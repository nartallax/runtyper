import {Runtyper} from "entrypoint"
import {refTypes, valueTypes} from "runtime/runtime"
import {appendConstToType, applyNonNull, deepEquals, RoRecord} from "utils"

export type GenArgs = RoRecord<Runtyper.SimpleType>

export class TypeSimplifier {

	private currentType: Runtyper.Type | null = null
	private knownRefTypesCache = new Map<string, Runtyper.SimpleType>()

	simplify(type: Runtyper.Type, genArgs: GenArgs = {}): Runtyper.SimpleType {
		try {
			this.currentType = type
			return this.simplifyInternal(type, genArgs)
		} finally {
			this.currentType = null
			this.knownRefTypesCache.clear()
		}
	}

	private cachedSimplifyReference(reference: Runtyper.TypeReferenceType, genArgs: GenArgs): Runtyper.SimpleType {
		let targetType = refTypes.get(reference.name)
		if(!targetType){
			this.fail("cannot find referenced type by name: ", reference)
		}
		if(targetType.type === "interface" || targetType.type === "alias"){
			genArgs = this.makeNewGenericArgs(reference, targetType, genArgs)
			let fullName = reference.name + "<" + JSON.stringify(genArgs) + ">"
			// cache is very important for recursive types, as otherwise they will never resolve without stack overflow
			// we can maybe sometimes miss it with same type being referenced from different places, no big deal
			let result = this.knownRefTypesCache.get(fullName)
			if(!result){
				result = this.simplifyInternal(targetType, genArgs)
				this.knownRefTypesCache.set(fullName, result)
			}
			return result
		} else if(targetType.type === "class" || targetType.type === "function"){
			// these two types also have generic parameters, but I won't support them (at least right now)
			this.fail("type reference cannot target class or function: ", reference)
		} else {
			return this.simplifyInternal(targetType, genArgs)
		}
	}

	private simplifyInternal(type: Runtyper.Type, genArgs: GenArgs): Runtyper.SimpleType {
		switch(type.type){
			case "illegal":
				this.fail("detected illegal type in file " + type.file + " when processing " + type.node + ": " + type.message)
			// eslint-disable-next-line no-fallthrough
			case "number":
			case "string":
			case "boolean":
			case "any":
			case "unknown":
			case "never":
			case "constant":
			case "constant_union": return type
			case "enum": return {type: "constant_union", value: type.values}
			case "type_reference": return this.cachedSimplifyReference(type, genArgs)
			case "generic_parameter":{
				let argVal = genArgs[type.name]
				if(!argVal){
					this.fail("type requested generic parameter " + type.name + " to be present, but it is nowhere to be found.")
				}
				return argVal
			}
			case "value_reference":{
				let valType = valueTypes.get(type.name)
				if(!valType){
					this.fail("type refers to value which is nowhere to be found: ", type)
				}
				return this.simplifyInternal(valType, genArgs)
			}
			case "call_result_reference":{
				let valType = valueTypes.get(type.functionName)
				if(!valType){
					this.fail("type refers to function value which is nowhere to be found: ", type)
				}
				if(valType.type !== "function"){
					this.fail("type expected to refer to function value, but got " + valType.type + " instead: ", type)
				}
				if(valType.signatures.length !== 1){
					this.fail("expected to have exactly one function signature! Can't resolve value of function that has more than one signature: ", valType)
				}
				let signature = valType.signatures[0]!
				return this.simplifyInternal(signature.returnType, genArgs)
			}
			case "function": this.fail("cannot simplify function type: ", type)
			// eslint-disable-next-line no-fallthrough
			case "class": this.fail("cannot simplify class type: ", type)
			// eslint-disable-next-line no-fallthrough
			case "intersection": return this.simplifyIntersection(type, genArgs)
			case "union":{
				let types = type.types.map(type => this.simplifyInternal(type, genArgs))
				return this.makeUnion(types)
			}
			case "tuple":
				return {type: "tuple", valueTypes: type.valueTypes.map(type => {
					if(type.type === "rest"){
						return {type: "rest", valueType: this.simplifyInternal(type.valueType, genArgs)}
					} else {
						return this.simplifyInternal(type, genArgs)
					}
				})}
			case "array":
				return {type: "array", valueType: this.simplifyInternal(type.valueType, genArgs)}
			case "non_null":{
				let simplified = this.simplifyInternal(type, genArgs)
				return applyNonNull(simplified, simplified)
			}
			case "keyof":{
				let target = this.simplifyInternal(type.target, genArgs)
				if(target.type !== "object"){
					this.fail("target of keyof expression is not object: ", type)
				}
				let keys = Object.keys(target.properties)
				let result: Runtyper.SimpleType = {type: "constant_union", value: keys.sort()}
				if(target.index){
					result = {type: "union", types: [result, target.index.keyType]}
				}
				return result
			}
			case "alias": return this.simplifyInternal(type.body, genArgs)
			case "index_access":{
				let target = this.simplifyInternal(type.object, genArgs)
				let index = this.simplifyInternal(type.index, genArgs)
				if(target.type === "object"){
					if(index.type !== "constant" || typeof(index.value) !== "string"){
						this.fail("expected index of object to be constant string: ", index)
					}
					let indexVal = index.value
					let prop = target.properties[indexVal]
					if(prop){
						return prop.optional ? appendConstToType(prop, undefined) : prop
					} else if(target.index && this.indexTypeIncludesValue(target.index.keyType, indexVal)){
						return appendConstToType(target.index.valueType, undefined)
					} else {
						this.fail("index key " + JSON.stringify(indexVal) + " is not in object: ", type)
					}
				} else if(target.type === "array"){
					if(type.rest){
						return {type: "array", valueType: target.valueType}
					} else {
						return target.valueType
					}
				} else if(target.type === "tuple"){
					// if(index.type !== "constant" || typeof(index.value) !== "number"){
					// 	this.fail("expected index of tuple to be constant number: ", index)
					// }
					// let indexNum = index.value
					// if(type.rest){
					// 	let resultTypes = [] as Runtyper.SimpleType[]
					// 	for(let i = indexNum; i < target.type.length; i++){
					// 	}
					// }

					// look, this shit is hard, okay? and I doubt a lot of people use it
					// so I'll just skip the implementation
					// future me: look into destructurization tests, there are a lot of tricky examples
					// TODO: implement index types for tuples
					this.fail("index types of tuples is not supported: ", type)
				} else {
					this.fail("index access type target is not of valid type: ", type)
				}
			}
			// eslint-disable-next-line no-fallthrough
			case "mapped_type":{
				let props = {} as Record<string, Runtyper.ObjectPropertyType<Runtyper.SimpleType>>
				let index = null as Runtyper.ObjectIndexType<Runtyper.SimpleType> | null
				let keyType = this.simplifyInternal(type.keyType, genArgs)
				this.forEachTerminalType(keyType, keyTypePart => {
					let argsWithKey: GenArgs = {
						...genArgs,
						[type.keyName]: keyTypePart
					}
					let partValueType = this.simplifyInternal(type.valueType, argsWithKey)
					if(keyTypePart.type === "string"){
						if(index){
							this.fail("more than one index on object is not supported: ", type)
						}
						// here we skip type.optional check
						// because indices are optional by default
						index = {
							keyType: keyTypePart,
							valueType: partValueType
						}
					} else if(keyTypePart.type === "constant"){
						if(typeof(keyTypePart.value) !== "string"){
							this.fail("constant keys of objects that are not strings are not supported: ", type)
						}
						if(type.optional){
							partValueType = appendConstToType(partValueType, undefined)
						}
						props[keyTypePart.value] = partValueType
					} else {
						this.fail("keys of objects can only be string or string constants: ", type)
					}
				})
				return {
					type: "object",
					properties: props,
					...(index ? {index} : {})
				}
			}
			case "object": return this.simplifyObject(type, genArgs)
			case "interface":{
				let props = {} as Record<string, Runtyper.SimpleType>
				let index = null as Runtyper.ObjectIndexType<Runtyper.SimpleType> | null

				let blend = (obj: Runtyper.SimpleType): void => {
					if(obj.type !== "object"){
						this.fail("expected interface to inherit object type, got something else instead: ", type)
					}
					props = {...props, ...obj.properties}
					if(obj.index){
						if(index){
							this.fail("more than one index on object is not supported: ", type)
						}
						index = obj.index
					}
				}

				if(type.heritage){
					for(let parentType of type.heritage){
						blend(this.simplifyInternal(parentType, genArgs))
					}
				}
				blend(this.simplifyObject(type, genArgs))

				return {
					type: "object",
					properties: props,
					...(index ? {index} : {})
				}
			}

			case "conditional":{
				if(type.checkType.type !== "generic_parameter"){
					this.fail("conditional type expressions which checked types are not generic arguments are not supported: ", type)
				}
				let genName = type.checkType.name
				let checkType = this.simplifyInternal(type.checkType, genArgs)
				if(type.extendsType.type === "constant_union"){
					// simplified check for constant unions
					let set = new Set(type.extendsType.value)
					let result = [] as Runtyper.SimpleType[]
					this.forEachTerminalType(checkType, subtype => {
						let checkResult: Runtyper.SimpleType
						if(subtype.type === "constant" && set.has(subtype.value)){
							checkResult = subtype
						} else {
							checkResult = {type: "never"}
						}
						result.push(this.simplifyInternal(type.trueType, {...genArgs, [genName]: checkResult}))
					})
					return this.makeUnion(result)
				}
				let sourceInferNames = this.findSourceInfers(type)
				let simpleExtendsType = this.simplifyInternal(type.extendsType, genArgs)
				let infers = this.typeExtendsType(checkType, simpleExtendsType, type)
				if(!infers){
					let newArgs = {} as Record<string, Runtyper.SimpleType>
					for(let name of sourceInferNames){
						newArgs[name] = {type: "never"}
					}
					return this.simplifyInternal(type.falseType, {...genArgs, ...newArgs})
				} else {
					let newArgs = {} as Record<string, Runtyper.SimpleType>
					for(let name of sourceInferNames){
						let inferredType = infers.get(name)
						if(!inferredType){
							this.fail("failed to inferred any type for " + name + "; this is not supported: ", type)
						}
						newArgs[name] = inferredType
					}
					return this.simplifyInternal(type.trueType, {...genArgs, ...newArgs})
				}
			}
		}
	}

	private fail(msg: string, type?: Runtyper.Type): never {
		if(type){
			msg += JSON.stringify(type)
		}
		let prefix = "Failed to simplify type " + JSON.stringify(this.currentType)
		throw new Error(prefix + ": " + msg)
	}

	private simplifyObject(type: Runtyper.ObjectType | Runtyper.InterfaceDeclaration, genArgs: GenArgs): Runtyper.SimpleType {
		let props = {} as Record<string, Runtyper.ObjectPropertyType<Runtyper.SimpleType>>
		for(let propName in type.properties){
			props[propName] = this.simplifyInternal(type.properties[propName]!, genArgs)
		}
		if(type.propertyByConstKeys){
			for(let valueName in type.propertyByConstKeys){
				let valueType = valueTypes.get(valueName)
				if(!valueType){
					this.fail("object property points to value " + valueName + ", but it's nowhere to be found: ", type)
				}
				if(valueType.type !== "constant" || typeof(valueType.value) !== "string"){
					this.fail("object property with variable key expected to be constant string, got something else: ", type)
				}
				props[valueType.value] = this.simplifyInternal(type.propertyByConstKeys[valueName]!, genArgs)
			}
		}

		let index = null as Runtyper.ObjectIndexType<Runtyper.SimpleType> | null
		if(type.index){
			index = {
				keyType: this.simplifyInternal(type.index.keyType, genArgs),
				valueType: this.simplifyInternal(type.index.valueType, genArgs)
			}
		}
		return {
			type: "object",
			properties: props,
			...(index ? {index} : {})
		}
	}

	/** Create a new set of generic arguments for a set of type parameters */
	private makeNewGenericArgs(reference: Runtyper.TypeReferenceType, targetType: {typeParameters?: Runtyper.TypeParameter[]}, oldGenericArgs: GenArgs): GenArgs {
		let simple = {} as Record<string, Runtyper.SimpleType>
		if(targetType.typeParameters){
			for(let i = 0; i < targetType.typeParameters.length; i++){
				let param = targetType.typeParameters[i]!
				let arg = !reference.typeArguments ? undefined : reference.typeArguments[i]
				if(arg && arg.type === "infer"){
					simple[param.name] = makeInferredUnknown(arg.name)
					continue
				}
				if(!arg){
					arg = param.default
				}
				if(!arg){
					this.fail("type argument not passed for type parameter " + param.name + ": ", reference)
				}
				simple[param.name] = this.simplifyInternal(arg, oldGenericArgs)
			}
		}
		return simple
	}

	private indexTypeIncludesValue(indexType: Runtyper.SimpleType, value: string): boolean {
		if(indexType.type === "string"){
			return true
		} else if(indexType.type === "union"){
			for(let subtype of indexType.types){
				if(this.indexTypeIncludesValue(subtype, value)){
					return true
				}
			}
			return false
		} else if(indexType.type === "constant"){
			return indexType.value === value
		} else if(indexType.type === "constant_union"){
			return indexType.value.indexOf(value) >= 0
		} else {
			return false
		}
	}

	private forEachTerminalType(type: Runtyper.SimpleType, handler: (type: Runtyper.SimpleType) => void): void {
		if(type.type === "union"){
			type.types.forEach(subtype => this.forEachTerminalType(subtype, handler))
		} else if(type.type === "constant_union"){
			type.value.forEach(v => handler({type: "constant", value: v}))
		} else {
			handler(type)
		}
	}

	private makeUnion(types: Runtyper.SimpleType[]): Runtyper.SimpleType {
		let consts = [] as Runtyper.ConstantType["value"][]
		let otherTypes = [] as Runtyper.SimpleType[]
		let simpleTypes = [] as ("string" | "number" | "boolean")[]
		let hasAny = false
		types.forEach(type => this.forEachTerminalType(type, type => {
			if(type.type === "constant"){
				consts.push(type.value)
			} else {
				if(type.type === "string" || type.type === "number" || type.type === "boolean"){
					simpleTypes.push(type.type)
				} else if(type.type === "any"){
					hasAny = true
				}
				otherTypes.push(type)
			}
		}))

		if(hasAny){
			return {type: "any"}
		}

		if(consts.length === 0 && otherTypes.length === 1){
			return otherTypes[0]!
		}
		otherTypes = otherTypes.filter(x => x.type !== "never")

		if(consts.length === 0 && otherTypes.length === 1){
			return otherTypes[0]!
		}
		let hasUnknown = !!otherTypes.find(x => x.type === "unknown")
		if(hasUnknown){
			// unknown | anything_else = unknown
			return {type: "unknown"}
		}

		for(let simpleType of simpleTypes){
			consts = consts.filter(v => typeof(v) !== simpleType)
		}
		consts = [...new Set(consts)].sort()

		if(consts.length === 1){
			otherTypes.push({type: "constant", value: consts[0]!})
		} else if(consts.length > 1){
			otherTypes.push({type: "constant_union", value: consts})
		}

		if(otherTypes.length === 0){
			return {type: "never"}
		} else if(otherTypes.length === 1){
			return otherTypes[0]!
		} else {
			return {type: "union", types: otherTypes}
		}
	}

	private simplifyIntersection(type: Runtyper.IntersectionType, genArgs: GenArgs): Runtyper.SimpleType {
		let types = type.types.map(type => this.simplifyInternal(type, genArgs))
		if(types.find(x => x.type === "never")){
			return {type: "never"}
		}
		if(types.find(x => x.type === "any")){
			// does not make much sense to me, but it really works like that
			return {type: "any"}
		}

		// unknown & anything_else = anything_else
		let beforeUnknownDropCount = types.length
		types = types.filter(x => x.type !== "unknown")
		if(types.length === 1){
			return types[0]!
		} else if(types.length === 0){
			return beforeUnknownDropCount > 0 ? {type: "unknown"} : {type: "never"}
		} else {
			// I could add a lot here
			// drop of primitive types if there is a constant of such type
			// merging of objects
			// early `never` detections
			// but this is too complex for me right now, I don't want to deal with it
			return {type: "intersection", types}
		}
	}

	/*
	private findSourceInfers(type: Runtyper.Type): Set<string> {
		switch(type.type){
			case "type_reference":{
				let args = type.typeArguments || []
				let result = [] as string[]
				args.forEach(type => {
					if(type.type === "infer"){
						result.push(type.name)
					} else {
						result.push(...this.findSourceInfers(type))
					}
				})
				return new Set(result)
			}
			case "union":{
				let result = [] as string[]
				type.types.forEach(subtype => result.push(...this.findSourceInfers(subtype)))
				result = [...new Set(result)]
				return new Set(result)
			}
			case "intersection":{
				let result = [] as string[]
				type.types.forEach(subtype => result.push(...this.findSourceInfers(subtype)))
				return this.checkNoInferredNamesCollision(type, result)
			}
			case "object":{
				let result = [] as string[]
				for(let propName in type.properties){
					result.push(...this.findSourceInfers(type.properties[propName]!))
				}
				if(type.propertyByConstKeys){
					for(let propName in type.propertyByConstKeys){
						result.push(...this.findSourceInfers(type.propertyByConstKeys[propName]!))
					}
				}
				if(type.index){
					result.push(...this.findSourceInfers(type.index.keyType))
					result.push(...this.findSourceInfers(type.index.valueType))
				}

				return this.checkNoInferredNamesCollision(type, result)
			}
			case "tuple":{
				let result = [] as string[]
				type.valueTypes.forEach(subtype => {
					result.push(...this.findSourceInfers(subtype.type === "rest" ? subtype.valueType : subtype))
				})
				return this.checkNoInferredNamesCollision(type, result)
			}
			case "array": return this.findSourceInfers(type.valueType)
			case "illegal": this.fail("cannot find source infers in illegal type: ", type)
			// eslint-disable-next-line no-fallthrough
			default: return new Set()
		}
	}
	*/

	private findSourceInfers(cond: Runtyper.ConditionalType): string[] {
		if(cond.extendsType.type !== "type_reference"){
			// all this check about reference type and allowed generic arguments is needed because
			// we can have some complex type expression as `extends` type
			// and I fear that I won't be able to find all `infer` types in them
			this.fail("havings something else but constant unions and/or reference types as type that conditional type matches against is not supported: ", cond)
		}
		let allowedGenArgTypes = new Set<Runtyper.Type["type"]>([
			"generic_parameter",
			"number",
			"string",
			"boolean",
			"constant",
			"constant_union",
			"unknown",
			"any",
			"never"
		])
		let result = [] as string[]
		for(let genArg of cond.extendsType.typeArguments || []){
			if(genArg.type === "infer"){
				result.push(genArg.name)
			} else if(!allowedGenArgTypes.has(genArg.type)){
				this.fail("only simple types are supported as reference type arguments in `extends` part of conditional expression, got something more complex: " + genArg.type, cond)
			}
		}
		return result
	}

	private typeExtendsType(checked: Runtyper.SimpleType, template: Runtyper.SimpleType, cond: Runtyper.ConditionalType): InferMap | null {
		let inferringName = getInferredUnknownName(template)
		if(inferringName){
			return new Map([[inferringName, checked]])
		// order is kinda important in next few checks
		// because `unknown extends unknown` is true, but `unknown extends anythingelse` is false
		// and so on for `never` and `any`
		} else if(template.type === "any" || template.type === "unknown"){
			return new Map()
		} else if(template.type === "never"){
			if(checked.type === "never"){
				return new Map()
			} else {
				return null
			}
		} else if(checked.type === "any"){
			return new Map()
		} else if(checked.type === "unknown"){
			return null
		} else if(checked.type === "never"){
			return null
		} else if(checked.type === "union"){
			// TODO: code dup
			for(let subtype of checked.types){
				let infers = this.typeExtendsType(subtype, template, cond)
				if(infers){
					if(infers.size > 0){
						// do I need this check here? I'm not sure
						this.fail("inferring anything from unions is not supported: ", cond)
					}
					return infers
				}
			}
			return null
		} else if(checked.type === "intersection"){
			// TODO: code dup
			let result = new Map<string, Runtyper.SimpleType>()
			for(let subtype of checked.types){
				let infers = this.typeExtendsType(subtype, template, cond)
				if(!infers){
					return null
				}
				this.mergeInfers(result, infers)
			}
			return result
		} else {
			switch(template.type){
				case "union":{
					for(let subtype of template.types){
						let infers = this.typeExtendsType(checked, subtype, cond)
						if(infers){
							if(infers.size > 0){
								// here I fear of inconsistent behavior of inferring types from unions
								// like, `{x: number | T}`, matched against `{x: number}`, will infer T = number
								// but when matched against `{x: boolean}`, will infer T = boolean
								// I don't want to deal with it
								this.fail("inferring anything from unions is not supported: ", cond)
							}
							return infers
						}
					}
					return null
				}
				case "intersection":{
					let result = new Map<string, Runtyper.SimpleType>()
					for(let subtype of template.types){
						let infers = this.typeExtendsType(checked, subtype, cond)
						if(!infers){
							return null
						}
						this.mergeInfers(result, infers)
					}
					return result
				}
				case "constant":{
					if(checked.type === "constant" && checked.value === template.value){
						return new Map()
					} else {
						return null
					}
				}
				case "constant_union":{
					if(checked.type === "constant" && template.value.indexOf(checked.value) >= 0){
						return new Map()
					} else if(checked.type === "constant_union"){
						let s = new Set(template.value)
						for(let v of checked.value){
							if(!s.has(v)){
								return null
							}
						}
						return new Map()
					} else {
						return null
					}
				}
				case "tuple":{
					if(checked.type === "tuple"){
						if(template.valueTypes.length !== checked.valueTypes.length){
							return null
						} else {
							let result = new Map<string, Runtyper.SimpleType>()
							for(let i = 0; i < template.valueTypes.length; i++){
								let tempType = template.valueTypes[i]!
								let checkType = checked.valueTypes[i]!
								if(tempType.type === "rest" || tempType.optional || checkType.type === "rest" || checkType.optional){
									this.fail("matching of extends of tuple types with optional/rest arguments is not supported: ", cond)
								}
								let newInfer = this.typeExtendsType(checkType, tempType, cond)
								if(!newInfer){
									return null
								}
								this.mergeInfers(result, newInfer)
							}
							return result
						}
					} else {
						return null
					}
				}
				case "array":{
					if(checked.type === "array"){
						return this.typeExtendsType(checked.valueType, template.valueType, cond)
					} else if(checked.type === "tuple"){
						let result = new Map<string, Runtyper.SimpleType>()
						for(let i = 0; i < checked.valueTypes.length; i++){
							let checkType = checked.valueTypes[i]!
							if(checkType.type === "rest"){
								checkType = checkType.valueType
							} else if(checkType.optional){
								this.fail("matching of optional tuple element against array type is not supported: ", cond)
							}
							let newInfer = this.typeExtendsType(checkType, template.valueType, cond)
							if(!newInfer){
								return null
							}
							this.mergeInfers(result, newInfer)
						}
						return result
					} else {
						return null
					}
				}
				case "boolean":
				case "number":
				case "string":{
					return this.checkIfValueIsOfPrimitiveType(checked, template.type)
				}
				case "object":{
					if(checked.type === "object"){
						let result = new Map<string, Runtyper.SimpleType>()
						if(template.index || checked.index){
							this.fail("matching of types with index values are not supported: ", cond)
						}
						for(let propName in template.properties){
							let tempProp = template.properties[propName]!
							if(tempProp.optional){
								// the behaviour of this is depends on compiler settings, I believe
								// like, `{x: number | undefined} extends {x?: number}` will be true or false depending on setting
								// I don't want to deal with it
								this.fail("matching against type with optional property (" + propName + ") is not supported: ", cond)
							}
							let checkProp = checked.properties[propName]
							if(!checkProp){
								if(!tempProp.optional){
									return null
								} else {
									continue
								}
							} else if(checkProp.optional){
								return null
							}
							let newInfer = this.typeExtendsType(checkProp, tempProp, cond)
							if(!newInfer){
								return null
							}
							this.mergeInfers(result, newInfer)
						}
						return result
					} else {
						return null
					}
				}
			}
		}
	}

	private checkIfValueIsOfPrimitiveType(checked: Runtyper.SimpleType, typeName: "string" | "number" | "boolean"): InferMap | null {
		if(checked.type === typeName){
			return new Map()
		} else if(checked.type === "constant" && typeof(checked.value) === typeName){
			return new Map()
		} else if(checked.type === "constant_union"){
			for(let v of checked.value){
				if(typeof(v) !== typeName){
					return null
				}
			}
			return new Map()
		} else {
			return null
		}
	}

	private mergeInfers(baseMap: InferMap, newMap: InferMap): void {
		if(newMap.size === 0){
			return
		}
		for(let [k, v] of newMap){
			let oldValue = baseMap.get(k)
			if(!oldValue){
				baseMap.set(k, v)
			} else if(!deepEquals(v, oldValue)){
				this.fail("failed to infer value of generic argument " + k + ": two different values found: " + JSON.stringify(oldValue) + " and " + JSON.stringify(v))
			}
		}
	}

}

type InferMap = Map<string, Runtyper.SimpleType>

interface InferredUnknownType {
	readonly type: "unknown"
	readonly isThisSpecialUnknownForInferring: true
	readonly name: string
}

function makeInferredUnknown(name: string): InferredUnknownType & Runtyper.SimpleType {
	return {type: "unknown", isThisSpecialUnknownForInferring: true, name}
}

function getInferredUnknownName(type: Runtyper.SimpleType): string | null {
	let iut = type as InferredUnknownType
	return iut.isThisSpecialUnknownForInferring ? iut.name : null
}
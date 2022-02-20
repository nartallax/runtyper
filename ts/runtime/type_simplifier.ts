import {Runtyper} from "entrypoint"
import {refTypes, valueTypes} from "runtime/runtime"
import {deepEquals, RoRecord} from "utils/utils"
import {forEachTerminalTypeInUnion, isObjectIndexKeyType, makeUnion, removeConstantFromType, removeTypesFromUnion} from "utils/simple_type_utils"
import {getInferredUnknownName, makeInferredUnknown} from "inferred_unknown"
import {simpleTypeToString} from "runtime/type_stringifier"

export type GenArgs = RoRecord<Runtyper.SimpleType>

interface MutableObjectType {
	type: "object"
	properties: Record<string, Runtyper.SimpleType>
	index?: Runtyper.ObjectIndexType<Runtyper.SimpleType>
	refName?: string
	fullRefName?: string
}

interface RefInfo {
	fullRefName: string
	refName: string
}

export class TypeSimplifier {

	private currentType: Runtyper.Type | null = null
	private readonly knownRefTypesCache = new Map<string, Runtyper.SimpleType>()
	private readonly currentlyDefiningRefTypeValues = new Map<string, MutableObjectType>()

	simplify(type: Runtyper.Type, genArgs: {[name: string]: Runtyper.SimpleType} = {}): Runtyper.SimpleType {
		try {
			this.currentType = type
			return this.simplifyInternal(type, genArgs, null)
		} finally {
			this.currentType = null
			this.currentlyDefiningRefTypeValues.clear()
		}
	}

	private makeRefName(reference: Runtyper.TypeReferenceType, target: {typeParameters?: Runtyper.TypeParameter[]}, newGenArgs: GenArgs, full: boolean): string {
		let refName: string
		if(full){
			refName = reference.name
		} else {
			// a little hackish, but whatever
			let refParts = reference.name.split(":")
			refName = refParts[refParts.length - 1] || ""
		}
		const typeParamArr = target.typeParameters
		const typeArgArr = reference.typeArguments
		if(typeArgArr && typeArgArr.length > 0 && typeParamArr){
			let argStrings = typeParamArr.map((param, i) => {
				let arg = typeArgArr[i] || param.default
				if(!arg){
					return "???"
				} else if(arg.type === "infer"){
					return "infer " + arg.name
				} else {
					let name = param.name
					let value = newGenArgs[name]
					if(!value){
						return "???"
					}
					return simpleTypeToString(value, {useLessName: true, fullNames: full})
				}
			})
			refName += "<" + argStrings.join(", ") + ">"
		}
		return refName
	}

	private cachedSimplifyReference(reference: Runtyper.TypeReferenceType, genArgs: GenArgs, throwOnCircular: boolean): Runtyper.SimpleType {
		let targetType = refTypes.get(reference.name)
		if(!targetType){
			this.fail("cannot find referenced type by name: ", reference)
		}
		if(targetType.type === "interface" || targetType.type === "alias"){
			genArgs = this.makeNewGenericArgs(reference, targetType, genArgs)
			let fullName = this.makeRefName(reference, targetType, genArgs, true)
			// cache is very important for recursive types, as otherwise they will never resolve without stack overflow
			// we can maybe sometimes miss it with same type being referenced from different places, no big deal
			let result = this.knownRefTypesCache.get(fullName)
			if(!result){
				let definingValue = this.currentlyDefiningRefTypeValues.get(fullName)
				if(definingValue){
					if(throwOnCircular){
						this.fail("this recursive type is too difficult to process: ", reference)
					} else {
						return definingValue
					}
				}
				let refInfo: RefInfo = {
					fullRefName: fullName,
					refName: this.makeRefName(reference, targetType, genArgs, false)
				}
				this.currentlyDefiningRefTypeValues.set(fullName, this.makeFreshMutableObject(refInfo))
				try {
					result = this.simplifyInternal(targetType, genArgs, refInfo)
					this.knownRefTypesCache.set(fullName, result)
				} finally {
					this.currentlyDefiningRefTypeValues.delete(fullName)
				}
			}
			return result
		} else if(targetType.type === "class" || targetType.type === "function"){
			// these two types also have generic parameters, but I won't support them (at least right now)
			this.fail("type reference cannot target class or function: ", reference)
		} else {
			// what else we can even refer to?
			return this.simplifyInternal(targetType, genArgs)
		}
	}

	private getDefiningObjectOrCreate(ref: RefInfo | null): MutableObjectType {
		if(!ref){
			return {
				type: "object",
				properties: {}
			}
		}
		let definingObject = this.currentlyDefiningRefTypeValues.get(ref.fullRefName)
		return definingObject || this.makeFreshMutableObject(ref)
	}

	private makeFreshMutableObject(ref: RefInfo): MutableObjectType {
		return {
			type: "object",
			properties: {},
			refName: ref.refName,
			fullRefName: ref.fullRefName
		}
	}

	private simplifyInternal(type: Runtyper.Type, genArgs: GenArgs, ref: RefInfo | null = null, throwOnCircular = false): Runtyper.SimpleType {
		switch(type.type){
			case "broken":
				this.fail("detected broken type in file " + type.file + " when processing " + type.node + ": " + type.message)
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
			case "type_reference": return this.cachedSimplifyReference(type, genArgs, throwOnCircular)
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
				// passing null as name (here and in intersection) is important
				// because otherwise there can be multiple objects with same name sharing the same reference
				// which is extremely bad
				let types = type.types.map(type => this.simplifyInternal(type, genArgs))
				return this.makeUnion(types)
			}
			case "tuple":
				return {type: "tuple", valueTypes: type.valueTypes.map(type => {
					if(type.type === "rest"){
						return {type: "rest", valueType: this.simplifyInternal(type.valueType, genArgs)}
					} else {
						let optional = type.optional
						if(type.optional){
							let x = {...type}
							delete x.optional
							type = x
						}
						let result = this.simplifyInternal(type, genArgs, null)
						if(optional){
							result = this.appendConstToType(result, undefined)
						}
						return result
					}
				})}
			case "array":
				return {type: "array", valueType: this.simplifyInternal(type.valueType, genArgs)}
			case "non_null":{
				let simplified = this.simplifyInternal(type.valueType, genArgs)
				return removeTypesFromUnion(
					simplified,
					type => type.type === "constant" && (type.value === null || type.value === undefined)
				)
			}
			case "keyof":{
				let target = this.simplifyInternal(type.target, genArgs, null, true)
				if(target.type !== "object"){
					this.fail("target of keyof expression is not object: ", type)
				}
				let keys = Object.keys(target.properties)
				let result: Runtyper.SimpleType = {type: "constant_union", value: keys.sort()}
				if(target.index){
					result = this.makeUnion([result, target.index.keyType])
				}
				return result
			}
			case "alias":{
				let result = this.simplifyInternal(type.body, genArgs, ref)
				if(ref && (result.fullRefName !== ref.fullRefName || result.refName !== ref.refName)){
					// not creating new values is good
					// not only because of memory consumption, also because of a trick with mutable objects
					// when you copy object just to rename, two instances of the same type are made
					// which is not great, because it leads to duplicate code generation
					// (it will still work, though)
					result = {
						...result,
						fullRefName: ref.fullRefName,
						refName: ref.refName
					}
				}
				return result
			}
			case "index_access":{
				let target = this.simplifyInternal(type.object, genArgs, null, true)
				let index = this.simplifyInternal(type.index, genArgs)
				if(target.type === "object"){
					let indexVal = index.type !== "constant" || typeof(index.value) !== "string" ? null : index.value
					if(indexVal !== null && indexVal in target.properties){
						return target.properties[indexVal]!
					} else if(target.index && this.typeExtendsType(index, target.index.keyType, type)){
						return this.appendConstToType(target.index.valueType, undefined)
					} else {
						this.fail("index key of type " + JSON.stringify(index) + " is not in object: ", type)
					}
				} else if(target.type === "array"){
					if(type.rest){
						return {type: "array", valueType: target.valueType}
					} else {
						return target.valueType
					}
				} else if(target.type === "tuple"){
					// look, this shit is hard, okay? and I doubt a lot of people use it
					// so I'll just skip the implementation
					// future me: look into destructurization tests, there are a lot of tricky examples
					if(type.rest){
						this.fail("index access of tuples by rest notation is not supported: ", type)
					}
					if(target.valueTypes.find(x => x.type === "rest")){
						this.fail("index access of tuples with rest notation is not supported: ", target)
					}

					if(index.type !== "constant" || typeof(index.value) !== "number"){
						this.fail("expected index of tuple to be constant number: ", index)
					}
					let indexNum = index.value
					if(indexNum >= target.valueTypes.length){
						this.fail("cannot get type of tuple value at index " + indexNum + ": there are less values in tuple than that: ", target)
					}
					let valueType = target.valueTypes[indexNum]!
					if(valueType.type === "rest"){
						this.fail("should never happen, checked above")
					}
					return valueType
				} else {
					this.fail("index access type target is not of valid type: ", type)
				}
			}
			// eslint-disable-next-line no-fallthrough
			case "mapped_type":{
				let props = {} as Record<string, Runtyper.SimpleType>
				let index = null as Runtyper.ObjectIndexType<Runtyper.SimpleType> | null
				let keyType = this.simplifyInternal(type.keyType, genArgs, null, true)
				forEachTerminalTypeInUnion(keyType, keyTypePart => {
					let argsWithKey: GenArgs = {
						...genArgs,
						[type.keyName]: keyTypePart
					}
					let partValueType = this.simplifyInternal(type.valueType, argsWithKey, null, true)
					if(keyTypePart.type === "string"){
						if(index){
							this.fail("more than one index on object is not supported: ", type)
						}
						// here we skip type.optional check
						// because indices are optional by default
						if(isObjectIndexKeyType(keyTypePart)){
							index = {
								keyType: keyTypePart,
								valueType: removeConstantFromType(partValueType, undefined)
							}
						} else {
							this.fail("type cannot be used as object index type: ", keyTypePart)
						}
					} else if(keyTypePart.type === "constant"){
						if(typeof(keyTypePart.value) !== "string"){
							this.fail("constant keys of objects that are not strings are not supported: ", type)
						}
						if(type.optional){
							partValueType = this.appendConstToType(partValueType, undefined)
						}
						props[keyTypePart.value] = partValueType
					} else {
						this.fail("keys of objects can only be string or string constants: ", type)
					}
				})
				return {
					type: "object",
					properties: props,
					...(index ? {index} : {}),
					...(ref ? {fullRefName: ref.fullRefName, refName: ref.refName} : {})
				}
			}
			case "object": return this.simplifyObject(type, genArgs, ref)
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

				if(!type.heritage){
					// to avoid copying. see "alias" processing on why it's bad
					return this.simplifyObject(type, genArgs, ref)
				} else {
					for(let parentType of type.heritage){
						blend(this.simplifyInternal(parentType, genArgs))
					}
				}
				let terminalObject = this.simplifyObject(type, genArgs, ref)
				blend(terminalObject)

				return {
					type: "object",
					properties: props,
					...(index ? {index} : {}),
					...(terminalObject.refName ? {refName: terminalObject.refName} : {}),
					...(terminalObject.fullRefName ? {fullRefName: terminalObject.fullRefName} : {})
				}
			}

			case "conditional":{
				if(type.checkType.type !== "generic_parameter"){
					this.fail("conditional type expressions which checked types are not generic arguments are not supported: ", type)
				}
				let genName = type.checkType.name
				let checkType = this.simplifyInternal(type.checkType, genArgs, ref)
				let simpleExtendsType = this.simplifyInternal(type.extendsType, genArgs, ref)
				let sourceInferNames = this.findSourceInfers(type)
				if(sourceInferNames.length === 0 && simpleExtendsType.type === "constant_union"){
					// simplified check for constant unions
					let set = new Set(simpleExtendsType.value)
					let result = [] as Runtyper.SimpleType[]
					forEachTerminalTypeInUnion(checkType, subtype => {
						let branch: Runtyper.Type
						if(subtype.type === "constant" && set.has(subtype.value)){
							branch = type.trueType
						} else {
							branch = type.falseType
						}
						result.push(this.simplifyInternal(branch, {...genArgs, [genName]: subtype}, ref))
					})
					return this.makeUnion(result)
				}
				let infers = this.typeExtendsType(checkType, simpleExtendsType, type)
				if(!infers){
					let newArgs = {} as Record<string, Runtyper.SimpleType>
					for(let name of sourceInferNames){
						newArgs[name] = {type: "never"}
					}
					return this.simplifyInternal(type.falseType, {...genArgs, ...newArgs}, ref)
				} else {
					let newArgs = {} as Record<string, Runtyper.SimpleType>
					for(let name of sourceInferNames){
						let inferredType = infers.get(name)
						if(!inferredType){
							this.fail("failed to infer any type for " + name + "; this is not supported: ", type)
						}
						newArgs[name] = inferredType
					}
					return this.simplifyInternal(type.trueType, {...genArgs, ...newArgs}, ref)
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

	private simplifyObject(type: Runtyper.ObjectType | Runtyper.InterfaceDeclaration, genArgs: GenArgs, refInfo: RefInfo | null): Runtyper.SimpleObjectType<Runtyper.SimpleType> & Runtyper.RefInfo {
		let result = this.getDefiningObjectOrCreate(refInfo)
		for(let propName in type.properties){
			let srcProp = type.properties[propName]!
			let wasOptional = false
			if(srcProp.optional){
				wasOptional = true
				let x = {...srcProp}
				delete x.optional // otherwise optional will leak into SimpleType
				srcProp = x
			}
			result.properties[propName] = this.simplifyInternal(srcProp, genArgs, null)
			if(wasOptional){
				result.properties[propName] = this.appendConstToType(result.properties[propName]!, undefined)
			}
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
				let srcProp = type.propertyByConstKeys[valueName]!
				let prop: Runtyper.SimpleType = this.simplifyInternal(srcProp, genArgs, null)
				if(srcProp.optional){
					prop = this.appendConstToType(prop, undefined)
				}
				result.properties[valueType.value] = prop
			}
		}

		let index = null as Runtyper.ObjectIndexType<Runtyper.SimpleType> | null
		if(type.index){
			let keyType = this.simplifyInternal(type.index.keyType, genArgs, null)
			if(isObjectIndexKeyType(keyType)){
				index = {
					keyType,
					valueType: removeConstantFromType(
						this.simplifyInternal(type.index.valueType, genArgs, null),
						undefined
					)
				}
			} else {
				this.fail("type cannot be used as object index type: ", keyType)
			}
		}
		if(index){
			result.index = index
		}

		return result
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
				simple[param.name] = this.simplifyInternal(arg, oldGenericArgs, null)
			}
		}
		return simple
	}

	private simplifyIntersection(type: Runtyper.IntersectionType, genArgs: GenArgs): Runtyper.SimpleType {
		let types = type.types.map(type => this.simplifyInternal(type, genArgs, null))
		if(types.find(x => x.type === "never")){
			return {type: "never"}
		}
		// sometimes this will actually produce `any` when there is `never`
		// like, `any & 5 & 10`
		// if(types.find(x => x.type === "any")){
		// 	// does not make much sense to me, but it really works like that
		// 	return {type: "any"}
		// }

		// I could add a lot here
		// drop of primitive types if there is a constant of such type
		// merging of objects
		// early `never` detections
		// but this is too complex for me right now, I don't want to deal with it
		return {type: "intersection", types}
	}

	private makeUnion(types: Runtyper.SimpleType[]): Runtyper.SimpleType {
		return makeUnion(types, false)
	}

	private findSourceInfers(cond: Runtyper.ConditionalType): string[] {
		let allowedTypes = new Set<Runtyper.Type["type"]>([
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
		if(cond.extendsType.type !== "type_reference"){
			if(!allowedTypes.has(cond.extendsType.type)){
			// all this check about reference type and allowed generic arguments is needed because
			// we can have some complex type expression as `extends` type
			// and I fear that I won't be able to find all `infer` types in them
				this.fail("matching against some of types in conditional types are not supported (" + cond.extendsType.type + "); wrap it in type reference maybe? ", cond)
			}
			return []
		}
		let result = [] as string[]
		for(let genArg of cond.extendsType.typeArguments || []){
			if(genArg.type === "infer"){
				result.push(genArg.name)
			} else if(!allowedTypes.has(genArg.type)){
				this.fail("only simple types are supported as reference type arguments in `extends` part of conditional expression, got something more complex: " + genArg.type, cond)
			}
		}
		return result
	}

	private checkIntersectionExtends(intersection: Runtyper.IntersectionType<Runtyper.SimpleType>, otherType: Runtyper.SimpleType, isIntersectionCheckedType: boolean, srcExpr: Runtyper.Type): InferMap | null {
		let result = new Map<string, Runtyper.SimpleType>()
		for(let subtype of intersection.types){
			let infers = isIntersectionCheckedType
				? this.typeExtendsType(subtype, otherType, srcExpr)
				: this.typeExtendsType(otherType, subtype, srcExpr)
			if(!infers){
				return null
			}
			this.mergeInfers(result, infers)
		}
		return result
	}

	private checkUnionExtends(intersection: Runtyper.UnionType<Runtyper.SimpleType>, otherType: Runtyper.SimpleType, isUnionCheckedType: boolean, srcExpr: Runtyper.Type): InferMap | null {
		let result: InferMap | null = null
		for(let subtype of intersection.types){
			let infers = isUnionCheckedType
				? this.typeExtendsType(subtype, otherType, srcExpr)
				: this.typeExtendsType(otherType, subtype, srcExpr)
			result = this.mergeInfers(result, infers)
			// we MUST walk all the union members to catch possible inferred types
			// so no break here
		}
		if(result && result.size > 0){
			// here I fear of inconsistent behavior of inferring types from unions
			// like, `{x: number | T}`, matched against `{x: number}`, will infer T = number
			// but when matched against `{x: boolean}`, will infer T = boolean
			// I don't want to deal with it
			this.fail("inferring anything from unions is not supported: ", srcExpr)
		}
		return result
	}

	private typeExtendsType(checked: Runtyper.SimpleType, template: Runtyper.SimpleType, srcExpr: Runtyper.Type): InferMap | null {
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
			return this.checkUnionExtends(checked, template, true, srcExpr)
		} else if(checked.type === "intersection"){
			return this.checkIntersectionExtends(checked, template, true, srcExpr)
		} else {
			switch(template.type){
				case "union": return this.checkUnionExtends(template, checked, false, srcExpr)
				case "intersection":return this.checkIntersectionExtends(template, checked, false, srcExpr)
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
								if(tempType.type === "rest" || checkType.type === "rest"){
									this.fail("matching of extends of tuple types with rest arguments is not supported: ", srcExpr)
								}
								let newInfer = this.typeExtendsType(checkType, tempType, srcExpr)
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
						return this.typeExtendsType(checked.valueType, template.valueType, srcExpr)
					} else if(checked.type === "tuple"){
						let result = new Map<string, Runtyper.SimpleType>()
						for(let i = 0; i < checked.valueTypes.length; i++){
							let checkType = checked.valueTypes[i]!
							if(checkType.type === "rest"){
								checkType = checkType.valueType
							}
							let newInfer = this.typeExtendsType(checkType, template.valueType, srcExpr)
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
							this.fail("matching of types with index values are not supported: ", srcExpr)
						}
						for(let propName in template.properties){
							let tempProp = template.properties[propName]!
							// if(tempProp.optional){
							// 	// the behaviour of this is depends on compiler settings, I believe
							// 	// like, `{x: number | undefined} extends {x?: number}` will be true or false depending on setting
							// 	// I don't want to deal with it
							// 	this.fail("matching against type with optional property (" + propName + ") is not supported: ", srcExpr)
							// }
							let checkProp = checked.properties[propName]
							if(!checkProp){
								return null
							}
							let newInfer = this.typeExtendsType(checkProp, tempProp, srcExpr)
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

	private mergeInfers(baseMap: InferMap | null, newMap: InferMap | null): InferMap | null {
		if(newMap && newMap.size > 0){
			baseMap = baseMap || new Map<string, Runtyper.SimpleType>()
			for(let [k, v] of newMap){
				let oldValue = baseMap.get(k)
				if(!oldValue){
					baseMap.set(k, v)
				} else if(!deepEquals(v, oldValue)){
					this.fail("failed to infer value of generic argument " + k + ": two different values found: " + JSON.stringify(oldValue) + " and " + JSON.stringify(v))
				}
			}
		}
		return baseMap
	}


	appendConstToType(type: Runtyper.SimpleType, value: Runtyper.ConstantType["value"]): Runtyper.SimpleType {
		return this.makeUnion([type, {type: "constant", value}])
	}

}

type InferMap = Map<string, Runtyper.SimpleType>
import {Runtyper} from "entrypoint"
import {getInferredUnknownName} from "inferred_unknown"

export function copyTypeRefs(resultType: Runtyper.SimpleType, baseType: Runtyper.SimpleType | null): Runtyper.SimpleType {
	if(!baseType || !baseType.refName){
		return resultType
	} else {
		return {
			...resultType,
			refName: baseType.refName,
			fullRefName: baseType.fullRefName
		}
	}
}

/** Given some selection of types, make type that represents them as union
 * May return a lot of different types, not only union types */
export function makeUnion(types: readonly Runtyper.SimpleType[], baseType: Runtyper.SimpleType | null = null, dropConstantsBySimpleTypes = true, simplifyNestedIntersections = true): Runtyper.SimpleType {
	let consts = [] as Runtyper.ConstantType["value"][]
	let otherTypes = [] as Runtyper.SimpleType[]
	let simpleTypes = [] as ("string" | "number" | "boolean")[]
	let hasAny = false
	types.forEach(type => {
		forEachTerminalTypeInUnion(type, type => {
			if(type.type === "constant"){
				consts.push(type.value)
			} else if(type.type === "string" || type.type === "number" || type.type === "boolean"){
				otherTypes.push(type)
				simpleTypes.push(type.type)
			} else if(type.type === "never"){
				// nothing, nevers are dropped from unions
			} else if(type.type === "any"){
				hasAny = true
			} else if(type.type === "intersection" && simplifyNestedIntersections){
				let simplified = makeIntersection(type.types, type)
				otherTypes.push(simplified)
			} else {
				otherTypes.push(type)
			}
		})
	})

	if(hasAny){
		return {type: "any"}
	}

	if(dropConstantsBySimpleTypes){
		// algebraically it makes sence to always drop constants by simple types
		// but sometimes we must return union type from keyof operator
		// and then it makes all the sense to actually keep constants
		// because each constant type is NOT optional (unless stated otherwise)
		// (and generic types (like `"string"`) are optional, because they are index keys)
		for(let simpleType of simpleTypes){
			consts = consts.filter(v => typeof(v) !== simpleType)
		}
	}
	consts = [...new Set(consts)].sort()

	if(consts.length === 1){
		otherTypes.push({type: "constant", value: consts[0]!})
	} else if(consts.length > 1){
		otherTypes.push({type: "constant_union", value: consts})
	}

	let hasUnknown = !!otherTypes.find(x => x.type === "unknown" && getInferredUnknownName(x) === null)
	if(hasUnknown){
		// unknown | anything_else = unknown
		return copyTypeRefs({type: "unknown"}, baseType)
	}

	if(otherTypes.length === 0){
		return copyTypeRefs({type: "never"}, baseType)
	} else if(otherTypes.length === 1){
		return copyTypeRefs(otherTypes[0]!, baseType)
	} else {
		return copyTypeRefs({type: "union", types: otherTypes}, baseType)
	}
}

export function forEachTerminalTypeInUnion(type: Runtyper.SimpleType, handler: (type: Runtyper.SimpleType) => void): void {
	if(type.type === "union"){
		type.types.forEach(subtype => forEachTerminalTypeInUnion(subtype, handler))
	} else if(type.type === "constant_union"){
		type.value.forEach(v => handler({type: "constant", value: v}))
	} else {
		handler(type)
	}
}

export function forEachTerminalTypeInUnionIntersection(type: Runtyper.SimpleType, handler: (type: Runtyper.SimpleType) => void): void {
	if(type.type === "union" || type.type === "intersection"){
		type.types.forEach(subtype => forEachTerminalTypeInUnionIntersection(subtype, handler))
	} else if(type.type === "constant_union"){
		type.value.forEach(v => handler({type: "constant", value: v}))
	} else {
		handler(type)
	}
}

export function removeTypesFromUnion(type: Runtyper.SimpleType, shouldBeRemoved: (simpleType: Runtyper.SimpleType) => boolean): Runtyper.SimpleType {
	let dropped = false
	let resultTypePack = [] as Runtyper.SimpleType[]
	forEachTerminalTypeInUnion(type, type => {
		if(shouldBeRemoved(type)){
			dropped = true
		} else {
			resultTypePack.push(type)
		}
	})
	return !dropped ? type : makeUnion(resultTypePack, type, false)
}

export function removeConstantFromType(type: Runtyper.SimpleType, value: Runtyper.ConstantType["value"]): Runtyper.SimpleType {
	return removeTypesFromUnion(type, type => type.type === "constant" && type.value === value)
}


export function isObjectIndexKeyType(type: Runtyper.SimpleType | Runtyper.Type): type is Runtyper.ObjectIndexKeyType {
	if(type.type === "constant" && (typeof(type.value) === "string" || typeof(type.value) === "number")){
		return true
	} else if(type.type === "constant_union"){
		return !type.value.find(v => typeof(v) !== "string" && typeof(v) !== "number")
	} else if(type.type === "string" || type.type === "number"){
		return true
	} else if(type.type === "union"){
		let types = type.types as (Runtyper.SimpleType | Runtyper.Type)[]
		return !types.find(t => !isObjectIndexKeyType(t))
	} else {
		return false
	}
}

export function canBeUndefined(type: Runtyper.SimpleType): boolean {
	let hasUndefined = false
	forEachTerminalTypeInUnion(type, subtype => {
		if(subtype.type === "constant" && subtype.value === undefined){
			hasUndefined = true
		}
	})
	return hasUndefined
}

export function describeObjectTypeKeys(type: Runtyper.SimpleObjectType<Runtyper.SimpleType>): {fixed: Map<string, Runtyper.SimpleType> | null, stringIndexValue: Runtyper.SimpleType | null} {
	let fixed = new Map<string, Runtyper.SimpleType>()
	for(let k in type.properties){
		fixed.set(k, type.properties[k]!)
	}

	let stringIndexValue: Runtyper.SimpleType | null = null

	// known keys may be a part of index, let's also check that
	// (type_simplifier does not yield constant keys in index btw, but still, let's check index key type)
	if(type.index){
		forEachTerminalTypeInUnion(type.index.keyType, keySubtype => {
			if(keySubtype.type === "constant"){
				if(typeof(keySubtype.value) !== "string"){
					throw new Error("Cannot build validator: constant key of object is not string: " + JSON.stringify(keySubtype.value) + " (of type " + typeof(keySubtype.value) + ")")
				}
				if(fixed.has(keySubtype.value)){
					throw new Error("Key " + JSON.stringify(keySubtype.value) + " is present both as field and part of index key type")
				}
				fixed.set(keySubtype.value, makeUnion([type.index!.valueType, {type: "constant", value: undefined}]))
			} else if(keySubtype.type === "string"){
				stringIndexValue = makeUnion([type.index!.valueType, {type: "constant", value: undefined}])
			} else {
				throw new Error("Cannot build validator: index key of object is not string: " + JSON.stringify(keySubtype))
			}
		})
	}

	return {
		fixed: fixed.size === 0 ? null : fixed,
		stringIndexValue
	}
}

export function makeIntersection(types: readonly Runtyper.SimpleType[], baseType: Runtyper.SimpleType | null, simplifyNestedUnions = true): Runtyper.SimpleType {
	// do I really need this early return?
	if(types.length === 1){
		let firstType = types[0]!
		switch(firstType.type){
			case "intersection": return makeIntersection(firstType.types, baseType)
			case "union": return makeUnion(firstType.types, baseType)
			default: return firstType
		}
	} else if(types.length === 0){
		return copyTypeRefs({type: "never"}, baseType)
	}

	let hasAny = false, hasUnknown = false, hasNever = false
	let consts = null as Set<Runtyper.ConstantType["value"]> | null
	// null means no primitive types, false means there is intersection of more than one
	let primitiveType = null as null | "string" | "number" | "boolean" | "object" | "array" | false

	let addPrimitiveType = (name: "string" | "number" | "boolean" | "object" | "array") => {
		primitiveType = primitiveType === null || primitiveType === name ? name : false
	}

	let objectTypes = [] as Runtyper.SimpleObjectType<Runtyper.SimpleType>[]
	let otherTypes = [] as Runtyper.SimpleType[]

	let addSubtype = (subtype: Runtyper.SimpleType): void => {
		switch(subtype.type){
			case "constant":{
				consts = !consts || consts.has(subtype.value) ? new Set([subtype.value]) : new Set()
				break
			}
			case "constant_union":{
				if(!consts){
					consts = new Set(subtype.value)
				} else {
					let unionVals = new Set(subtype.value)
					for(let v of [...consts]){
						if(!unionVals.has(v)){
							consts.delete(v)
						}
					}
				}
				break
			}
			case "any":
				hasAny = true
				break
			case "unknown":
				hasUnknown = true
				break
			case "never":
				hasNever = true
				break
			case "string":
			case "number":
			case "boolean":
				addPrimitiveType(subtype.type)
				break
			case "object":
				addPrimitiveType(subtype.type)
				objectTypes.push(subtype)
				break
			case "tuple":
			case "array":
				otherTypes.push(subtype)
				addPrimitiveType("array")
				break
			case "intersection":
				for(let subsubtype of subtype.types){
					addSubtype(subsubtype)
				}
				break
			case "union":{
				if(simplifyNestedUnions){
					subtype = makeUnion(subtype.types, subtype)
					if(subtype.type !== "union"){
						addSubtype(subtype)
						break
					}
				}
				otherTypes.push(subtype)
				break
			}
			// default: throw new Error("I forgot to process type " + subtype.type + " in intersection simplification")
		}
	}

	for(let subtype of types){
		addSubtype(subtype)
	}

	if(primitiveType === false){
		return copyTypeRefs({type: "never"}, baseType)
	}

	if(primitiveType !== null){
		if(primitiveType === "string" || primitiveType === "number" || primitiveType === "boolean"){
			otherTypes.push({type: primitiveType})
		}
		if(consts){
			for(let v of [...consts]){
				if(typeof(v) !== primitiveType){
					consts.delete(v)
				}
			}
		}
	}

	if((consts && consts.size === 0)){
		return copyTypeRefs({type: "never"}, baseType)
	}

	if(hasNever){
		return copyTypeRefs({type: "never"}, baseType)
	}

	if(hasAny){
		return copyTypeRefs({type: "any"}, baseType)
	}

	if(consts && consts.size === 1){
		for(let v of consts){
			return copyTypeRefs({type: "constant", value: v}, baseType)
		}
	}

	let objType = objectTypes[0]
	for(let i = 1; i < objectTypes.length; i++){
		objType = mergeObjectsInIntersection(objType!, objectTypes[i]!)
	}

	if(objType){
		if(otherTypes.length < 1){
			return copyTypeRefs(objType, baseType)
		}
		return copyTypeRefs({type: "intersection", types: [objType, ...otherTypes]}, baseType)
	}
	if(otherTypes.length === 1){
		return copyTypeRefs(otherTypes[0]!, baseType)
	}
	if(otherTypes.length > 1){
		return copyTypeRefs({type: "intersection", types: otherTypes}, baseType)
	}

	if(hasUnknown){
		return copyTypeRefs({type: "unknown"}, baseType)
	}

	throw new Error("Cannot make intersection: reached end of the function and don't know what to do; source types are " + JSON.stringify(types))
}

function mergeObjectsInIntersection(a: Runtyper.SimpleObjectType<Runtyper.SimpleType>, b: Runtyper.SimpleObjectType<Runtyper.SimpleType>): Runtyper.SimpleObjectType<Runtyper.SimpleType> {
	let props = {} as {[k: string]: Runtyper.SimpleType}

	for(let k in a.properties){
		if(k in b.properties){
			props[k] = makeIntersection([a.properties[k]!, b.properties[k]!], null)
		} else {
			props[k] = a.properties[k]!
		}
	}

	for(let k in b.properties){
		if(!(k in props)){
			props[k] = b.properties[k]!
		}
	}

	let index = a.index || b.index
	if(a.index && b.index){
		let keyType = makeUnion([a.index.keyType, b.index.keyType], null)
		if(!isObjectIndexKeyType(keyType)){
			throw new Error("Failed to make union of two key types: the result is not valid key type. Source types are " + JSON.stringify(a.index.keyType) + " and " + JSON.stringify(b.index.keyType))
		}
		index = {
			keyType,
			valueType: makeIntersection([a.index.valueType, b.index.valueType], null)
		}
	}

	let result: Runtyper.SimpleObjectType<Runtyper.SimpleType> = {type: "object", properties: props}
	if(index){
		result = {...result, index}
	}
	return result
}


export type DiscriminatedTypePack = DiscriminatedUnionGroup | Runtyper.SimpleObjectType<Runtyper.SimpleType>[]

export interface DiscriminatedUnionGroup {
	// switch(obj[propertyName]){
	propertyName: string

	// case "123": recursion
	mapping: Map<Runtyper.ConstantType["value"], DiscriminatedTypePack>

	// default: recursion
	default: DiscriminatedTypePack
}

export function findDiscriminatorsInUnion(types: Runtyper.SimpleObjectType<Runtyper.SimpleType>[]): DiscriminatedTypePack {
	let keys = {} as Record<string, Set<Runtyper.ConstantType["value"]>>
	for(let obj of types){
		for(let propName in obj.properties){
			let propType = obj.properties[propName]!
			let values = null as null | readonly Runtyper.ConstantType["value"][]
			if(propType.type === "constant"){
				values = [propType.value]
			} else if(propType.type === "constant_union"){
				values = propType.value
			} else {
				continue
			}

			if(propName in keys){
				for(let value of values){
					keys[propName]!.add(value)
				}
			} else {
				keys[propName] = new Set(values)
			}
		}
	}

	let keyOrder = Object.keys(keys).sort((a, b) => keys[b]!.size - keys[a]!.size)
	let result = groupByDiscriminatorKeys(types, keyOrder)
	return result
}

function groupByDiscriminatorKeys(types: Runtyper.SimpleObjectType<Runtyper.SimpleType>[], keys: string[], i = 0): DiscriminatedTypePack {
	if(keys.length <= i){
		return types
	}

	let pack = groupByDiscriminatorKey(types, keys[i]!)
	if(Array.isArray(pack)){
		return groupByDiscriminatorKeys(pack, keys, i + 1)
	}

	for(let [key, value] of pack.mapping){
		if(Array.isArray(value)){
			pack.mapping.set(key, groupByDiscriminatorKeys(value, keys, i + 1))
		}
	}
	if(Array.isArray(pack.default)){
		pack.default = groupByDiscriminatorKeys(pack.default, keys, i + 1)
	}

	return pack
}

function groupByDiscriminatorKey(types: Runtyper.SimpleObjectType<Runtyper.SimpleType>[], key: string): DiscriminatedTypePack {
	let dflt = [] as Runtyper.SimpleObjectType<Runtyper.SimpleType>[]
	let map = new Map<Runtyper.ConstantType["value"], Runtyper.SimpleObjectType<Runtyper.SimpleType>[]>()

	for(let type of types){
		let propType = type.properties[key]
		if(!propType){
			dflt.push(type)
			continue
		}

		let values = null as null | readonly Runtyper.ConstantType["value"][]
		if(propType.type === "constant"){
			values = [propType.value]
		} else if(propType.type === "constant_union"){
			values = propType.value
		} else {
			dflt.push(type)
			continue
		}

		for(let value of values){
			let arr = map.get(value)
			if(!arr){
				arr = []
				map.set(value, arr)
			}
			arr.push(type)
		}
	}

	if(map.size === 0){
		return dflt
	} else {
		return {
			propertyName: key,
			mapping: map,
			default: dflt
		}
	}

}
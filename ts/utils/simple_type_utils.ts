import {Runtyper} from "entrypoint"
import {getInferredUnknownName} from "inferred_unknown"

/** Given some selection of types, make type that represents them as union
 * May return a lot of different types, not only union types */
export function makeUnion(types: readonly Runtyper.SimpleType[], dropConstantsBySimpleTypes = true): Runtyper.SimpleType {
	let consts = [] as Runtyper.ConstantType["value"][]
	let otherTypes = [] as Runtyper.SimpleType[]
	let simpleTypes = [] as ("string" | "number" | "boolean")[]
	let hasAny = false
	types.forEach(type => forEachTerminalTypeInUnion(type, type => {
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
	let hasUnknown = !!otherTypes.find(x => x.type === "unknown" && getInferredUnknownName(x) === null)
	if(hasUnknown){
		// unknown | anything_else = unknown
		return {type: "unknown"}
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

	if(otherTypes.length === 0){
		return {type: "never"}
	} else if(otherTypes.length === 1){
		return otherTypes[0]!
	} else {
		return {type: "union", types: otherTypes}
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
	return !dropped ? type : makeUnion(resultTypePack, false)
}

export function removeConstantFromType(type: Runtyper.SimpleType, value: Runtyper.ConstantType["value"]): Runtyper.SimpleType {
	return removeTypesFromUnion(type, type => type.type === "constant" && type.value === value)
}


export function isObjectIndexKeyType(type: Runtyper.Type): type is Runtyper.ObjectIndexKeyType {
	if(type.type === "constant" && (typeof(type.value) === "string" || typeof(type.value) === "number")){
		return true
	} else if(type.type === "constant_union"){
		return !type.value.find(v => typeof(v) !== "string" && typeof(v) !== "number")
	} else if(type.type === "string" || type.type === "number"){
		return true
	} else if(type.type === "union"){
		return !type.types.find(t => !isObjectIndexKeyType(t))
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

// export function simplifyIntersection(type: Runtyper.IntersectionType<Runtyper.SimpleType>): Runtyper.SimpleType {
// 	if(type.types.length === 1){
// 		let firstType = type.types[0]!
// 		return firstType.type === "intersection" ? simplifyIntersection(firstType) : firstType
// 	} else if(type.types.length === 0){
// 		return {type: "never"}
// 	}
// 	let hasAny = false, hasUnknown = false, hasNever = false
// 	let consts = null as Set<Runtyper.ConstantType["value"]> | null
// 	let primitiveTypes = null as null | Set<"string" | "number" | "boolean" | "object" | "array">
// 	let objectTypes = [] as Runtyper.SimpleObjectType<Runtyper.SimpleType>[]

// 	let addSubtype = (subtype: Runtyper.SimpleType): void => {
// 		switch(subtype.type){
// 			case "constant":{
// 				consts = !consts || consts.has(subtype.value) ? new Set([subtype.value]) : new Set()
// 				break
// 			}
// 			case "constant_union":{
// 				if(!consts){
// 					consts = new Set(subtype.value)
// 				} else {
// 					let unionVals = new Set(subtype.value)
// 					for(let v of [...consts]){
// 						if(!unionVals.has(v)){
// 							consts.delete(v)
// 						}
// 					}
// 				}
// 				break
// 			}
// 			case "any":
// 				hasAny = true
// 				break
// 			case "unknown":
// 				hasUnknown = true
// 				break
// 			case "never":
// 				hasNever = true
// 				break
// 			case "string":
// 			case "number":
// 			case "boolean":
// 				primitiveTypes = !primitiveTypes || primitiveTypes.has(subtype.type) ? new Set([subtype.type]) : new Set()
// 				break
// 			case "object":
// 				primitiveTypes = !primitiveTypes || primitiveTypes.has(subtype.type) ? new Set([subtype.type]) : new Set()
// 				objectTypes.push(subtype)
// 				break
// 			case "tuple":
// 			case "array":
// 				primitiveTypes = !primitiveTypes || primitiveTypes.has("array") ? new Set(["array"]) : new Set()
// 				break
// 			case "intersection":
// 				addSubtype(subtype)
// 				break
// 			case "union":{
// 				let unionConsts = new Set<Runtyper.ConstantType["value"]>()
// 				let unionPrimitives = new Set<"string" | "number" | "boolean" | "object" | "array">()
// 				forEachTerminalTypeInUnion(subtype, subsubtype => {
// 					switch(subsubtype.type){
// 						case "constant":
// 							unionConsts.add(subsubtype.value)
// 							break
// 						case "string":
// 						case "number":
// 						case "boolean":
// 						case "object":
// 							unionPrimitives.add(subsubtype.type)
// 							break
// 						case "array":
// 						case "tuple":
// 							unionPrimitives.add("array")
// 							break
// 						case "
// 					}
// 				})
// 			}
// 		}

// 		for(let subtype of type.types){
// 			addSubtype(subtype)
// 		}
// 	}
// }
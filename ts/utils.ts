import {Runtyper} from "entrypoint"

/* eslint-disable @typescript-eslint/ban-types */
export function deepEquals(a: unknown, b: unknown): boolean {
	if(a === b){
		return true
	}

	let ta = typeof(a)
	let tb = typeof(b)
	if(ta !== tb){
		return false
	}

	switch(ta){
		case "object":{
			if(Array.isArray(a) || Array.isArray(b)){
				if(!Array.isArray(a) || !Array.isArray(b)){
					return false
				}
				if(a.length !== b.length){
					return false
				}
				for(let i = 0; i < a.length; i++){
					if(!deepEquals(a[i], b[i])){
						return false
					}
				}
				return true
			}

			if(!a || !b){ // проверка на null
				return false
			}

			let ka = Object.keys(a as object)
			let kb = Object.keys(b as object)
			if(ka.length !== kb.length){
				return false
			}
			for(let key in a as object){
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				if(!(key in (b as object)) || !deepEquals((a as any)[key], (b as any)[key])){
					return false
				}
			}
			return true
		}
		default: // числа, строки, булевы переменнные, функции и т.д.
			return false // a === b проверили выше
	}
}

export function capitalize(x: string): string {
	return x.length === 0 ? x : x.charAt(0).toUpperCase() + x.substring(1)
}

export type RoRecord<T> = {readonly [k: string]: T}

export function applyNonNull<D>(type: Runtyper.SimpleType, dflt: D): Runtyper.SimpleType | D
export function applyNonNull<D>(type: Runtyper.Type, dflt: D): Runtyper.Type | D
export function applyNonNull<D>(type: Runtyper.Type, dflt: D): Runtyper.Type | D {
	if(type.type === "constant"){
		if(type.value === null || type.value === undefined){
			return {type: "never"}
		} else {
			return type
		}
	} else if(type.type === "constant_union"){
		return clearConstantUnionOfNullUndefined(type)
	} else if(type.type === "union"){
		let types = [] as Runtyper.Type[]
		for(let t of type.types){
			if(t.type === "constant" && (t.value === undefined || t.value === null)){
				continue // drop
			} else if(t.type === "constant_union"){
				let cleared = clearConstantUnionOfNullUndefined(t)
				if(cleared.type !== "never"){
					types.push(cleared)
				}
			} else {
				types.push(t)
			}
		}
		return types.length > 1 ? {type: "union", types} : types.length === 1 ? types[0]! : {type: "never"}
	} else {
		return dflt
	}
}

function clearConstantUnionOfNullUndefined(type: Runtyper.ConstantUnionType): Runtyper.Type {
	let vals = type.value.filter(x => x !== undefined && x !== null)
	if(vals.length === 0){
		return {type: "never"}
	} else if(vals.length === 1){
		return {type: "constant", value: vals[0]!}
	} else {
		return {type: "constant_union", value: vals}
	}
}

export function appendConstToType(type: Runtyper.SimpleType, value: Runtyper.ConstantType["value"]): Runtyper.SimpleType {
	let constUnionValues: Runtyper.ConstantType["value"][]
	if(type.type === "union"){
		let constUnion = type.types.find(x => x.type === "constant_union")
		if(constUnion){
			let otherTypes = type.types.filter(x => x !== constUnion)
			return {type: "union", types: [appendConstToType(constUnion, value), ...otherTypes]}
		} else {
			let cnst = type.types.find(x => x.type === "constant")
			if(cnst){
				let otherTypes = type.types.filter(x => x !== cnst)
				return {type: "union", types: [appendConstToType(cnst, value), ...otherTypes]}
			} else {
				return {type: "union", types: [{type: "constant", value}, ...type.types]}
			}
		}
	} else if(type.type === "constant_union"){
		constUnionValues = [value, ...type.value]
	} else if(type.type === "constant"){
		constUnionValues = [value, type.value]
	} else {
		return {type: "union", types: [{type: "constant", value}, type]}
	}

	constUnionValues = [...new Set(constUnionValues)].sort()
	if(constUnionValues.length === 1){
		return {type: "constant", value: constUnionValues[0]!}
	} else {
		return {type: "constant_union", value: constUnionValues}
	}
}
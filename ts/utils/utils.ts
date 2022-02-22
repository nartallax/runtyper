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

			if(a instanceof Set || b instanceof Set){
				if(!(a instanceof Set) || !(b instanceof Set)){
					return false
				}
				if(a.size !== b.size){
					return false
				}
				for(let v of a){
					if(!b.has(v)){
						return false
					}
				}
				return true
			}

			if(a instanceof Map || b instanceof Map){
				if(!(a instanceof Map) || !(b instanceof Map)){
					return false
				}
				if(a.size !== b.size){
					return false
				}
				for(let [k, v] of a){
					if(!b.has(k)){
						return false
					}
					if(!deepEquals(v, b.get(k)!)){
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

export type RoRecord<T> = {readonly [k: string]: T}
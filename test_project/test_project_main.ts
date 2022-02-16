import {Runtyper} from "runtyper/runtyper"

export const simplifiedTests = [] as [Runtyper.Type, (Runtyper.SimpleType | string)][]

export function main(): void {
	for(let [srcType, result] of simplifiedTests){
		// console.log("running simplification test: ", srcType)
		try {
			let simplifiedStructure = Runtyper.simplifier.simplify(srcType)
			if(!deepEquals(result, simplifiedStructure)){
				console.error("Simplification test failed:")
				console.error("source: " + JSON.stringify(srcType))
				console.error("expected: " + JSON.stringify(result))
				console.error("got: " + JSON.stringify(simplifiedStructure))
				process.exit(1)
			}
		} catch(e){
			if(!(e instanceof Error) || typeof(result) !== "string"){
				console.error("Simplification test failed:")
				console.error("source: " + JSON.stringify(srcType))
				console.error("stack: " + (e as Error).stack)
				process.exit(1)
			}
			if(e.message.indexOf(result) < 0){
				console.error("Simplification test failed:")
				console.error("source: " + JSON.stringify(srcType))
				console.error("expected error text: " + result)
				console.error("got error text: " + e.message)
				console.error("stack: " + e.stack)
				process.exit(1)
			}
		}
	}
}





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
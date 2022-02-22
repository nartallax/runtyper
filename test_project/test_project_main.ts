import {Runtyper} from "runtyper/runtyper"

export const simplificationTests = [] as [Runtyper.Type, (Runtyper.SimpleType | string)][]
export const codeGenerationTests = [] as [Runtyper.Type, string, Partial<Runtyper.ValidatorBuilderOptions & {ensureAbsent: boolean}>?][]
export const validationTests = [] as [Runtyper.Type, unknown, string | null, Partial<Runtyper.ValidatorBuilderOptions>?][]

export function main(): void {

	let failedCount = runSimplificationTests() + runCodeGenerationTests() + runValidationTests()

	if(failedCount === 0){
		console.error("Testing successful.")
		process.exit(0)
	} else {
		console.error("Failed " + failedCount + " tests. Testing failed.")
		process.exit(failedCount === 0 ? 0 : 1)
	}
}



function runSimplificationTests(): number {
	let failedCount = 0
	for(let [srcType, result] of simplificationTests){
		try {
			let simplifiedStructure = Runtyper.getSimplifier().simplify(srcType)
			// console.dir(simplifiedStructure, {depth: null})
			try {
				void JSON.stringify(simplifiedStructure) // to check on recursive types
			} catch(e){
				throw new Error("This structure is not JSONable.")
			}

			if(!deepEquals(result, simplifiedStructure)){
				console.error("\nSimplification test failed:")
				console.error("source: " + JSON.stringify(srcType))
				console.error("expected: " + JSON.stringify(result))
				console.error("got: " + JSON.stringify(simplifiedStructure))
				failedCount++
			}
		} catch(e){
			if(!(e instanceof Error)){
				throw e
			}
			if(typeof(result) !== "string"){
				console.error("\nSimplification test failed:")
				console.error("source: " + JSON.stringify(srcType))
				console.error("stack: " + (e as Error).stack)
				failedCount++
			} else if(e.message.indexOf(result) < 0){
				console.error("\nSimplification test failed:")
				console.error("source: " + JSON.stringify(srcType))
				console.error("expected error text: " + result)
				console.error("got error text: " + e.message)
				console.error("stack: " + e.stack)
				failedCount++
			}
		}
	}

	return failedCount
}

function runCodeGenerationTests(): number {
	let failCount = 0
	for(let [type, result, mbOptions] of codeGenerationTests){
		try {
			let builder = Runtyper.getValidatorBuilder(mbOptions)
			let code = builder.buildCode(Runtyper.getSimplifier().simplify(type))
			let hasFragment = code.code.indexOf(result) < 0
			if(hasFragment === !(mbOptions?.ensureAbsent)){
				console.error("\nCode generation test failed:")
				console.error("source: " + JSON.stringify(type))
				console.error("expected: " + result)
				console.error("got: " + code.code)
				failCount++
			}
		} catch(e){
			if(!(e instanceof Error)){
				throw e
			}
			let hasFragment = e.message.indexOf(result) < 0
			if(hasFragment === !(mbOptions?.ensureAbsent)){
				console.error("\nCode generation test failed:")
				console.error("source: " + JSON.stringify(type))
				console.error("expected: " + result)
				console.error("got error text: " + e.message)
				console.error("stack: " + e.stack)
				failCount++
			}
		}
	}
	return failCount
}

function runValidationTests(): number {
	let failCount = 0
	for(let [type, value, expectedResult, mbOptions] of validationTests){
		try {
			let builder = Runtyper.getValidatorBuilder(mbOptions)
			let validator = builder.build(Runtyper.getSimplifier().simplify(type))
			validator(value)
			if(expectedResult !== null){
				console.error("\nValidation test failed:")
				console.error("type: " + JSON.stringify(type))
				console.error("value: " + JSON.stringify(value))
				console.error("expected error: " + expectedResult)
				console.error("got no error")
				failCount++
			}
		} catch(e){
			if(!(e instanceof Error)){
				throw e
			}
			if(expectedResult === null){
				console.error("\nValidation test failed:")
				console.error("type: " + JSON.stringify(type))
				console.error("value: " + JSON.stringify(value))
				console.error("expected no error")
				console.error("got error text: " + e.message)
				// console.error("stack: " + e.stack)
				failCount++
			} else if(e.message.indexOf(expectedResult) < 0){
				console.error("\nValidation test failed:")
				console.error("type: " + JSON.stringify(type))
				console.error("value: " + JSON.stringify(value))
				console.error("expected error: " + expectedResult)
				console.error("got error text: " + e.message)
				// console.error("stack: " + e.stack)
				failCount++
			}
		}
	}
	return failCount
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
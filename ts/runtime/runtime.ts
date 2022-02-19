import {Runtyper} from "entrypoint"

// functions that work in runtime are living in this file

export const functionsByName = new Map<string, () => void>()
export const nameByFunctions = new Map<() => void, string>()
export const valueTypes = new Map<string, Runtyper.Type>()
export const refTypes = new Map<string, Runtyper.Type>()
export const attachedValidators = new Map<Runtyper.Type, ((v: unknown) => void)[]>()

export function buildValidator(type: Runtyper.Type): (value: unknown) => void {
	void type
	throw new Error("Not implemented.")
}

export function attachValidator<T>(type: Runtyper.Type, validator: (value: T) => void): void {
	let arr = attachedValidators.get(type)
	if(!arr){
		arr = []
		attachedValidators.set(type, arr)
	}
	arr.push(validator as (value: unknown) => void)
}

export function finalize(): void {
	throw new Error("Not implemented.")
}
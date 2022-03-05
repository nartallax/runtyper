import {Runtyper} from "entrypoint"
import {makeRefNameFromRef} from "runtime/type_stringifier"

export const functionsByName = new Map<string, () => void>()
export const nameByFunctions = new Map<() => void, string>()
export const valueTypes = new Map<string, Runtyper.Type>()
export const refTypes = new Map<string, Runtyper.Type>()
export const typeValidators = new Map<string, ((v: unknown) => boolean)[]>()
export const valueValidators = new Map<string, ((v: unknown) => boolean)[]>()
const rawValidators = [] as {type: Runtyper.ReferenceType, fullName: boolean, validator(value: unknown): boolean}[]

export function cleanupAllMaps(): void {
	typeValidators.clear()
	valueValidators.clear()
	functionsByName.clear()
	nameByFunctions.clear()
	refTypes.clear()
	valueTypes.clear()
	rawValidators.length = 0
}

export function attachValidator(type: Runtyper.Type, fullName: boolean, validator: (value: unknown) => boolean): void {
	if(type.type !== "value_reference" && type.type !== "type_reference"){
		throw new Error("It does not makes sense to add validator to something other than reference type. You probably did something wrong.")
	}
	rawValidators.push({type, fullName, validator})
}

export function processValidators(): void {
	rawValidators.forEach(({type, fullName, validator}) => {
		let name = !fullName ? type.name : makeRefNameFromRef(type, true)
		let map = type.type === "value_reference" ? valueValidators : typeValidators
		let arr = map.get(name)
		if(!arr){
			arr = []
			map.set(name, arr)
		}
		arr.push(validator as (value: unknown) => boolean)
	})
	rawValidators.length = 0
}
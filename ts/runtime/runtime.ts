/* eslint-disable @typescript-eslint/ban-types */
import {Runtyper} from "entrypoint"
import {makeRefNameFromRef} from "runtime/type_stringifier"

export const functionsByName = new Map<string, Function>()
export const nameByFunctions = new Map<Function, string>()
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

export function getPublicMethodsOfClass(cls: Function, includeParentClasses?: boolean): Record<string, Function> {
	let clsName = nameByFunctions.get(cls)
	if(!clsName){
		throw new Error("Cannot find class name " + cls)
	}
	let clsType = valueTypes.get(clsName)
	if(!clsType){
		throw new Error("Cannot find class type for class " + clsName)
	}
	if(clsType.type !== "class"){
		throw new Error("Type that was found for class is not a `class` type: it's " + clsType.type + " : " + clsName)
	}

	let result = {} as Record<string, Function>
	getPublicMethodsOfClassType(clsType, !!includeParentClasses, result)
	return result
}

function getPublicMethodsOfClassType(clsType: Runtyper.ClassDeclaration, includeParentClasses: boolean, result: Record<string, Function>): void {
	if(includeParentClasses && clsType.heritage){
		clsType.heritage.forEach(clause => {
			if(clause.type !== "value_reference"){
				return
			}
			let type = valueTypes.get(clause.name)
			if(!type){
				throw new Error("Cannot get type of inherited entity by name: " + clause.name)
			}
			if(type.type === "class"){
				getPublicMethodsOfClassType(type, includeParentClasses, result)
			}
		})
	}

	if(clsType.methods){
		for(let methodName in clsType.methods){
			let method = clsType.methods[methodName]!
			if(method.access !== "public"){
				continue
			}
			let fn = functionsByName.get(method.functionName)
			if(!fn){
				throw new Error("Failed to get method function by method name: " + method.functionName)
			}
			result[methodName] = fn
		}
	}
}
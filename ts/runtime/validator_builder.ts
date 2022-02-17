// import {Runtyper} from "entrypoint"
// import {refTypes, valueTypes} from "runtime/runtime"
// import {capitalize, RoRecord} from "utils"

// interface ConstructorValue {
// 	name: string
// 	value: unknown
// }

// /** Code of validator that is boolean expression
//  * This expression is either false if validation failed, or true if the value is alright */
// interface ConditionValidatorCode {
// 	isCondition: true
// 	values?: ConstructorValue[]
// 	expression(valueName: string): string
// }

// /** Code of validator that is some function.
//  * When said function is invoked, it should either throw or pass */
// interface FunctionValidatorCode {
// 	isCondition: false
// 	declaration?: string
// 	declarationName?: string
// 	values?: ConstructorValue[]
// }

// type ValidatorCode = ConditionValidatorCode | FunctionValidatorCode

// interface ValidatorCodeBundle {
// 	values: ConstructorValue[]
// 	declarations: []
// 	expressions: []
// }

// export class ValidatorBuilder {

// 	private readonly valueValidators = new Map<string, ValidatorCode>()
// 	private readonly typeValidators = new Map<string, ValidatorCode>()

// 	private usedValueIdentifiers = new Map<string, unknown>()
// 	private currentType: Runtyper.Type | null = null

// 	build<T>(type: Runtyper.Type): (x: unknown) => x is T {
// 		this.currentType = type
// 		try {
// 		} finally {
// 			this.usedIdentifiers.clear()
// 			this.currentType = null
// 		}
// 	}

// 	private makeValue(suggestedName: string, value: unknown): ConstructorValue {
// 		let counter = 1
// 		let name = suggestedName
// 		while(this.usedValueIdentifiers.has(name)){
// 			let oldValue = this.usedValueIdentifiers.get(name)
// 			if(oldValue === value){
// 				return {name, value}
// 			} else {
// 				name = suggestedName + "_" + (counter++)
// 			}
// 		}
// 		this.usedValueIdentifiers.set(name, value)
// 		return {name, value}
// 	}

// 	private makeFailFunctionDeclaration(): string {
// 		return `
// function failValidation(valueName, value, message){
// 	var resultMsg = "Validation failed for value at " + valueName + " (of type " + typeof(value) + ")"
// 	if(message){
// 		resultMsg += ": " + message
// 	}
// 	throw new Error(resultMsg)
// }
// `
// 	}

// private makeFailCall(valueCode: string, message: string): string {
// 	return `failValidation(${JSON.stringify(valueCode)}, ${valueCode}, ${JSON.stringify(message)})`
// }

// 	private buildOrGetCachedCode(type: Runtyper.TypeReferenceType | Runtyper.ValueReferenceType, genericArgs: GenArgs): ValidatorCode {
// 		let fullName = type.name + "<" + JSON.stringify(genericArgs) + ">"
// 		let codeMap = type.type === "type_reference" ? this.typeValidators : this.valueValidators
// 		let code = codeMap.get(fullName)
// 		if(!code){
// 			let typeMap = type.type === "type_reference" ? refTypes : valueTypes
// 			let targetType = typeMap.get(type.name)
// 			if(!targetType){
// 				this.fail(type.type + " is not naming a known type: " + type.name)
// 			}
// 			code = this.buildCode(targetType, genericArgs)
// 			codeMap.set(fullName, code)
// 		}
// 		return code
// 	}

// 	private buildCode(type: Runtyper.Type, genericArgs: GenArgs): ValidatorCode {
// switch(type.type){
// 	case "broken":
// 		this.fail("detected broken type in file " + type.file + " when processing " + type.node + ": " + type.message)
// 	// eslint-disable-next-line no-fallthrough
// 	case "number": return {
// 		isCondition: true,
// 		expression: valueCode => `(typeof(${valueCode}) === "number" && !Number.isNaN(${valueCode}))`
// 	}
// 	case "string": return {
// 		isCondition: true,
// 		expression: valueCode => `typeof(${valueCode}) === "string"`
// 	}
// 	case "boolean": return {
// 		isCondition: true,
// 		expression: valueCode => `(${valueCode} === true || ${valueCode} === false)`
// 	}
// 	case "any": return {
// 		isCondition: true,
// 		expression: () => "true"
// 	} // TODO: customize by options
// 	case "unknown": return {
// 		isCondition: true,
// 		expression: () => "true"
// 	} // TODO: customize by options
// 	case "never": return {
// 		isCondition: true,
// 		expression: () => "false"
// 	}
// 	case "constant":{
// 		let values = [] as ConstructorValue[]
// 		let valueToCheck: string
// 		if(type.value === undefined){
// 			valueToCheck = "undefined"
// 		} else if(type.value === null){
// 			valueToCheck = "null"
// 		} else if(type.value === true){
// 			valueToCheck = "true"
// 		} else if(type.value === false){
// 			valueToCheck = "false"
// 		} else if(typeof(type.value) === "string"){
// 			valueToCheck = JSON.stringify(type.value)
// 		} else {
// 			let name = typeof(type.value) === "number"
// 				? "const" + type.value
// 				: "constOf" + capitalize(typeof(type.value))
// 			let cval = this.makeValue(name, type.value)
// 			values.push(cval)
// 			valueToCheck = cval.name
// 		}
// 		return {
// 			isCondition: true,
// 			values,
// 			expression: valueCode => `${valueCode} === ${valueToCheck}`
// 		}
// 	}
// 	case "constant_union":{
// 		let set = new Set(type.value)
// 		let constrVal = this.makeValue("unionValueSet", set)
// 		return {
// 			isCondition: true,
// 			values: [constrVal],
// 			expression: valueCode => `${constrVal.name}.has(${valueCode})`
// 		}
// 	}
// 	case "value_reference":
// 	case "type_reference": return this.buildOrGetCachedCode(type)
// 	case "call_result_reference":{
// 		let fnType = valueTypes.get(type.functionName)
// 		if(!fnType){
// 			this.fail("cannot get call result type for function " + type.functionName + " : function is not known.")
// 		}
// 		if(fnType.type === "function"){
// 			if(fnType.signatures.length !== 1){
// 				this.fail("expected exactly one signature of function, got " + fnType.signatures.length + " instead. Getting return type of overloaded functions is not supported: ", fnType)
// 			}
// 			let signature = fnType.signatures[0]!
// 			return this.buildCode(signature.returnType)
// 		} else if(fnType.type === "broken"){
// 			return this.buildCode(fnType)
// 		} else {
// 			this.fail("expected function type, got " + fnType.type + " instead: ", fnType)
// 		}
// 	}
// 	case "alias":{
// 	}
// }
// 	}

// }
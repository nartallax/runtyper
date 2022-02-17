// import {Runtyper} from "entrypoint"
// import {refTypes, valueTypes} from "runtime/runtime"

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

// 	private readonly typeValidators = new Map<Runtyper.SimpleObjectType<Runtyper.SimpleType>, FunctionValidatorCode>()

// 	private usedParamIdentifiers = new Map<string, unknown>()
// 	private usedFnDeclIdentifiers = new Set<string>()


// 	build<T>(type: Runtyper.SimpleType): (x: unknown) => x is T {
// 		try {
// 		} finally {
// 			this.usedParamIdentifiers.clear()
// 		}
// 	}

// 	private isIdentifierInUse(name: string): boolean {
// 		return this.usedParamIdentifiers.has(name) || this.usedFnDeclIdentifiers.has(name)
// 	}

// 	private makeParam(suggestedName: string, value: unknown): ConstructorValue {
// 		let counter = 1
// 		let name = suggestedName
// 		while(this.isIdentifierInUse(name)){
// 			let oldValue = this.usedParamIdentifiers.get(name)
// 			if(oldValue === value){
// 				return {name, value}
// 			} else {
// 				name = suggestedName + "_" + (counter++)
// 			}
// 		}
// 		this.usedParamIdentifiers.set(name, value)
// 		return {name, value}
// 	}

// 	private findUnusedFnDeclName(baseName)

// 	private makeFailFunctionDeclaration(): string {
// 		return `function failValidation(valueName, value, message){
// 	var resultMsg = "Validation failed for value at " + valueName + " (of type " + typeof(value) + ")"
// 	if(message){
// 		resultMsg += ": " + message
// 	}
// 	throw new Error(resultMsg)
// }`
// 	}

// 	private makeFailCall(valueCode: string, message: string): string {
// 		return `failValidation(${JSON.stringify(valueCode)}, ${valueCode}, ${JSON.stringify(message)})`
// 	}

// 	private buildOrGetCachedCode(type: Runtyper.SimpleObjectType<Runtyper.SimpleType>): ValidatorCode {
// 		let result = this.typeValidators.get(type)
// 		if(!result){


// 			result = {
// 				isCondition: false,
// 				declaration: "function(){}"
// 			}
// 			result = this.buildCode(type)
// 		}
// 	}

// 	private buildCode(type: Runtyper.SimpleType): ValidatorCode {
// 		switch(type.type){
// 			case "broken":
// 				this.fail("detected broken type in file " + type.file + " when processing " + type.node + ": " + type.message)
// 				// eslint-disable-next-line no-fallthrough
// 			case "number": return {
// 				isCondition: true,
// 				expression: valueCode => `(typeof(${valueCode}) === "number" && !Number.isNaN(${valueCode}))`
// 			}
// 			case "string": return {
// 				isCondition: true,
// 				expression: valueCode => `typeof(${valueCode}) === "string"`
// 			}
// 			case "boolean": return {
// 				isCondition: true,
// 				expression: valueCode => `(${valueCode} === true || ${valueCode} === false)`
// 			}
// 			case "any": return {
// 				isCondition: true,
// 				expression: () => "true"
// 			} // TODO: customize by options
// 			case "unknown": return {
// 				isCondition: true,
// 				expression: () => "true"
// 			} // TODO: customize by options
// 			case "never": return {
// 				isCondition: true,
// 				expression: () => "false"
// 			}
// 			case "constant":{
// 				let values = [] as ConstructorValue[]
// 				let valueToCheck: string
// 				if(type.value === undefined){
// 					valueToCheck = "undefined"
// 				} else if(type.value === null){
// 					valueToCheck = "null"
// 				} else if(type.value === true){
// 					valueToCheck = "true"
// 				} else if(type.value === false){
// 					valueToCheck = "false"
// 				} else if(typeof(type.value) === "string"){
// 					valueToCheck = JSON.stringify(type.value)
// 				} else {
// 					let name = typeof(type.value) === "number"
// 						? "const" + type.value
// 						: "constOf" + capitalize(typeof(type.value))
// 					let cval = this.makeParam(name, type.value)
// 					values.push(cval)
// 					valueToCheck = cval.name
// 				}
// 				return {
// 					isCondition: true,
// 					values,
// 					expression: valueCode => `${valueCode} === ${valueToCheck}`
// 				}
// 			}
// 			case "constant_union":{
// 				let set = new Set(type.value)
// 				let constrVal = this.makeParam("unionValueSet", set)
// 				return {
// 					isCondition: true,
// 					values: [constrVal],
// 					expression: valueCode => `${constrVal.name}.has(${valueCode})`
// 				}
// 			}
// 			case "value_reference":
// 			case "type_reference": return this.buildOrGetCachedCode(type)
// 			case "call_result_reference":{
// 				let fnType = valueTypes.get(type.functionName)
// 				if(!fnType){
// 					this.fail("cannot get call result type for function " + type.functionName + " : function is not known.")
// 				}
// 				if(fnType.type === "function"){
// 					if(fnType.signatures.length !== 1){
// 						this.fail("expected exactly one signature of function, got " + fnType.signatures.length + " instead. Getting return type of overloaded functions is not supported: ", fnType)
// 					}
// 					let signature = fnType.signatures[0]!
// 					return this.buildCode(signature.returnType)
// 				} else if(fnType.type === "broken"){
// 					return this.buildCode(fnType)
// 				} else {
// 					this.fail("expected function type, got " + fnType.type + " instead: ", fnType)
// 				}
// 			}
// 			case "alias":{
// 			}
// 		}
// 	}

// }
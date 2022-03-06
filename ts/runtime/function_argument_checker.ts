/* eslint-disable @typescript-eslint/ban-types */
import {Runtyper} from "entrypoint"
import {nameByFunctions, valueTypes} from "runtime/runtime"
import {ValidatorUtils} from "runtime/validator_utils"
import {makeUnion} from "utils/simple_type_utils"

interface ParamValidator {
	readonly name?: string
	rest?(value: unknown): Runtyper.ValidationError | null
	validator(value: unknown): Runtyper.ValidationError | null
}

interface ParamSet {
	params: ParamValidator[]
	paramMap: {[k: string]: ParamValidator}
}

export class FunctionArgumentChecker {
	private readonly builder: Runtyper.ValidatorBuilder
	constructor(private readonly options: Runtyper.FunctionArgumentCheckerOptions) {
		this.builder = Runtyper.getValidatorBuilder(options)
	}

	buildForArray(fn: Function): (args: unknown[]) => void {
		let paramSets = this.getParamSets(fn)
		return argsArray => {
			if(!Array.isArray(argsArray)){
				throw new Error("Expected arguments to be in array, but they are in something else (of type " + typeof(argsArray) + ")")
			}
			let lastError: Error | null = null
			setIteration: for(let paramSet of paramSets){
				if(argsArray.length > paramSet.params.length && this.options.onExtraArguments === "validation_error"){
					let lastParam = paramSet.params[paramSet.params.length - 1]
					if(!lastParam || !lastParam.rest){
						lastError = new Error("Found " + (argsArray.length - paramSet.params.length) + " extra arguments in array.")
						continue
					}
				}

				for(let i = 0; i < paramSet.params.length; i++){
					let param = paramSet.params[i]!
					if(param.rest){
						for(let j = i; j < argsArray.length; j++){
							let arg = argsArray[j]
							let validationResult = param.validator(arg)
							if(validationResult){
								if(param.name){
									validationResult = validationResult.withDifferentValueName(param.name)
								}
								lastError = validationResult
								continue setIteration
							}
						}
					} else {
						// duplicate code, yeah
						// don't know how to do this better without harming performance
						// let it just be here
						let arg = argsArray[i]
						let validationResult = param.validator(arg)
						if(validationResult){
							if(param.name){
								validationResult = validationResult.withDifferentValueName(param.name)
							}
							lastError = validationResult
							continue setIteration
						}
					}

				}

				lastError = null
				break
			}

			if(lastError){
				throw lastError
			}
		}
	}

	buildForObject(fn: Function): (args: {[k: string]: unknown}) => unknown[] {
		let paramSets = this.getParamSets(fn)
		let hasNamelessParameter = !!paramSets.find(set => set.params.find(param => param.name === undefined))
		if(hasNamelessParameter){
			throw new Error("Cannot build argument checker: in some overloads, some parameters has no name (due to destructurization probably). Use array argument checker, or rewrite your function definition. Function is: " + fn)
		}

		return argsMap => {
			if(!ValidatorUtils.isTypicalObject(argsMap)){
				throw new Error("Expected map of arguments to be object, got something else (of type " + typeof(argsMap) + ")")
			}

			let lastError: Error | null = null
			let goodSet: ParamSet | null = null
			setIteration: for(let paramSet of paramSets){

				if(this.options.onExtraArguments === "validation_error"){
					for(let k in argsMap){
						if(!(k in paramSet.paramMap)){
							lastError = new Error("Found extra argument: " + k)
							continue setIteration
						}
					}
				}

				for(let param of paramSet.params){
					let arg = argsMap[param.name!]
					let validationResult = param.rest ? param.rest(arg) : param.validator(arg)
					if(validationResult){
						lastError = validationResult.withDifferentValueName(param.name!)
						continue setIteration
					}
				}

				lastError = null
				goodSet = paramSet
				break
			}

			if(lastError || !goodSet){
				throw lastError || new Error("No suitable overload found")
			}

			let result = [] as unknown[]
			for(let param of goodSet.params){
				if(param.rest){
					let paramValue = argsMap[param.name!] as unknown[] | undefined
					// vararg is always allowed to be absent
					if(paramValue){
						result.push(...paramValue)
					}
				} else {
					result.push(argsMap[param.name!])
				}
			}
			return result
		}
	}

	private getParamSets(fn: Function): ParamSet[] {
		let fnName = nameByFunctions.get(fn)
		if(!fnName){
			throw new Error("Cannot build argument checker: function is not known: " + fn)
		}
		let fnType = valueTypes.get(fnName)
		if(!fnType){
			throw new Error("Cannot build argument checker: function type is not known: " + fn)
		}
		if(fnType.type !== "function"){
			throw new Error("Cannot build argument checker: function known as non-function type: " + fn)
		}
		if(fnType.signatures.length === 1){
			return [this.signatureToParamSet(fnType.signatures[0]!)]
		} else if(fnType.signatures.length > 1){
			return fnType.signatures
				.filter(x => !x.hasImplementation)
				.map(x => this.signatureToParamSet(x))
		} else {
			throw new Error("Cannot build argument checker: function has no signatures")
		}
	}

	private signatureToParamSet(signature: Runtyper.CallSignature): ParamSet {
		let params = (signature.parameters || []).map(param => {
			let type = Runtyper.getSimplifier().simplify(param.valueType)
			return {
				name: param.name,
				rest: param.rest ? this.builder.buildNonThrowing(makeUnion([
					{type: "constant", value: undefined},
					{type: "array", valueType: type}
				])) : undefined,
				validator: this.builder.buildNonThrowing(!param.optional ? type : makeUnion([
					{type: "constant", value: undefined},
					type
				]))
			}
		})

		let paramMap = {} as Record<string, ParamValidator>
		// its ok to just drop all nameless parameters
		// names are used just in param-map checker, and this checker has check for no absent names anyway
		params.forEach(param => paramMap[param.name || ""] = param)

		return {params, paramMap}
	}
}
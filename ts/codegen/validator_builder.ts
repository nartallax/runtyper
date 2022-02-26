import {ValidatorFunctionBuilder} from "codegen/validator_function_builder"
import {Runtyper} from "entrypoint"
import {StackSet} from "utils/stack_set"

class RecursiveValidatorBuildingError extends Error {}

export interface ErrorValidationResult {
	value: unknown
	path: (string | number)[]
	expression: string
}

export type RawValidator = (value: unknown) => ErrorValidationResult | null | undefined | false
export type WrappedValidator<T = unknown> = (value: unknown) => value is T

/** An aggregator over all validation building process
 * Manages caches, individual validator builders etc */
export class ValidatorBuilderImpl {

	constructor(readonly opts: Runtyper.ValidatorBuilderOptions) {}

	readonly rawValidators = new Map<string, RawValidator>()
	readonly knownRecursiveTypes = new Set<string>()
	readonly currentlyBuildingValidators = new StackSet<string>()
	readonly wrappedValidators = new Map<string, WrappedValidator>()

	build<T = unknown>(type: Runtyper.SimpleType): (value: unknown) => value is T {
		if(type.fullRefName){
			let wrapped = this.wrappedValidators.get(type.fullRefName)
			if(wrapped){
				return wrapped as WrappedValidator<T>
			}
		}
		try {
			let raw = this.buildInternal(type)
			let wrapped = this.wrap<T>(raw)
			if(type.fullRefName){
				this.wrappedValidators.set(type.fullRefName, wrapped)
			}
			return wrapped
		} finally {
			this.clear()
		}
	}

	private clear(): void {
		this.knownRecursiveTypes.clear()
		this.currentlyBuildingValidators.clear()
	}

	private wrap<T>(rawValidator: RawValidator): WrappedValidator<T> {
		return function validatorWrapper(value: unknown): value is T {
			let result = rawValidator(value)
			if(!result){
				return true
			} else {
				throw new Runtyper.ValidationError(
					result.value,
					result.path.reverse(),
					result.expression,
					value
				)
			}
		}
	}

	buildInternal(type: Runtyper.SimpleType): RawValidator {
		if(type.fullRefName){
			let prebuilt = this.rawValidators.get(type.fullRefName)
			if(prebuilt){
				return prebuilt
			}

			if(this.currentlyBuildingValidators.has(type.fullRefName)){
				if(!this.knownRecursiveTypes.has(type.fullRefName)){
					let newRecursiveTypes = this.currentlyBuildingValidators
						.rewindPopUntil(typeName => typeName === type.fullRefName)
					for(let typeName of newRecursiveTypes){
						this.knownRecursiveTypes.add(typeName)
					}
					throw new RecursiveValidatorBuildingError()
				}
			}
		}

		try {
			if(type.fullRefName){
				this.currentlyBuildingValidators.push(type.fullRefName)
			}
			let result = new ValidatorFunctionBuilder(this).build(type)
			if(type.fullRefName){
				this.currentlyBuildingValidators.pop()
			}
			return result
		} catch(e){
			if(e instanceof RecursiveValidatorBuildingError){
				// just try it again, now with some information about recursive types
				return this.buildInternal(type)
			} else {
				throw e
			}
		}
	}


}
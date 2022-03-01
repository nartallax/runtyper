import {ValidatorFunctionBuilder} from "codegen/validator_function_builder"
import {Runtyper} from "entrypoint"
import {StackMap} from "utils/stack_map"

export interface ErrorValidationResult {
	value: unknown
	path: (string | number)[]
	expression: string
}

export type RawValidator = (value: unknown) => ErrorValidationResult | null | undefined | false
export type WrappedValidator<T = unknown> = (value: unknown) => value is T

interface ProxyFunctionPair {
	set(realFn: (...args: unknown[]) => unknown): void
	call(...args: unknown[]): unknown
}

/** An aggregator over all validation building process
 * Manages caches, individual validator builders etc */
export class ValidatorBuilderImpl {

	constructor(readonly opts: Runtyper.ValidatorBuilderOptions) {}

	readonly rawValidators = new Map<string, RawValidator>()
	readonly currentlyBuildingValidators = new StackMap<string, ProxyFunctionPair | null>()
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
				let proxy = this.currentlyBuildingValidators.get(type.fullRefName)
				if(!proxy){
					proxy = this.makeProxyFunctionPair()
					this.currentlyBuildingValidators.update(type.fullRefName, proxy)
				}
				return proxy.call as unknown as RawValidator
			}
		}

		if(type.fullRefName){
			this.currentlyBuildingValidators.push(type.fullRefName, null)
		}
		let result = new ValidatorFunctionBuilder(this).build(type, true)
		if(type.fullRefName){
			let [, proxy] = this.currentlyBuildingValidators.pop()!
			if(proxy){
				proxy.set(result)
			}
		}
		return result
	}

	private makeProxyFunctionPair(): ProxyFunctionPair {
		return new Function(`
			var realFn = null
			var set = fn => { realFn = fn }
			var call = (...args) => realFn(...args)
			return {set, call}
		`)()
	}


}
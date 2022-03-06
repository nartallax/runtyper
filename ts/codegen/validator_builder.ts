import {ValidatorFunctionBuilder} from "codegen/validator_function_builder"
import {Runtyper} from "entrypoint"

export interface ErrorValidationResult {
	value: unknown
	path: (string | number)[]
	expression: string
}

export type RawValidator = (value: unknown) => ErrorValidationResult | null | undefined | false
export type WrappedThrowingValidator<T = unknown> = (value: unknown) => value is T
export type WrappedNonThrowingValidator = (value: unknown) => Runtyper.ValidationError | null

interface ProxyFunctionPair {
	set(realFn: (...args: unknown[]) => unknown): void
	call(...args: unknown[]): unknown
}

/** An aggregator over all validation building process
 * Manages caches, individual validator builders etc */
export class ValidatorBuilderImpl {

	constructor(readonly opts: Runtyper.ValidatorBuilderOptions) {}

	readonly rawValidators = new Map<string, RawValidator>()
	readonly currentlyBuildingValidators = new Map<string, ProxyFunctionPair | null>()
	readonly wrappedThrowingValidators = new Map<string, WrappedThrowingValidator>()
	readonly wrappedNonThrowingValidators = new Map<string, WrappedNonThrowingValidator>()

	build<T = unknown>(type: Runtyper.SimpleType): (value: unknown) => value is T {
		return this.buildWrapCached(type, raw => this.wrapThrowing<T>(raw), this.wrappedThrowingValidators) as WrappedThrowingValidator<T>
	}

	buildNonThrowing(type: Runtyper.SimpleType): (value: unknown) => Runtyper.ValidationError | null {
		return this.buildWrapCached(type, raw => this.wrapNonThrowing(raw), this.wrappedNonThrowingValidators)
	}

	private buildWrapCached<T>(type: Runtyper.SimpleType, wrapper: (raw: RawValidator) => T, cache: Map<string, T>): T {
		if(type.fullRefName){
			let wrapped = cache.get(type.fullRefName)
			if(wrapped){
				return wrapped
			}
		}
		try {
			let raw = this.buildInternal(type)
			let wrapped = wrapper(raw)
			if(type.fullRefName){
				cache.set(type.fullRefName, wrapped)
			}
			return wrapped
		} finally {
			this.clear()
		}
	}

	private clear(): void {
		this.currentlyBuildingValidators.clear()
	}

	private wrapThrowing<T>(rawValidator: RawValidator): WrappedThrowingValidator<T> {
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

	private wrapNonThrowing(rawValidator: RawValidator): WrappedNonThrowingValidator {
		return function validatorWrapper(value: unknown) {
			let result = rawValidator(value)
			if(!result){
				return null
			} else {
				return new Runtyper.ValidationError(
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
					this.currentlyBuildingValidators.set(type.fullRefName, proxy)
				}
				return proxy.call as unknown as RawValidator
			} else {
				this.currentlyBuildingValidators.set(type.fullRefName, null)
			}
		}

		let result = new ValidatorFunctionBuilder(this).build(type, true)

		if(type.fullRefName){
			let proxy = this.currentlyBuildingValidators.get(type.fullRefName)
			this.currentlyBuildingValidators.delete(type.fullRefName)
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
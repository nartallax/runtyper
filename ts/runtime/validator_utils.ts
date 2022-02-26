import {ErrorValidationResult} from "codegen/validator_builder"

class IntersectionContext {
	private map = new Map<{[k: string]: unknown}, string[]>()

	add(obj: {[k: string]: unknown}, k: string): void {
		let arr = this.map.get(obj)
		if(!arr){
			this.map.set(obj, [k])
		} else {
			arr.push(k)
		}
	}

	/** Merge other intersection context into this
	 * We can't always use just one context per highest-level intersection
	 * For example, if we have following type:
	 * type T = ({c: number} & {d: number}) | {b: number}
	 * and we validating it agaist following data:
	 * {b: 5, c: 5}
	 * check for "do we have field c" will pass, and field c will be added to intersection context
	 * but check for field d won't pass. So field c must not be in the context
	 * Therefore, we must have one context per each intersection (not only per top-level)
	 * And only if intersection checked correctly as a whole, we can merge this context into parent intersection */
	merge(con: IntersectionContext): void {
		for(let [obj, fieldNames] of con.map){
			let arr = this.map.get(obj)
			if(!arr){
				this.map.set(obj, fieldNames)
			} else {
				arr.push(...fieldNames)
			}
		}
	}

	check(): ErrorValidationResult | null {
		for(let [obj, fieldNames] of this.map){
			// TODO: refactor this into separate check, as this will include more types later
			if(obj === null || typeof(obj) !== "object" || Array.isArray(obj)){
				continue
			}
			let fieldSet = new Set(fieldNames)
			for(let k in obj){
				if(!fieldSet.has(k)){
					return {
						expression: "<unknown field found>",
						// we cannot just put k in path
						// because in case of deeply nested paths it will point to wrong location
						// better have incomplete path rather than wrong path
						path: [],
						value: obj
					}
				}
			}
		}
		return null
	}
}

export namespace ValidatorUtils {

	export function err(value: unknown, expression: string, lastPathPart?: string): ErrorValidationResult {
		let result: ErrorValidationResult = {
			value, expression, path: []
		}
		if(lastPathPart !== undefined){
			result.path.push(lastPathPart)
		}
		return result
	}

	export function makeIntCont(): IntersectionContext {
		return new IntersectionContext()
	}

}
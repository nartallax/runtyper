import {ErrorValidationResult} from "runtime/validator_builder"

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

}
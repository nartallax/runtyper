import {Runtyper} from "entrypoint"
import {isValidIdentifier, simpleTypeToString} from "runtime/type_stringifier"
import {canBeUndefined, forEachTerminalTypeInUnion, makeUnion} from "utils/simple_type_utils"

let validatorsGeneratedCounter = 0

/** Code of validator that is expression
 * This expression is either returns failure information if validation failed, or falsy value if the value is alright */
interface ExpressionValidatorCodePart {
	isExpression: true
	values?: Runtyper.ValidatorOuterValue[]
	expression(valueName: string): string
	condition(valueName: string): string
}

/** Code of validator that is some function.
 * When said function is invoked, it should act as expression validator (see above) */
interface FunctionValidatorCodePart {
	isExpression: false
	declaration: string
	declarationName: string
	values?: Runtyper.ValidatorOuterValue[]
}

type ValidatorCodePart = ExpressionValidatorCodePart | FunctionValidatorCodePart

interface ErrorValidationResult {
	value: unknown
	path: (string | number)[]
	expression: string
}

export class ValidatorBuilder {

	private readonly usedParamIdentifiers = new Map<string, unknown>()
	private readonly functionDeclarations = new Map<string, FunctionValidatorCodePart>()
	private readonly validatorsCache = new Map<Runtyper.SimpleType, FunctionValidatorCodePart>()

	constructor(private readonly opts: Runtyper.ValidatorBuilderOptions) {
		this.reset()
	}

	private reset(): void {
		this.usedParamIdentifiers.clear()
		this.functionDeclarations.clear()
		this.validatorsCache.clear()

		let errDescr = this.makeErrorDescribingFunction()
		this.functionDeclarations.set(errDescr.declarationName, errDescr)

		// explicitly forbidding some of identifiers to prevent name collision
		this.usedParamIdentifiers.set("i", {})
		this.usedParamIdentifiers.set("propName", {})
		this.usedParamIdentifiers.set("obj", {})
		this.usedParamIdentifiers.set("tuple", {})
		this.usedParamIdentifiers.set("arr", {})
	}

	build<T = unknown>(type: Runtyper.SimpleType): (x: unknown) => x is T {
		return this.buildFunction(this.buildCode(type))
	}

	buildCode(type: Runtyper.SimpleType): Runtyper.ValidatorCode {
		try {
			return this.buildFullCode(type)
		} finally {
			this.reset()
		}
	}

	private isIdentifierInUse(name: string): boolean {
		return this.usedParamIdentifiers.has(name) || this.functionDeclarations.has(name)
	}

	private makeParam(suggestedName: string, value: unknown): Runtyper.ValidatorOuterValue {
		let counter = 1
		let name = suggestedName
		while(this.isIdentifierInUse(name)){
			let oldValue = this.usedParamIdentifiers.get(name)
			if(oldValue === value){
				return {name, value}
			} else {
				name = suggestedName + "_" + (counter++)
			}
		}
		this.usedParamIdentifiers.set(this.makeIdentifierCodeSafe(name), value)
		return {name, value}
	}

	private makeIdentifierCodeSafe(base: string): string {
		return base.replace(/</g, "_of_")
			.replace(/[\s>,.:]/g, "_")
			.replace(/[^a-zA-Z\d_]/, "")
			.replace(/_+/g, "_")
	}

	private makeComment(text: string): string {
		return "/* " + text
			.replace(/\/\*/g, "/ *")
			.replace(/\*\//g, "* /")
			.replace(/[\n\r]/g, " ")
			+ " */"
	}

	private makeValidationFunctionName(refName: string): string {
		return this.findUnusedIdentifier(this.makeIdentifierCodeSafe("validate_" + refName))
	}

	private findUnusedIdentifier(baseName: string): string {
		let counter = 1
		let name = baseName
		while(this.isIdentifierInUse(name)){
			name = baseName + "_" + (counter++)
		}
		return name
	}

	private conditionToExpression(conditionExpressionCode: (valueCode: string) => string, values?: Runtyper.ValidatorOuterValue[]): ExpressionValidatorCodePart {
		return {
			isExpression: true,
			values,
			condition: conditionExpressionCode,
			expression: valueCode => {
				let cond = conditionExpressionCode(valueCode)
				return `(${cond} && ${this.makeDescribeErrorCall(valueCode, cond)})`
			}
		}
	}

	private makeAllowEverythingExpression(reason: string): ExpressionValidatorCodePart {
		let text = this.makeComment(reason) + " false"
		return {
			isExpression: true,
			condition: () => text,
			expression: () => text
		}
	}

	private readonly errorDescriptionFnName = "fail"
	private makeErrorDescribingFunction(): FunctionValidatorCodePart {
		return {
			isExpression: false,
			declarationName: this.errorDescriptionFnName,
			declaration: `/* make error description structure */
function ${this.errorDescriptionFnName}(value, expression){
	return {value, path: [], expression}
}`
		}
	}

	private makeDescribeErrorCall(valueCode: string, exprCode: string): string {
		return `${this.errorDescriptionFnName}(${valueCode}, ${JSON.stringify(exprCode)})`
	}

	private validatorToExpressionCode(validator: ValidatorCodePart, valueCode: string): string {
		if(validator.isExpression){
			return validator.expression(valueCode)
		} else {
			return validator.declarationName + "(" + valueCode + ")"
		}
	}

	private validatorToCondition(validator: ValidatorCodePart, valueCode: string): string {
		if(validator.isExpression){
			return validator.condition(valueCode)
		} else {
			return validator.declarationName + "(" + valueCode + ")"
		}
	}

	private buildOrGetCachedCode(type: Runtyper.SimpleType, suggestedValueName: string, build: (base: FunctionValidatorCodePart) => void): ValidatorCodePart {
		let result = this.validatorsCache.get(type)
		if(!result){
			let name = this.makeValidationFunctionName(suggestedValueName)
			let fn: FunctionValidatorCodePart = result = {
				isExpression: false,
				declaration: "code building error: no function declaration",
				declarationName: name
			}
			this.functionDeclarations.set(name, fn)
			this.validatorsCache.set(type, result)
			build(result)
		}
		return result
	}

	/** Extract all outer values of all the expressions in one single array
	 * Values from functions are not extracted, as they can be extracted later;
	 * extracting them here may lead to duplicate values */
	private valuesOfExpressions(codes: ValidatorCodePart[]): Runtyper.ValidatorOuterValue[] | undefined {
		let result = undefined as Runtyper.ValidatorOuterValue[] | undefined
		codes.forEach(code => {
			if(code.isExpression && code.values){
				(result ||= []).push(...code.values)
			}
		})
		return result
	}

	private makePropertyAccessExpression(base: string, index: string | number) {
		if(typeof(index) === "number"){
			base += "[" + index + "]"
		} else {
			base += (isValidIdentifier(index) ? "." + index : "[" + JSON.stringify(index) + "]")
		}
		return base
	}

	private buildCodePart(type: Runtyper.SimpleType): ValidatorCodePart {
		switch(type.type){
			case "number": return this.conditionToExpression(
				valueCode => {
					let code = `(typeof(${valueCode}) !== "number"`
					if(this.opts.onNaNWhenExpectedNumber === "validation_error"){
						code += ` || Number.isNaN(${valueCode}))`
					}
					return code
				}
			)
			case "string": return this.conditionToExpression(
				valueCode => `typeof(${valueCode}) !== "string"`
			)
			case "boolean": return this.conditionToExpression(
				valueCode => `(${valueCode} !== true && ${valueCode} !== false)`
			)
			case "any":
				if(this.opts.onAny === "allow_anything"){
					return this.makeAllowEverythingExpression("any allows everything")
				} else {
					throw new Error("Failed to build validator: `any` type is not allowed")
				}
			case "unknown":
				if(this.opts.onUnknown === "allow_anything"){
					return this.makeAllowEverythingExpression("unknown allows everything")
				} else {
					throw new Error("Failed to build validator: `unknown` type is not allowed")
				}
			case "never": return this.conditionToExpression(() => this.makeComment("type: never") + " true")
			case "constant":{
				let values: Runtyper.ValidatorOuterValue[] | undefined = undefined
				let valueToCheck: string
				if(type.value === undefined){
					valueToCheck = "void 0"
				} else if(type.value === null){
					valueToCheck = "null"
				} else if(type.value === true){
					valueToCheck = "true"
				} else if(type.value === false){
					valueToCheck = "false"
				} else if(typeof(type.value) === "string"){
					valueToCheck = JSON.stringify(type.value)
				} else if(typeof(type.value) === "number" && type.value % 1 === 0 && Math.abs(type.value) - 1 < Number.MAX_SAFE_INTEGER){
					valueToCheck = type.value + ""
				} else {
					let name = "const_of_" + typeof(type.value)
					let cval = this.makeParam(name, type.value)
					values = [cval]
					valueToCheck = cval.name
				}
				return this.conditionToExpression(valueCode => `${valueCode} !== ${valueToCheck}`, values)
			}
			case "constant_union":{
				let set = new Set(type.value)
				let constrVal = this.makeParam("allowedValues", set)
				return this.conditionToExpression(
					valueCode => `${constrVal.name}.has(${valueCode})`,
					[constrVal]
				)
			}
			case "intersection":{
				// it's important to build code of subtypes before expression is invoked
				// because outside we rely on fact that after the outermost buildCode() call exist,
				// no more buildCode() calls will occur when we will try to make code out of expressions
				// that's vital for putting functions in function map at buildCode() time
				let typeCode = type.types.map(type => this.buildCodePart(type))
				return {
					isExpression: true,
					values: this.valuesOfExpressions(typeCode),
					condition: valueCode => "("
						+ typeCode.map(type => this.validatorToCondition(type, valueCode)).join(" || ")
						+ ")",
					expression: valueCode => "("
						+ typeCode.map(type => this.validatorToExpressionCode(type, valueCode)).join(" || ")
						+ ")"
				}
			}
			case "union":{
				const fixedType = makeUnion(type.types, true) // to simplify and drop constants
				if(fixedType.type !== "union"){
					return this.buildCodePart(fixedType)
				}
				let typeCode = fixedType.types.map(type => this.buildCodePart(type))
				return this.conditionToExpression(valueCode => "("
					+ typeCode.map(type => this.validatorToCondition(type, valueCode)).join(" && ")
					+ ")"
				, this.valuesOfExpressions(typeCode))
			}


			case "array":
				return this.buildOrGetCachedCode(type, "array", fnDecl => {
					let paramName = "arr"
					let indexedParamName = paramName + "[i]"
					let valueCond = this.buildCodePart(type.valueType)
					let valueExpr = this.validatorToExpressionCode(valueCond, indexedParamName)
					let initialCheck = `!Array.isArray(${paramName})`

					fnDecl.values = this.valuesOfExpressions([valueCond])
					fnDecl.declaration = `function ${fnDecl.declarationName}(${paramName}){
	if(${initialCheck}){
		return ${this.makeDescribeErrorCall(paramName, initialCheck)}
	}

	var len = ${paramName}.length
	var lastPathEl = path.length - 1
	var checkResult
	for(var i = 0; i < len; i++){
		checkResult = ${valueExpr}
		if(checkResult){
			checkResult.path.push(i)
			return checkResult
		}
	}
	return false
}`
				})


			case "object":{
				let rawName = "object"
				if(type.refName && type.refName.length < 30){
					rawName = type.refName
				}
				return this.buildOrGetCachedCode(type, rawName, fnDecl => {
					let paramName = "obj"
					let comment = ""
					if(type.refName){
						comment = this.makeComment("for " + type.refName) + "\n"
					}

					let values: Runtyper.ValidatorOuterValue[] = []
					let fixedKeys = Object.keys(type.properties)

					// building code for known keys
					let propConds = [] as ValidatorCodePart[]
					let makeFixedKeyCheckerCode = (propName: string, propType: Runtyper.SimpleType): string => {
						let propCond = this.buildCodePart(propType)
						propConds.push(propCond)
						let propExprCode = this.makePropertyAccessExpression(paramName, propName)
						return `
	checkResult = ${this.validatorToExpressionCode(propCond, propExprCode)}
	if(checkResult){
		checkResult.path.push(${JSON.stringify(propName)})
		return checkResult
	}`
					}

					let fixedKeysCheckingParts = fixedKeys.map(propName => {
						return makeFixedKeyCheckerCode(propName, type.properties[propName]!)
					})

					// known keys may be a part of index, let's also check that
					let hasStringIndex = false
					if(type.index){
						forEachTerminalTypeInUnion(type.index.keyType, keySubtype => {
							if(keySubtype.type === "constant"){
								if(typeof(keySubtype.value) !== "string"){
									throw new Error("Cannot build validator: constant key of object is not string: " + JSON.stringify(keySubtype.value) + " (of type " + typeof(keySubtype.value) + ")")
								}
								fixedKeysCheckingParts.push(makeFixedKeyCheckerCode(keySubtype.value, type.index!.valueType))
								fixedKeys.push(keySubtype.value)
							} else if(keySubtype.type === "string"){
								hasStringIndex = true
							} else {
								throw new Error("Cannot build validator: index key of object is not string: " + JSON.stringify(keySubtype))
							}
						})
					}

					let setOfFieldNames: Runtyper.ValidatorOuterValue | null = null
					if(fixedKeys.length > 0){
						setOfFieldNames = this.makeParam(this.makeIdentifierCodeSafe("known_fields_of_" + rawName), new Set(fixedKeys))
						values.push(setOfFieldNames)
					}

					// building code that checks unknown keys
					let unlistedPropsCheckingCode: string
					if(this.opts.onUnknownFieldInObject === "allow_anything"){
						unlistedPropsCheckingCode = ""
					} else if(!hasStringIndex){
						unlistedPropsCheckingCode = `
		checkResult = ${this.makeDescribeErrorCall(paramName + "[propName]", "<unknown field found>")}
		checkResult.path.push(propName)
		return checkResult`
					} else {
						let propCond = this.buildCodePart(type.index!.valueType)
						propConds.push(propCond)
						let indexTypeChecker = this.validatorToExpressionCode(propCond, paramName + "[propName]")
						unlistedPropsCheckingCode = `
		checkResult = ${indexTypeChecker}
		if(checkResult){
			checkResult.path.push(propName)
			return checkResult
		}
		`
						if(setOfFieldNames){
							unlistedPropsCheckingCode = `
		if(!${setOfFieldNames.name}.has(propName)){
			continue
		}` + unlistedPropsCheckingCode
						}
					}
					unlistedPropsCheckingCode = `for(var propName in ${paramName}){${unlistedPropsCheckingCode}}`

					let initialCheck = `${paramName} === null || typeof(${paramName}) !== "object" || Array.isArray(${paramName})`

					values.push(...this.valuesOfExpressions(propConds) || [])
					if(values.length > 0){
						fnDecl.values = values
					}

					fnDecl.declaration = `${comment}function ${fnDecl.declarationName}(${paramName}){
	if(${initialCheck}){
		return ${this.makeDescribeErrorCall(paramName, initialCheck)}
	}

	var checkResult
	${fixedKeysCheckingParts.join("\n")}

	${unlistedPropsCheckingCode}

	return false
}`
				})
			}

			case "tuple": return this.buildOrGetCachedCode(type, "tuple", fnDecl => {
				let paramName = "tuple"
				let minLength = 0
				let maxLength = 0

				let restCheckerCode = ""
				let fixedCheckersCode = [] as string[]
				let propConds = [] as ValidatorCodePart[]

				let makeFixedChecker = (index: number, propType: Runtyper.SimpleType): void => {
					let propCond = this.buildCodePart(propType)
					propConds.push(propCond)
					let code = `
	checkResult = ${this.validatorToExpressionCode(propCond, paramName + "[" + index + "]")}
	if(checkResult){
		checkResult.path.push(${index})
		return checkResult
	}`
					fixedCheckersCode.push(code)
				}

				let rest: Runtyper.RestType<Runtyper.SimpleType> | null = null
				for(let i = 0; i < type.valueTypes.length; i++){
					let vtype = type.valueTypes[i]!
					if(vtype.type === "rest"){
						minLength = i
						maxLength = Number.MAX_SAFE_INTEGER
						rest = vtype
						break
					} else {
						maxLength = i + 1
						if(!canBeUndefined(vtype)){
							minLength = i + 1
						}
						makeFixedChecker(i, vtype)
					}
				}

				if(rest){
					let tailOffset = 0
					for(let i = type.valueTypes.length - 1; i > minLength; i--){
						let vtype = type.valueTypes[i]!
						if(vtype.type === "rest"){
							throw new Error("Cannot build validator: tuple has more than one rest value: " + simpleTypeToString(type, {fullNames: false}))
						}
						makeFixedChecker(i, vtype)
						minLength = Math.max(minLength, i)
						tailOffset++
					}
					let restCond = this.buildCodePart(rest.valueType)
					propConds.push(restCond)
					restCheckerCode = `
	for(var i = ${minLength}; i < ${minLength - tailOffset}; i++){
		checkResult = ${this.validatorToExpressionCode(restCond, paramName + "[i]")}
		if(checkResult){
			checkResult.path.push(i)
			return checkResult
		}
	}`
				}

				let initialCheck = `!Array.isArray(${paramName})`
				let lenCheck = minLength === maxLength
					? `${paramName}.length !== ${minLength}`
					: maxLength === Number.MAX_SAFE_INTEGER
						? `${paramName}.length < ${minLength}`
						: `${paramName}.length < ${minLength} || ${paramName}.length > ${maxLength}`

				fnDecl.values = this.valuesOfExpressions(propConds)
				fnDecl.declaration = `function ${fnDecl.declarationName}(${paramName}){
	if(${initialCheck}){
		return ${this.makeDescribeErrorCall(paramName, initialCheck)}
	}

	if(${lenCheck}){
		return ${this.makeDescribeErrorCall(paramName, lenCheck)}
	}

	var checkResult
	${fixedCheckersCode.join("\n")}

	${restCheckerCode}

	return false
}`
			})

		}
	}

	private buildFullCode(rootType: Runtyper.SimpleType): Runtyper.ValidatorCode {
		let rootValidator = this.buildCodePart(rootType)
		let allValues = this.valuesOfExpressions([rootValidator]) || []
		for(let [, decl] of this.functionDeclarations){
			if(decl.values){
				allValues.push(...decl.values)
			}
		}

		let code = ""

		let sortedDecls = [...this.functionDeclarations]
			.sort(([a], [b]) => a > b ? 1 : -1)
			.map(([, decl]) => decl)
		for(let decl of sortedDecls){
			code += "\n\n" + decl.declaration
		}

		let paramName = "value"
		let id = ++validatorsGeneratedCounter
		code += "\n\n"
		if(rootValidator.isExpression){
			code += `return function validator_entrypoint_${id}(${paramName}){
	return ${this.validatorToExpressionCode(rootValidator, paramName)}
}`
		} else {
			code += `return ${rootValidator.declarationName}`
		}
		code += `\n//# sourceURL=runtyper_validator_generated_code_${id}`


		return {code, values: allValues}
	}

	private buildFunction<T>(code: Runtyper.ValidatorCode): (value: unknown) => value is T {
		let outerFunction = new Function(...code.values.map(x => x.name), code.code)
		let validatorCompiled = outerFunction(...code.values.map(x => x.value)) as (value: unknown) => ErrorValidationResult
		return function validatorWrapper(value: unknown): value is T {
			let result = validatorCompiled(value)
			if(!result){
				return true
			} else {
				throw new Runtyper.ValidationError(
					result.value,
					result.path,
					result.expression,
					value
				)
			}
		}
	}
}
import {Runtyper} from "entrypoint"
import {isValidIdentifier, simpleTypeToString} from "runtime/type_stringifier"
import {ValidatorUtils} from "runtime/validator_utils"
import {canBeUndefined, forEachTerminalTypeInUnion, makeUnion} from "utils/simple_type_utils"
import {deepEquals} from "utils/utils"

let validatorsGeneratedCounter = 0

/** Code of validator that is expression
 * This expression is either returns failure information if validation failed, or falsy value if the value is alright */
interface ExpressionValidatorCodePart {
	isExpression: true
	expression(valueName: string): string
	condition(valueName: string): string
}

/** Code of validator that is some function.
 * When said function is invoked, it should act as expression validator (see above) */
interface FunctionValidatorCodePart {
	isExpression: false
	declaration: string
	declarationName: string
}

type ValidatorCodePart = ExpressionValidatorCodePart | FunctionValidatorCodePart

export interface ErrorValidationResult {
	value: unknown
	path: (string | number)[]
	expression: string
}

const reservedNames: ReadonlySet<string> = new Set(["checkResult", "i", "propName", "obj", "tuple", "arr", "value", "intersectionData", "parentIntersectionData", "fieldSet"])

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

		this.usedParamIdentifiers.set("u", ValidatorUtils)
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
		return this.usedParamIdentifiers.has(name) || this.functionDeclarations.has(name) || reservedNames.has(name)
	}

	private makeParam(suggestedName: string, value: unknown): Runtyper.ValidatorOuterValue {
		let counter = 1
		let name = suggestedName
		while(this.isIdentifierInUse(name)){
			let oldValue = this.usedParamIdentifiers.get(name)
			if(deepEquals(oldValue, value)){
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
			.replace(/^_|_$/g, "")
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

	private conditionToExpression(conditionExpressionCode: (valueCode: string) => string): ExpressionValidatorCodePart {
		return {
			isExpression: true,
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

	private makeDescribeErrorCall(valueCode: string, exprCode: string, propName?: string): string {
		let result = `u.err(${valueCode}, ${JSON.stringify(exprCode)}`
		if(propName !== undefined){
			result += `, ${JSON.stringify(propName)}`
		}
		result += ")"
		return result
	}

	private validatorToExpressionCode(validator: ValidatorCodePart, valueCode: string): string {
		if(validator.isExpression){
			return validator.expression(valueCode)
		} else {
			return validator.declarationName + "(" + valueCode + ", typeof(intersectionData) !== \"undefined\" && intersectionData)"
		}
	}

	private validatorToConditionCode(validator: ValidatorCodePart, valueCode: string): string {
		if(validator.isExpression){
			return validator.condition(valueCode)
		} else {
			return validator.declarationName + "(" + valueCode + ")"
		}
	}

	private makeValidatorFnComment(type: Runtyper.SimpleType): string {
		return type.refName ? this.makeComment("for " + type.refName) + "\n" : ""
	}

	private makeRoughTypeName(type: Runtyper.SimpleType, dflt: string): string {
		return type.refName && type.refName.length <= 30 ? type.refName : dflt
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
					valueToCheck = cval.name
				}
				return this.conditionToExpression(valueCode => `${valueCode} !== ${valueToCheck}`)
			}
			case "constant_union":{
				let set = new Set(type.value)
				let constrVal = this.makeParam("allowed_values", set)
				return this.conditionToExpression(valueCode => `!${constrVal.name}.has(${valueCode})`)
			}
			case "intersection": return this.buildIntersectionCheckingCode(type)
			case "union":{
				const fixedType = makeUnion(type.types, true) // to simplify and drop constants
				if(fixedType.type !== "union"){
					return this.buildCodePart(fixedType)
				}
				// it's important to build code of subtypes before expression is invoked
				// because outside we rely on fact that after the outermost buildCode() call exist,
				// no more buildCode() calls will occur when we will try to make code out of expressions
				// that's vital for putting functions in function map at buildCode() time
				let typeCode = fixedType.types.map(type => this.buildCodePart(type))
				return this.conditionToExpression(valueCode => "("
					+ typeCode.map(type => this.validatorToConditionCode(type, valueCode)).join(" && ")
					+ ")")
			}


			case "array": return this.buildArrayCheckingCode(type)
			case "object": return this.buildObjectCheckingCode(type)
			case "tuple": return this.buildTupleCheckingCode(type)

		}
	}

	private buildIntersectionCheckingCode(type: Runtyper.IntersectionType<Runtyper.SimpleType>): ValidatorCodePart {
		let canBeObject = false
		for(let subtype of type.types){
			if(subtype.type === "object"){
				canBeObject = true
			} else if(subtype.type === "union"){
				forEachTerminalTypeInUnion(subtype, subsubtype => {
					if(subsubtype.type === "object"){
						canBeObject = true
					}
				})
			}
			if(canBeObject){
				break
			}
		}

		if(!canBeObject){
			return this.buildIntersectionCheckingExpressionCode(type)
		} else {
			return this.buildIntersectionCheckingFunctionCode(type)
		}
	}

	private buildIntersectionCheckingFunctionCode(type: Runtyper.IntersectionType<Runtyper.SimpleType>): ValidatorCodePart {
		return this.buildIntersectionCheckingExpressionCode(type)
		// 		let roughName = this.makeRoughTypeName(type, "intersection")
		// 		return this.buildOrGetCachedCode(type, roughName, fnDecl => {
		// 			let paramName = "value"

		// 			let simpleTypeCheckingPart = this.buildIntersectionCheckingExpressionCode(type)
		// 			let simpleTypeCheckingCode = this.validatorToExpressionCode(simpleTypeCheckingPart, paramName)

		// 			let subtypes = type.types.filter(x => x.type === "union" || x.type === "intersection" || x.type === "object")
		// 			let subtypesCode = subtypes.map(type => {
		// 				let part = this.buildCodePart(type)
		// 				return this.validatorToExpressionCode(part, paramName)
		// 			})

		// 			let comment = this.makeValidatorFnComment(type)
		// 			fnDecl.declaration = `${comment}function ${fnDecl.declarationName}(${paramName}){
		// 	if(typeof(${paramName}) !== "object" || ${paramName} === null || Array.isArray(${paramName})){
		// 		return ${simpleTypeCheckingCode}
		// 	}

		// 	var intersectionData = {fields:[], hasStringIndex: false}
		// 	var checkResult = ${subtypesCode.join(" || ")}
		// 	if(checkResult){
		// 		return checkResult
		// 	}
		// 	var fieldSet = new Set(intersectionData.fields)

		// 	return false
		// }`

		// 			// TODO: props checking code here
		// 		})
	}

	private buildIntersectionCheckingExpressionCode(type: Runtyper.IntersectionType<Runtyper.SimpleType>): ValidatorCodePart {
		let typeCode = type.types
			.filter(type => type.type !== "object")
			.map(type => this.buildCodePart(type))
		return {
			isExpression: true,
			condition: valueCode => "("
				+ typeCode.map(type => this.validatorToConditionCode(type, valueCode)).join(" || ")
				+ ")",
			expression: valueCode => "("
				+ typeCode.map(type => this.validatorToExpressionCode(type, valueCode)).join(" || ")
				+ ")"
		}
	}

	private buildArrayCheckingCode(type: Runtyper.ArrayType<Runtyper.SimpleType>): ValidatorCodePart {
		let roughName = this.makeRoughTypeName(type, "object")
		return this.buildOrGetCachedCode(type, roughName, fnDecl => {
			let paramName = "arr"
			let indexedParamName = paramName + "[i]"
			let valueCond = this.buildCodePart(type.valueType)
			let valueExpr = this.validatorToExpressionCode(valueCond, indexedParamName)
			let initialCheck = `!Array.isArray(${paramName})`

			let comment = this.makeValidatorFnComment(type)
			fnDecl.declaration = `${comment}function ${fnDecl.declarationName}(${paramName}){
	if(${initialCheck}){
		return ${this.makeDescribeErrorCall(paramName, initialCheck)}
	}

	var len = ${paramName}.length
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
	}

	private buildTupleCheckingCode(type: Runtyper.SimpleTupleType<Runtyper.SimpleType>): ValidatorCodePart {
		let roughName = this.makeRoughTypeName(type, "tuple")
		return this.buildOrGetCachedCode(type, roughName, fnDecl => {
			let paramName = "tuple"
			let minLength = 0
			let maxLength = 0

			let restCheckerCode = ""
			let fixedCheckersCode = [] as string[]
			let propConds = [] as ValidatorCodePart[]

			let makeFixedChecker = (index: number, propType: Runtyper.SimpleType, fromTail = false): void => {
				let propCond = this.buildCodePart(propType)
				propConds.push(propCond)
				let indexCode = fromTail ? paramName + ".length - " + index : (index + "")
				let code = `
	checkResult = ${this.validatorToExpressionCode(propCond, paramName + "[" + indexCode + "]")}
	if(checkResult){
		checkResult.path.push(${indexCode})
		return checkResult
	}`
				fixedCheckersCode.push(code)
			}

			let restStartsAt: number | null = null
			let rest: Runtyper.RestType<Runtyper.SimpleType> | null = null
			for(let i = 0; i < type.valueTypes.length; i++){
				let vtype = type.valueTypes[i]!
				if(vtype.type === "rest"){
					restStartsAt = i
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

			if(rest !== null && restStartsAt !== null){
				let tailOffset = 0
				for(let i = type.valueTypes.length - 1; i > restStartsAt; i--){
					let vtype = type.valueTypes[i]!
					if(vtype.type === "rest"){
						throw new Error("Cannot build validator: tuple has more than one rest value: " + simpleTypeToString(type, {fullNames: false}))
					}
					makeFixedChecker(type.valueTypes.length - i, vtype, true)
					minLength = Math.max(minLength, i)
					tailOffset++
				}
				let restCond = this.buildCodePart(rest.valueType)
				propConds.push(restCond)
				restCheckerCode = `
	for(var i = ${restStartsAt}; i < tuple.length${tailOffset === 0 ? "" : " - " + tailOffset}; i++){
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

			let comment = this.makeValidatorFnComment(type)
			fnDecl.declaration = `${comment}function ${fnDecl.declarationName}(${paramName}){
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

	private buildObjectCheckingCode(type: Runtyper.SimpleObjectType<Runtyper.SimpleType>): ValidatorCodePart {
		let roughName = this.makeRoughTypeName(type, "object")
		return this.buildOrGetCachedCode(type, roughName, fnDecl => {
			let paramName = "obj"
			let fixedKeys = Object.keys(type.properties)

			// building code for known keys
			let makeFixedKeyCheckerCode = (propName: string, propType: Runtyper.SimpleType): string => {
				let propCond = this.buildCodePart(propType)
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
			// (type_simplifier does not yield constant keys in index btw, but still, let's check index key type)
			let hasStringIndex = false
			if(type.index){
				forEachTerminalTypeInUnion(type.index.keyType, keySubtype => {
					if(keySubtype.type === "constant"){
						if(typeof(keySubtype.value) !== "string"){
							throw new Error("Cannot build validator: constant key of object is not string: " + JSON.stringify(keySubtype.value) + " (of type " + typeof(keySubtype.value) + ")")
						}
						fixedKeysCheckingParts.push(makeFixedKeyCheckerCode(
							keySubtype.value,
							makeUnion([type.index!.valueType, {type: "constant", value: undefined}])
						))
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
				setOfFieldNames = this.makeParam(this.makeIdentifierCodeSafe("known_fields_of_" + roughName), new Set(fixedKeys))
			}

			let unlistedPropsCheckingCode = this.buildObjectUnlistedPropertiesCheckingCode(setOfFieldNames?.name, !hasStringIndex ? null : type.index?.valueType, paramName)

			let initialCheck = `${paramName} === null || typeof(${paramName}) !== "object" || Array.isArray(${paramName})`
			let comment = this.makeValidatorFnComment(type)
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

	private buildObjectUnlistedPropertiesCheckingCode(fieldSetName: string | null | undefined, stringIndexType: Runtyper.SimpleType | null | undefined, paramName: string): string {
		let skipKnownPropCode = ""
		if(fieldSetName){
			skipKnownPropCode = `
		if(${fieldSetName}.has(propName)){
			continue
		}`
		}

		let unlistedPropsCheckingCode: string
		if(this.opts.onUnknownFieldInObject === "allow_anything"){
			unlistedPropsCheckingCode = ""
		} else {
			if(!stringIndexType){
				unlistedPropsCheckingCode = `${skipKnownPropCode}
		checkResult = ${this.makeDescribeErrorCall(paramName + "[propName]", "<unknown field found>")}
		checkResult.path.push(propName)
		return checkResult`
			} else {
				let propCond = this.buildCodePart(makeUnion([
					stringIndexType,
					{type: "constant", value: undefined}
				]))
				let indexTypeChecker = this.validatorToExpressionCode(propCond, paramName + "[propName]")
				unlistedPropsCheckingCode = `${skipKnownPropCode}
		checkResult = ${indexTypeChecker}
		if(checkResult){
			checkResult.path.push(propName)
			return checkResult
		}
		`
			}
			unlistedPropsCheckingCode = `for(var propName in ${paramName}){${unlistedPropsCheckingCode}\n\t}`
		}
		return unlistedPropsCheckingCode
	}

	private buildFullCode(rootType: Runtyper.SimpleType): Runtyper.ValidatorCode {
		let rootValidator = this.buildCodePart(rootType)
		let allValues = [...this.usedParamIdentifiers].map(([name, value]) => {
			return {name, value} as Runtyper.ValidatorOuterValue
		})

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
					result.path.reverse(),
					result.expression,
					value
				)
			}
		}
	}
}
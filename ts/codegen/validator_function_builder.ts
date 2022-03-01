import {CodePart, FunctionBuilder, FunctionCodePart, FunctionParameter} from "codegen/function_builder"
import {Runtyper} from "entrypoint"
import {ErrorValidationResult, ValidatorBuilderImpl} from "codegen/validator_builder"
import {ValidatorUtils} from "runtime/validator_utils"
import {canBeUndefined, forEachTerminalTypeInUnion, forEachTerminalTypeInUnionIntersection, makeUnion} from "utils/simple_type_utils"
import {isValidIdentifier, simpleTypeToString} from "runtime/type_stringifier"
import {CodeBuilder} from "codegen/code_builder"

const reservedNames: ReadonlySet<string> = new Set(["checkResult", "i", "propName", "obj", "tuple", "arr", "value", "intCont", "parentIntCont"])

// sometimes `context` is not defined inside of functions
// but I want to pass it to function invocations even if it's not present in the enclosing function
// so here I declare "default" value of context
// and now I can instead of `typeof(context) === "undefined"? undefined: context`
// just write `context`, because it will be undefined by default and won't generate error
const codePreamble = "var intCont = undefined"

export class ValidatorFunctionBuilder extends FunctionBuilder {

	private readonly definedFunctionsOfTypes = new Map<string, FunctionCodePart>()

	constructor(readonly manager: ValidatorBuilderImpl) {
		super()
		this.addParameter("u", ValidatorUtils)
	}

	protected isNameReserved(name: string): boolean {
		return reservedNames.has(name)
	}

	protected partToCode(validator: CodePart, valueCode: string): string {
		if(validator.isExpression){
			return validator.expression(valueCode)
		} else {
			return validator.declarationName + "(" + valueCode + ", intCont)"
		}
	}

	build(type: Runtyper.SimpleType): (value: unknown) => ErrorValidationResult | null | undefined | false {
		let part = this.buildPart(type)
		return this.buildStartingAt(part, "value", codePreamble) as (value: unknown) => ErrorValidationResult | null | undefined | false
	}

	private buildPart(type: Runtyper.SimpleType): CodePart {
		if(type.fullRefName){
			let prebuilt = this.manager.rawValidators.get(type.fullRefName)
			if(prebuilt){
				return this.importFunction(type, prebuilt)
			}

			if(this.manager.knownRecursiveTypes.has(type.fullRefName)){
				return this.buildPartNoCache(type)
			}

			let newFn = this.manager.buildInternal(type)
			return this.importFunction(type, newFn)
		}

		return this.buildPartNoCache(type)
	}

	private importFunction(type: Runtyper.SimpleType, fn: (value: unknown) => unknown): CodePart {
		let name = this.makeValidatorFunctionName(type, "value")
		this.reserveIdentifier(name)
		let param = this.addParameter(name, fn)
		return {
			isExpression: false,
			get declaration(): string {
				throw new Error("This function is imported and not supposed to have a declaration")
			},
			declarationName: param.name
		}
	}

	private makeValidatorFunctionName(type: Runtyper.SimpleType, dfltTypeName: string): string {
		let name = !type.refName || type.refName.length > 100 ? dfltTypeName : type.refName
		return this.getUnusedIdentifier("validate_" + name)
	}

	private makeAllowEverythingExpression(reason: string): CodePart {
		let text = this.makeComment(reason) + " false"
		return {isExpression: true, expression: () => text}
	}

	private makeDescribeErrorCall(valueCode: string, exprCode: string, propName?: string, propNameCode?: string): string {
		let result = `u.err(${valueCode}, ${JSON.stringify(exprCode)}`
		if(propName !== undefined){
			result += `, ${JSON.stringify(propName)}`
		} else if(propNameCode !== undefined){
			result += ", " + propNameCode
		}
		result += ")"
		return result
	}

	private makeComment(text: string): string {
		return "/* " + text
			.replace(/\/\*/g, "/ *")
			.replace(/\*\//g, "* /")
			.replace(/[\n\r]/g, " ")
			+ " */"
	}

	private conditionToExpression(condBuilder: (valueCode: string) => string): CodePart {
		return {
			isExpression: true,
			expression: valueCode => {
				let cond = condBuilder(valueCode)
				return `(${cond} && ${this.makeDescribeErrorCall(valueCode, cond)})`
			}
		}
	}

	private makeLiteralPropertyAccessExpression(base: string, indexLiteralValue: string | number) {
		if(typeof(indexLiteralValue) === "number"){
			base += "[" + indexLiteralValue + "]"
		} else {
			base += (isValidIdentifier(indexLiteralValue) ? "." + indexLiteralValue : "[" + JSON.stringify(indexLiteralValue) + "]")
		}
		return base
	}

	private makeValidatorFnComment(type: Runtyper.SimpleType): string {
		return type.refName ? this.makeComment("for " + type.refName) + "\n" : ""
	}

	private makeOrTakeFunction(type: Runtyper.SimpleType, dfltFunctionName: string, maker: (builder: CodeBuilder) => void): CodePart {
		if(type.fullRefName){
			let alreadyDefinedFunction = this.definedFunctionsOfTypes.get(type.fullRefName)
			if(alreadyDefinedFunction){
				return alreadyDefinedFunction
			}
		}

		let fnDecl = this.addFunction(this.makeValidatorFunctionName(type, dfltFunctionName))
		if(type.fullRefName){
			this.definedFunctionsOfTypes.set(type.fullRefName, fnDecl)
		}
		let builder = new CodeBuilder()
		builder.append(this.makeValidatorFnComment(type))
		builder.append(`function ${fnDecl.declarationName}`)
		maker(builder)
		fnDecl.declaration = builder.getResult()
		return fnDecl
	}

	private buildPartNoCache(type: Runtyper.SimpleType): CodePart {
		switch(type.type){
			case "number": return this.conditionToExpression(valueCode => {
				let code = `(typeof(${valueCode}) !== "number"`
				if(this.manager.opts.onNaNWhenExpectedNumber === "validation_error"){
					code += ` || Number.isNaN(${valueCode}))`
				}
				return code
			})
			case "string": return this.conditionToExpression(valueCode => {
				return `typeof(${valueCode}) !== "string"`
			})
			case "boolean": return this.conditionToExpression(valueCode => {
				return `(${valueCode} !== true && ${valueCode} !== false)`
			})
			case "any":
				if(this.manager.opts.onAny === "allow_anything"){
					return this.makeAllowEverythingExpression("any allows everything")
				} else {
					throw new Error("Failed to build validator: `any` type is not allowed")
				}
			case "unknown":
				if(this.manager.opts.onUnknown === "allow_anything"){
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
					let cval = this.addParameter(name, type.value)
					valueToCheck = cval.name
				}
				return this.conditionToExpression(valueCode => `${valueCode} !== ${valueToCheck}`)
			}
			case "constant_union":{
				let set = new Set(type.value)
				let constrVal = this.addParameter("allowed_values", set)
				return this.conditionToExpression(valueCode => `!${constrVal.name}.has(${valueCode})`)
			}
			case "intersection": return this.buildIntersectionCheckingCode(type)
			case "union":{
				let subtypesCheckingParts = type.types.map(type => this.buildPart(type))
				return this.conditionToExpression(valueCode => "("
					+ subtypesCheckingParts.map(part => this.partToCode(part, valueCode)).join(" && ")
					+ ")")
			}
			case "array": return this.buildArrayCheckingCode(type)
			case "object": return this.buildObjectCheckingCode(type)
			case "tuple": return this.buildTupleCheckingCode(type)

		}
	}

	private buildIntersectionCheckingCode(type: Runtyper.IntersectionType<Runtyper.SimpleType> | Runtyper.UnionType<Runtyper.SimpleType>): CodePart {
		let subtypesCheckingParts = type.types.map(type => this.buildPart(type))

		let objectTypes = [] as Runtyper.SimpleObjectType<Runtyper.SimpleType>[]
		forEachTerminalTypeInUnionIntersection(type, type => {
			if(type.type === "object"){
				objectTypes.push(type)
			}
		})

		if(objectTypes.length === 0){
			return this.conditionToExpression(valueCode => "("
			+ subtypesCheckingParts.map(part => this.partToCode(part, valueCode)).join(" || ")
			+ ")")
		}

		if(objectTypes.find(x => !!x.index)){
			throw new Error("Cannot build validator for union/intersection that has object with index property: " + simpleTypeToString(type))
		}

		return this.makeOrTakeFunction(type, "intersection", builder => {
			let paramName = "value"

			let subtypesCheckingCode = subtypesCheckingParts
				.map(part => this.partToCode(part, paramName))
				.join(" || ")

			builder.append(`(${paramName}, parentIntCont){
				var intCont = u.makeIntCont()
				var checkResult = ${subtypesCheckingCode}
				if(checkResult){
					return checkResult
				}
				if(parentIntCont === undefined){
					checkResult = intCont.check()
					if(checkResult){
						return checkResult
					}
				} else {
					parentIntCont.merge(intCont)
				}
	
				return false
			}`)
		})
	}

	private buildArrayCheckingCode(type: Runtyper.ArrayType<Runtyper.SimpleType>): CodePart {
		return this.makeOrTakeFunction(type, "array", builder => {
			let paramName = "arr"
			let indexedParamName = paramName + "[i]"
			let valueCond = this.buildPart(type.valueType)
			let valueExpr = this.partToCode(valueCond, indexedParamName)
			let initialCheck = `!Array.isArray(${paramName})`

			builder.append(`(${paramName}){
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
			}`)
		})
	}

	private buildTupleCheckingCode(type: Runtyper.SimpleTupleType<Runtyper.SimpleType>): CodePart {
		return this.makeOrTakeFunction(type, "tuple", builder => {
			let paramName = "tuple"
			let minLength = 0
			let maxLength = 0

			let restCheckerCode = ""
			let fixedCheckersCode = [] as string[]
			let propConds = [] as CodePart[]

			let makeFixedChecker = (index: number, propType: Runtyper.SimpleType, fromTail = false): void => {
				let propCond = this.buildPart(propType)
				propConds.push(propCond)
				let indexCode = fromTail ? paramName + ".length - " + index : (index + "")
				let code = `
					checkResult = ${this.partToCode(propCond, paramName + "[" + indexCode + "]")}
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
				let restCond = this.buildPart(rest.valueType)
				propConds.push(restCond)
				restCheckerCode = `
					for(var i = ${restStartsAt}; i < tuple.length${tailOffset === 0 ? "" : " - " + tailOffset}; i++){
						checkResult = ${this.partToCode(restCond, paramName + "[i]")}
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

			builder.append(`(${paramName}){
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
			}`)
		})
	}

	private buildObjectCheckingCode(type: Runtyper.SimpleObjectType<Runtyper.SimpleType>): CodePart {
		return this.makeOrTakeFunction(type, "object", builder => {
			let paramName = "obj"
			let fixedKeys = Object.keys(type.properties)

			// building code for known keys
			let makeFixedKeyCheckerCode = (propName: string, propType: Runtyper.SimpleType): string => {
				let propCond = this.buildPart(propType)
				let propExprCode = this.makeLiteralPropertyAccessExpression(paramName, propName)
				return `
					checkResult = ${this.partToCode(propCond, propExprCode)}
					if(checkResult){
						checkResult.path.push(${JSON.stringify(propName)})
						return checkResult
					}
				`
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

			let setOfFieldNames: FunctionParameter | null = null
			if(fixedKeys.length > 0){
				setOfFieldNames = this.addParameter("known_fields", new Set(fixedKeys))
			}

			let unlistedPropsCheckingCode = this.buildObjectUnlistedPropertiesCheckingCode(setOfFieldNames?.name, !hasStringIndex ? null : type.index?.valueType, paramName, "intCont")

			let initialCheck = `${paramName} === null || typeof(${paramName}) !== "object" || Array.isArray(${paramName})`
			builder.append(`(${paramName}, intCont){
				if(${initialCheck}){
					return ${this.makeDescribeErrorCall(paramName, initialCheck)}
				}

				var checkResult
				${fixedKeysCheckingParts.join("\n")}

				${unlistedPropsCheckingCode}

				return false
			}`)
		})
	}

	private buildObjectUnlistedPropertiesCheckingCode(fieldSetName: string | null | undefined, stringIndexType: Runtyper.SimpleType | null | undefined, paramName: string, parentIntContName: string | null): string {
		let skipKnownPropCode = ""
		if(fieldSetName){
			skipKnownPropCode = `
				if(${fieldSetName}.has(propName)){
					continue
				}`
		}

		let wrapInCycle = (code: string): string => {
			return `for(var propName in ${paramName}){${code}\n\t}`
		}

		let unlistedPropsCheckingCode: string
		if(this.manager.opts.onUnknownFieldInObject === "allow_anything"){
			unlistedPropsCheckingCode = ""
		} else if(!stringIndexType){
			unlistedPropsCheckingCode = `${skipKnownPropCode}
				return ${this.makeDescribeErrorCall(paramName + "[propName]", "<unknown field found>", undefined, "propName")}`
			unlistedPropsCheckingCode = wrapInCycle(unlistedPropsCheckingCode)
			if(fieldSetName && parentIntContName){
				unlistedPropsCheckingCode = `
					if(${parentIntContName}){
						for(var i of ${fieldSetName}){
							${parentIntContName}.add(${paramName}, i)
						}
					} else {
						${unlistedPropsCheckingCode}
					}`
			}
		} else {
			let propCond = this.buildPart(makeUnion([
				stringIndexType,
				{type: "constant", value: undefined}
			]))
			let indexTypeChecker = this.partToCode(propCond, paramName + "[propName]")
			unlistedPropsCheckingCode = `${skipKnownPropCode}
				checkResult = ${indexTypeChecker}
				if(checkResult){
					checkResult.path.push(propName)
					return checkResult
				}`
			unlistedPropsCheckingCode = wrapInCycle(unlistedPropsCheckingCode)
		}
		return unlistedPropsCheckingCode
	}

}
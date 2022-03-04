import {CodePart, FunctionBuilder, FunctionCodePart, FunctionParameter} from "codegen/function_builder"
import {Runtyper} from "entrypoint"
import {RawValidator, ValidatorBuilderImpl} from "codegen/validator_builder"
import {ValidatorUtils} from "runtime/validator_utils"
import {canBeUndefined, describeObjectTypeKeys, DiscriminatedTypePack, findDiscriminatorsInUnion, forEachTerminalTypeInUnionIntersection} from "utils/simple_type_utils"
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

	build(type: Runtyper.SimpleType, preventReuse = false): RawValidator {
		let part = this.buildPart(type, preventReuse)
		return this.buildStartingAt(part, "value", codePreamble) as RawValidator
	}

	private buildPart(type: Runtyper.SimpleType, preventReuse = false): CodePart {
		if(type.fullRefName && !preventReuse){
			return this.importFunction(type, this.manager.buildInternal(type))
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

	private makeDescribeErrorCall(valueCode: string, exprCode: string): string {
		return this.makeDescribeErrorCallWithRawCode(valueCode, JSON.stringify(exprCode))
	}

	private makeDescribeErrorCallWithRawCode(valueCode: string, exprCodeRaw: string): string {
		return `u.err(${valueCode}, ${exprCodeRaw})`
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
				let code = `typeof(${valueCode}) !== "number"`
				if(this.manager.opts.onNaNWhenExpectedNumber === "validation_error"){
					code = `(${code} || Number.isNaN(${valueCode}))`
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
				let valueToCheck = this.constValueToCode(type.value)
				return this.conditionToExpression(valueCode => `${valueCode} !== ${valueToCheck}`)
			}
			case "constant_union":{
				let set = new Set(type.value)
				let constrVal = this.addParameter("allowed_values", set)
				return this.conditionToExpression(valueCode => `!${constrVal.name}.has(${valueCode})`)
			}
			case "instance":{
				if(this.manager.opts.onClassInstance === "throw_on_build"){
					throw new Error("Failed to build validator: checking of class instances is disabled; class is " + type.fullRefName + ", " + type.cls)
				}
				let name = !type.refName || type.refName.length > 50 ? "cnstructor" : type.refName
				let param = this.addParameter("cls_" + name, type.cls)
				return this.conditionToExpression(valueCode => `!(${valueCode} instanceof ${param.name})`)
			}
			case "intersection": return this.buildIntersectionCheckingCode(type)
			case "union": return this.buildUnionCheckingCode(type)
			case "array": return this.buildArrayCheckingCode(type)
			case "object": return this.buildObjectCheckingCode(type)
			case "tuple": return this.buildTupleCheckingCode(type)
		}
	}

	private constValueToCode(value: Runtyper.ConstantType["value"]): string {
		if(value === undefined){
			return "void 0"
		} else if(value === null){
			return "null"
		} else if(value === true){
			return "true"
		} else if(value === false){
			return "false"
		} else if(typeof(value) === "string"){
			return JSON.stringify(value)
		} else if(typeof(value) === "number" && value % 1 === 0 && Math.abs(value) - 1 < Number.MAX_SAFE_INTEGER){
			return value + ""
		} else {
			let name = "const_of_" + typeof(value)
			let cval = this.addParameter(name, value)
			return cval.name
		}
	}

	private buildUnionCheckingCode(type: Runtyper.UnionType<Runtyper.SimpleType>): CodePart {
		let objTypes = type.types.filter(type => type.type === "object") as Runtyper.SimpleObjectType<Runtyper.SimpleType>[]
		if(objTypes.length < 2){
			let subtypesCheckingParts = type.types.map(type => this.buildPart(type))
			return this.conditionToExpression(valueCode => "("
				+ subtypesCheckingParts.map(part => this.partToCode(part, valueCode)).join(" && ")
				+ ")")
		}

		let discrGroups = findDiscriminatorsInUnion(objTypes)

		let nonObjTypes = type.types.filter(type => type.type !== "object")
		return this.makeOrTakeFunction(type, "union", builder => {
			let paramName = "value"

			let initialCheck = `!u.isTypicalObject(${paramName})`
			builder.append(`(${paramName}, intCont){
				if(${initialCheck}){
					return ${nonObjTypes.length < 1 ? this.makeDescribeErrorCall(paramName, initialCheck) : nonObjTypes.map(type => this.partToCode(this.buildPart(type), paramName)).join(" && ")}
				}

				${this.discriminationPackToCode(discrGroups, paramName)}
			}`)
		})
	}

	private discriminationPackToCode(pack: DiscriminatedTypePack, valueCode: string): string {
		if(Array.isArray(pack)){
			return "return " + pack.map(type => this.partToCode(this.buildPart(type), valueCode)).join(" && ")
		}

		let cases = [...pack.mapping].map(([value, subpack]) =>
			"case " + this.constValueToCode(value) + ": " + this.discriminationPackToCode(subpack, valueCode)
		).join("\n")

		let dflt = Array.isArray(pack.default) && pack.default.length < 1
			? "return " + this.makeDescribeErrorCall(
				valueCode,
				"!allowedConstantUnionValues.has(" + this.makeLiteralPropertyAccessExpression(valueCode, pack.propertyName) + ")"
			)
			: this.discriminationPackToCode(pack.default, valueCode)

		return `switch(${this.makeLiteralPropertyAccessExpression(valueCode, pack.propertyName)}){
			${cases}
			default: ${dflt}
		}`
	}

	private buildIntersectionCheckingCode(type: Runtyper.IntersectionType<Runtyper.SimpleType>): CodePart {
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

			let allowExtraFields = this.manager.opts.onUnknownFieldInObject === "allow_anything"

			builder.append(`(${paramName}, parentIntCont){
				${allowExtraFields ? "" : "var intCont = u.makeIntCont()"}
				var checkResult = ${subtypesCheckingCode}
				if(checkResult){
					return checkResult
				}
				${allowExtraFields ? "" : `
					if(parentIntCont === undefined){
						checkResult = intCont.check()
						if(checkResult){
							return checkResult
						}
					} else {
						parentIntCont.merge(intCont)
					}
				`}
	
				return false
			}`)
		})
	}

	private buildArrayCheckingCode(type: Runtyper.ArrayType<Runtyper.SimpleType>): CodePart {
		return this.makeOrTakeFunction(type, "array", builder => {
			let paramName = "arr"
			let initialCheck = `!Array.isArray(${paramName})`
			builder.append(`(${paramName}){
				if(${initialCheck}){
					return ${this.makeDescribeErrorCall(paramName, initialCheck)}
				}

				var len = ${paramName}.length
				var checkResult
				for(var i = 0; i < len; i++){
					checkResult = ${this.partToCode(this.buildPart(type.valueType), paramName + "[i]")}
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

			let {fixed, stringIndexValue} = describeObjectTypeKeys(type)

			let fieldSetParam: FunctionParameter | null = null
			if(fixed){
				fieldSetParam = this.addParameter("known_fields", new Set(fixed.keys()))
			}

			let initialCheck = `!u.isTypicalObject(${paramName})`
			builder.append(`(${paramName}, intCont){
				if(${initialCheck}){
					return ${this.makeDescribeErrorCall(paramName, initialCheck)}
				}

				var checkResult
				${!fixed ? "" : [...fixed].map(([key, type]) => `
					checkResult = ${this.partToCode(this.buildPart(type), this.makeLiteralPropertyAccessExpression(paramName, key))}
					if(checkResult){
						checkResult.path.push(${JSON.stringify(key)})
						return checkResult
					}
				`).join("\n")}

				${stringIndexValue ? `
					for(var propName in ${paramName}){
						${!fieldSetParam ? "/* no fieldset */" : `
							if(${fieldSetParam.name}.has(propName)){
								/* Don't double-check fixed-name fields: their type may be overriden */
								continue
							}
						`}
						checkResult = ${this.partToCode(this.buildPart(stringIndexValue), paramName + "[propName]")}
						if(checkResult){
							checkResult.path.push(propName)
							return checkResult
						}
					}
				` : this.manager.opts.onUnknownFieldInObject === "allow_anything" ? "" : `
					if(intCont){
						${!fieldSetParam ? "/* no fieldset, nothing to add to context */" : `
							for(var i of ${fieldSetParam.name}){
								intCont.add(${paramName}, i)
							}
						`}
					} else {
						checkResult = u.checkNoExtraFields(${paramName}${!fieldSetParam ? "" : ", " + fieldSetParam.name})
						if(checkResult){
							return checkResult
						}
					}
				`}

				return false
			}`)
		})
	}

}
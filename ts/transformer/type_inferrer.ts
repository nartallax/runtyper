import {Runtyper} from "entrypoint"
import {TransParams} from "transformer/transformer"
import {RuntyperTricks} from "transformer/tricks"
import {TypeDescriberBase} from "transformer/type_describer_base"
import {TypeNodeDescriber} from "transformer/type_node_describer"
import * as Tsc from "typescript"
import {deepEquals} from "utils/utils"

export class TypeInferrer extends TypeDescriberBase {

	constructor(
		private typeNodeDescriber: TypeNodeDescriber,
		tricks: RuntyperTricks,
		file: Tsc.SourceFile,
		params: TransParams,
		currentNode: Tsc.Node | null) {
		super(tricks, file, params, currentNode)
	}

	inferVariableDeclarationType(decl: Tsc.VariableDeclaration, preferConst: boolean): Runtyper.Type {
		if(decl.initializer){
			let hasDestructurization = !Tsc.isIdentifier(decl.name)
			return this.inferExpressionType(decl.initializer, preferConst, hasDestructurization)
		} else {
			return this.fail("Cannot infer variable declaration type: no initializer: ", decl)
		}
	}

	inferExpressionType(expr: Tsc.Expression, preferConst = false, hasDestructurization = false): Runtyper.Type {
		if(Tsc.isAsExpression(expr)){
			return this.inferAsExpression(expr)
		} else if(Tsc.isParenthesizedExpression(expr)){
			return this.inferExpressionType(expr.expression, preferConst, hasDestructurization)
		} else if(Tsc.isNumericLiteral(expr)){
			return this.inferNumericLiteralType(expr, preferConst)
		} else if(Tsc.isStringLiteral(expr)){
			return this.inferStringLiteralType(expr, preferConst)
		} else if(expr.kind === Tsc.SyntaxKind.TrueKeyword){
			return preferConst ? {type: "constant", value: true} : {type: "boolean"}
		} else if(expr.kind === Tsc.SyntaxKind.FalseKeyword){
			return preferConst ? {type: "constant", value: false} : {type: "boolean"}
		} else if(expr.kind === Tsc.SyntaxKind.UndefinedKeyword){
			return {type: "constant", value: undefined}
		} else if(Tsc.isVoidExpression(expr)){
			return {type: "constant", value: undefined}
		} else if(expr.kind === Tsc.SyntaxKind.NullKeyword){
			return {type: "constant", value: null}
		} else if(Tsc.isPrefixUnaryExpression(expr)){
			return this.inferPrefixUnaryExpressionType(expr, preferConst)
		} else if(Tsc.isNonNullExpression(expr)){
			return this.inferNonNullExpressionType(expr, preferConst, hasDestructurization)
		} else if(Tsc.isObjectLiteralExpression(expr)){
			return this.inferObjectLiteralType(expr, hasDestructurization)
		} else if(Tsc.isArrayLiteralExpression(expr)){
			return this.inferArrayLiteralExpressionType(expr, hasDestructurization)
		} else if(Tsc.isCallExpression(expr)){
			return this.inferCallExpressionType(expr)
		} else if(Tsc.isIdentifier(expr)){
			return this.inferVariableExpressionType(expr)
		} else if(Tsc.isArrowFunction(expr)){
			return this.inferArrowFunctionType(expr)
		} else {
			return this.fail("Cannot infer type of expression: ", expr)
		}
	}

	private inferPrefixUnaryExpressionType(expr: Tsc.PrefixUnaryExpression, preferConst: boolean): Runtyper.Type {
		if(!preferConst){
			return this.inferExpressionType(expr.operand)
		} else {
			let nestedType = this.inferExpressionType(expr.operand, true)
			if(nestedType.type !== "constant" || typeof(nestedType.value) !== "number"){
				return this.fail("Unary operators are only allowed on numeric constant types: ", expr)
			} else if(expr.operator !== Tsc.SyntaxKind.MinusToken){
				return this.fail("Only unary operator constant number type is allowed to have is minus, but this have something else: ", expr)
			} else {
				return {type: "constant", value: -nestedType.value}
			}
		}
	}

	private inferNonNullExpressionType(expr: Tsc.NonNullExpression, preferConst: boolean, hasDestructurization = false): Runtyper.Type {
		let type = this.inferExpressionType(expr.expression, preferConst, hasDestructurization)
		// if(type.type === "constant"){
		// 	if(type.value === null || type.value === undefined){
		// 		return {type: "never"}
		// 	} else {
		// 		return type
		// 	}
		// } else if(type.type === "constant_union"){
		// 	return this.clearConstantUnionOfNullUndefined(type)
		// } else if(type.type === "union"){
		// 	let types = [] as Runtyper.Type[]
		// 	for(let t of type.types){
		// 		if(t.type === "constant" && (t.value === undefined || t.value === null)){
		// 			continue // drop
		// 		} else if(t.type === "constant_union"){
		// 			let cleared = this.clearConstantUnionOfNullUndefined(t)
		// 			if(cleared.type !== "never"){
		// 				types.push(cleared)
		// 			}
		// 		} else {
		// 			types.push(t)
		// 		}
		// 	}
		// 	return types.length > 1 ? {type: "union", types} : types.length === 1 ? types[0]! : {type: "never"}
		// } else {
		// 	return {type: "non_null", valueType: type}
		// }
		return {type: "non_null", valueType: type}
	}

	// private clearConstantUnionOfNullUndefined(type: Runtyper.ConstantUnionType): Runtyper.Type {
	// 	let vals = type.value.filter(x => x !== undefined && x !== null)
	// 	if(vals.length === 0){
	// 		return {type: "never"}
	// 	} else if(vals.length === 1){
	// 		return {type: "constant", value: vals[0]!}
	// 	} else {
	// 		return {type: "constant_union", value: vals}
	// 	}
	// }

	private inferNumericLiteralType(expr: Tsc.NumericLiteral, preferConst: boolean): Runtyper.Type {
		if(preferConst){
			let num = parseFloat(expr.text)
			if(Number.isNaN(num)){
				return this.fail("Failed to parse number value of numeric literal ", expr)
			}
			return {type: "constant", value: parseFloat(expr.text)}
		} else {
			return {type: "number"}
		}
	}

	private inferStringLiteralType(expr: Tsc.StringLiteral, preferConst: boolean): Runtyper.Type {
		return preferConst ? {type: "constant", value: expr.text} : {type: "string"}
	}

	private inferObjectLiteralType(expr: Tsc.ObjectLiteralExpression, hasDestructurization = false): Runtyper.Type {
		let props = {} as Record<string, Runtyper.ObjectPropertyType>

		for(let prop of expr.properties){
			if(Tsc.isPropertyAssignment(prop)){
				let name = this.tricks.propertyNameToString(prop.name) || prop.name.getText()
				props[name] = {
					...this.inferExpressionType(prop.initializer, false, hasDestructurization),
					...(prop.questionToken ? {optional: true} : {})
				}
				continue
			}

			return this.fail("Cannot understand what this object property is: ", prop)
		}

		return {
			type: "object",
			properties: props
		}
	}

	private inferArrayLiteralExpressionType(expr: Tsc.ArrayLiteralExpression, hasDestructurization = false): Runtyper.Type {
		if(hasDestructurization){
			return this.fail("when the variable is destructurized, array value may or may not infer to a tuple type; therefore, accurate type inferrence is not supported: ", expr)
		}
		let valueTypes = expr.elements.map(el => this.inferExpressionType(el))

		if(valueTypes.length === 0){
			return {type: "array", valueType: {type: "never"}}
		}

		valueTypes = valueTypes
			// a little crappy, but will work
			.sort((a, b) => a.type > b.type ? 1 : a.type < b.type ? -1 : JSON.stringify(a) > JSON.stringify(b) ? 1 : -1)

		let uniqValueTypes = [valueTypes[0]!] as Runtyper.Type[]
		for(let i = 1; i < valueTypes.length; i++){
			let type = valueTypes[i]!
			if(!deepEquals(uniqValueTypes[uniqValueTypes.length - 1]!, type)){
				uniqValueTypes.push(type)
			}
		}

		let constTypes = uniqValueTypes.filter(x => x.type === "constant" || x.type === "constant_union")
		if(constTypes.length > 1){
			let allValues = [] as Runtyper.ConstantType["value"][]
			for(let type of constTypes){
				switch(type.type){
					case "constant":
						allValues.push(type.value)
						break
					case "constant_union":
						allValues.push(...type.value)
						break
				}
			}
			let uniqValues = [...new Set(allValues)]
			let compactedType: Runtyper.Type = uniqValues.length === 1
				? {type: "constant", value: uniqValues[0]!}
				: {type: "constant_union", value: uniqValues.sort()}

			uniqValueTypes = uniqValueTypes.filter(x => x.type !== "constant" && x.type !== "constant_union")
			uniqValueTypes.push(compactedType)
		}

		if(uniqValueTypes.length === 1){
			return {type: "array", valueType: uniqValueTypes[0]!}
		} else {
			return {type: "array", valueType: {type: "union", types: uniqValueTypes}}
		}
	}

	private inferCallExpressionType(expr: Tsc.CallExpression): Runtyper.Type {
		let symbol = this.tricks.checker.getSymbolAtLocation(expr.expression)
		if(!symbol){
			return this.fail("Call expression base has no symbol: ", expr)
		}

		let decl = symbol.valueDeclaration
		if(!decl){
			return this.fail("Call expression base has no declaration: ", expr)
		}

		let name = this.nameOfNode(decl)
		return {type: "call_result_reference", functionName: name}
	}

	private inferVariableExpressionType(expr: Tsc.Identifier): Runtyper.Type {
		let symbol = this.tricks.checker.getSymbolAtLocation(expr)
		if(!symbol){
			return this.fail("Variable reference expression has no symbol: ", expr)
		}

		let decl = symbol.valueDeclaration
		if(!decl){
			let decls = symbol.getDeclarations()
			if(!decls){
				return this.fail("Variable reference expression has no declaration: ", expr)
			} else if(decls.length > 2){
				return this.fail("Variable reference expression has more than one declaration: ", expr)
			} else {
				decl = decls[0]!
			}
		}

		let name: string
		if(Tsc.isImportSpecifier(decl)){
			let importDescr = this.typeNodeDescriber.describeImportSpecifierSource(decl)
			if(typeof(importDescr) !== "string"){
				return importDescr
			}
			name = importDescr
		} else {
			name = this.nameOfNode(decl)
		}

		return {type: "value_reference", name}
	}

	private inferAsExpression(expr: Tsc.AsExpression): Runtyper.Type {
		if(Tsc.isTypeReferenceNode(expr.type) && Tsc.isIdentifier(expr.type.typeName) && expr.type.typeName.text === "const"){
			return this.inferExpressionType(expr.expression, true)
		} else {
			return this.typeNodeDescriber.describeType(expr.type)
		}
	}

	private inferArrowFunctionType(expr: Tsc.ArrowFunction): Runtyper.Type {
		return {type: "function", signatures: [this.typeNodeDescriber.describeCallSignature(expr)]}
	}

}
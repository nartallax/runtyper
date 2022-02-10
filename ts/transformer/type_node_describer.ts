import {Runtyper} from "entrypoint"
import {TransParams} from "transformer/toplevel_transformer"
import {DestructVariable, RuntyperTricks} from "transformer/tricks"
import {TypeDescriberBase} from "transformer/type_describer_base"
import * as Tsc from "typescript"

export interface TypedVariable {
	type: Runtyper.Type
	name: Tsc.PropertyName
}

export interface TypedFunction {
	signature: Runtyper.CallSignature
	name: Tsc.PropertyName
	hasImpl: boolean
}

export class TypeNodeDescriber extends TypeDescriberBase {

	constructor(tricks: RuntyperTricks,
		params: TransParams,
		sourceFile: Tsc.SourceFile,
		actualFile: Tsc.SourceFile,
		currentNode: Tsc.Node | null = null) {

		super(tricks, params, sourceFile, actualFile, currentNode)
	}

	describeClass(decl: Tsc.ClassDeclaration): {cls: Runtyper.Class, variables: TypedVariable[], methods: TypedFunction[]} {
		let staticProps = new Map<string, Runtyper.StaticProperty>()
		let instanceProps = new Map<string, Runtyper.InstanceProperty>()
		let methods = new Map<string, Runtyper.Method>()
		let variables = [] as TypedVariable[]
		let methodsArr = [] as TypedFunction[]

		decl.members.forEach(member => {
			if(Tsc.isPropertyDeclaration(member)){
				let typeNode = member.type
				let type = !typeNode
					? this.fail("Class property has no explicit type: ", member)
					: this.describeType(typeNode)

				// TODO: does nodes in class gets named correctly? test for that
				if(this.tricks.isNodeStatic(member)){
					let name = this.nameOfNode(member)
					staticProps.set(this.tricks.propertyNameToString(member.name), {
						name, access: this.tricks.nodeAccessLevel(member)
					})
					variables.push({name: member.name, type})
				} else {
					instanceProps.set(this.tricks.propertyNameToString(member.name), {
						...type,
						access: this.tricks.nodeAccessLevel(member),
						...(member.questionToken ? {optional: true} : {})
					})
				}
			} else if(Tsc.isConstructorDeclaration(member)){
				member.parameters.forEach(param => {
					if(this.tricks.nodeHasAccessModifier(param) || this.tricks.isNodeReadonly(param)){
						let typeNode = param.type
						let type = !typeNode
							? this.fail("Class property in constructor has no explicit type: ", param)
							: this.describeType(typeNode)
						let nameNode = param.name
						if(!Tsc.isIdentifier(nameNode)){
							throw new Error("Name of constructor property is not identifier: " + member.getText())
						}
						instanceProps.set(nameNode.text, {
							...type,
							access: this.tricks.nodeAccessLevel(param),
							...(member.questionToken ? {optional: true} : {})
						})
					}
				})
			} else if(Tsc.isMethodDeclaration(member)){
				let signature = this.describeMethodOrFunction(member)
				let name = this.nameOfNode(member)
				methodsArr.push({
					name: member.name,
					hasImpl: !!member.body,
					signature
				})
				methods.set(this.tricks.propertyNameToString(member.name), {
					type: "method",
					functionName: name,
					access: this.tricks.nodeAccessLevel(member),
					...(member.questionToken ? {optional: true} : {})
				})
			}
		})

		let typeParams = this.describeTypeParameters(decl)
		let heritage = this.describeHeritage(decl.heritageClauses)
		return {cls: {
			type: "class",
			...(typeParams.length > 0 ? {typeParameters: typeParams} : {}),
			...(heritage.length > 0 ? {heritage} : {}),
			...(instanceProps.size > 0 ? {instanceProperties: instanceProps} : {}),
			...(staticProps.size > 0 ? {staticProperties: staticProps} : {}),
			...(methods.size > 0 ? {methods} : {})
		}, variables, methods: methodsArr}
	}

	describeVariables(decl: Tsc.VariableStatement): TypedVariable[] {
		let result = [] as TypedVariable[]
		decl.declarationList.declarations.forEach(declPart => {
			let vars = this.tricks.extractVariablesFromDeclaration(declPart)
			let typeNode = declPart.type
			let declType = !typeNode
				? this.fail("No type node found; expected them to be added on previous step: ", declPart)
				: this.describeType(typeNode)
			vars.forEach(v => {
				let type = this.makeTypeOfVariable(declType, v)
				result.push({type, name: v.identifier})
			})
		})
		return result
	}

	describeCallSignature(decl: Tsc.FunctionDeclaration | Tsc.CallSignatureDeclaration | Tsc.FunctionTypeNode | Tsc.MethodDeclaration | Tsc.MethodSignature): Runtyper.CallSignature {
		let params = decl.parameters.map(param => {
			let typeNode = param.type
			let type: Runtyper.Type
			if(!typeNode){
				type = this.fail("No explicit function parameter type! Type inferrence did not run? Parameter is: ", param)
			} else {
				type = this.describeType(typeNode)
			}
			return {
				type: "parameter",
				...(Tsc.isIdentifier(param.name) ? {name: param.name.text} : {}),
				valueType: type,
				...(param.questionToken || param.initializer ? {optional: true} : {})
			} as Runtyper.Parameter
		})

		let retTypeNode = decl.type
		let retType = !retTypeNode
			? this.fail("No explicit function return type! Type inferrence did not run? Function is: ", decl)
			: this.describeType(retTypeNode)

		let typeParams = this.describeTypeParameters(decl)

		return {
			type: "call_signature",
			...(typeParams.length > 0 ? {typeParameters: typeParams} : {}),
			...(params.length > 0 ? {parameters: params} : {}),
			returnType: retType
		}
	}

	describeMethodOrFunction(decl: Tsc.FunctionDeclaration | Tsc.MethodDeclaration): Runtyper.FunctionOverload {
		let base = this.describeCallSignature(decl)
		return {
			...base,
			...(decl.body ? {hasImplementation: true} : {})
		}
	}

	/** When variable is declared through destructurizing, we need to store its type somehow
	 * All we have is overall type of value that is destructurized
	 * So to create an accurate destructurization type, we add indices to the overall type */
	private makeTypeOfVariable(type: Runtyper.Type, v: DestructVariable): Runtyper.Type {
		for(let i = 0; i < v.path.length; i++){
			let part = v.path[i]!
			let rest = !!v.rest && i === v.path.length - 1
			type = {
				type: "index_access",
				index: {type: "constant", value: part},
				object: type,
				...(!rest ? {} : {rest})
			}
		}
		return type
	}

	describeInterface(node: Tsc.InterfaceDeclaration): Runtyper.TypeDeclaration {
		return this.wrapTypeExtraction(node, () => {
			let base = this.describeObjectType(node)
			if(base.type === "illegal"){
				return base
			}

			if(base.type !== "object"){
				return this.fail("Base type of interface is not an object: ", node)
			}

			let extnds = this.describeHeritage(node.heritageClauses)

			let typeParams = this.describeTypeParameters(node)
			let result: Runtyper.InterfaceDeclaration = {
				...base,
				type: "interface",
				...(extnds.length < 1 ? {} : {extends: extnds}),
				...(typeParams.length < 1 ? {} : {typeParameters: typeParams})
			}

			return result
		})
	}

	describeAlias(node: Tsc.TypeAliasDeclaration): Runtyper.TypeDeclaration {
		return this.wrapTypeExtraction(node, () => {
			let typeParameters = this.describeTypeParameters(node)
			return {
				type: "alias",
				body: this.describeType(node.type),
				...(typeParameters.length > 0 ? {typeParameters} : {})
			}
		})
	}

	describeEnum(node: Tsc.EnumDeclaration): Runtyper.TypeDeclaration {
		let values = new Set<string | number>()
		for(let member of node.members){
			let name = member.name
			let type = this.tricks.checker.getTypeAtLocation(name)
			if(type.isNumberLiteral() || type.isStringLiteral()){
				values.add(type.value)
			} else {
				return this.fail("Type of member " + name.getText() + " is not string or number literal: ", node)
			}
		}
		return {type: "enum", values}
	}

	private describeTypeParameters(node: Tsc.DeclarationWithTypeParameterChildren): Runtyper.TypeParameter[] {
		return (node.typeParameters || []).map(param => ({
			name: param.name.text,
			...(!param.default ? {} : {default: this.describeType(param.default)})
		}))
	}

	private describeHeritage(clauses: Tsc.NodeArray<Tsc.HeritageClause> | undefined): Runtyper.Type[] {
		let result = [] as Runtyper.Type[]
		clauses?.forEach(clause => clause.types.forEach(heritageType => {
			result.push(this.describeType(heritageType))
		}))
		return result
	}

	private describeType(node: Tsc.Node): Runtyper.Type {
		if(Tsc.isParenthesizedTypeNode(node)){
			return this.describeType(node.type)
		} else if(Tsc.isLiteralTypeNode(node)){
			return this.describeLiteralType(node)
		} else if(node.kind === Tsc.SyntaxKind.NumberKeyword){
			return {type: "number"}
		} else if(node.kind === Tsc.SyntaxKind.StringKeyword){
			return {type: "string"}
		} else if(node.kind === Tsc.SyntaxKind.BooleanKeyword){
			return {type: "boolean"}
		} else if(node.kind === Tsc.SyntaxKind.AnyKeyword){
			return {type: "any"}
		} else if(node.kind === Tsc.SyntaxKind.UnknownKeyword){
			return {type: "unknown"}
		} else if(node.kind === Tsc.SyntaxKind.UndefinedKeyword){
			// yep, undefined is not LiteralType for some reason
			return {type: "constant", value: undefined}
		} else if(node.kind === Tsc.SyntaxKind.VoidKeyword){
			// right now I decided to treat `void` just like `undefined` value
			// from my POV there is not much difference
			return {type: "constant", value: undefined}
		} else if(node.kind === Tsc.SyntaxKind.NeverKeyword){
			return {type: "never"}
		} else if(Tsc.isUnionTypeNode(node)){
			return this.describeUnionType(node)
		} else if(Tsc.isIntersectionTypeNode(node)){
			return {
				type: "intersection",
				types: node.types.map(type => this.describeType(type))
			}
		} else if(Tsc.isArrayTypeNode(node)){
			return {type: "array", valueType: this.describeType(node.elementType)}
		} else if(Tsc.isTypeLiteralNode(node)){
			return this.describeObjectType(node)
		} else if(Tsc.isTupleTypeNode(node)){
			return this.describeTupleType(node)
		} else if(Tsc.isTypeReferenceNode(node)){
			return this.describeTypeReference(node)
		} else if(Tsc.isExpressionWithTypeArguments(node)){
			return this.describeExpressionWithTypeArgs(node)
		} else if(Tsc.isIndexedAccessTypeNode(node)){
			return this.describeIndexAccessType(node)
		} else if(Tsc.isMappedTypeNode(node)){
			return this.describeMappedType(node)
		} else if(Tsc.isTypeOperatorNode(node) && node.operator === Tsc.SyntaxKind.KeyOfKeyword){
			return this.describeKeyofType(node)
		} else if(Tsc.isTypeQueryNode(node)){
			return this.describeTypeofType(node)
		} else if(Tsc.isImportTypeNode(node)){
			return this.describeImportTypeNode(node) // `typeof imported_value` will generate such node
		} else if(Tsc.isConditionalTypeNode(node)){
			return this.describeConditionalTypeNode(node)
		} else if(Tsc.isFunctionTypeNode(node)){
			return this.describeCallSignature(node)
		} else {
			return this.fail("Cannot understand what this node is exactly: " + node.getText() + ", kind = " + Tsc.SyntaxKind[node.kind])
		}
	}

	private describeLiteralType(node: Tsc.LiteralTypeNode): Runtyper.Type {
		let literal = node.literal
		if(Tsc.isStringLiteral(literal)){
			return {type: "constant", value: literal.text}
		} else if(Tsc.isNumericLiteral(literal)){
			let num = parseFloat(literal.text)
			if(Number.isNaN(num)){
				return this.fail("Failed to parse number value of numeric literal ", node)
			}
			return {type: "constant", value: num}
		} else if(literal.kind === Tsc.SyntaxKind.NullKeyword){
			return {type: "constant", value: null}
		} else if(literal.kind === Tsc.SyntaxKind.TrueKeyword){
			return {type: "constant", value: true}
		} else if(literal.kind === Tsc.SyntaxKind.FalseKeyword){
			return {type: "constant", value: false}
		} else {
			return this.fail("Cannot understand type of literal type expression: ", node)
		}
	}

	private describeImportTypeNode(node: Tsc.ImportTypeNode): Runtyper.Type {
		if(!node.qualifier){
			return this.fail("Cannot process type import node without qualifier: ", node)
		}
		let names = this.tricks.entityNameToArray(node.qualifier)
		let argType = node.argument
		let moduleName: string
		if(Tsc.isLiteralTypeNode(argType) && Tsc.isStringLiteral(argType.literal)){
			let pathToModule = argType.literal.text
			moduleName = this.tricks.modulePathResolver.getCanonicalModuleName(pathToModule)
		} else {
			return this.fail("Cannot process type import with non-constant argument: ", node)
		}
		let fullName = this.nameOfModuleAndIdentifiers(moduleName, names)
		return {type: "reference", name: fullName}
	}

	private describeUnionType(node: Tsc.UnionTypeNode): Runtyper.Type {
		// optimize here? no need to create type descriptions for constant types
		// because we will just throw them away
		if(node.types.length === 1){
			return this.describeType(node.types[0]!)
		}

		let otherTypes = [] as Runtyper.Type[]
		let constValues = [] as Runtyper.ConstantType["value"][]

		function addType(type: Runtyper.Type) {
			if(type.type === "constant"){
				constValues.push(type.value)
			} else if(type.type === "constant_union"){
				constValues.push(...type.value)
			} else if(type.type === "union"){
				type.types.forEach(addType)
			} else {
				otherTypes.push(type)
			}
		}

		for(let type of node.types){
			addType(this.describeType(type))
		}

		if(constValues.length < 2){
			if(constValues.length > 0){
				otherTypes.push({type: "constant", value: constValues[0]!})
			}
			return {type: "union", types: otherTypes}
		}

		let constUnion: Runtyper.ConstantUnionType = {
			type: "constant_union",
			value: new Set(constValues)
		}

		if(otherTypes.length === 0){
			return constUnion
		}

		otherTypes.push(constUnion)
		return {
			type: "union",
			types: otherTypes
		}
	}

	private describeObjectType(node: Tsc.TypeLiteralNode | Tsc.InterfaceDeclaration): Runtyper.Type {
		let props = {} as Record<string, Runtyper.ObjectPropertyType>
		let varProps = {} as Record<string, Runtyper.ObjectPropertyType>
		let callSignatures = [] as Runtyper.CallSignature[]
		let hasVarProp = false
		let index = null as Runtyper.ObjectIndexType | null

		let determinePropNameObjMbType = (member: Tsc.MethodSignature | Tsc.PropertySignature) => {
			let propObj: Record<string, Runtyper.ObjectPropertyType>
			let propName: string
			let propType: Runtyper.Type | null = null
			if(Tsc.isComputedPropertyName(member.name) && Tsc.isIdentifier(member.name.expression)){
				let type = this.tricks.checker.getTypeAtLocation(member.name.expression)
				if(!type.isStringLiteral()){
					throw new Error("Computed property name is not string literal: " + member.getText())
				}
				propObj = varProps
				hasVarProp = true
				let symbol = this.tricks.checker.getSymbolAtLocation(member.name.expression)
				let decls = symbol?.declarations || []
				let decl = decls[0]!
				if(decls.length !== 1 || (!Tsc.isVariableDeclaration(decl) && !Tsc.isBindingElement(decl)) || !Tsc.isIdentifier(decl.name)){
					propType = this.fail("More than one declaration of key variable: ", member)
					propName = member.name.getText()
				} else {
					propName = this.nameOfNode(decl.name)
				}
			} else {
				propObj = props
				propName = this.tricks.propertyNameToString(member.name)
			}

			return {propObj, propName, propType}
		}

		for(let member of node.members){
			if(Tsc.isIndexSignatureDeclaration(member)){
				if(index){
					return this.fail("More than one index signature is not supported: ", member)
				}
				if(member.parameters.length !== 1){
					// enforced by typescript
					return this.fail("Index signatures must have exactly one parameter: ", member)
				}
				let param = member.parameters[0]!
				let keyType = param.type
				if(!keyType){
					return this.fail("Index signatures must have explicit type: ", member)
				}
				let keyTypeDescr = this.describeType(keyType)
				if(keyTypeDescr.type !== "string" && keyTypeDescr.type !== "number"){
					if(keyTypeDescr.type !== "union"
					|| keyTypeDescr.types.length !== 2
					|| !keyTypeDescr.types.find(x => x.type === "number")
					|| !keyTypeDescr.types.find(x => x.type === "string")){
						return this.fail("Only string or number index is allowed: ", member)
					}
				}
				let valueTypeDescr = this.describeType(member.type)
				index = {keyType: keyTypeDescr, valueType: valueTypeDescr}
				continue
			}

			if(Tsc.isPropertySignature(member)){
				if(!member.type){
					return this.fail("Expected all object properties to be explicitly typed, but this is not: ", member)
				}
				let {propObj, propName, propType} = determinePropNameObjMbType(member)

				propObj[propName] = propType || {
					...this.describeType(member.type),
					...(member.questionToken ? {optional: true} : {})
				}
				continue
			}

			if(Tsc.isMethodSignature(member)){
				let {propObj, propName, propType} = determinePropNameObjMbType(member)
				propObj[propName] = propType || {
					...this.describeCallSignature(member),
					...(member.questionToken ? {optional: true} : {})
				}
				continue
			}

			if(Tsc.isCallSignatureDeclaration(member)){
				callSignatures.push(this.describeCallSignature(member))
				continue
			}

			return this.fail("Can only process index and property signatures, got something else instead: ", member)
		}
		return {
			type: "object",
			properties: props,
			...(hasVarProp ? {propertyByConstKeys: varProps} : {}),
			...(index ? {index} : {}),
			...(callSignatures.length > 0 ? {callSignatures} : {})
		}
	}

	private describeTupleType(node: Tsc.TupleTypeNode): Runtyper.Type {
		return {type: "tuple", valueTypes: node.elements.map(el => {
			let result: Runtyper.TupleElementType
			let optional = false
			if(Tsc.isNamedTupleMember(el)){
				if(el.questionToken){
					optional = true
				}
				result = {
					...this.describeType(el.type),
					...(optional ? {optional} : {})
				}
				if(el.dotDotDotToken){
					if(result.type !== "array"){
						// not gonna happen, typescript enforces it
						return this.fail("Rest tuple element must have array type")
					}
					result = {
						type: "rest",
						valueType: result.valueType
					}
				}
			} else {
				if(Tsc.isOptionalTypeNode(el)){
					optional = true
					el = el.type
				}
				if(Tsc.isRestTypeNode(el)){
					let nestedType = this.describeType(el.type)
					if(nestedType.type !== "array"){
						// not gonna happen, typescript enforces it
						return this.fail("Rest tuple element must have array type")
					}
					result = {
						type: "rest",
						valueType: nestedType.valueType
					}
				} else {
					result = {
						...this.describeType(el),
						...(optional ? {optional} : {})
					}
				}
			}
			return result
		})}
	}

	private describeExpressionWithTypeArgs(node: Tsc.ExpressionWithTypeArguments): Runtyper.Type {
		let symbol = this.tricks.checker.getSymbolAtLocation(node.expression)
		return this.describeNodeBySymbol(node, symbol)
	}

	private describeTypeReference(node: Tsc.TypeReferenceNode): Runtyper.Type {
		let symbol = this.tricks.checker.getSymbolAtLocation(node.typeName)
		return this.describeNodeBySymbol(node, symbol)
	}

	private describeNodeBySymbol(node: Tsc.NodeWithTypeArguments, symbol: Tsc.Symbol | undefined): Runtyper.Type {
		if(!symbol){
			return this.fail("Node has no symbol: ", node)
		}

		let decls = symbol.getDeclarations() || []
		if(decls.length === 0){
			return this.fail("Node has no declarations: ", node)
		}

		let externalType = this.processExternalTypeDecls(node, decls, symbol)
		if(externalType){
			return externalType
		}

		if(decls.length > 1){
			return this.fail("Multiple declarations are not supported: ", node)
		}

		return this.describeReferencedDeclarationType(node, decls[0]!)
	}

	private describeReferencedDeclarationType(reference: Tsc.NodeWithTypeArguments, decl: Tsc.Declaration): Runtyper.Type {
		if(Tsc.isTypeParameterDeclaration(decl)){
			return {type: "generic_parameter", name: decl.name.text}
		}

		if(Tsc.isEnumDeclaration(decl)){
			return {type: "reference", name: this.nameOfNode(decl.name)}
		}

		let typeArguments = (reference.typeArguments || []).map(typeArg => {
			if(Tsc.isInferTypeNode(typeArg)){
				return {type: "infer", name: typeArg.typeParameter.name.text} as Runtyper.InferType
			} else {
				return this.describeType(typeArg)
			}
		})
		if(Tsc.isInterfaceDeclaration(decl) || Tsc.isTypeAliasDeclaration(decl) || Tsc.isClassDeclaration(decl)){
			return {
				type: "reference",
				name: this.nameOfNode(decl),
				...(typeArguments.length > 0 ? {typeArguments} : {})
			}
		}

		if(Tsc.isImportSpecifier(decl)){
			let modSpec = decl.parent.parent.parent.moduleSpecifier
			if(!Tsc.isStringLiteral(modSpec)){
				return this.fail("Module specifier is not string literal: ", modSpec)
			}
			let rawModName = modSpec.text
			let fullModName = this.tricks.modulePathResolver.resolveModuleDesignator(rawModName, this.sourceFile.fileName)
			let origName = (decl.propertyName || decl.name).text
			return {
				type: "reference",
				name: this.nameOfModuleAndIdentifiers(fullModName, [origName]),
				...(typeArguments.length > 0 ? {typeArguments} : {})
			}
		}

		return this.fail("Can't understand type of declaration: ", decl)
	}

	// this function partially copies describeReferencedDeclarationType
	// because they do essentially the same, just this functions returns the literal type of declaration and not just reference
	// private describeExternalDeclarationRecursively(decl: Tsc.Declaration): void {
	// 	let type: Runtyper.Type | null = null
	// 	let name: string | null = this.maybeNameOfDeclaration(decl)
	// 	if(Tsc.isClassDeclaration(decl)){
	// 		type = this.fail("Class types are not supported: ", decl)
	// 	} else if(Tsc.isTypeParameterDeclaration(decl)){
	// 		return // or can I do something good here?
	// 	} else if(Tsc.isEnumDeclaration(decl)){
	// 		// TODO
	// 		this.fail("Enum types are not supported, at least yet: ", decl)
	// 		return
	// 	} else if(Tsc.isInterfaceDeclaration(decl)){
	// 		type = this.describeInterface(decl)
	// 	} else if(Tsc.isTypeAliasDeclaration(decl)){
	// 		type = this.describeAlias(decl)
	// 	}

	// 	if(type && name){
	// 		this.typeMap.maybeAdd(name, type)
	// 		if(type.type !== "illegal"){
	// 			this.findAndRecursivelyDescribeAllReferenceTypesIn(decl)
	// 		}
	// 	}
	// 	this.fail("Can't understand type of declaration: ", decl)
	// }

	// private findAndRecursivelyDescribeAllReferenceTypesIn(node: Tsc.Node): void {
	// 	let visit = (node: Tsc.Node) => {
	// 		let symbol: Tsc.Symbol | undefined
	// 		if(Tsc.isTypeReferenceNode(node)){
	// 			symbol = this.tricks.checker.getSymbolAtLocation(node.typeName)
	// 		} else if(Tsc.isExpressionWithTypeArguments(node)){
	// 			symbol = this.tricks.checker.getSymbolAtLocation(node.expression)
	// 		} else {
	// 			Tsc.visitEachChild(node, visit, this.tricks.transformContext)
	// 			return node
	// 		}
	// 		if(!symbol){
	// 			this.fail("No symbol for ", node)
	// 			return node
	// 		}
	// 		let decls = symbol.getDeclarations() || []
	// 		if(decls.length < 0){
	// 			this.fail("No declarations of ", node)
	// 			return node
	// 		}
	// 		if(decls.length > 1){
	// 			this.fail("More than one declaration of ", node)
	// 			return node
	// 		}

	// 		this.describeExternalDeclarationRecursively(decls[0]!)
	// 		return node
	// 	}

	// 	visit(node)
	// }

	private processExternalTypeDecls(node: Tsc.NodeWithTypeArguments, decls: Tsc.Declaration[], symbol: Tsc.Symbol): Runtyper.Type | null {
		let isTypeFromPackage = !!decls.find(decl => this.tricks.isInNodeModules(decl))

		if(!isTypeFromPackage){
			return null
		}

		let decl = decls[0]!
		let packageName = this.tricks.getPackageName(decl)
		let name = symbol.getName()
		if((name === "Array" || name === "ReadonlyArray") && packageName === "typescript"){
			let valueType = (node.typeArguments || [])[0]
			if(!valueType){
				return this.fail("Array must have type argument: ", node)
			}
			return {type: "array", valueType: this.describeType(valueType)}
		}

		// It's just tedious, and I don't see much profit from it right now
		// maybe later
		return this.fail("References to most of external types are not supported (yet): ", node)

		// if(decls.length > 1){
		// 	return this.fail("Multiple declarations not supported: ", node)
		// }

		// if(this.params.litRefPacks.has(packageName)){
		// 	this.describeExternalDeclarationRecursively(decl)
		// 	return this.describeReferencedDeclarationType(node, decl)
		// } else if(this.params.refRefPacks.has(packageName)){
		// 	return this.describeReferencedDeclarationType(node, decl)
		// }

		// return this.fail("Library value cannot/won't be converted to type description: ", node)
	}

	private describeKeyofType(node: Tsc.TypeOperatorNode): Runtyper.Type {
		return {type: "keyof", target: this.describeType(node.type)}
	}

	private describeIndexAccessType(node: Tsc.IndexedAccessTypeNode): Runtyper.Type {
		return {
			type: "index_access",
			index: this.describeType(node.indexType),
			object: this.describeType(node.objectType)
		}
	}

	private describeMappedType(node: Tsc.MappedTypeNode): Runtyper.Type {
		let keyType = node.typeParameter.constraint
		if(!keyType){
			return this.fail("Cannot describe mapped type: key is not constrained: ", node)
		}

		let valueType = node.type
		if(!valueType){
			return this.fail("Cannot describe mapped type: no value type: ", node)
		}

		return {
			type: "mapped_type",
			keyName: node.typeParameter.name.text,
			keyType: this.describeType(keyType),
			valueType: this.describeType(valueType),
			...(node.questionToken ? {optional: true} : {})
		}
	}

	private describeTypeofType(node: Tsc.TypeQueryNode): Runtyper.Type {
		let symbol = this.tricks.checker.getSymbolAtLocation(node.exprName)
		if(!symbol){
			return this.fail("No symbol found for typeof target: ", node)
		}

		let decls = symbol.getDeclarations() || []
		if(decls.length < 1){
			return this.fail("Symbol of typeof target has no declarations: ", node)
		} else if(decls.length > 1){
			return this.fail("Symbol of typeof target has more than one declaration, this is not supported: ", node)
		}
		let decl = decls[0]!

		if(!Tsc.isVariableDeclaration(decl) && !Tsc.isBindingElement(decl) && !Tsc.isPropertyDeclaration(decl) && !Tsc.isParameterPropertyDeclaration(decl, decl.parent)){
			return this.fail("Cannot understand type of typeof target declaration: ", node)
		}

		return {type: "value_reference", name: this.nameOfNode(decl.name)}
	}

	private describeConditionalTypeNode(node: Tsc.ConditionalTypeNode): Runtyper.Type {
		return {
			type: "conditional",
			checkType: this.describeType(node.checkType),
			extendsType: this.describeType(node.extendsType),
			trueType: this.describeType(node.trueType),
			falseType: this.describeType(node.falseType)
		}
	}
}
import {Runtyper} from "entrypoint"
import {FunctionNameMap, StringNodeableUniqMap} from "transformer/nodeable_uniq_map"
import {RuntyperTricks} from "transformer/tricks"
import {TypedVariable, TypeNodeDescriber} from "transformer/type_node_describer"
import * as Tsc from "typescript"
import {murmurHash} from "utils/murmur"

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TransParams extends Runtyper.TransformerParameters {
	allowedExtPacks: Set<string>
}

export class Transformer {

	constructor(private readonly tricks: RuntyperTricks,
		private readonly params: TransParams
	) {}

	transform(file: Tsc.SourceFile): Tsc.SourceFile {
		return this.addTypeStructures(file)
	}

	private typeOfGenericArg(node: Tsc.CallExpression, scope: TransformationScope): Runtyper.Type {
		let genArg = (node.typeArguments || [])[0]
		if(!genArg){
			throw new Error("This call expected to always have one explicit type argument: " + node.getText())
		}

		return scope.describer.describeType(genArg)
	}

	private makeAttachValidatorCall(baseCall: Tsc.CallExpression, fullName: boolean, scope: TransformationScope): Tsc.CallExpression {
		let type = this.typeOfGenericArg(baseCall, scope)
		let validatorFnArg = baseCall.arguments[0]
		if(!validatorFnArg){
			throw new Error("attachValidator() function called without argument! That's not allowed.")
		}
		let f = Tsc.factory
		scope.forceImport = true
		return f.createCallExpression(
			f.createPropertyAccessExpression(
				f.createPropertyAccessExpression(
					f.createPropertyAccessExpression(
						f.createIdentifier(this.params.moduleIdentifier),
						f.createIdentifier("Runtyper")
					),
					f.createIdentifier("internal")
				),
				f.createIdentifier("attachValidator")
			),
			undefined,
			[
				this.tricks.createLiteralOfValue(type),
				fullName ? f.createTrue() : f.createFalse(),
				validatorFnArg
			]
		)
	}

	private substituteSpecialFunctions(root: Tsc.Node, scope: TransformationScope): Tsc.Node {

		let visitor = (node: Tsc.Node): Tsc.Node => {
			if(Tsc.isCallExpression(node)){
				try {
					scope.describer.currentNode = node
					let type = this.tricks.checker.getTypeAtLocation(node)
					if(this.tricks.typeHasMarker(type, "RUNTYPER_THIS_IS_MARKER_INTERFACE_FOR_TYPE_INSTANCE")){
						let typeStructure: Runtyper.Type
						let genArg = (node.typeArguments || [])[0]
						if(!genArg){
							typeStructure = scope.describer.fail("Cannot describe type for query: no generic argument: ", node)
						} else {
							typeStructure = scope.describer.describeType(genArg)
						}
						return this.tricks.createLiteralOfValue(typeStructure)
					} else if(this.tricks.typeHasMarker(type, "RUNTYPER_THIS_IS_MARKER_INTERFACE_FOR_ATTACH_VALIDATOR")){
						return this.makeAttachValidatorCall(node, false, scope)
					} else if(this.tricks.typeHasMarker(type, "RUNTYPER_THIS_IS_MARKER_INTERFACE_FOR_ATTACH_VALIDATOR_GENERIC")){
						return this.makeAttachValidatorCall(node, true, scope)
					}
				} finally {
					scope.describer.currentNode = null
				}
			}

			return Tsc.visitEachChild(node, visitor, this.tricks.transformContext)
		}

		return Tsc.visitEachChild(root, visitor, this.tricks.transformContext)
	}

	private addTypeStructures(file: Tsc.SourceFile): Tsc.SourceFile {
		try {

			return this.forEachNodeScoped(file,
				(root, parentScope) => new TransformationScope(
					root,
					parentScope,
					this.tricks,
					file,
					this.params
				),
				(scope, root, parentScope) => {
					if(Tsc.isSourceFile(root)){
						return this.attachTypesToFile(root, scope)
					} else if(Tsc.isModuleBlock(root)){
						if(parentScope){
							parentScope.forceImport = parentScope.forceImport || scope.functionsByName.size > 0
						}
						let fnNode = scope.functionsByName.toNode(this.tricks, this.params.moduleIdentifier)
						return !fnNode ? root : Tsc.factory.updateModuleBlock(root, [
							...root.statements,
							fnNode
						])
					} else {
						throw new Error("Scope wrapper is not file or module, wtf?")
					}
				},
				(node, scope) => {
					try {
						scope.describer.currentNode = node
						node = this.substituteSpecialFunctions(node, scope)
						this.updateScope(node, scope)
					} finally {
						scope.describer.currentNode = null
					}
					return node
				}
			)

		} catch(e){
			if(e instanceof Error){
				console.error(e.stack || e.message)
			}
			throw e
		}
	}

	/** Add information about node structure to scope if applicable */
	private updateScope(node: Tsc.Node, scope: TransformationScope): void {
		if(Tsc.isInterfaceDeclaration(node)){
			let type = scope.describer.describeInterface(node)
			scope.refTypes.add(scope.describer.nameOfNode(node), type)
		} else if(Tsc.isTypeAliasDeclaration(node)){
			let type = scope.describer.describeAlias(node)
			scope.refTypes.add(scope.describer.nameOfNode(node), type)
		} else if(Tsc.isEnumDeclaration(node)){
			let type = scope.describer.describeEnum(node)
			scope.refTypes.add(scope.describer.nameOfNode(node.name), type)
		} else if(Tsc.isVariableStatement(node)){
			let vars = scope.describer.describeVariables(node)
			scope.addVariables(vars)
		} else if(Tsc.isFunctionDeclaration(node)){
			let signature = scope.describer.describeCallSignature(node)
			scope.addFunctionSignature(this.tricks.functionDeclName(node), signature)
		} else if(Tsc.isClassDeclaration(node)){
			let {cls, methods, variables} = scope.describer.describeClass(node)
			if(!node.name){
				let name = scope.describer.nameOfNode(node)
				scope.valueTypes.add(name, scope.describer.fail("Class does not have a name! Cannot describe: ", node))
			} else {
				let clsFullName = scope.describer.nameOfNode(node.name)
				scope.valueTypes.add(clsFullName, cls)
				scope.addValueToFunctions(clsFullName, node.name)
				scope.addVariables(variables)

				methods.forEach(fn => {
					scope.addFunctionSignature(fn.name, fn.signature)
				})
			}
		}
	}

	private attachTypesToFile(file: Tsc.SourceFile, scope: TransformationScope): Tsc.SourceFile {
		let maps = [scope.refTypes, scope.valueTypes, scope.functionsByName]
		let forceImport = scope.forceImport

		let dataNodes = [] as Tsc.Statement[]
		maps.forEach(map => {
			let node = map.toNode(this.tricks, this.params.moduleIdentifier)
			if(node){
				dataNodes.push(node)
			}
		})

		let importNodes = [] as Tsc.ImportDeclaration[]
		for(let [modSpec, identifier] of scope.imports){
			let factory = Tsc.factory
			importNodes.push(factory.createImportDeclaration(undefined, undefined,
				factory.createImportClause(
					false, undefined, factory.createNamespaceImport(identifier)
				),
				factory.createStringLiteral(modSpec),
				undefined
			))
		}


		if(dataNodes.length < 1 && importNodes.length < 1 && !forceImport){
			return file
		}

		let imprt = Tsc.factory.createImportDeclaration(undefined, undefined,
			Tsc.factory.createImportClause(false, undefined,
				Tsc.factory.createNamespaceImport(Tsc.factory.createIdentifier(this.params.moduleIdentifier))
			), Tsc.factory.createStringLiteral(this.params.moduleName), undefined
		)

		return Tsc.factory.updateSourceFile(file,
			[
				imprt,
				...importNodes,
				...file.statements,
				...dataNodes
			]
		)
	}

	/** Iterate over all scopes in file and run a callback for each node in scope.
	 * Scope = namespaces or toplevel (files) */
	private forEachNodeScoped<T extends Tsc.SourceFile | Tsc.ModuleBlock>(scopeRoot: T,
		openScope: (root: Tsc.SourceFile | Tsc.ModuleBlock, parentScope: TransformationScope | null) => TransformationScope,
		closeScope: (scope: TransformationScope, updatedRoot: Tsc.SourceFile | Tsc.ModuleBlock, parentScope: TransformationScope | null) => Tsc.SourceFile | Tsc.ModuleBlock,
		callback: (node: Tsc.Node, scope: TransformationScope) => Tsc.Node,
		parentScope: TransformationScope | null = null): T {

		let scope = openScope(scopeRoot, parentScope)

		let updatedRoot = Tsc.visitEachChild(scopeRoot, node => {
			if(Tsc.isModuleDeclaration(node)){
				return Tsc.visitEachChild(node, node => {
					if(Tsc.isModuleBlock(node)){
						return this.forEachNodeScoped(node, openScope, closeScope, callback, scope)
					} else {
						return node
					}
				}, this.tricks.transformContext)
			} else {
				return callback(node, scope)
			}
		}, this.tricks.transformContext)
		return closeScope(scope, updatedRoot, parentScope) as T // just trust the callback
	}

}

/** An object that hold information about types in current scope */
export class TransformationScope {

	public valueTypes: StringNodeableUniqMap<Runtyper.Type>
	public refTypes: StringNodeableUniqMap<Runtyper.Type>
	public functionsByName: FunctionNameMap = new FunctionNameMap("f")
	public imports: Map<string, Tsc.Identifier>
	public forceImport = false
	public readonly describer: TypeNodeDescriber

	constructor(
		public scopeRoot: Tsc.SourceFile | Tsc.ModuleBlock,
		parentScope: TransformationScope | null,
		public tricks: RuntyperTricks,
		public file: Tsc.SourceFile,
		public readonly params: TransParams) {

		this.refTypes = parentScope ? parentScope.refTypes : new StringNodeableUniqMap<Runtyper.Type>("t")
		this.imports = parentScope ? parentScope.imports : new Map()
		this.valueTypes = parentScope?.valueTypes || new StringNodeableUniqMap<Runtyper.Type>("v")
		this.describer = new TypeNodeDescriber(this.tricks, this.file, this.params, this)
	}

	addFunctionSignature(nameNode: Tsc.Node, signature: Runtyper.CallSignature): void {

		let name = this.describer.nameOfNode(nameNode)

		let funcDecl = this.valueTypes.get(name)
		if(!funcDecl){
			funcDecl = {type: "function", signatures: []}
		} else {
			switch(funcDecl.type){
				case "broken": return
				case "function": break
				default: throw new Error("Function named " + name + " is also non-function: " + funcDecl.type)
			}
		}
		this.valueTypes.addMaybeOverwrite(name, {
			...funcDecl,
			signatures: [...funcDecl.signatures, signature]
		})

		if(signature.hasImplementation){
			this.addValueToFunctions(name, nameNode)
		}
	}

	private isExportedFromScope(node: Tsc.Node): boolean {
		if(node.parent === this.scopeRoot){
			return this.tricks.isNodeExported(node)
		} else if(node.parent){
			return this.isExportedFromScope(node.parent)
		} else {
			return false // o_O
		}
	}

	addValueExpressionToFunctions(name: string, node: Tsc.Expression): void {
		this.functionsByName.add(name, node)
	}

	addImportedValueToFunctions(name: string, node: Tsc.Node): void {
		let moduleName = this.tricks.getModuleNameForImport(node)
		if(!moduleName){
			this.addValueToFunctions(name, node, undefined, true)
			return
		}

		let moduleIdentifier = this.imports.get(moduleName)
		if(!moduleIdentifier){
			let safeModuleName = moduleName.replace(/[^a-zA-Z\d_]/g, "_").replace(/_{2,}/g, "_")
			let identifierText = this.params.moduleIdentifier + "_" + safeModuleName + "_" + murmurHash(moduleName, 31337)
			moduleIdentifier = Tsc.factory.createIdentifier(identifierText)
			this.imports.set(moduleName, moduleIdentifier)
		}

		this.addValueToFunctions(name, node, moduleIdentifier, true)
	}

	addValueToFunctions(name: string, node: Tsc.Node, prefix?: Tsc.Identifier, canBeDuplicate = false): void {
		let exported = this.isExportedFromScope(node)
		let limiter = exported ? this.scopeRoot.parent?.parent : this.scopeRoot
		let path = this.tricks.getPathToNodeUpToLimit(node, x => x === limiter)
		if(prefix){
			path = [prefix, ...path]
		}
		if(canBeDuplicate){
			this.functionsByName.maybeAdd(name, path)
		} else {
			this.functionsByName.add(name, path)
		}
	}

	addVariables(variables: TypedVariable[]): void {
		variables.forEach(v => {
			let name = this.describer.nameOfNode(v.name)
			this.valueTypes.add(name, v.type)
			this.addValueToFunctions(name, v.name)
		})
	}

}
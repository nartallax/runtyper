import {Runtyper} from "entrypoint"
import {FunctionNameMap, StringNodeableUniqMap} from "transformer/nodeable_uniq_map"
import {RuntyperTricks} from "transformer/tricks"
import {TypedVariable, TypeNodeDescriber} from "transformer/type_node_describer"
import * as Tsc from "typescript"

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TransParams extends Runtyper.TransformerParameters {
	// litRefPacks: Set<string>
	// refRefPacks: Set<string>
}

export class Transformer {

	constructor(private readonly tricks: RuntyperTricks,
		private readonly params: TransParams
	) {}

	transform(file: Tsc.SourceFile): Tsc.SourceFile {
		file = this.addTypeStructures(file)
		file = this.substituteSpecialFunctions(file)
		return file
	}

	private substituteSpecialFunctions(file: Tsc.SourceFile): Tsc.SourceFile {
		let typeDescriber = new TypeNodeDescriber(this.tricks, file)

		let visitor = (node: Tsc.Node): Tsc.Node => {
			if(!Tsc.isCallExpression(node)){
				return Tsc.visitEachChild(node, visitor, this.tricks.transformContext)
			}
			try {
				typeDescriber.currentNode = node
				let type = this.tricks.checker.getTypeAtLocation(node)
				if(this.tricks.typeHasMarker(type, "RUNTYPER_THIS_IS_MARKER_INTERFACE_FOR_TYPE_INSTANCE")){
					let typeStructure: Runtyper.Type
					let genArg = (node.typeArguments || [])[0]
					if(!genArg){
						typeStructure = typeDescriber.fail("Cannot describe type for query: no generic argument: ", node)
					} else {
						typeStructure = typeDescriber.describeType(genArg)
					}
					return this.tricks.createLiteralOfValue(typeStructure)
				}

				return node
			} finally {
				typeDescriber.currentNode = null
			}
		}

		return Tsc.visitEachChild(file, visitor, this.tricks.transformContext)
	}

	private addTypeStructures(file: Tsc.SourceFile): Tsc.SourceFile {
		try {

			let typeNodeDescriber = new TypeNodeDescriber(this.tricks, file)

			return this.forEachNodeScoped(file,
				(root, parentScope) => new Scope(
					root,
					parentScope,
					this.tricks,
					typeNodeDescriber
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
	private updateScope(node: Tsc.Node, scope: Scope): void {
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
				let path = this.tricks.getPathToNodeUpToLimit(node.name, x => x === scope.pathLimiter)
				scope.functionsByName.add(clsFullName, path)

				scope.addVariables(variables)

				methods.forEach(fn => {
					scope.addFunctionSignature(fn.name, fn.signature)
				})
			}
		}
	}

	private attachTypesToFile(file: Tsc.SourceFile, scope: Scope): Tsc.SourceFile {
		let maps = [scope.refTypes, scope.valueTypes, scope.functionsByName]
		let forceImport = scope.forceImport
		let nodes = [] as Tsc.Statement[]
		maps.forEach(map => {
			let node = map.toNode(this.tricks, this.params.moduleIdentifier)
			if(node){
				nodes.push(node)
			}
		})
		if(nodes.length < 1 && !forceImport){
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
				...file.statements,
				...nodes
			]
		)
	}

	/** Iterate over all scopes in file and run a callback for each node in scope.
	 * Scope = namespaces or toplevel (files) */
	private forEachNodeScoped<T extends Tsc.SourceFile | Tsc.ModuleBlock>(scopeRoot: T,
		openScope: (root: Tsc.SourceFile | Tsc.ModuleBlock, parentScope: Scope | null) => Scope,
		closeScope: (scope: Scope, updatedRoot: Tsc.SourceFile | Tsc.ModuleBlock, parentScope: Scope | null) => Tsc.SourceFile | Tsc.ModuleBlock,
		callback: (node: Tsc.Node, scope: Scope) => Tsc.Node,
		parentScope: Scope | null = null): T {

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
class Scope {

	public refTypes: StringNodeableUniqMap<Runtyper.Type>
	public valueTypes: StringNodeableUniqMap<Runtyper.Type>
	public functionsByName: FunctionNameMap = new FunctionNameMap("f")
	public forceImport = false

	constructor(
		public scopeRoot: Tsc.Node,
		parentScope: Scope | null,
		public tricks: RuntyperTricks,
		public describer: TypeNodeDescriber) {

		this.refTypes = parentScope?.refTypes || new StringNodeableUniqMap<Runtyper.Type>("t")
		this.valueTypes = parentScope?.valueTypes || new StringNodeableUniqMap<Runtyper.Type>("v")
	}


	addFunctionSignature(nameNode: Tsc.Node, signature: Runtyper.CallSignature) {

		let name = this.describer.nameOfNode(nameNode)

		let funcDecl = this.valueTypes.get(name)
		if(!funcDecl){
			funcDecl = {type: "function", signatures: []}
		} else {
			switch(funcDecl.type){
				case "illegal": return
				case "function": break
				default: throw new Error("Function named " + name + " is also non-function: " + funcDecl.type)
			}
		}
		this.valueTypes.addMaybeOverwrite(name, {
			...funcDecl,
			signatures: [...funcDecl.signatures, signature]
		})

		if(signature.hasImplementation){
			let path = this.tricks.getPathToNodeUpToLimit(nameNode, x => x === this.pathLimiter)
			this.functionsByName.add(name, path)
		}
	}

	get pathLimiter(): Tsc.Node | undefined {
		return this.scopeRoot.parent?.parent
	}

	addVariables(variables: TypedVariable[]) {
		variables.forEach(v => {
			let name = this.describer.nameOfNode(v.name)
			this.valueTypes.add(name, v.type)
			let path = this.tricks.getPathToNodeUpToLimit(v.name, x => x === this.pathLimiter)
			this.functionsByName.add(name, path)
		})
	}

}
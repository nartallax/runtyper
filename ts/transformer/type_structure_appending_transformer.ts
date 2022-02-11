import {Runtyper} from "entrypoint"
import {FunctionNameMap, StringNodeableUniqMap} from "transformer/nodeable_uniq_map"
import {TransParams} from "transformer/toplevel_transformer"
import {RuntyperTricks} from "transformer/tricks"
import {TypedVariable, TypeNodeDescriber} from "transformer/type_node_describer"
import * as Tsc from "typescript"

/** Transformer that collects all the types in file and appends their structure to the end of it */
export class TypeStructureAppendingTransformer {

	constructor(private readonly tricks: RuntyperTricks,
		private readonly params: TransParams
	) {}

	/** Iterate over two nodes children simultaneously, implying they have same structure
	 * @param destinationFile file that receives new nodes
	 * @param referenceFile file that is used as main source of nodes to iterate over */
	private walkTwoNodes<T extends Tsc.Node>(destination: T, reference: T, callback: (destination: Tsc.Node, reference: Tsc.Node) => Tsc.Node): T {
		let index = 0

		let refNodes = [] as Tsc.Node[]

		Tsc.visitEachChild(reference, refNode => {
			refNodes.push(refNode)
			return refNode
		}, this.tricks.transformContext)

		return Tsc.visitEachChild(destination, desNode => {
			let refNode = refNodes[index++]
			if(!refNode){
				throw new Error("Reference and source AST trees don't match: no reference tree node for destination node " + desNode.getText())
			} else if(refNode.kind !== desNode.kind){
				throw new Error("Reference and source AST trees don't match: different kinds of nodes (" + Tsc.SyntaxKind[desNode.kind] + " vs " + Tsc.SyntaxKind[refNode.kind] + ") for destination node " + desNode.getText() + " vs " + refNode.getText())
			}
			return callback(desNode, refNode)
		}, this.tricks.transformContext)
	}

	/** Iterate over all scopes in file and run a callback for each node in scope.
	 * Scope = namespaces or toplevel (files) */
	private forEachNodeScoped<T extends Tsc.SourceFile | Tsc.ModuleBlock>(dest: T, ref: T,
		openScope: (refNode: Tsc.SourceFile | Tsc.ModuleBlock, parentScope: Scope | null) => Scope,
		closeScope: (scope: Scope, updatedDest: Tsc.SourceFile | Tsc.ModuleBlock, parentScope: Scope | null) => Tsc.SourceFile | Tsc.ModuleBlock,
		callback: (destNode: Tsc.Node, refNode: Tsc.Node, scope: Scope) => Tsc.Node,
		parentScope: Scope | null = null): T {

		let scope = openScope(ref, parentScope)
		let updatedDest = this.walkTwoNodes(dest, ref, (destNode, refNode) => {
			if(Tsc.isModuleDeclaration(destNode)){
				return this.walkTwoNodes(destNode, refNode, (destNode, refNode) => {
					if(Tsc.isModuleBlock(destNode) && Tsc.isModuleBlock(refNode)){
						return this.forEachNodeScoped(destNode, refNode, openScope, closeScope, callback, scope)
					} else {
						return destNode
					}
				})
			} else {
				return callback(destNode, refNode, scope)
			}
		})
		return closeScope(scope, updatedDest, parentScope) as T // just trust the callback
	}

	transform(actualFile: Tsc.SourceFile, sourceFile: Tsc.SourceFile): Tsc.SourceFile {
		let typeNodeDescriber = new TypeNodeDescriber(this.tricks, this.params, sourceFile, actualFile)

		return this.forEachNodeScoped(sourceFile, actualFile,
			(ref, parentScope) => new Scope(
				ref,
				parentScope?.refTypes || new StringNodeableUniqMap<Runtyper.TypeDeclaration>("refTypes"),
				parentScope?.valueTypes || new StringNodeableUniqMap<Runtyper.Type>("valueTypes"),
				new FunctionNameMap("functionsByName"), // always new
				parentScope?.forceImport ?? false,
				this.tricks,
				typeNodeDescriber
			),
			(scope, dest, parentScope) => {
				if(Tsc.isSourceFile(dest)){
					return this.attachTypesToFile(dest, scope)
				} else if(Tsc.isModuleBlock(dest)){
					if(parentScope){
						parentScope.forceImport = parentScope.forceImport || scope.functionsByName.size > 0
					}
					let result = Tsc.factory.updateModuleBlock(dest, [
						...dest.statements,
						...scope.functionsByName.toNodes(this.tricks, this.params.moduleIdentifier)
					])
					return result
				} else {
					throw new Error("Scope wrapper is not file or module, wtf?")
				}
			},
			(destNode, refNode, scope) => {
				this.updateScope(refNode, scope)
				return destNode
			}
		)
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
			let signature = scope.describer.describeMethodOrFunction(node)
			if(!node.name){
				throw new Error("Function declaration without name! How is this possible? " + node.getText())
			}
			let name = scope.describer.nameOfNode(node.name)
			scope.addFunctionSignature(name, signature)
			if(signature.hasImplementation){
				let path = this.tricks.getPathToNodeUpToLimit(node.name, x => x === scope.pathLimiter)
				scope.functionsByName.add(name, path)
			}
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
					let fnFullName = scope.describer.nameOfNode(fn.name)
					scope.addFunctionSignature(fnFullName, fn.signature)
					if(fn.hasImpl){
						let path = this.tricks.getPathToNodeUpToLimit(fn.name, x => x === scope.pathLimiter)
						// TODO: tricky names in method identifier
						scope.functionsByName.add(fnFullName, path)
					}
				})
			}
		}
	}

	private attachTypesToFile(file: Tsc.SourceFile, scope: Scope): Tsc.SourceFile {
		let maps = [scope.refTypes, scope.valueTypes, scope.functionsByName]
		let forceImport = scope.forceImport
		let nodes = [] as Tsc.Statement[]
		maps.forEach(map => nodes.push(...map.toNodes(this.tricks, this.params.moduleIdentifier)))
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

}



/** An object that hold information about types in current scope */
class Scope {
	constructor(
		public ref: Tsc.Node,
		public refTypes: StringNodeableUniqMap<Runtyper.TypeDeclaration>,
		public valueTypes: StringNodeableUniqMap<Runtyper.Type>,
		public functionsByName: FunctionNameMap,
		public forceImport: boolean,
		public tricks: RuntyperTricks,
		public describer: TypeNodeDescriber) {}


	addFunctionSignature(name: string, signature: Runtyper.CallSignature) {
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
	}

	get pathLimiter(): Tsc.Node | undefined {
		return this.ref.parent?.parent
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
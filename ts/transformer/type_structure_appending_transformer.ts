import {Runtyper} from "entrypoint"
import {FunctionNameMap, NodeableUniqMap, StringNodeableUniqMap} from "transformer/nodeable_uniq_map"
import {TransParams} from "transformer/toplevel_transformer"
import {RuntyperTricks} from "transformer/tricks"
import {TypedVariable, TypeNodeDescriber} from "transformer/type_node_describer"
import * as Tsc from "typescript"

/** Transformer that collects all the types in file and appends their structure to the end of it */
export class TypeStructureAppendingTransformer {

	constructor(private readonly tricks: RuntyperTricks,
		private readonly params: TransParams
	) {}

	transform(actualFile: Tsc.SourceFile, sourceFile: Tsc.SourceFile): Tsc.SourceFile {
		let refTypes = new StringNodeableUniqMap<Runtyper.TypeDeclaration>("refTypes")
		let valueTypes = new StringNodeableUniqMap<Runtyper.Type>("valueTypes")
		const functionsByNameVarName = "functionsByName"
		let rootFunctionsByName = new FunctionNameMap(functionsByNameVarName)
		let forceImport = false

		let typeNodeDescriber = new TypeNodeDescriber(this.tricks, this.params, sourceFile, actualFile)

		function addFunctionSignature(name: string, signature: Runtyper.CallSignature) {
			let funcDecl = valueTypes.get(name)
			if(!funcDecl){
				funcDecl = {type: "function", signatures: []}
			} else {
				switch(funcDecl.type){
					case "illegal": return
					case "function": break
					default: throw new Error("Function named " + name + " is also non-function: " + funcDecl.type)
				}
			}
			valueTypes.addMaybeOverwrite(name, {
				...funcDecl,
				signatures: [...funcDecl.signatures, signature]
			})
		}

		let visitor = (node: Tsc.Node, currentRoot: Tsc.Node, functionsByName: FunctionNameMap): Tsc.VisitResult<Tsc.Node> => {

			if(Tsc.isModuleDeclaration(node)){
				let newFunctionsByName = new FunctionNameMap(functionsByNameVarName)
				return Tsc.visitEachChild(node, node => {
					if(Tsc.isModuleBlock(node)){
						Tsc.visitEachChild(
							node,
							subnode => visitor(subnode, node, newFunctionsByName),
							this.tricks.transformContext
						)
						forceImport = forceImport || newFunctionsByName.size > 0
						return Tsc.factory.updateModuleBlock(node, [
							...node.statements,
							...newFunctionsByName.toNodes(this.tricks, this.params.moduleIdentifier)
						])
					} else {
						return node
					}
				}, this.tricks.transformContext)
			}

			let addVariables = (variables: TypedVariable[]) => {
				variables.forEach(v => {
					let name = typeNodeDescriber.nameOfNode(v.name)
					valueTypes.add(name, v.type)
					let path = this.tricks.getPathToNodeUpToLimit(v.name, x => x === currentRoot)
					functionsByName.add(name, path)
				})
			}

			if(Tsc.isInterfaceDeclaration(node)){
				let type = typeNodeDescriber.describeInterface(node)
				refTypes.add(typeNodeDescriber.nameOfNode(node), type)
			} else if(Tsc.isTypeAliasDeclaration(node)){
				let type = typeNodeDescriber.describeAlias(node)
				refTypes.add(typeNodeDescriber.nameOfNode(node), type)
			} else if(Tsc.isEnumDeclaration(node)){
				let type = typeNodeDescriber.describeEnum(node)
				refTypes.add(typeNodeDescriber.nameOfNode(node.name), type)
			} else if(Tsc.isVariableStatement(node)){
				let vars = typeNodeDescriber.describeVariables(node)
				addVariables(vars)
			} else if(Tsc.isFunctionDeclaration(node)){
				let signature = typeNodeDescriber.describeMethodOrFunction(node)
				if(!node.name){
					throw new Error("Function declaration without name! How is this possible? " + node.getText())
				}
				let name = typeNodeDescriber.nameOfNode(node.name)
				addFunctionSignature(name, signature)
				if(signature.hasImplementation){
					let path = this.tricks.getPathToNodeUpToLimit(node.name, x => x === currentRoot)
					functionsByName.add(name, path)
				}
			} else if(Tsc.isClassDeclaration(node)){
				let {cls, methods, variables} = typeNodeDescriber.describeClass(node)
				if(!node.name){
					let name = typeNodeDescriber.nameOfNode(node)
					valueTypes.add(name, typeNodeDescriber.fail("Class does not have a name! Cannot describe: ", node))
				} else {
					let clsFullName = typeNodeDescriber.nameOfNode(node.name)
					valueTypes.add(clsFullName, cls)
					let path = this.tricks.getPathToNodeUpToLimit(node.name, x => x === currentRoot)
					functionsByName.add(clsFullName, path)

					addVariables(variables)

					methods.forEach(fn => {
						let fnFullName = typeNodeDescriber.nameOfNode(fn.name)
						addFunctionSignature(fnFullName, fn.signature)
						if(fn.hasImpl){
							let path = this.tricks.getPathToNodeUpToLimit(fn.name, x => x === currentRoot)
							// let tail = path.pop()!
							// path.push("prototype", tail)
							// TODO: tricky names in method identifier
							functionsByName.add(fnFullName, path)
						}
					})
				}
			}

			return node
		}

		Tsc.visitEachChild(actualFile, subnode => visitor(subnode, actualFile, rootFunctionsByName), this.tricks.transformContext)
		return this.attachTypesToFile(actualFile, [refTypes, valueTypes, rootFunctionsByName], forceImport)
	}

	private attachTypesToFile(file: Tsc.SourceFile, maps: NodeableUniqMap<unknown, unknown>[], forceImport: boolean): Tsc.SourceFile {
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
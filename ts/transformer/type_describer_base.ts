import {Runtyper} from "entrypoint"
import {TransParams} from "transformer/toplevel_transformer"
import {RuntyperTricks} from "transformer/tricks"
import * as Tsc from "typescript"

export abstract class TypeDescriberBase {

	private readonly sourceModuleName: string

	constructor(protected readonly tricks: RuntyperTricks,
		protected readonly params: TransParams,
		// file from which nodes that we will operate upon are originated
		// they can later be moved to other file, but we need this file for correct names
		protected readonly sourceFile: Tsc.SourceFile,
		// actual file that contains all this nodes
		protected readonly actualFile: Tsc.SourceFile,
		protected currentNode: Tsc.Node | null = null) {

		this.sourceModuleName = tricks.modulePathResolver.getCanonicalModuleName(sourceFile.fileName)
	}

	fail(message: string, failNode?: Tsc.Node, forceThrow = false): Runtyper.IllegalType {
		if(failNode){
			let nodeText: string
			try {
				nodeText = failNode.getText()
			} catch(e){
				nodeText = "<node text not available>"
			}
			message = message + nodeText + ` (of kind ${Tsc.SyntaxKind[failNode.kind]})`
		}
		let file: string
		if(this.sourceFile){
			file = this.sourceFile.fileName
			file = this.tricks.modulePathResolver.getCanonicalModuleName(file)
		} else {
			file = "<unknown>"
		}
		let node = this.currentNode?.getText() ?? "<unknown>"
		if(this.params.onTransformerTypeError === "throw" || forceThrow){
			let locationPostfix = ` (while processing node ${node} in file ${file})`
			throw new Error(message + locationPostfix)
		} else {
			return {
				type: "illegal",
				file, node, message
			}
		}
	}

	protected maybeNameOfDeclaration(decl: Tsc.Declaration): string | null {
		if(Tsc.isInterfaceDeclaration(decl) || Tsc.isTypeAliasDeclaration(decl) || Tsc.isClassDeclaration(decl) || Tsc.isIdentifier(decl)){
			return this.nameOfNode(decl)
		} else {
			return null
		}
	}

	nameOfNode(node: Tsc.Node): string {
		let ref = this.tricks.getReferenceToNode(node)
		let moduleName = node.getSourceFile() === this.actualFile ? this.sourceModuleName : ref.moduleName
		return this.nameOfModuleAndIdentifiers(moduleName, ref.nodePath)
	}

	protected nameOfModuleAndIdentifiers(moduleName: string, identifiers: Tsc.PropertyName[]): string {
		return moduleName + ":" + identifiers.map(x => this.tricks.propertyNameToString(x) || x.getText()).join(".")
	}

	protected wrapTypeExtraction<T>(node: Tsc.Node, action: () => T): T | Runtyper.IllegalType {
		this.currentNode = node
		try {
			return action()
		} catch(e){
			if(e instanceof Error){
				return this.fail(e.stack || e.message)
			} else {
				throw e
			}
		} finally {
			this.currentNode = null
		}
	}

}
import {Runtyper} from "entrypoint"
import {RuntyperTricks} from "transformer/tricks"
import * as Tsc from "typescript"

export abstract class TypeDescriberBase {

	private readonly sourceModuleName: string

	constructor(protected readonly tricks: RuntyperTricks,
		protected readonly file: Tsc.SourceFile,
		public currentNode: Tsc.Node | null = null) {

		this.sourceModuleName = tricks.modulePathResolver.getCanonicalModuleName(file.fileName)
	}

	fail(message: string, failNode?: Tsc.Node): Runtyper.IllegalType {
		if(failNode){
			let nodeText: string
			try {
				nodeText = failNode.getText()
			} catch(e){
				nodeText = "<node text not available>"
			}
			message = message + nodeText + ` (of kind ${Tsc.SyntaxKind[failNode.kind]})`
		}
		let file = this.sourceModuleName
		let node = this.currentNode?.getText() ?? "<unknown>"
		return {
			type: "illegal",
			file, node, message
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
		let moduleName = node.getSourceFile() === this.file ? this.sourceModuleName : ref.moduleName
		return this.nameOfModuleAndIdentifiers(moduleName, ref.nodePath)
	}

	protected nameOfModuleAndIdentifiers(moduleName: string, identifiers: Tsc.PropertyName[]): string {
		return moduleName + ":" + identifiers.map(x => this.tricks.propertyNameToString(x) || x.getText()).join(".")
	}

	protected wrapTypeExtraction<T>(action: () => T): T | Runtyper.IllegalType {
		try {
			return action()
		} catch(e){
			if(e instanceof Error){
				return this.fail(e.stack || e.message)
			} else {
				throw e
			}
		}
	}

}
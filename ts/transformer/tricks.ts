import type * as Tsc from "typescript"
import {NodeReference, ToolboxTransformer} from "@nartallax/toolbox-transformer"
import * as Path from "path"
import {Runtyper} from "entrypoint"

// utility functions the transformer use
// later I'll reloc most of them into tricks in toolbox

/** A single variable in destructuring pattern */
export interface DestructVariable {
	identifier: Tsc.Identifier
	rest?: boolean // like variable c in `let [a, b, ...c] = [1,2,3,4,5]`
	path: (string | number)[]
}

export class RuntyperTricks extends ToolboxTransformer.ToolboxTricks {
	constructor(toolboxContext: ToolboxTransformer.TransformerProjectContext, transformContext: Tsc.TransformationContext, tsc: typeof Tsc) {
		super(toolboxContext, transformContext, tsc)

	}

	/*
	stringLiteralContent(str: Tsc.StringLiteral | string): string {
		let text: string
		if(typeof(str) === "string"){
			text = str
		} else {
			try {
				text = str.getText()
				console.log("TEXT OF STRLIT: " + text + " (text = " + str.text + ")")
			} catch(e){
				console.log(str)
				throw e
			}
		}
		if(text.charAt(0) === "'"){
			text = text
				.substring(1, text.length - 1)
				.replace(/"/g, "\\\"")
			text = "\"" + text + "\""
		}
		return JSON.parse(text)
	}
	*/

	propertyNameToString(name: Tsc.PropertyName): string {
		if(this.tsc.isIdentifier(name) || this.tsc.isPrivateIdentifier(name)){
			return name.text
		} else if(this.tsc.isStringLiteral(name)){
			return name.text
		} else if(this.tsc.isNumericLiteral(name)){
			return name.text
		} else if(this.tsc.isComputedPropertyName(name)){
			if(this.tsc.isStringLiteral(name.expression)){
				return name.expression.text
			}
			throw new Error("Computed property name is not string constant, this is not allowed: " + name)
		} else {
			throw new Error("Cannot understand what this property name is: " + name)
		}
	}

	isInNodeModules(decl: Tsc.Declaration): boolean {
		let pathParts = decl.getSourceFile().fileName.split(Path.sep)
		return !!pathParts.find(x => x === "node_modules")
	}

	getPackageName(decl: Tsc.Declaration): string {
		let path = decl.getSourceFile().fileName
		let pathParts = path.split(Path.sep)
		for(let i = pathParts.length - 2; i >= 0; i--){
			if(pathParts[i] === "node_modules"){
				let part = pathParts[i + 1]!
				if(!part.startsWith("@")){
					return part
				}

				if(i === pathParts.length - 2){
					throw new Error("Cannot deduce NPM package name from file path: " + path + ": last part of path is a namespace, but nothing comes after it.")
				}
				return part + "/" + pathParts[i + 2]
			}
		}
		throw new Error("Cannot deduce NPM package name from file path: " + path + ": cannot find node_modules in path (or it is last part of path)")
	}

	extractVariablesFromDeclaration(el: Tsc.VariableDeclaration): DestructVariable[] {
		return this.extractVariablesFromBinding(el.name, [])
	}

	private extractVariablesFromBinding(el: Tsc.BindingName, currentPath: (string | number)[], rest?: boolean): DestructVariable[] {
		let result = [] as DestructVariable[]
		if(this.tsc.isIdentifier(el)){
			result.push({path: currentPath, identifier: el, rest})
		} else if(this.tsc.isObjectBindingPattern(el)){
			el.elements.forEach(el => {
				let pathPart: string
				if(el.propertyName){
					pathPart = this.propertyNameToString(el.propertyName)
				} else if(this.tsc.isIdentifier(el.name)){
					pathPart = el.name.text
				} else {
					throw new Error("Object binding pattern element does not have property name: " + el.getText())
				}
				result.push(...this.extractVariablesFromBinding(el.name, [...currentPath, pathPart]))
			})
		} else if(this.tsc.isArrayBindingPattern(el)){
			el.elements.forEach((el, i) => {
				if(this.tsc.isOmittedExpression(el)){
					return
				}
				result.push(...this.extractVariablesFromBinding(el.name, [...currentPath, i], !!el.dotDotDotToken))
			})
		} else {
			throw new Error("Name of variable is not identifier or binding pattern. Cannot understand what it is: " + el)
		}
		return result
	}

	printNodeTree(node: Tsc.Node, prefix = ""): void {
		let visitor: (node: Tsc.Node, offset: string) => Tsc.VisitResult<Tsc.Node> = (node, offset) => {
			console.error(prefix + "\t" + offset + (!node ? node + "" : this.tsc.SyntaxKind[node.kind]))
			return this.tsc.visitEachChild(node, node => visitor(node, offset + "\t"), this.transformContext)
		}

		visitor(node, "")
	}

	isNodeStatic(node: Tsc.Node): boolean {
		return this.nodeHasModifier(node, this.tsc.SyntaxKind.StaticKeyword)
	}

	isNodeDefault(node: Tsc.Node): boolean {
		return this.nodeHasModifier(node, this.tsc.SyntaxKind.DefaultKeyword)
	}

	isNodeReadonly(node: Tsc.Node): boolean {
		return this.nodeHasModifier(node, this.tsc.SyntaxKind.ReadonlyKeyword)
	}

	isNodePrivate(node: Tsc.Node): boolean {
		return this.nodeHasModifier(node, this.tsc.SyntaxKind.PrivateKeyword)
	}

	isNodeProtected(node: Tsc.Node): boolean {
		return this.nodeHasModifier(node, this.tsc.SyntaxKind.ProtectedKeyword)
	}

	isNodePublic(node: Tsc.Node): boolean {
		return this.nodeHasModifier(node, this.tsc.SyntaxKind.PublicKeyword)
	}

	nodeAccessLevel(node: Tsc.Node): Runtyper.AccessLevel {
		return this.isNodePrivate(node) ? "private" : this.isNodeProtected(node) ? "protected" : "public"
	}

	nodeHasAccessModifier(node: Tsc.Node): boolean {
		return this.isNodePublic(node) || this.isNodePrivate(node) || this.isNodeProtected(node)
	}

	/** Get path to node that describes its location
	 * Different from getReferenceToDeclaration - not only declarations supported, and also can be used for variables in functions, properties in classes etc */
	getReferenceToNode(node: Tsc.Node): NodeReference {
		let sourceFile = node.getSourceFile()
		let path = this.getPathToNodeUpToLimit(node, parent => parent === sourceFile)
		let moduleName = this.modulePathResolver.getCanonicalModuleName(sourceFile.fileName)
		return {moduleName, identifiers: path}
	}

	getPathToNodeUpToLimit(node: Tsc.Node, shouldStop: (parent: Tsc.Node) => boolean): string[] {
		let path = [] as string[]
		let isStaticField = false
		while(node && !shouldStop(node)){
			if(this.tsc.isVariableDeclaration(node)){
				if(this.tsc.isIdentifier(node.name)){
					// if declaration of class is put inside variable
					// the exported name will be not the name of class, but the name of the variable
					path.pop()
					path.push(node.name.text)
				}
			} else if(this.tsc.isModuleDeclaration(node) || this.tsc.isInterfaceDeclaration(node) || this.tsc.isTypeAliasDeclaration(node)){ // namespaces
				path.push(node.name.text)
			} else if(this.tsc.isClassDeclaration(node)){
				if(path.length > 0 && !isStaticField){
					path.push("prototype")
				}
				if(node.name){
					path.push(node.name.text)
				} else if(this.isNodeExported(node) && this.isNodeDefault(node)){
					path.push("default") // very special case
				}
			} else if(this.tsc.isFunctionDeclaration(node) || this.tsc.isFunctionExpression(node)){
				if(node.name){
					path.push(node.name.text)
				}
			} else if(this.tsc.isIdentifier(node)){
				path.push(node.text)
				// skipping the parent, because this identifier is probably the name, and we need to skip without adding it second time
				// we still need to add this identifier here, because parent may be destructurizing variable declaration, that has no clear name
				node = node.parent
				isStaticField = isStaticField || this.isNodeStatic(node)
			} else if(this.tsc.isPropertyDeclaration(node) || this.tsc.isMethodDeclaration(node)){
				isStaticField = isStaticField || this.isNodeStatic(node)
				path.push(this.propertyNameToString(node.name))
			}
			node = node.parent
		}
		return path.reverse()
	}

}
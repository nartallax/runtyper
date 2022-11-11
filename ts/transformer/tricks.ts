import type * as Tsc from "typescript"
import {ToolboxTransformer} from "@nartallax/toolbox-transformer"
import {Runtyper} from "entrypoint"
import {AmbientModuleCache} from "transformer/ambient_module_cache"

// utility functions the transformer use
// later I'll reloc most of them into tricks in toolbox

/** A single variable in destructuring pattern */
export interface DestructVariable {
	identifier: Tsc.PropertyName
	rest?: boolean // like variable c in `let [a, b, ...c] = [1,2,3,4,5]`
	path: (string | number)[]
}

export interface NodeReferenceByNodes {
	moduleName: string
	nodePath: Tsc.PropertyName[]
}

export class RuntyperTricks extends ToolboxTransformer.ToolboxTricks {

	constructor(toolboxContext: ToolboxTransformer.TransformerProjectContext, transformContext: Tsc.TransformationContext, tsc: typeof Tsc, readonly ambientModules: AmbientModuleCache) {
		super(toolboxContext, transformContext, tsc)
	}

	propertyNameToString(name: Tsc.PropertyName): string | null {
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
			return null
			// throw new Error("Computed property name is not string constant, this is not allowed: " + name.getText())
		} else {
			throw new Error("Cannot understand what this property name is: " + name)
		}
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
					if(!this.tsc.isIdentifier(el.propertyName)){
						result.push({path: currentPath, identifier: el.propertyName, rest})
						return
					}
					pathPart = el.propertyName.text
				} else if(this.tsc.isIdentifier(el.name)){
					pathPart = el.name.text
				} else {
					throw new Error("Nested binding pattern element does not have property name: " + el.getText())
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
	getReferenceToNode(node: Tsc.Node): NodeReferenceByNodes {
		let sourceFile = node.getSourceFile()
		let path = this.getPathToNodeUpToLimit(node, parent => parent === sourceFile)
		// process external modules here maybe?
		let moduleName = this.modulePathResolver.getCanonicalModuleName(sourceFile.fileName)
		return {moduleName, nodePath: path}
	}

	getPathToNodeUpToLimit(node: Tsc.Node, shouldStop: (parent: Tsc.Node) => boolean): Tsc.PropertyName[] {
		let path = [] as Tsc.PropertyName[]
		let isStaticField = false
		while(node && !shouldStop(node)){
			if(this.tsc.isVariableDeclaration(node) || this.tsc.isBindingElement(node)){
				if(this.tsc.isIdentifier(node.name)){
					// if declaration of class is put inside variable
					// the exported name will be not the name of class, but the name of the variable
					path.pop()
					path.push(node.name)
				}
			} else if(this.tsc.isModuleDeclaration(node)){
				if(node.flags & this.tsc.NodeFlags.GlobalAugmentation){
					break // the node we describing is in global scope, no reason to go further
				}
				if(this.tsc.isStringLiteral(node.name)){
					break // string literal module name = ambient module declaration; it's like toplevel wrapper
				}
				path.push(node.name)
			} else if(this.tsc.isInterfaceDeclaration(node) || this.tsc.isTypeAliasDeclaration(node) || this.tsc.isEnumDeclaration(node)){
				path.push(node.name)
			} else if(this.tsc.isClassDeclaration(node)){
				if(path.length > 0 && !isStaticField){
					path.push(this.tsc.factory.createIdentifier("prototype"))
				}
				if(node.name){
					path.push(node.name)
				} else if(this.isNodeExported(node) && this.isNodeDefault(node)){
					path.push(this.tsc.factory.createIdentifier("default")) // very special case
				}
			} else if(this.tsc.isFunctionDeclaration(node)){
				if(node.name){
					path.push(node.name)
				}
			} else if(this.tsc.isIdentifier(node)){
				path.push(node)
				// skipping the parent, because this identifier is probably the name, and we need to skip without adding it second time
				// we still need to add this identifier here, because parent may be destructurizing variable declaration, that has no clear name
				node = node.parent
				isStaticField = isStaticField || this.isNodeStatic(node)
			} else if(this.tsc.isPropertyDeclaration(node) || this.tsc.isMethodDeclaration(node)){
				isStaticField = isStaticField || this.isNodeStatic(node)
				path.push(node.name)
			}
			node = node.parent
		}
		return path.reverse()
	}

	propNamesToAccessChain(names: Tsc.PropertyName[]): Tsc.Expression {
		let firstName = names[0]!
		let result: Tsc.Expression
		if(this.tsc.isIdentifier(firstName) || this.tsc.isPrivateIdentifier(firstName)){
			result = firstName
		} else {
			throw new Error("Cannot create property access expression: first name is not identifier: " + firstName.getText())
		}
		for(let i = 1; i < names.length; i++){
			let name = names[i]!
			if(this.tsc.isIdentifier(name) || this.tsc.isPrivateIdentifier(name)){
				result = this.tsc.factory.createPropertyAccessExpression(result,
					this.tsc.factory.createIdentifier(name.text)
				)
			} else if(this.tsc.isComputedPropertyName(name)){
				// I thought about copying the expression here, but found no obvious way to do so
				// welp, hope it'll be alright to just reference it like that
				result = this.tsc.factory.createElementAccessExpression(result, name.expression)
			} else {
				result = this.tsc.factory.createElementAccessExpression(result, name)
			}
		}
		return result
	}

	entityNameToNameArray(expr: Tsc.EntityName): Tsc.Identifier[] {
		let result = [] as Tsc.Identifier[]

		for(;;){
			if(this.tsc.isIdentifier(expr)){
				result.push(expr)
				break
			} else if(this.tsc.isQualifiedName(expr)){
				result.push(expr.right)
				expr = expr.left
			} else {
				throw new Error("Expected following expression to be property access expression, or identifier, but it's neither: " + expr)
			}
		}

		return result.reverse()
	}

	functionDeclName(decl: Tsc.FunctionDeclaration): Tsc.Node {
		let name = decl.name || decl.modifiers?.find(x => x.kind === this.tsc.SyntaxKind.DefaultKeyword)
		if(!name){
			throw new Error("Function declaration without name! How is this possible? " + decl.getText())
		}
		return name
	}

	moduleFilePath(modSpec: string, referencedFrom: Tsc.SourceFile): string {
		let ambientSrcFiles = this.ambientModules.getAmbientModuleSourceFilePaths(modSpec)
		if(ambientSrcFiles){
			// if a module is declared in multiple files, take whatever (just do it consistently)
			return ambientSrcFiles.sort()[0]!
		} else {
			let resolutionResult = this.tsc.resolveModuleName(
				modSpec,
				referencedFrom.fileName,
				this.toolboxContext.program.getCompilerOptions(),
				this.tsc.sys
			)
			if(resolutionResult.resolvedModule){
				return resolutionResult.resolvedModule.resolvedFileName
			} else {
				throw new Error(`Cannot resolve file path of module ${modSpec} referenced from ${referencedFrom.fileName}`)
			}
		}
		// return this.modulePathResolver.getCanonicalModuleName(result)
	}

	private findExportEqualsNamespaces(base: Tsc.Node): Tsc.ModuleDeclaration[] {
		let result = [] as Tsc.ModuleDeclaration[]
		base.forEachChild(child => {
			if(!this.tsc.isExportAssignment(child)){
				return
			}
			let symbol = this.checker.getSymbolAtLocation(child.expression)
			if(!symbol){
				return
			}
			let decls = symbol.declarations
			if(decls){
				decls.forEach(decl => {
					if(this.tsc.isModuleDeclaration(decl)){
						result.push(decl)
					}
				})
			}
		})
		return result
	}

	private findExportedSymbol(base: Tsc.Node, name: string): Tsc.Node | null {
		let exportEqualsNamespaces = this.findExportEqualsNamespaces(base)
		if(exportEqualsNamespaces.length > 0){
			let nodes = exportEqualsNamespaces
				.map(ns => !ns.body ? null : this.findExportedSymbol(ns.body, name))
				.filter(x => !!x)
			if(nodes.length === 1){
				return nodes[0]!
			}
			if(nodes.length > 1){
				return null
			}
		}

		let result: Tsc.Node | null = null
		base.forEachChild(child => {
			if(!this.isNodeExported(child)){
				return
			}

			if(this.tsc.isVariableStatement(child)){
				child.declarationList.declarations.forEach(decl => {
					if(this.tsc.isIdentifier(decl.name) && decl.name.text === name){
						result = decl
					}
				})
			} else {
				let path = this.getPathToNodeUpToLimit(child, x => x === base)
				if(path.length === 1 && this.tsc.isIdentifier(path[0]!) && path[0]!.text === name){
					result = child
				}
			}
		})
		return result
	}

	/** Get declaration of imported value */
	findImportedDeclaration(importedName: string, modSpec: string, referencedFrom: Tsc.SourceFile): Tsc.Node {
		let ambientModules = this.ambientModules.getAmbientModuleDeclarations(modSpec)
		if(ambientModules){
			let results = ambientModules.map(module => {
				if(!module.body){
					return null
				} else {
					return this.findExportedSymbol(module.body, importedName)
				}
			}).filter(x => !!x)
			if(results.length > 1){
				throw new Error(`Found more than one exported symbol ${importedName} in module ${modSpec}`)
			} else if(results.length < 1){
				throw new Error(`Cannot find exported symbol ${importedName} in module ${modSpec}`)
			}
			return results[0]!
		}

		let filePath = this.moduleFilePath(modSpec, referencedFrom)
		let sourceFile = this.toolboxContext.program.getSourceFile(filePath)
		if(!sourceFile){
			throw new Error(`Failed to get source file for module ${modSpec}; resolved file name is ${filePath}`)
		}
		let result = this.findExportedSymbol(sourceFile, importedName)
		if(!result){
			throw new Error(`Cannot find exported symbol ${importedName} in module ${modSpec}`)
		}
		return result
	}

	/** Get a string that can be used as module specifier when importing, or null if the declaration is global and there is nothing to import */
	getModuleNameForImport(node: Tsc.Node): string | null {
		if(this.tsc.isSourceFile(node)){
			if(!this.isModuleFile(node)){
				return null
			}
			let externalPkg = this.modulePathResolver.getExternalPackageNameAndPath(node.fileName)
			if(externalPkg){
				return externalPkg.packageName
			}
			return this.modulePathResolver.getCanonicalModuleName(node.fileName)
		} else if(this.tsc.isModuleDeclaration(node)){
			if(node.flags & this.tsc.NodeFlags.GlobalAugmentation){
				return null // `global` namespace
			}
			if(this.tsc.isStringLiteral(node.name)){
				return node.name.text // ambient module
			}
		}

		if(!node.parent){
			throw new Error("Cannot generate import name for node " + node.getText())
		} else {
			return this.getModuleNameForImport(node.parent)
		}
	}

	/** Does this file exports or imports anything? */
	isModuleFile(file: Tsc.SourceFile): boolean {
		let result = false
		file.forEachChild(child => {
			result = result || this.tsc.isImportDeclaration(child) || this.isNodeExported(child)
		})
		return result
	}

}
import {RuntyperTricks} from "transformer/tricks"
import * as Tsc from "typescript"

/** Transformer that adds explicit types to all the nodes that require it */
export class TypeInferringTransformer {

	constructor(private readonly tricks: RuntyperTricks) {}

	transform(file: Tsc.SourceFile): Tsc.SourceFile {
		let visitor = (node: Tsc.Node): Tsc.VisitResult<Tsc.Node> => {
			if(Tsc.isModuleDeclaration(node) || Tsc.isModuleBlock(node)){
				return Tsc.visitEachChild(node, subnode => visitor(subnode), this.tricks.transformContext)
			}

			if(Tsc.isVariableStatement(node)){
				return this.transformVariableStatement(node)
			} else if(Tsc.isFunctionDeclaration(node)){
				return this.transformFunctionLike(node)
			} else if(Tsc.isClassDeclaration(node)){
				return this.transformClassDeclaration(node)
			}

			return node
		}

		return Tsc.visitEachChild(file, subnode => visitor(subnode), this.tricks.transformContext)
	}

	private declType(name: Tsc.BindingName | Tsc.PropertyName, decl: Tsc.Declaration): Tsc.TypeNode | undefined {
		let type = this.tricks.checker.getTypeAtLocation(name)
		return this.tricks.checker.typeToTypeNode(type, decl, undefined)
	}

	private transformVariableStatement(node: Tsc.VariableStatement): Tsc.VariableStatement {
		let updated = false
		let newDecls = node.declarationList.declarations.map(decl => {
			if(decl.type){
				return decl
			}

			updated = true
			return Tsc.factory.updateVariableDeclaration(decl,
				decl.name, decl.exclamationToken, this.declType(decl.name, decl), decl.initializer)
		})

		return !updated ? node : Tsc.factory.updateVariableStatement(node, node.modifiers,
			Tsc.factory.updateVariableDeclarationList(node.declarationList, newDecls)
		)
	}

	private transformFunctionLike<T extends Tsc.FunctionDeclaration | Tsc.ConstructorDeclaration | Tsc.MethodDeclaration>(node: T): T {
		let updated = false
		let newParams = node.parameters.map(decl => {
			if(decl.type){
				return decl
			}

			updated = true
			// TODO: support rest parameters
			return Tsc.factory.updateParameterDeclaration(decl, decl.decorators, decl.modifiers, decl.dotDotDotToken, decl.name, decl.questionToken, this.declType(decl.name, decl), decl.initializer)
		})

		let retTypeNode: Tsc.TypeNode | undefined = node.type
		if(!retTypeNode && (Tsc.isFunctionDeclaration(node) || Tsc.isMethodDeclaration(node))){
			let type = this.tricks.checker.getTypeAtLocation(node)
			let signatures = type.getCallSignatures()
			if(signatures.length === 1){
				updated = true
				let retType = signatures[0]!.getReturnType()
				retTypeNode = this.tricks.checker.typeToTypeNode(retType, node, undefined)
			}
		}

		// TODO: support generators????????
		if(!updated){
			return node
		}
		if(Tsc.isFunctionDeclaration(node)){
			return Tsc.factory.updateFunctionDeclaration(node, node.decorators, node.modifiers, node.asteriskToken, node.name, node.typeParameters, newParams, retTypeNode, node.body) as T
		} else if(Tsc.isConstructorDeclaration(node)){
			return Tsc.factory.updateConstructorDeclaration(node, node.decorators, node.modifiers, newParams, node.body) as T
		} else if(Tsc.isMethodDeclaration(node)){
			return Tsc.factory.updateMethodDeclaration(node, node.decorators, node.modifiers, node.asteriskToken, node.name, node.questionToken, node.typeParameters, newParams, retTypeNode, node.body) as T
		} else {
			throw new Error("Bad node passed to transform function-like: " + node)
		}
	}

	private transformClassDeclaration(node: Tsc.ClassDeclaration): Tsc.ClassDeclaration {
		let updated = false
		let members = node.members.map(member => {
			if(Tsc.isPropertyDeclaration(member)){
				if(member.type){
					return member
				}

				updated = true
				return Tsc.factory.updatePropertyDeclaration(member, member.decorators, member.modifiers, member.name, member.exclamationToken || member.questionToken, this.declType(member.name, member), member.initializer)
			} else if(Tsc.isConstructorDeclaration(member) || Tsc.isMethodDeclaration(member)){
				let result = this.transformFunctionLike(member)
				updated = updated || result !== member
				return result
			} else {
				return member
			}
		})

		return !updated ? node : Tsc.factory.updateClassDeclaration(node, node.decorators, node.modifiers, node.name, node.typeParameters, node.heritageClauses, members)
	}

}
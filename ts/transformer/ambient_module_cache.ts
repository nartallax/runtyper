import * as Tsc from "typescript"

export class AmbientModuleCache {

	private readonly decls = new Map<string, Tsc.ModuleDeclaration[]>()

	constructor(checker: Tsc.TypeChecker) {
		checker.getAmbientModules().forEach(symbol => {
			if(symbol.valueDeclaration){
				this.addDecl(symbol.valueDeclaration)
			}
			if(symbol.declarations){
				symbol.declarations.forEach(decl => this.addDecl(decl))
			}
		})
	}

	isAmbientModule(name: string): boolean {
		return this.decls.has(name)
	}

	getAmbientModuleSourceFilePaths(name: string): string[] | undefined {
		let decls = this.decls.get(name)
		return !decls ? undefined : [...new Set(decls.map(x => x.getSourceFile().fileName))]
	}

	getAmbientModuleDeclarations(name: string): Tsc.ModuleDeclaration[] | undefined {
		return this.decls.get(name)
	}

	private addDecl(decl: Tsc.Node): void {
		if(!Tsc.isModuleDeclaration(decl) || !Tsc.isStringLiteral(decl.name) || !decl.body){
			return
		}
		let arr = this.decls.get(decl.name.text)
		if(!arr){
			arr = [] as Tsc.ModuleDeclaration[]
			this.decls.set(decl.name.text, arr)
		} else if(arr.find(x => x === decl)){
			return // no dulicates
		}
		arr.push(decl)
	}

}
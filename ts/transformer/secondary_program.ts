import {ToolboxTransformer} from "@nartallax/toolbox-transformer"
import * as Tsc from "typescript"
import * as Path from "path"

export class SecondaryProgram {

	private readonly host: Tsc.CompilerHost
	// private program: Tsc.SemanticDiagnosticsBuilderProgram
	private readonly fullTempFileName: string
	private code: string | null = null
	transformer: ((context: Tsc.TransformationContext, f: Tsc.SourceFile) => Tsc.SourceFile) | null = null

	constructor(private readonly context: ToolboxTransformer.TransformerProjectContext, tempFileName: string) {
		this.fullTempFileName = Path.resolve(Path.dirname(context.tsconfigPath), tempFileName)
		this.host = Tsc.createCompilerHost(context.program.getCompilerOptions())
		this.patchHost(this.host, context.program)
		// this.program = Tsc.createProgram({
		// 	host: this.host,
		// 	options: context.program.getCompilerOptions(),
		// 	rootNames: context.program.getRootFileNames(),
		// 	configFileParsingDiagnostics: context.program.getConfigFileParsingDiagnostics(),
		// 	projectReferences: context.program.getProjectReferences()
		// })
		// maybe I need it? don't know for sure
		// this.program.emit()

		// this.program = Tsc.createSemanticDiagnosticsBuilderProgram(
		// 	context.program,
		// 	{
		// 		useCaseSensitiveFileNames(): boolean {
		// 			return true
		// 		}
		// 	}
		// )

		// this.program = Tsc.createSemanticDiagnosticsBuilderProgram(
		// 	context.program.getRootFileNames(),
		// 	context.program.getCompilerOptions(),
		// 	this.host,
		// 	undefined,
		// 	undefined,
		// 	context.program.getProjectReferences()
		// )
	}

	isTheTempFile(file: Tsc.SourceFile | string): boolean {
		let filePath = typeof(file) === "string" ? file : file.fileName
		// let moduleName = this.tricks.modulePathResolver.getCanonicalModuleName(filePath)
		// return moduleName === this.tempFileName
		return filePath === this.fullTempFileName
	}
	private patchHost(host: Tsc.CompilerHost, program: Tsc.Program): void {

		void program
		// let scriptTarget = program.getCompilerOptions().target || Tsc.ScriptTarget.ES5
		// let knownFiles = new Map<string, Tsc.SourceFile>()
		// host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
		// 	let code = host.readFile(fileName)
		// 	if(!code){
		// 		let msg = "Cannot get source file for path " + fileName + ": no file content"
		// 		if(onError){
		// 			onError(msg)
		// 			return
		// 		} else {
		// 			throw new Error(msg)
		// 		}

		// 	}

		// 	if(knownFiles.has(fileName)){
		// 		return knownFiles.get(fileName)
		// 	}

		// 	// TODO: why do I need those? investigate
		// 	void languageVersion, shouldCreateNewSourceFile
		// 	let result = Tsc.createLanguageServiceSourceFile(
		// 		fileName,
		// 		Tsc.ScriptSnapshot.fromString(code),
		// 		scriptTarget,
		// 		"",
		// 		true
		// 	)
		// 	knownFiles.set(fileName, result)
		// 	return result
		// }
		let originalGetSourceFile = host.getSourceFile
		host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
			if(this.isTheTempFile(fileName) && this.code){
				return Tsc.createSourceFile(fileName, this.code, languageVersion)
			} else {
				return originalGetSourceFile.call(host, fileName, languageVersion, onError, shouldCreateNewSourceFile)
			}
		}

		let origReadFile = host.readFile
		host.readFile = fileName => {
			if(this.isTheTempFile(fileName) && this.code){
				return this.code
			} else {
				return origReadFile.call(host, fileName)
			}
		}
	}

	applyTransformerToFileCode(fileCode: string, transformer: (context: Tsc.TransformationContext, file: Tsc.SourceFile) => Tsc.SourceFile): void {
		let start = Date.now()
		let mainProgram = this.context.program
		let rootNames = mainProgram.getRootFileNames()
		rootNames = [...rootNames, this.fullTempFileName]
		this.code = fileCode

		// this.program = Tsc.createSemanticDiagnosticsBuilderProgram(
		// 	rootNames,
		// 	mainProgram.getCompilerOptions(),
		// 	this.host,
		// 	this.program,
		// 	undefined,
		// 	mainProgram.getProjectReferences()
		// )

		// let file = this.program.getSourceFile(this.fullTempFileName)
		// this.program.emit(file, () => {
		// 	// nothing
		// }, undefined, false, {
		// 	before: [context => ({
		// 		transformSourceFile: file => transformer(context, file),
		// 		transformBundle: x => x
		// 	})]
		// })

		let program = Tsc.createProgram({
			host: this.host,
			oldProgram: mainProgram, // TODO: pick latest program here?
			options: mainProgram.getCompilerOptions(),
			rootNames: rootNames,
			configFileParsingDiagnostics: mainProgram.getConfigFileParsingDiagnostics(),
			projectReferences: mainProgram.getProjectReferences()
		})
		let file = program.getSourceFile(this.fullTempFileName)
		program.emit(file, () => {
			// nothing
		}, undefined, false, {
			before: [context => ({
				transformSourceFile: file => transformer(context, file),
				transformBundle: x => x
			})]
		})




		console.log("Secondary program call took " + (Date.now() - start) + "ms")
	}

}
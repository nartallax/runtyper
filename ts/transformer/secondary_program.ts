import {ToolboxTransformer} from "@nartallax/toolbox-transformer"
import * as Tsc from "typescript"
import * as Path from "path"

export class SecondaryProgram {

	private readonly host: Tsc.CompilerHost
	private readonly watchHost: Tsc.WatchCompilerHostOfConfigFile<Tsc.SemanticDiagnosticsBuilderProgram>
	private program: Tsc.SemanticDiagnosticsBuilderProgram | undefined = undefined
	private watchProgram: Tsc.WatchOfConfigFile<Tsc.SemanticDiagnosticsBuilderProgram>
	private readonly fullTempFileName: string
	private code: string | null = null
	private notifyFileUpdated: (() => void) | null = null
	transformer: ((context: Tsc.TransformationContext, f: Tsc.SourceFile) => Tsc.SourceFile) | null = null

	constructor(private readonly context: ToolboxTransformer.TransformerProjectContext, tempFileName: string) {
		this.fullTempFileName = Path.resolve(Path.dirname(context.tsconfigPath), tempFileName)
		this.host = Tsc.createCompilerHost(context.program.getCompilerOptions())
		this.patchHost(this.host, context.program)
		this.watchHost = this.createWatchHost(context)

		// this.program = this.watchHost.createProgram(
		// 	[...context.program.getRootFileNames(), this.fullTempFileName],
		// 	context.program.getCompilerOptions(),
		// 	this.host,
		// 	undefined,
		// 	undefined,
		// 	context.program.getProjectReferences()
		// )

		this.watchProgram = Tsc.createWatchProgram(this.watchHost)
	}

	isTheTempFile(file: Tsc.SourceFile | string): boolean {
		let filePath = typeof(file) === "string" ? file : file.fileName
		// let moduleName = this.tricks.modulePathResolver.getCanonicalModuleName(filePath)
		// return moduleName === this.tempFileName
		return filePath === this.fullTempFileName
	}

	private createWatchHost(context: ToolboxTransformer.TransformerProjectContext): Tsc.WatchCompilerHostOfConfigFile<Tsc.SemanticDiagnosticsBuilderProgram> {
		let result = Tsc.createWatchCompilerHost(
			context.tsconfigPath,
			{},
			{
				...Tsc.sys,
				writeFile: (path, data, writeBom) => {
					void path, data, writeBom // nop
				},
				setTimeout: (cb, ms, ...args) => {
					void ms
					!args ? cb() : cb(...args)
				},
				fileExists: path => {
					return this.isTheTempFile(path) || Tsc.sys.fileExists(path)
				},
				readFile: path => {
					if(this.isTheTempFile(path)){
						return this.code || "let x = 'this is code in case it is absent UwU'"
					} else {
						return Tsc.sys.readFile(path)
					}
				}
			},
			Tsc.createSemanticDiagnosticsBuilderProgram,
			() => {/* nope*/},
			() => {/* nope*/}
		)

		// prevents rebuild scheduling
		// result.setTimeout = undefined
		// result.clearTimeout = undefined
		result.setTimeout = (cb, ms, ...args) => {
			void ms
			cb(...args)
		}

		let watchFile = result.watchFile
		if(!watchFile){
			throw new Error("WatchHost has no watchFile()! Unexpected.")
		}
		result.watchFile = (path, cb, pollingInterval, opts) => {
			if(this.isTheTempFile(path)){
				this.notifyFileUpdated = () => cb(path, Tsc.FileWatcherEventKind.Changed)
				return {close: () => {
					this.notifyFileUpdated = null
				}}
			} else {
				void pollingInterval, opts
				return {close: () => {
					// nop
				}}
				// return watchFile(path, cb, pollingInterval, opts)
			}
		}
		result.watchDirectory = () => ({close: () => {
			// nop
		}})

		let createProgram = result.createProgram
		result.createProgram = (rootNames, options, host, oldProgram, configFileParsingDiagnostics, projectReferences) => {
			rootNames = [...(rootNames || []), this.fullTempFileName]
			let program = createProgram(
				rootNames, options, host, oldProgram, configFileParsingDiagnostics, projectReferences
			)

			let emit = program.emit
			program.emit = (target, write, cancToken, onlyDts, trans) => {
				trans = trans || {}
				trans.before ||= []
				trans.before.push(context => ({
					transformBundle: x => x,
					transformSourceFile: file => {
						if(!this.transformer){
							return file
						} else {
							return this.transformer(context, file)
						}
					}
				}))
				return emit(target, write, cancToken, onlyDts, trans)
			}

			return program
		}

		return result
	}

	private patchHost(host: Tsc.CompilerHost, program: Tsc.Program): void {

		void program
		let scriptTarget = program.getCompilerOptions().target || Tsc.ScriptTarget.ES5
		let knownFiles = new Map<string, Tsc.SourceFile>()
		host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
			let code = host.readFile(fileName)
			if(!code){
				let msg = "Cannot get source file for path " + fileName + ": no file content"
				if(onError){
					onError(msg)
					return
				} else {
					throw new Error(msg)
				}

			}

			let oldFile = knownFiles.get(fileName)
			if(oldFile){
				oldFile = Tsc.updateLanguageServiceSourceFile(oldFile,
					Tsc.ScriptSnapshot.fromString(code),
					"",
					{span: {start: 0, length: oldFile.text.length}, newLength: code.length}
				)
				knownFiles.set(fileName, oldFile)
				return oldFile
			}

			// TODO: why do I need those? investigate
			void languageVersion, shouldCreateNewSourceFile
			let result = Tsc.createLanguageServiceSourceFile(
				fileName,
				Tsc.ScriptSnapshot.fromString(code),
				scriptTarget,
				"",
				true
			)
			knownFiles.set(fileName, result)
			return result
		}

		let origReadFile = host.readFile
		host.readFile = fileName => {
			if(this.isTheTempFile(fileName) && this.code){
				return this.code
			} else {
				return origReadFile.call(host, fileName)
			}
		}

		host.writeFile = (name, data, writeBOM, onError, sourceFiles) => {
			void name, data, writeBOM, onError, sourceFiles // nop
		}
	}

	private firstTime = true
	applyTransformerToFileCode(fileCode: string, transformer: (context: Tsc.TransformationContext, file: Tsc.SourceFile) => Tsc.SourceFile): void {
		let start = Date.now()
		let mainProgram = this.context.program
		let rootNames = mainProgram.getRootFileNames()
		rootNames = [...rootNames, this.fullTempFileName]
		void rootNames
		this.code = fileCode
		this.transformer = transformer

		if(!this.notifyFileUpdated){
			if(!this.firstTime){
				throw new Error("No file update callback! Secondary program was not initialized.")
			}
			this.firstTime = false
		} else {
			this.notifyFileUpdated()
		}

		void this.program
		void this.watchProgram
		// let program = this.watchProgram.getProgram()

		// let file = program.getSourceFile(this.fullTempFileName)
		// void file
		// program.emit(file, () => {
		// 	// nothing
		// }, undefined, false, {
		// 	before: [context => ({
		// 		transformSourceFile: file => transformer(context, file),
		// 		transformBundle: x => x
		// 	})]
		// })

		this.transformer = null
		console.log("Secondary program call took " + (Date.now() - start) + "ms")
	}

}
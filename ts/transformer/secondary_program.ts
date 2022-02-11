import {ToolboxTransformer} from "@nartallax/toolbox-transformer"
import * as Tsc from "typescript"
import * as Path from "path"

/** A secondary watch program that runs on files of original program and allows substituting them for second-hand processing
 * Should be mostly detached from FS. No watchers, no writing. */
export class SecondaryProgram {

	private readonly fileOverrides = new Map<string, string>()
	private readonly fileWatchers = new Map<string, () => void>()
	private readonly dirWatchers = new Map<string, (path: string) => void>()
	private readonly watchHost: Tsc.WatchCompilerHostOfConfigFile<Tsc.SemanticDiagnosticsBuilderProgram>
	private watchProgram: Tsc.WatchOfConfigFile<Tsc.SemanticDiagnosticsBuilderProgram> | null = null
	private transformer: ((context: Tsc.TransformationContext, f: Tsc.SourceFile) => Tsc.SourceFile) | null = null
	private currentlyUpdatedFile: string | null = null

	constructor(context: ToolboxTransformer.TransformerProjectContext) {
		this.watchHost = this.createWatchHost(context)
		this.watchProgram = Tsc.createWatchProgram(this.watchHost)
	}

	// noone will ever use it, but it's good thing to have this method anywat
	shutdown(): void {
		if(this.watchProgram){
			this.watchProgram.close()
			this.watchProgram = null
		}
	}

	private createWatchHost(context: ToolboxTransformer.TransformerProjectContext): Tsc.WatchCompilerHostOfConfigFile<Tsc.SemanticDiagnosticsBuilderProgram> {
		let result = Tsc.createWatchCompilerHost(
			context.tsconfigPath,
			{},
			{
				...Tsc.sys,
				writeFile: (path, data, writeBom) => {
					void path, data, writeBom // absolutely no writing to FS
				},
				setTimeout: (cb, ms, ...args) => {
					// it's not the most beautiful thing
					// but we REALLY REALLY need to run emit() syncronously after FS notification
					void ms
					cb(...args)
				},
				readFile: path => this.fileOverrides.get(path) || Tsc.sys.readFile(path)
			},
			Tsc.createSemanticDiagnosticsBuilderProgram,
			diag => {
				if(diag.category === Tsc.DiagnosticCategory.Error){
					throw new Error("Secondary program discovered an error during compilation: " + diag.messageText + " (at " + diag.start + " of file " + diag.file?.fileName + ")")
				}
			},
			() => {
				// nop
			}
		)

		result.watchFile = (path, cb) => {
			this.fileWatchers.set(path, () => cb(path, Tsc.FileWatcherEventKind.Changed))
			return {close: () => {
				this.fileWatchers.delete(path)
			}}
		}
		result.watchDirectory = (path, callback) => {
			this.dirWatchers.set(path, callback)
			return {close: () => {
				// nop
			}}
		}

		let createProgram = result.createProgram
		result.createProgram = (rootNames, options, host, oldProgram, configFileParsingDiagnostics, projectReferences) => {
			let program = createProgram(
				rootNames, options, host, oldProgram, configFileParsingDiagnostics, projectReferences
			)

			let emit = program.emit
			program.emit = (target, write, cancToken, onlyDts, trans) => {
				if(!target && this.currentlyUpdatedFile){
					target = program.getSourceFile(this.currentlyUpdatedFile)
				}
				trans = trans || {}
				trans.before ||= []
				trans.before.push(context => ({
					transformBundle: x => x,
					transformSourceFile: file => {
						if(!this.transformer || (file.fileName !== this.currentlyUpdatedFile)){
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

	private findDirWatcher(srcPath: string): (path: string) => void {
		let currentPath = srcPath
		while(currentPath){
			let watcher = this.dirWatchers.get(currentPath)
			if(watcher){
				console.log("Found watcher at " + currentPath + " for " + srcPath)
				return watcher
			}

			let newPath = Path.dirname(currentPath)
			if(newPath === currentPath){
				break
			}
			currentPath = newPath
		}
		throw new Error("Directory watcher not found for file " + srcPath)
	}

	/** Having file from original program, substitute the code of secondary program with current code of the file and run a transformer on the resulting (re-parsed) AST */
	applyTransformerToFileCode(sourceFile: Tsc.SourceFile, transformer: (context: Tsc.TransformationContext, file: Tsc.SourceFile) => Tsc.SourceFile): void {

		let start = Date.now()
		try {
			this.currentlyUpdatedFile = sourceFile.fileName
			this.transformer = transformer

			let printer = Tsc.createPrinter()
			let code = printer.printFile(sourceFile)

			if(!this.fileWatchers.has(sourceFile.fileName)){
				// that means new file is created! let's notify the program.
				let dirWatcher = this.findDirWatcher(sourceFile.fileName)
				dirWatcher(sourceFile.fileName)
			}
			let notifier = this.fileWatchers.get(sourceFile.fileName)
			if(!notifier){
				throw new Error("No file update callback! That's unexpected. Cannot pass primary program code to secondary.")
			} else {
				this.fileOverrides.set(sourceFile.fileName, code)
				notifier()
			}
		} finally {
			this.transformer = null
			this.currentlyUpdatedFile = null
		}
		console.log("Secondary program call took " + (Date.now() - start) + "ms")
	}

}
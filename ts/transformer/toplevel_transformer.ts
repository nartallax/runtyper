import {Runtyper} from "entrypoint"
import {SecondaryProgram} from "transformer/secondary_program"
import {RuntyperTricks} from "transformer/tricks"
import {TypeInferringTransformer} from "transformer/type_inferring_transformer"
import {TypeStructureAppendingTransformer} from "transformer/type_structure_appending_transformer"
import * as Tsc from "typescript"

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TransParams extends Runtyper.TransformerParameters {
	// litRefPacks: Set<string>
	// refRefPacks: Set<string>
}

/** Entrypoint transformer of this module. Manages other transformers. */
export class TopLevelTransformer {

	constructor(private readonly tricks: RuntyperTricks,
		private readonly params: TransParams,
		private readonly secondaryProgram: SecondaryProgram
	) {}

	transform(file: Tsc.SourceFile): Tsc.SourceFile {

		try {
			if(this.secondaryProgram.isTheTempFile(file)){
				return file
			}

			let result = new TypeInferringTransformer(this.tricks).transform(file)
			if(result === file){
				let structureTrans = new TypeStructureAppendingTransformer(this.tricks, this.params)
				return structureTrans.transform(result, file)
			}
			let printer = Tsc.createPrinter()
			let code = printer.printFile(result)

			// file.fileName.match(/functions/) && console.log("Code of " + file.fileName + ":\n" + code)

			this.secondaryProgram.applyTransformerToFileCode(code, (context, secFile) => {
				if(!this.secondaryProgram.isTheTempFile(secFile)){
					return secFile
				}
				let tricks = new RuntyperTricks(this.tricks.toolboxContext, context, Tsc)
				let structureTrans = new TypeStructureAppendingTransformer(tricks, this.params)
				let secResult = structureTrans.transform(secFile, file)

				// if we won't update source code and just shove new nodes in,
				// text ranges within the nodes applied to old code will mess it up completely
				result = Tsc.updateSourceFile(result, code, {span: {start: 0, length: result.text.length}, newLength: code.length})
				result = Tsc.factory.updateSourceFile(result, secResult.statements)
				return secResult
			})

			return result
		} catch(e){
			if(e instanceof Error){
				console.error(e.stack || e.message)
			}
			throw e
		}
	}

}
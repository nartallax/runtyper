// import * as Tsc from "typescript"

// function transformFile(program: Tsc.Program, file: Tsc.SourceFile): Tsc.SourceFile {
// 	let empty = () => {
// 		// intended
// 	}
// 	// Dummy transformation context
// 	let context: Tsc.TransformationContext = {
// 		startLexicalEnvironment: empty,
// 		suspendLexicalEnvironment: empty,
// 		resumeLexicalEnvironment: empty,
// 		endLexicalEnvironment: () => [],
// 		getCompilerOptions: () => program.getCompilerOptions(),
// 		hoistFunctionDeclaration: empty,
// 		hoistVariableDeclaration: empty,
// 		readEmitHelpers: () => undefined,
// 		requestEmitHelper: empty,
// 		enableEmitNotification: empty,
// 		enableSubstitution: empty,
// 		isEmitNotificationEnabled: () => false,
// 		isSubstitutionEnabled: () => false,
// 		onEmitNode: empty,
// 		onSubstituteNode: (hint, node) => node
// 	}
// 	const transformedFile = Tsc.visitEachChild(file, child => visit(child, context), context)
// 	return transformedFile
// }

// function visit(node: Tsc.Node, context: Tsc.TransformationContext): Tsc.Node {
// 	if(Tsc.isStringLiteral(node) && node.text === "replaceMe"){
// 		return Tsc.createCall(
// 			Tsc.createPropertyAccess(
// 				Tsc.createIdentifier("A"),
// 				"myMethod"),
// 			[],
// 			[])
// 	}
// 	return Tsc.visitEachChild(node, child => visit(child, context), context)
// }

// let host = Tsc.createCompilerHost({})
// let program = Tsc.createProgram(["fake_file_for_transformer.ts"], {}, host)

// let transformed = program.getSourceFiles()
// 	.map(f => ({original: f, transformed: transformFile(program, f)}))
// 	.reduce<{[name: string]: {original: Tsc.SourceFile, transformed: Tsc.SourceFile}}>((r, f) => {
// 	r[f.original.fileName] = f; return r
// }, {})

// let originalGetSourceFile = host.getSourceFile
// let printer = Tsc.createPrinter()

// // Rig the host to return the new verisons of transformed files.
// host.getSourceFile = function(fileName, languageVersion, onError, shouldCreateNewSourceFile) {
// 	let file = transformed[fileName]
// 	if(file){
// 		if(file.original !== file.transformed){
// 			// Since we need to return a SourceFile it is tempting to return the transformed source file and not parse it again
// 			// The compiler doe not support Synthesized nodes in the AST except during emit, and it will check node positions
// 			// (which for Synthesized are -1) and fail. So we need to reparse
// 			return Tsc.createSourceFile(fileName, printer.printFile(file.transformed), languageVersion)
// 		} else {
// 			// For unchanged files it should be safe to reuse the source file
// 			return file.original
// 		}
// 	}
// 	return originalGetSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile)
// }

// // Recreate the program, we pass in the original to
// program = Tsc.createProgram(["toTrans.ts"], {}, host, program)

// let result = program.emit()
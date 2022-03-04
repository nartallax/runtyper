import {test} from "@nartallax/clamsensor"
import {Imploder} from "@nartallax/imploder"
import {promises as Fs} from "fs"
import * as Path from "path"
import * as ChildProcess from "child_process"

/*
async function fileExists(path: string): Promise<boolean> {
	try {
		await Fs.stat(path)
		return true
	} catch(e){
		if((e as {code: string}).code === "ENOENT"){
			return false
		} else {
			throw e
		}
	}
}
*/

test("main test", async assert => {

	let outDir = Path.resolve("./test_project/js/main")
	let ethalonJsDir = Path.resolve("./test_project/ethalon_js")
	await Fs.rm(outDir, {recursive: true, force: true})

	try {
		await Fs.mkdir("./test_project/node_modules/@nartallax/runtyper", {recursive: true})
	} catch(e){
		// nothing
	}
	await Fs.copyFile("./target/runtyper.d.ts", "./test_project/node_modules/@nartallax/runtyper/runtyper.d.ts")
	await Fs.copyFile("./target/runtyper.js", "./test_project/node_modules/@nartallax/runtyper/runtyper.js")
	await Fs.copyFile("./package.json", "./test_project/node_modules/@nartallax/runtyper/package.json")

	let context = await Imploder.runFromTsconfig("./test_project/tsconfig.json")
	if(!context.compiler.lastBuildWasSuccessful){
		throw new Error("Failed to build test project.")
	}

	let getJs = (path: string) => Fs.readFile(Path.resolve(outDir, path), "utf-8")

	let assertEthalonJs = async(path: string[]) => {
		path[path.length - 1] += ".js"
		let fullProducedPath = Path.join(outDir, ...path)
		let fullEthalonPath = Path.join(ethalonJsDir, ...path)
		console.error("Comparing js code in " + fullProducedPath + " with ethalon...")
		let [producedJs, ethalonJS] = await Promise.all([getJs(fullProducedPath), getJs(fullEthalonPath)])
		assert(producedJs).equalsTo(ethalonJS)
	}

	for(let name of ["array", "conditional_types", "constant_types", "destructurizing", "enums", "fields_and_dtos", "infer", "inheritance", "mapped_types_and_indexed_access", "other_module_type_ref", "recursive_type", "simple", "tricky_property_names", "tuples", "typeof", "union_intersection", "external_types", "exportequals_to_be_imported", "class_instances"]){
		await assertEthalonJs(["types", name])
	}

	for(let name of ["classes", "exclamation_token", "functions", "get_type", "namespaces", "tricky_imports"]){
		await assertEthalonJs(["values", name])
	}

	let {exitCode} = await runWithResult(process.argv0, [context.config.outFile])
	assert(exitCode).equalsTo(0)
})

function runWithResult(cmd: string, args: string[]): Promise<{exitCode: number | NodeJS.Signals | null}> {
	return new Promise((ok, bad) => {
		try {
			let process = ChildProcess.spawn(
				cmd, args, {
					stdio: "inherit"
				}
			)
			process.on("error", e => bad(e))
			process.on("exit", (code, signal) => ok({exitCode: code === null ? signal : code}))
		} catch(e){
			bad(e)
		}
	})
}
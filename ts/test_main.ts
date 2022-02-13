import {test} from "@nartallax/clamsensor"
import {Imploder} from "@nartallax/imploder"
import {promises as Fs} from "fs"
import * as Path from "path"

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

	for(let name of ["array", "conditional_types", "constant_types", "destructurizing", "enums", "fields_and_dtos", "infer", "inheritance", "mapped_types_and_indexed_access", "other_module_type_ref", "recursive_type", "simple", "tricky_property_names", "tuples", "typeof", "union_intersection"]){
		await assertEthalonJs(["types", name])
	}

	for(let name of ["classes", "exclamation_token", "functions", "get_type", "namespaces", "tricky_imports"]){
		await assertEthalonJs(["values", name])
	}

})
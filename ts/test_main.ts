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

	let assertTypeJs = (name: string) => assertEthalonJs(["types", name])
	let assertInferrenceJs = (name: string) => assertEthalonJs(["inferrence", name])

	await assertTypeJs("simple")
	await assertTypeJs("union_intersection")
	await assertTypeJs("constant_types")
	await assertTypeJs("mapped_types_and_indexed_access")
	await assertTypeJs("inheritance")
	await assertTypeJs("array")
	await assertTypeJs("tuples")
	await assertTypeJs("typeof")
	await assertTypeJs("destructurizing")
	await assertTypeJs("other_module_type_ref")
	await assertTypeJs("conditional_types")
	await assertTypeJs("infer")
	await assertTypeJs("tricky_property_names")
	await assertTypeJs("recursive_type")
	await assertTypeJs("enums")
	await assertInferrenceJs("functions")
	await assertInferrenceJs("classes")

})
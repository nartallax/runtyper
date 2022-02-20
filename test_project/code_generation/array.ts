import {codeGenerationTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {MyArr2, MyArr5} from "types/array"

codeGenerationTests.push([
	Runtyper.getType<MyArr2>(),
	"if(!Array.isArray(arr)){"
])

codeGenerationTests.push([
	Runtyper.getType<MyArr5>(),
	"index key of object is not string"
])
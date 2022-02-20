import {codeGenerationTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {MyNull, Quality} from "types/constant_types"

codeGenerationTests.push([
	Runtyper.getType<Quality>(),
	"allowed_values.has(value)"
])

codeGenerationTests.push([
	Runtyper.getType<MyNull>(),
	"value !== null"
])
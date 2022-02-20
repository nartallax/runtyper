import {codeGenerationTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {TwoTuples} from "types/tuples"

codeGenerationTests.push([
	Runtyper.getType<TwoTuples>(),
	"function validate_tuple_1(tuple)"
])
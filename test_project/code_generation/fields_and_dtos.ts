import {codeGenerationTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {Car} from "types/fields_and_dtos"

codeGenerationTests.push([
	Runtyper.getType<Car>(),
	"checkResult.path.push(\"manufacturingDate\")"
])
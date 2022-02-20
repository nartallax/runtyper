import {codeGenerationTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {Div, DivPrinter, Img} from "types/recursive_type"

codeGenerationTests.push([
	Runtyper.getType<DivPrinter>(),
	"validate_Div_1",
	{ensureAbsent: true}
])

codeGenerationTests.push([
	Runtyper.getType<Div>(),
	"validate_Div_1",
	{ensureAbsent: true}
])

codeGenerationTests.push([
	Runtyper.getType<Img>(),
	"validate_Div_1",
	{ensureAbsent: true}
])
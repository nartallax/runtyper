import {codeGenerationTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {Div, DivPrinter, Img, TreeNode} from "types/recursive_type"

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

codeGenerationTests.push([
	Runtyper.getType<TreeNode<number>>(),
	"validate_TreeNode_of_number_1",
	{ensureAbsent: true}
])
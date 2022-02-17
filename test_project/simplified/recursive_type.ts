import {simplifiedTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {Div3, Div4, DivPrinter, Img, LinkChain, TreeNode} from "types/recursive_type"

// see `console.dir` of output to check

simplifiedTests.push([
	Runtyper.getType<Img>(),
	"structure is not JSONable"
])

simplifiedTests.push([
	Runtyper.getType<TreeNode<string>>(),
	"structure is not JSONable"
])

simplifiedTests.push([
	Runtyper.getType<Div3>(),
	"this recursive type is too difficult to process"
])

simplifiedTests.push([
	Runtyper.getType<Div4>(),
	"structure is not JSONable"
])

simplifiedTests.push([
	Runtyper.getType<LinkChain>(),
	{type: "object", properties: {next: {type: "object", properties: {next: {type: "object", properties: {next: {type: "string"}}, refName: "LinkNodeOf<string>", fullRefName: "/types/recursive_type:LinkNodeOf<string>"}}, refName: "LinkNodeOf<LinkNodeOf<string>>", fullRefName: "/types/recursive_type:LinkNodeOf</types/recursive_type:LinkNodeOf<string>>"}}, refName: "LinkChain", fullRefName: "/types/recursive_type:LinkChain"}

])

simplifiedTests.push([
	Runtyper.getType<DivPrinter>(),
	"structure is not JSONable"
])
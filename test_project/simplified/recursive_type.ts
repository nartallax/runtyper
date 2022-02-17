import {simplifiedTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {Div3, Div4, Img, LinkChain, TreeNode} from "types/recursive_type"

// see `console.dir` of output to check

simplifiedTests.push([
	Runtyper.getType<Img>(),
	"circular structure to JSON"
])

simplifiedTests.push([
	Runtyper.getType<TreeNode<string>>(),
	"circular structure to JSON"
])

simplifiedTests.push([
	Runtyper.getType<Div3>(),
	"this recursive type is too difficult to process"
])

simplifiedTests.push([
	Runtyper.getType<Div4>(),
	"circular structure to JSON"
])

simplifiedTests.push([
	Runtyper.getType<LinkChain>(),
	{type: "object", properties: {next: {type: "object", properties: {next: {type: "object", properties: {next: {type: "string"}}}}}}}
])
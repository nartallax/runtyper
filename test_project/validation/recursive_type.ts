import {validationTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {Div4, DivPrinter, LinkChain, TreeNode} from "types/recursive_type"

validationTests.push([
	Runtyper.getType<TreeNode<string>>(),
	{value: "5", right: null},
	null
])

validationTests.push([
	Runtyper.getType<TreeNode<string>>(),
	{value: "5", right: null, left: {value: "", right: null}},
	null
])

validationTests.push([
	Runtyper.getType<TreeNode<string>>(),
	{value: "5", right: {value: "", right: {value: "", right: {value: "", right: {value: "", right: null}}}}},
	null
])

validationTests.push([
	Runtyper.getType<TreeNode<string>>(),
	{value: "5", right: {value: "", right: {value: "", right: {value: "", right: {value: ""}}}}},
	"at path value.right (of type object)" // it's union type, that's why path is truncated
])

validationTests.push([
	Runtyper.getType<TreeNode<string>>(),
	{value: "5", right: {value: "", right: null, left: {value: "", right: {value: "", right: null}}}},
	null
])

validationTests.push([
	Runtyper.getType<Div4>(),
	{next: {next: {next: {next: {next: {next: null}}}}}},
	"at path value.next.next.next.next.next.next (of type object)"
])

validationTests.push([
	Runtyper.getType<LinkChain>(),
	{next: {next: {next: "nya"}}},
	null
])

validationTests.push([
	Runtyper.getType<LinkChain>(),
	{next: {next: {next: {next: "nya"}}}},
	"at path value.next.next.next (of type object)"
])

validationTests.push([
	Runtyper.getType<DivPrinter>(),
	{printedValue: {text: "nya", child: {src: "nya", child: {src: "nya"}}}},
	null
])

validationTests.push([
	Runtyper.getType<DivPrinter>(),
	{printedValue: {text: "nya", child: {src: "nya", child: {src: "nya", isTrue: true}}}},
	"bad value"
])



// two cycles within the recursive type
type Content = {content?: Div10 | Img10}
type Div10 = {body: Content}
type Img10 = {src: Content}

validationTests.push([
	Runtyper.getType<Div10>(),
	{body: {content: {src: {content: {src: {content: {body: {}}}}}}}},
	null
])

validationTests.push([
	Runtyper.getType<Div10>(),
	{body: {content: {src: {content: {src: {content: {}}}}}}},
	"bad value"
])

validationTests.push([
	Runtyper.getType<Content>(),
	{content: {src: {content: {src: {content: {}}}}}},
	"bad value"
])

validationTests.push([
	Runtyper.getType<Content>(),
	{content: {src: {content: {src: {content: {body: {}}}}}}},
	null
])
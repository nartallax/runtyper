import {simplificationTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {MyArr, MyArr2, MyArr3, MyArr4, MyArr5} from "types/array"

simplificationTests.push([
	Runtyper.getType<MyArr>(),
	{type: "array", valueType: {type: "number"}, fullRefName: "/types/array:MyArr", refName: "MyArr"}
])

simplificationTests.push([
	Runtyper.getType<MyArr2>(),
	{type: "array", valueType: {type: "string"}, fullRefName: "/types/array:MyArr2", refName: "MyArr2"}
])

simplificationTests.push([
	Runtyper.getType<MyArr3>(),
	{type: "array", valueType: {type: "constant", value: null}, fullRefName: "/types/array:MyArr3", refName: "MyArr3"}
])

simplificationTests.push([
	Runtyper.getType<MyArr4>(),
	"detected broken type in file /types/array when processing export type MyArr4 = ArrayLike<5>: References to most of external types are not supported"
])

simplificationTests.push([
	Runtyper.getType<MyArr5>(),
	{type: "object", properties: {}, refName: "MyArr5", fullRefName: "/types/array:MyArr5", index: {keyType: {type: "union", types: [{type: "string"}, {type: "number"}]}, valueType: {type: "number"}}}
])
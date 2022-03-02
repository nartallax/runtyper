import {simplificationTests} from "test_project_main"
import {Runtyper} from "@nartallax/runtyper"
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
	{type: "object", properties: {length: {type: "number"}}, refName: "MyArr4", fullRefName: "/types/array:MyArr4", index: {keyType: {type: "number"}, valueType: {type: "constant", value: 5}}}
])

simplificationTests.push([
	Runtyper.getType<MyArr5>(),
	{type: "object", properties: {}, refName: "MyArr5", fullRefName: "/types/array:MyArr5", index: {keyType: {type: "union", types: [{type: "string"}, {type: "number"}]}, valueType: {type: "number"}}}
])
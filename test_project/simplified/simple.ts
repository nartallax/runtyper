import {simplifiedTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {MyString, Point, SimpleNS} from "types/simple"

simplifiedTests.push([
	Runtyper.getType<Point>(),
	{type: "object", properties: {x: {type: "number"}, y: {type: "number"}, z: {type: "union", types: [{type: "number"}, {type: "constant", value: undefined}]}}, refName: "Point", fullRefName: "/types/simple:Point"}
])

simplifiedTests.push([
	Runtyper.getType<MyString>(),
	{type: "string"}
])

simplifiedTests.push([
	Runtyper.getType<SimpleNS.MyMy>(),
	{type: "constant_union", value: ["cow", "dog"]}
])
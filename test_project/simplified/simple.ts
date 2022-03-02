import {simplificationTests} from "test_project_main"
import {Runtyper} from "@nartallax/runtyper"
import {MyString, Point, SimpleNS} from "types/simple"

simplificationTests.push([
	Runtyper.getType<Point>(),
	{type: "object", properties: {x: {type: "number"}, y: {type: "number"}, z: {type: "union", types: [{type: "number"}, {type: "constant", value: undefined}]}}, refName: "Point", fullRefName: "/types/simple:Point"}
])

simplificationTests.push([
	Runtyper.getType<MyString>(),
	{type: "string", fullRefName: "/types/simple:MyString", refName: "MyString"}
])

simplificationTests.push([
	Runtyper.getType<SimpleNS.MyMy>(),
	{type: "constant_union", value: ["cow", "dog"], fullRefName: "/types/simple:SimpleNS.MyMy", refName: "SimpleNS.MyMy"}
])
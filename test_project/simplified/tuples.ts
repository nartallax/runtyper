import {simplifiedTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {Tuple1, Tuple2, Tuple3, Tuple4, Tuple5} from "types/tuples"

simplifiedTests.push([
	Runtyper.getType<Tuple1>(),
	{type: "tuple", valueTypes: [{type: "number"}, {type: "number"}]}
])

simplifiedTests.push([
	Runtyper.getType<Tuple2>(),
	{type: "tuple", valueTypes: [{type: "number"}, {type: "number"}, {type: "rest", valueType: {type: "string"}}]}
])

simplifiedTests.push([
	Runtyper.getType<Tuple3>(),
	{type: "tuple", valueTypes: [{type: "number"}, {type: "number"}, {type: "union", types: [{type: "string"}, {type: "constant", value: undefined}]}]}
])

simplifiedTests.push([
	Runtyper.getType<Tuple4>(),
	{type: "tuple", valueTypes: [{type: "number"}, {type: "number"}, {type: "union", types: [{type: "string"}, {type: "constant", value: undefined}]}, {type: "rest", valueType: {type: "boolean"}}]}
])

simplifiedTests.push([
	Runtyper.getType<Tuple5>(),
	{type: "tuple", valueTypes: [{type: "number"}, {type: "number"}, {type: "rest", valueType: {type: "string"}}, {type: "number"}]}
])
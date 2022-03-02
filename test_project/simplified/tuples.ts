import {simplificationTests} from "test_project_main"
import {Runtyper} from "@nartallax/runtyper"
import {Tuple1, Tuple2, Tuple3, Tuple4, Tuple5, TupleVal1, TupleVal2, TupleVal3} from "types/tuples"

simplificationTests.push([
	Runtyper.getType<Tuple1>(),
	{type: "tuple", valueTypes: [{type: "number"}, {type: "number"}], fullRefName: "/types/tuples:Tuple1", refName: "Tuple1"}
])

simplificationTests.push([
	Runtyper.getType<Tuple2>(),
	{type: "tuple", valueTypes: [{type: "number"}, {type: "number"}, {type: "rest", valueType: {type: "string"}}], fullRefName: "/types/tuples:Tuple2", refName: "Tuple2"}
])

simplificationTests.push([
	Runtyper.getType<Tuple3>(),
	{type: "tuple", valueTypes: [{type: "number"}, {type: "number"}, {type: "union", types: [{type: "string"}, {type: "constant", value: undefined}]}], fullRefName: "/types/tuples:Tuple3", refName: "Tuple3"}
])

simplificationTests.push([
	Runtyper.getType<Tuple4>(),
	{type: "tuple", valueTypes: [{type: "number"}, {type: "number"}, {type: "union", types: [{type: "string"}, {type: "constant", value: undefined}]}, {type: "rest", valueType: {type: "boolean"}}], fullRefName: "/types/tuples:Tuple4", refName: "Tuple4"}
])

simplificationTests.push([
	Runtyper.getType<Tuple5>(),
	{type: "tuple", valueTypes: [{type: "number"}, {type: "number"}, {type: "rest", valueType: {type: "string"}}, {type: "number"}], fullRefName: "/types/tuples:Tuple5", refName: "Tuple5"}
])


simplificationTests.push([
	Runtyper.getType<TupleVal1>(),
	{type: "number", fullRefName: "/types/tuples:TupleVal1", refName: "TupleVal1"}
])
simplificationTests.push([
	Runtyper.getType<TupleVal2>(),
	"index access of tuples with rest notation is not supported"
])
simplificationTests.push([
	Runtyper.getType<TupleVal3>(),
	{type: "union", types: [{type: "string"}, {type: "constant", value: undefined}], fullRefName: "/types/tuples:TupleVal3", refName: "TupleVal3"}
])

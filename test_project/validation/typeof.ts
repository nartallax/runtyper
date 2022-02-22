import {validationTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {BigObjTypeof, ConstTypeof, ObjectTypeof, TupleTypeof, VarTypeof} from "types/typeof"

validationTests.push([
	Runtyper.getType<TupleTypeof>(),
	"c",
	null
])

validationTests.push([
	Runtyper.getType<TupleTypeof>(),
	"d",
	"value !== \"c\""
])

validationTests.push([
	Runtyper.getType<ObjectTypeof>(),
	"a",
	null
])

validationTests.push([
	Runtyper.getType<ObjectTypeof>(),
	"",
	"value !== \"a\""
])

validationTests.push([
	Runtyper.getType<ConstTypeof>(),
	"b",
	null
])

validationTests.push([
	Runtyper.getType<ConstTypeof>(),
	"a",
	"value !== \"b\""
])

validationTests.push([
	Runtyper.getType<VarTypeof>(),
	5,
	null
])

validationTests.push([
	Runtyper.getType<VarTypeof>(),
	0.01,
	null
])

validationTests.push([
	Runtyper.getType<VarTypeof>(),
	"0",
	"at path value"
])

validationTests.push([
	Runtyper.getType<BigObjTypeof>(),
	{a: 0, b: 0, z: {y: {x: []}}},
	null
])

validationTests.push([
	Runtyper.getType<BigObjTypeof>(),
	{a: 0, b: 0, z: {y: {x: ["niet"]}}},
	"at path value.z.y.x[0]"
])
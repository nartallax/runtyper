import {validationTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {Tuple1, Tuple2, Tuple3, Tuple4, Tuple6, TwoTuples} from "types/tuples"

validationTests.push([
	Runtyper.getType<Tuple1>(),
	[1, 2],
	null
])

validationTests.push([
	Runtyper.getType<Tuple1>(),
	[1],
	".length !== 2"
])

validationTests.push([
	Runtyper.getType<Tuple1>(),
	[1, 2, 3],
	".length !== 2"
])

validationTests.push([
	Runtyper.getType<Tuple1>(),
	{},
	"!Array.isArray"
])

validationTests.push([
	Runtyper.getType<Tuple1>(),
	"123123",
	"!Array.isArray"
])


validationTests.push([
	Runtyper.getType<Tuple2>(),
	[1, 2, "nya", "uwu"],
	null
])

validationTests.push([
	Runtyper.getType<Tuple2>(),
	[1, 2],
	null
])

validationTests.push([
	Runtyper.getType<Tuple2>(),
	[1, "uwu"],
	"at path value[1] (of type string)"
])

validationTests.push([
	Runtyper.getType<Tuple2>(),
	[1],
	".length < 2"
])

validationTests.push([
	Runtyper.getType<Tuple3>(),
	[1, 2, "nya"],
	null
])

validationTests.push([
	Runtyper.getType<Tuple3>(),
	[1, 2, undefined],
	null
])

validationTests.push([
	Runtyper.getType<Tuple3>(),
	[1, 2],
	null
])

validationTests.push([
	Runtyper.getType<Tuple3>(),
	[1],
	"tuple.length < 2 || tuple.length > 3"
])

validationTests.push([
	Runtyper.getType<Tuple3>(),
	[1, 2, 3, 4],
	"tuple.length < 2 || tuple.length > 3"
])

validationTests.push([
	Runtyper.getType<Tuple3>(),
	[1, 2, 3],
	"at path value[2] (of type number)"
])


validationTests.push([
	Runtyper.getType<Tuple4>(),
	[1, 2],
	null
])

validationTests.push([
	Runtyper.getType<Tuple4>(),
	[1, 2, "nya"],
	null
])

validationTests.push([
	Runtyper.getType<Tuple4>(),
	[1, 2, "nya", false, true, false, true],
	null
])

validationTests.push([
	Runtyper.getType<Tuple4>(),
	[1, 2, undefined, false, true, false, true],
	null
])

validationTests.push([
	Runtyper.getType<Tuple4>(),
	[1, 2, false, true, false, true],
	"at path value[2] (of type boolean)"
])

validationTests.push([
	Runtyper.getType<Tuple4>(),
	[1],
	".length < 2"
])


validationTests.push([
	Runtyper.getType<Tuple6>(),
	[1, 2, 3],
	null
])

validationTests.push([
	Runtyper.getType<Tuple6>(),
	[1, 2],
	".length < 3"
])

validationTests.push([
	Runtyper.getType<Tuple6>(),
	[1, 2, 3, 4],
	"value at path value[2] (of type number)"
])

validationTests.push([
	Runtyper.getType<Tuple6>(),
	[1, 2, "nya", 4],
	null
])

validationTests.push([
	Runtyper.getType<Tuple6>(),
	[1, 2, "nya", "uwu", "owo", "yBy", 4],
	null
])



validationTests.push([
	Runtyper.getType<TwoTuples>(),
	[1, "nya"],
	null
])

validationTests.push([
	Runtyper.getType<TwoTuples>(),
	[false, false, null],
	null
])

validationTests.push([
	Runtyper.getType<TwoTuples>(),
	[false, false, null, null],
	"at path value"
])

validationTests.push([
	Runtyper.getType<TwoTuples>(),
	[false, false],
	"at path value"
])
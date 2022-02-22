import {validationTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {MyArr, MyArr2, MyArr3} from "types/array"

validationTests.push([
	Runtyper.getType<MyArr>(),
	[1, 2, 3, 4, 5],
	null
])

validationTests.push([
	Runtyper.getType<MyArr>(),
	NaN,
	"bad value at path value (of type number)"
])

validationTests.push([
	Runtyper.getType<MyArr>(),
	5,
	"bad value at path value (of type number)"
])

validationTests.push([
	Runtyper.getType<MyArr>(),
	{"0": 5},
	"bad value at path value (of type object)"
])

validationTests.push([
	Runtyper.getType<MyArr>(),
	[1, 2, 3, 4, NaN],
	"bad value at path value[4] (of type number)"
])

validationTests.push([
	Runtyper.getType<MyArr>(),
	[],
	null
])

validationTests.push([
	Runtyper.getType<MyArr>(),
	["nya"],
	"bad value at path value[0] (of type string)"
])

validationTests.push([
	Runtyper.getType<number[]>(),
	[1, 2, 3, 4, 5],
	null
])

validationTests.push([
	Runtyper.getType<number[]>(),
	[1, 2, null, 4, 5],
	"bad value at path value[2] (of type object)"
])


validationTests.push([
	Runtyper.getType<MyArr2>(),
	["nya", "nya-nya"],
	null
])

validationTests.push([
	Runtyper.getType<MyArr2>(),
	["", 1],
	"bad value at path value[1] (of type number)"
])


validationTests.push([
	Runtyper.getType<MyArr3>(),
	[],
	null
])

validationTests.push([
	Runtyper.getType<MyArr3>(),
	[null, null, null, null],
	null
])

validationTests.push([
	Runtyper.getType<MyArr3>(),
	// eslint-disable-next-line no-sparse-arrays
	[null, , null],
	"bad value at path value[1] (of type undefined)"
])

validationTests.push([
	Runtyper.getType<MyArr3>(),
	[null, undefined, null],
	"bad value at path value[1] (of type undefined)"
])

validationTests.push([
	Runtyper.getType<MyArr3>(),
	[null, false, null],
	"bad value at path value[1] (of type boolean)"
])
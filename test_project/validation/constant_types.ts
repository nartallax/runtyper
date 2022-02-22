import {validationTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {AnswerToEverything, Fraction, MyDogName, MyFalse, MyUndefined, Quality} from "types/constant_types"

validationTests.push([
	Runtyper.getType<MyFalse>(),
	false,
	null
])

validationTests.push([
	Runtyper.getType<MyFalse>(),
	true,
	"bad value at path value (of type boolean)"
])

validationTests.push([
	Runtyper.getType<MyUndefined>(),
	null,
	"bad value at path value (of type object)"
])

validationTests.push([
	Runtyper.getType<MyUndefined>(),
	undefined,
	null
])

validationTests.push([
	Runtyper.getType<AnswerToEverything>(),
	42,
	null
])

validationTests.push([
	Runtyper.getType<AnswerToEverything>(),
	43,
	"bad value at path value (of type number)"
])

validationTests.push([
	Runtyper.getType<AnswerToEverything>(),
	{},
	"bad value at path value (of type object)"
])

validationTests.push([
	Runtyper.getType<MyDogName>(),
	"doggie",
	"bad value at path value (of type string)"
])

validationTests.push([
	Runtyper.getType<MyDogName>(),
	"I have\" \\ no dog!",
	null
])

validationTests.push([
	Runtyper.getType<Quality>(),
	null,
	null
])


validationTests.push([
	Runtyper.getType<Quality>(),
	2,
	null
])

validationTests.push([
	Runtyper.getType<Quality>(),
	"2",
	"bad value at path value (of type string)"
])

validationTests.push([
	Runtyper.getType<Quality>(),
	"absolutely_perfect",
	null
])

validationTests.push([
	Runtyper.getType<Quality>(),
	[],
	"bad value at path value (of type object)"
])

validationTests.push([
	Runtyper.getType<Fraction>(),
	1,
	"bad value at path value (of type number)"
])

validationTests.push([
	Runtyper.getType<Fraction>(),
	-0.3,
	null
])
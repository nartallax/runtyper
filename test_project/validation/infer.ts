import {validationTests} from "test_project_main"
import {Runtyper} from "@nartallax/runtyper"
import {NullOrFive, ThisShouldBeNumber} from "types/infer"

validationTests.push([
	Runtyper.getType<ThisShouldBeNumber>(),
	5,
	null
])

validationTests.push([
	Runtyper.getType<NullOrFive>(),
	5,
	null
])

validationTests.push([
	Runtyper.getType<NullOrFive>(),
	null,
	null
])

validationTests.push([
	Runtyper.getType<NullOrFive>(),
	6,
	"bad value at path value (of type number)"
])

validationTests.push([
	Runtyper.getType<NullOrFive>(),
	{},
	"bad value at path value (of type object)"
])
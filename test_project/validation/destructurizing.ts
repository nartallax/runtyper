import {validationTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {NamedDestrA} from "types/destructurizing"

validationTests.push([
	Runtyper.getType<NamedDestrA>(),
	{x: 5, y: 10},
	null
])

validationTests.push([
	Runtyper.getType<NamedDestrA>(),
	{x: 5, y: 10, z: 15},
	"unknown field found"
])

validationTests.push([
	Runtyper.getType<NamedDestrA>(),
	{y: 10},
	"bad value at path value.x (of type undefined)"
])
import {validationTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {Car} from "types/fields_and_dtos"

validationTests.push([
	Runtyper.getType<Car>(),
	null,
	"bad value at path value (of type object)"
])

validationTests.push([
	Runtyper.getType<Car>(),
	{model: "x5", color: "red", manufacturingDate: 5},
	null
])

validationTests.push([
	Runtyper.getType<Car>(),
	{model: "x5", color: "red", manufacturingDate: 5, stateNum: "owo"},
	"!(\"stateNum\" in obj)"
])

validationTests.push([
	Runtyper.getType<{model: "123", color: "123", manufacturingDate: 123}>(),
	{model: "x5", color: "red", manufacturingDate: 5},
	"bad value at path value.model (of type string)"
])

validationTests.push([
	Runtyper.getType<{model: string, color: string, manufacturingDate: number}>(),
	{model: "x5", color: "red", manufacturingDate: 5},
	null
])
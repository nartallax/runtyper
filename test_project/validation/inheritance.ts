import {validationTests} from "test_project_main"
import {Runtyper} from "@nartallax/runtyper"
import {C, NameWithValue} from "types/inheritance"

validationTests.push([
	Runtyper.getType<C>(),
	{x: 1, y: 2, z: -1},
	null
])

validationTests.push([
	Runtyper.getType<C>(),
	{x: 1, z: -1},
	null
])

validationTests.push([
	Runtyper.getType<C>(),
	{x: 1, y: undefined, z: -1},
	null
])

validationTests.push([
	Runtyper.getType<C>(),
	{x: 1, y: "nya", z: -1},
	"bad value at path value.y (of type string)"
])

validationTests.push([
	Runtyper.getType<NameWithValue>(),
	{isNameWithValue: true, name: "bobby", value: "nya"},
	null
])

validationTests.push([
	Runtyper.getType<NameWithValue>(),
	{isNameWithValue: true, name: "bobby", value: 5},
	"ad value at path value.value (of type number)"
])

validationTests.push([
	Runtyper.getType<NameWithValue>(),
	{isNameWithValue: true, name: "bobby"},
	"bad value at path value.value (of type undefined)"
])

validationTests.push([
	Runtyper.getType<NameWithValue>(),
	{isNameWithValue: true, name: false, value: "nya"},
	"bad value at path value.name (of type boolean)"
])

validationTests.push([
	Runtyper.getType<NameWithValue>(),
	{isNameWithValue: true, name: "nya", value: "nya", isThisPossible: true},
	null
])
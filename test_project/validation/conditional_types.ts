import {validationTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {NamedZ} from "types/conditional_types"

validationTests.push([
	Runtyper.getType<NamedZ>(),
	{z: 5, name: "5"},
	null
])

validationTests.push([
	Runtyper.getType<NamedZ>(),
	{x: 10, z: 5, name: "5"},
	"bad value at path value.x (of type number): failed at expression <unknown field found>"
])

validationTests.push([
	Runtyper.getType<NamedZ>(),
	{z: 5, name: 10},
	"bad value at path value.name (of type number)"
])

validationTests.push([
	Runtyper.getType<NamedZ>(),
	{name: "5"},
	"bad value at path value.z (of type undefined)"
])

validationTests.push([
	Runtyper.getType<NamedZ>(),
	{z: 5},
	"bad value at path value.name (of type undefined)"
])

validationTests.push([
	Runtyper.getType<NamedZ>(),
	null,
	"bad value at path value (of type object)"
])

validationTests.push([
	Runtyper.getType<NamedZ>(),
	"yay",
	"bad value at path value (of type string)"
])

validationTests.push([
	Runtyper.getType<NamedZ>(),
	[],
	"bad value at path value (of type object)"
])
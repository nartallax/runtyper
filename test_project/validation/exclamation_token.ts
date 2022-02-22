import {validationTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {ThisShoultBeNever, XNoNull, ZNoEmptyVal} from "values/exclamation_token"

validationTests.push([
	Runtyper.getType<XNoNull>(),
	null,
	"bad value at path value (of type object)"
])

validationTests.push([
	Runtyper.getType<XNoNull>(),
	5,
	null
])

validationTests.push([
	Runtyper.getType<ThisShoultBeNever>(),
	undefined,
	"bad value at path value (of type undefined)"
])

validationTests.push([
	Runtyper.getType<ZNoEmptyVal>(),
	null,
	"bad value at path value (of type object)"
])

validationTests.push([
	Runtyper.getType<ZNoEmptyVal>(),
	undefined,
	"bad value at path value (of type undefined)"
])

validationTests.push([
	Runtyper.getType<ZNoEmptyVal>(),
	false,
	null
])
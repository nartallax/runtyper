import {simplifiedTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {NullOrFive, ThisShouldBeNumber} from "types/infer"
import {ThisShouldBeBoolean, ThisShouldBeBoolean4, ThisShouldBeBoolean5, ThisShouldBeNullOrString, ThisShouldBeStringOrBoolean} from "knowingly_broken/infers_bad"

simplifiedTests.push([
	Runtyper.getType<ThisShouldBeNumber>(),
	{type: "number"}
])

simplifiedTests.push([
	Runtyper.getType<NullOrFive>(),
	{type: "constant_union", value: [5, null]}
])


simplifiedTests.push([
	Runtyper.getType<ThisShouldBeStringOrBoolean>(),
	"only simple types are supported as reference type arguments in `extends` part of conditional expression"
])


simplifiedTests.push([
	Runtyper.getType<ThisShouldBeNullOrString>(),
	"nferring anything from unions is not supported"
])

simplifiedTests.push([
	Runtyper.getType<ThisShouldBeBoolean>(),
	"inferring anything from unions is not supported"
])

simplifiedTests.push([
	Runtyper.getType<ThisShouldBeBoolean4>(),
	"inferring anything from unions is not supported"
])

simplifiedTests.push([
	Runtyper.getType<ThisShouldBeBoolean5>(),
	"inferring anything from unions is not supported"
])
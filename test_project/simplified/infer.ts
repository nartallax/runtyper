import {simplificationTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {NullOrFive, ThisShouldBeNumber} from "types/infer"
import {ThisShouldBeBoolean, ThisShouldBeBoolean4, ThisShouldBeBoolean5, ThisShouldBeNullOrString, ThisShouldBeStringOrBoolean} from "knowingly_broken/infers_bad"

simplificationTests.push([
	Runtyper.getType<ThisShouldBeNumber>(),
	{type: "number", fullRefName: "/types/infer:ThisShouldBeNumber", refName: "ThisShouldBeNumber"}
])

simplificationTests.push([
	Runtyper.getType<NullOrFive>(),
	{type: "constant_union", value: [5, null], fullRefName: "/types/infer:NullOrFive", refName: "NullOrFive"}
])


simplificationTests.push([
	Runtyper.getType<ThisShouldBeStringOrBoolean>(),
	"only simple types are supported as reference type arguments in `extends` part of conditional expression"
])


simplificationTests.push([
	Runtyper.getType<ThisShouldBeNullOrString>(),
	"nferring anything from unions is not supported"
])

simplificationTests.push([
	Runtyper.getType<ThisShouldBeBoolean>(),
	"inferring anything from unions is not supported"
])

simplificationTests.push([
	Runtyper.getType<ThisShouldBeBoolean4>(),
	"inferring anything from unions is not supported"
])

simplificationTests.push([
	Runtyper.getType<ThisShouldBeBoolean5>(),
	"inferring anything from unions is not supported"
])
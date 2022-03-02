import {simplificationTests} from "test_project_main"
import {Runtyper} from "@nartallax/runtyper"
import {QwertNoEmptyVal, RewqInlineNoEmptyVal, RewqNoEmptyVal, ThisShoultBeNever, XNoNull, YNoUndef, ZConstNoEmptyVal, ZNoEmptyVal} from "values/exclamation_token"

simplificationTests.push([
	Runtyper.getType<XNoNull>(),
	{type: "number", fullRefName: "/values/exclamation_token:XNoNull", refName: "XNoNull"}
])
simplificationTests.push([
	Runtyper.getType<YNoUndef>(),
	{type: "string", fullRefName: "/values/exclamation_token:YNoUndef", refName: "YNoUndef"}
])
simplificationTests.push([
	Runtyper.getType<ZNoEmptyVal>(),
	{type: "boolean", fullRefName: "/values/exclamation_token:ZNoEmptyVal", refName: "ZNoEmptyVal"}
])
simplificationTests.push([
	Runtyper.getType<ZConstNoEmptyVal>(),
	{type: "constant", value: false, fullRefName: "/values/exclamation_token:ZConstNoEmptyVal", refName: "ZConstNoEmptyVal"}
])
simplificationTests.push([
	Runtyper.getType<QwertNoEmptyVal>(),
	{type: "constant", value: 5, fullRefName: "/values/exclamation_token:QwertNoEmptyVal", refName: "QwertNoEmptyVal"}
])
simplificationTests.push([
	Runtyper.getType<RewqNoEmptyVal>(),
	{type: "constant", value: 5, fullRefName: "/values/exclamation_token:RewqNoEmptyVal", refName: "RewqNoEmptyVal"}
])
simplificationTests.push([
	Runtyper.getType<RewqInlineNoEmptyVal>(),
	{type: "constant", value: 5, fullRefName: "/values/exclamation_token:RewqInlineNoEmptyVal", refName: "RewqInlineNoEmptyVal"}
])
simplificationTests.push([
	Runtyper.getType<ThisShoultBeNever>(),
	{type: "never", fullRefName: "/values/exclamation_token:ThisShoultBeNever", refName: "ThisShoultBeNever"}
])
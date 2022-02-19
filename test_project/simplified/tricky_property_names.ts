import {simplificationTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {TrickyProperties} from "types/tricky_property_names"

simplificationTests.push([
	Runtyper.getType<TrickyProperties>(),
	{type: "object", properties: {"5": {type: "number"}, "[propname]": {type: "number"}, ыыыы: {type: "number"}, "\"": {type: "number"}, "\"\"": {type: "number"}, "\\": {type: "number"}, "\\\"": {type: "number"}, "0.5": {type: "number"}, "0.05": {type: "number"}, "0.005": {type: "number"}, "0.0005": {type: "number"}, "0.00005": {type: "number"}, "0.000005": {type: "number"}, "5e-7": {type: "number"}, "5e-8": {type: "number"}, "5e-9": {type: "number"}, "5e+22": {type: "number"}}, refName: "TrickyProperties", fullRefName: "/types/tricky_property_names:TrickyProperties"}
])
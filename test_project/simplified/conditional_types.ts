import {simplificationTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {NamedZ} from "types/conditional_types"

simplificationTests.push([
	Runtyper.getType<NamedZ>(),
	{type: "object", properties: {z: {type: "number"}, name: {type: "string"}}, refName: "NamedZ", fullRefName: "/types/conditional_types:NamedZ"}
])
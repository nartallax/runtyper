import {simplifiedTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {NamedZ} from "types/conditional_types"

simplifiedTests.push([
	Runtyper.getType<NamedZ>(),
	{type: "object", properties: {z: {type: "number"}, name: {type: "string"}}, refName: "NamedZ", fullRefName: "/types/conditional_types:NamedZ"}
])
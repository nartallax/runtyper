import {simplifiedTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {Img} from "types/recursive_type"

simplifiedTests.push([
	Runtyper.getType<Img>(),
	{type: "object", properties: {x: {type: "number"}, y: {type: "number"}, z: {type: "union", types: [{type: "number"}, {type: "constant", value: undefined}]}}}
])
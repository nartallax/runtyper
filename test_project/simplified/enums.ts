import {simplifiedTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {DirectionOrNamed} from "types/enums"

simplifiedTests.push([
	Runtyper.getType<DirectionOrNamed>(),
	{type: "constant_union", value: [0, 1, 2, 3, 4, "sss"]}
])
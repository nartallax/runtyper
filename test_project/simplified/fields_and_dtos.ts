import {simplifiedTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {Car} from "types/fields_and_dtos"

simplifiedTests.push([
	Runtyper.getType<Car>(),
	{type: "object", properties: {color: {type: "string"}, manufacturingDate: {type: "number"}, model: {type: "string"}}}
])
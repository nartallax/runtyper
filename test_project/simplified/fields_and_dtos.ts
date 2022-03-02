import {simplificationTests} from "test_project_main"
import {Runtyper} from "@nartallax/runtyper"
import {Car} from "types/fields_and_dtos"

simplificationTests.push([
	Runtyper.getType<Car>(),
	{type: "object", properties: {color: {type: "string", fullRefName: "/types/fields_and_dtos:FieldType</types/fields_and_dtos:FieldDefinition<string>>", refName: "FieldType<FieldDefinition<string>>"}, manufacturingDate: {type: "number", fullRefName: "/types/fields_and_dtos:FieldType</types/fields_and_dtos:FieldDefinition<number>>", refName: "FieldType<FieldDefinition<number>>"}, model: {type: "string", fullRefName: "/types/fields_and_dtos:FieldType</types/fields_and_dtos:FieldDefinition<string>>", refName: "FieldType<FieldDefinition<string>>"}}, fullRefName: "/types/fields_and_dtos:Car", refName: "Car"}
])
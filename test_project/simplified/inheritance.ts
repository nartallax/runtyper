import {simplificationTests} from "test_project_main"
import {Runtyper} from "@nartallax/runtyper"
import {NameWithValue, WrappedNamedNumber} from "types/inheritance"

simplificationTests.push([
	Runtyper.getType<WrappedNamedNumber>(),
	{type: "object", properties: {value: {type: "number"}, name: {type: "union", types: [{type: "string"}, {type: "constant", value: undefined}]}, isNumber: {type: "constant", value: true}}, refName: "WrappedNamedNumber", fullRefName: "/types/inheritance:WrappedNamedNumber"}
])

simplificationTests.push([
	Runtyper.getType<NameWithValue>(),
	{type: "object", properties: {name: {type: "string"}, value: {type: "string"}, isNameWithValue: {type: "constant", value: true}}, index: {keyType: {type: "string"}, valueType: {type: "union", types: [{type: "string"}, {type: "boolean"}]}}, refName: "NameWithValue", fullRefName: "/types/inheritance:NameWithValue"}

])
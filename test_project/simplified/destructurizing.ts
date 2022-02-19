import {simplificationTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {MixedTypeD, NamedDestrA, NamedDestrX, RenamedTypeC, RestZ, TypeFromArrayDestr1, TypeFromArrayDestr2, TypeFromObjDestr1, TypeFromObjDestr2} from "types/destructurizing"

simplificationTests.push([
	Runtyper.getType<TypeFromObjDestr1>(),
	{type: "number", fullRefName: "/types/destructurizing:TypeFromObjDestr1", refName: "TypeFromObjDestr1"}
])
simplificationTests.push([
	Runtyper.getType<TypeFromObjDestr2>(),
	{type: "number", fullRefName: "/types/destructurizing:TypeFromObjDestr2", refName: "TypeFromObjDestr2"}
])
simplificationTests.push([
	Runtyper.getType<TypeFromArrayDestr1>(),
	{type: "string", fullRefName: "/types/destructurizing:TypeFromArrayDestr1", refName: "TypeFromArrayDestr1"}
])
simplificationTests.push([
	Runtyper.getType<TypeFromArrayDestr2>(),
	"when the variable is destructurized, array value may or may not infer to a tuple type"
])
simplificationTests.push([
	Runtyper.getType<RenamedTypeC>(),
	{type: "number", fullRefName: "/types/destructurizing:RenamedTypeC", refName: "RenamedTypeC"}
])
simplificationTests.push([
	Runtyper.getType<MixedTypeD>(),
	"when the variable is destructurized, array value may or may not infer to a tuple type"
])
simplificationTests.push([
	Runtyper.getType<RestZ>(),
	"when the variable is destructurized, array value may or may not infer to a tuple type"
])

simplificationTests.push([
	Runtyper.getType<NamedDestrX>(),
	{type: "number", fullRefName: "/types/destructurizing:NamedDestrX", refName: "NamedDestrX"}
])
simplificationTests.push([
	Runtyper.getType<NamedDestrA>(),
	{type: "object", properties: {x: {type: "number"}, y: {type: "number"}}, refName: "NamedDestrA", fullRefName: "/types/destructurizing:NamedDestrA"}
])
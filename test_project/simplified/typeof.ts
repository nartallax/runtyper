import {simplificationTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {BigObjTypeof, ConstTypeof, DestructuredVarType, NamespacedObjectType, ObjectTypeof, TupleTypeof, VarTypeof} from "types/typeof"

simplificationTests.push([
	Runtyper.getType<TupleTypeof>(),
	{type: "constant", value: "c", fullRefName: "/types/typeof:TupleTypeof", refName: "TupleTypeof"}
])

simplificationTests.push([
	Runtyper.getType<ObjectTypeof>(),
	{type: "constant", value: "a", fullRefName: "/types/typeof:ObjectTypeof", refName: "ObjectTypeof"}
])

simplificationTests.push([
	Runtyper.getType<ConstTypeof>(),
	{type: "constant", value: "b", fullRefName: "/types/typeof:ConstTypeof", refName: "ConstTypeof"}
])

simplificationTests.push([
	Runtyper.getType<VarTypeof>(),
	{type: "number", fullRefName: "/types/typeof:VarTypeof", refName: "VarTypeof"}
])

simplificationTests.push([
	Runtyper.getType<BigObjTypeof>(),
	{type: "object", properties: {a: {type: "number"}, b: {type: "number"}, z: {type: "object", properties: {y: {type: "object", properties: {x: {type: "array", valueType: {type: "number"}}}}}}}, fullRefName: "/types/typeof:BigObjTypeof", refName: "BigObjTypeof"}
])

simplificationTests.push([
	Runtyper.getType<NamespacedObjectType>(),
	{type: "constant", value: "a", fullRefName: "/types/typeof:NamespacedObjectType", refName: "NamespacedObjectType"}
])

simplificationTests.push([
	Runtyper.getType<DestructuredVarType>(),
	{type: "number", fullRefName: "/types/typeof:DestructuredVarType", refName: "DestructuredVarType"}
])
import {simplifiedTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {BigObjTypeof, ConstTypeof, DestructuredVarType, NamespacedObjectType, ObjectTypeof, TupleTypeof, VarTypeof} from "types/typeof"

simplifiedTests.push([
	Runtyper.getType<TupleTypeof>(),
	{type: "constant", value: "c"}
])

simplifiedTests.push([
	Runtyper.getType<ObjectTypeof>(),
	{type: "constant", value: "a"}
])

simplifiedTests.push([
	Runtyper.getType<ConstTypeof>(),
	{type: "constant", value: "b"}
])

simplifiedTests.push([
	Runtyper.getType<VarTypeof>(),
	{type: "number"}
])

simplifiedTests.push([
	Runtyper.getType<BigObjTypeof>(),
	{type: "object", properties: {a: {type: "number"}, b: {type: "number"}, z: {type: "object", properties: {y: {type: "object", properties: {x: {type: "array", valueType: {type: "number"}}}}}}}}
])

simplifiedTests.push([
	Runtyper.getType<NamespacedObjectType>(),
	{type: "constant", value: "a"}
])

simplifiedTests.push([
	Runtyper.getType<DestructuredVarType>(),
	{type: "number"}
])
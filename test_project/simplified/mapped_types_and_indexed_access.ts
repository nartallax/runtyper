import {simplifiedTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {C, constFromMappedTypeFile, MappedPoint, MyRecordCopyA, MyRecordCopyB, MyRecordCopyBB, OptCopiedPoint, PointCopy, PointStupidCopy, PointY, XPoint, XXPoint, ZOfPoint} from "types/mapped_types_and_indexed_access"


simplifiedTests.push([
	Runtyper.getType<PointCopy>(),
	{type: "object", properties: {x: {type: "number"}, y: {type: "number"}}, moduleName: "/types/mapped_types_and_indexed_access", refName: "PointCopy"}
])

simplifiedTests.push([
	Runtyper.getType<PointStupidCopy>(),
	{type: "object", properties: {x: {type: "number"}, y: {type: "number"}}, moduleName: "/types/mapped_types_and_indexed_access", refName: "PointStupidCopy"}
])

simplifiedTests.push([
	Runtyper.getType<PointY>(),
	{type: "number"}
])

simplifiedTests.push([
	Runtyper.getType<MappedPoint>(),
	{type: "object", properties: {x: {type: "number"}, y: {type: "number"}}, moduleName: "/types/mapped_types_and_indexed_access", refName: "MappedPoint"}
])

simplifiedTests.push([
	Runtyper.getType<ZOfPoint>(),
	{type: "union", types: [{type: "number"}, {type: "constant", value: undefined}]}
])

simplifiedTests.push([
	Runtyper.getType<MyRecordCopyA>(),
	{type: "object", properties: {x: {type: "number"}}, index: {keyType: {type: "string"}, valueType: {type: "number"}}, moduleName: "/types/mapped_types_and_indexed_access", refName: "MyRecordCopyA"}
])

simplifiedTests.push([
	Runtyper.getType<MyRecordCopyB>(),
	{type: "object", properties: {}, index: {keyType: {type: "string"}, valueType: {type: "string"}}, moduleName: "/types/mapped_types_and_indexed_access", refName: "MyRecordCopyB"}

])

simplifiedTests.push([
	Runtyper.getType<MyRecordCopyBB>(),
	{type: "object", properties: {}, index: {keyType: {type: "string"}, valueType: {type: "boolean"}}, moduleName: "/types/mapped_types_and_indexed_access", refName: "MyRecordCopyBB"}

])

simplifiedTests.push([
	Runtyper.getType<XPoint>(),
	{type: "object", properties: {z: {type: "object", properties: {i: {type: "object", properties: {j: {type: "object", properties: {x: {type: "number"}, y: {type: "number"}}}}}}}}, refName: "XPoint", moduleName: "/types/mapped_types_and_indexed_access"}
])

simplifiedTests.push([
	Runtyper.getType<XXPoint>(),
	{type: "object", properties: {x: {type: "object", properties: {z: {type: "object", properties: {i: {type: "object", properties: {j: {type: "union", types: [{type: "number"}, {type: "constant", value: undefined}]}}}}}}}, y: {type: "object", properties: {z: {type: "object", properties: {i: {type: "object", properties: {j: {type: "union", types: [{type: "number"}, {type: "constant", value: undefined}]}}}}}}}}, moduleName: "/types/mapped_types_and_indexed_access", refName: "XXPoint"}
])


simplifiedTests.push([
	Runtyper.getType<OptCopiedPoint>(),
	{type: "object", properties: {x: {type: "union", types: [{type: "number"}, {type: "constant", value: undefined}]}, y: {type: "union", types: [{type: "number"}, {type: "constant", value: undefined}]}}, moduleName: "/types/mapped_types_and_indexed_access", refName: "OptCopiedPoint"}
])

simplifiedTests.push([
	Runtyper.getType<C>(),
	{type: "union", types: [{type: "object", properties: {a: {type: "number"}}, refName: "A<number>", moduleName: "/types/mapped_types_and_indexed_access"}, {type: "object", properties: {b: {type: "string"}}, refName: "B<string>", moduleName: "/types/mapped_types_and_indexed_access"}]}
])

simplifiedTests.push([
	Runtyper.getType<typeof constFromMappedTypeFile>(),
	{type: "object", properties: {a: {type: "string"}}, refName: "A<string>", moduleName: "/types/mapped_types_and_indexed_access"}
])
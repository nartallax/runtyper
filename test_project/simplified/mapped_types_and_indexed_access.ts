import {simplificationTests} from "test_project_main"
import {Runtyper} from "@nartallax/runtyper"
import {C, constFromMappedTypeFile, MappedPoint, MyRecordCopyA, MyRecordCopyB, MyRecordCopyBB, OptCopiedPoint, PointCopy, PointStupidCopy, PointY, XPoint, XXPoint, ZOfPoint} from "types/mapped_types_and_indexed_access"


simplificationTests.push([
	Runtyper.getType<PointCopy>(),
	{type: "object", properties: {x: {type: "number"}, y: {type: "number"}}, fullRefName: "/types/mapped_types_and_indexed_access:PointCopy", refName: "PointCopy"}
])

simplificationTests.push([
	Runtyper.getType<PointStupidCopy>(),
	{type: "object", properties: {x: {type: "number"}, y: {type: "number"}}, fullRefName: "/types/mapped_types_and_indexed_access:PointStupidCopy", refName: "PointStupidCopy"}
])

simplificationTests.push([
	Runtyper.getType<PointY>(),
	{type: "number", fullRefName: "/types/mapped_types_and_indexed_access:PointY", refName: "PointY"}
])

simplificationTests.push([
	Runtyper.getType<MappedPoint>(),
	{type: "object", properties: {x: {type: "number"}, y: {type: "number"}}, fullRefName: "/types/mapped_types_and_indexed_access:MappedPoint", refName: "MappedPoint"}
])

simplificationTests.push([
	Runtyper.getType<ZOfPoint>(),
	{type: "union", types: [{type: "number"}, {type: "constant", value: undefined}], fullRefName: "/types/mapped_types_and_indexed_access:ZOfPoint", refName: "ZOfPoint"}
])

simplificationTests.push([
	Runtyper.getType<MyRecordCopyA>(),
	{type: "object", properties: {x: {type: "number"}}, index: {keyType: {type: "string"}, valueType: {type: "number"}}, fullRefName: "/types/mapped_types_and_indexed_access:MyRecordCopyA", refName: "MyRecordCopyA"}
])

simplificationTests.push([
	Runtyper.getType<MyRecordCopyB>(),
	{type: "object", properties: {}, index: {keyType: {type: "string"}, valueType: {type: "string"}}, fullRefName: "/types/mapped_types_and_indexed_access:MyRecordCopyB", refName: "MyRecordCopyB"}

])

simplificationTests.push([
	Runtyper.getType<MyRecordCopyBB>(),
	{type: "object", properties: {}, index: {keyType: {type: "string"}, valueType: {type: "boolean"}}, fullRefName: "/types/mapped_types_and_indexed_access:MyRecordCopyBB", refName: "MyRecordCopyBB"}

])

simplificationTests.push([
	Runtyper.getType<XPoint>(),
	{type: "object", properties: {z: {type: "object", properties: {i: {type: "object", properties: {j: {type: "object", properties: {x: {type: "number"}, y: {type: "number"}}}}}}}}, refName: "XPoint", fullRefName: "/types/mapped_types_and_indexed_access:XPoint"}
])

simplificationTests.push([
	Runtyper.getType<XXPoint>(),
	{type: "object", properties: {x: {type: "object", properties: {z: {type: "object", properties: {i: {type: "object", properties: {j: {type: "union", types: [{type: "number"}, {type: "constant", value: undefined}]}}}}}}}, y: {type: "object", properties: {z: {type: "object", properties: {i: {type: "object", properties: {j: {type: "union", types: [{type: "number"}, {type: "constant", value: undefined}]}}}}}}}}, fullRefName: "/types/mapped_types_and_indexed_access:XXPoint", refName: "XXPoint"}
])


simplificationTests.push([
	Runtyper.getType<OptCopiedPoint>(),
	{type: "object", properties: {x: {type: "union", types: [{type: "number"}, {type: "constant", value: undefined}]}, y: {type: "union", types: [{type: "number"}, {type: "constant", value: undefined}]}}, fullRefName: "/types/mapped_types_and_indexed_access:OptCopiedPoint", refName: "OptCopiedPoint"}
])

simplificationTests.push([
	Runtyper.getType<C>(),
	{type: "union", types: [{type: "object", properties: {a: {type: "number"}}, refName: "A<number>", fullRefName: "/types/mapped_types_and_indexed_access:A<number>"}, {type: "object", properties: {b: {type: "string"}}, refName: "B<string>", fullRefName: "/types/mapped_types_and_indexed_access:B<string>"}], fullRefName: "/types/mapped_types_and_indexed_access:C", refName: "C"}
])

simplificationTests.push([
	Runtyper.getType<typeof constFromMappedTypeFile>(),
	{type: "object", properties: {a: {type: "string"}}, refName: "A<string>", fullRefName: "/types/mapped_types_and_indexed_access:A<string>"}
])
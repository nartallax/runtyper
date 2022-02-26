import {validationTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {C, MappedPoint, OptCopiedPoint, PointCopy, PointStupidCopy, PointY, XPoint, XXPoint} from "types/mapped_types_and_indexed_access"

validationTests.push([
	Runtyper.getType<PointCopy>(),
	{x: 1, y: 2},
	null
])

validationTests.push([
	Runtyper.getType<PointCopy>(),
	{x: 1, z: 2},
	"bad value at path value.y (of type undefined)"
])

validationTests.push([
	Runtyper.getType<PointStupidCopy>(),
	{x: 1, y: 2},
	null
])

validationTests.push([
	Runtyper.getType<PointStupidCopy>(),
	{x: 1, z: 2},
	"bad value at path value.y (of type undefined)"
])

validationTests.push([
	Runtyper.getType<PointY>(),
	5,
	null
])

validationTests.push([
	Runtyper.getType<MappedPoint>(),
	{x: 5, y: 10},
	null
])

validationTests.push([
	Runtyper.getType<MappedPoint>(),
	{x: 5, y: 10, z: 15},
	"bad value at path value.z (of type number)"
])

validationTests.push([
	Runtyper.getType<MappedPoint>(),
	{x: 5},
	"bad value at path value.y (of type undefined)"
])

validationTests.push([
	Runtyper.getType<OptCopiedPoint>(),
	{x: 5, y: 10},
	null
])

validationTests.push([
	Runtyper.getType<OptCopiedPoint>(),
	{x: 5},
	null
])

validationTests.push([
	Runtyper.getType<OptCopiedPoint>(),
	{y: 10},
	null
])

validationTests.push([
	Runtyper.getType<OptCopiedPoint>(),
	{},
	null
])

validationTests.push([
	Runtyper.getType<OptCopiedPoint>(),
	null,
	"bad value at path value (of type object)"
])

validationTests.push([
	Runtyper.getType<OptCopiedPoint>(),
	[],
	"bad value at path value (of type object)"
])

validationTests.push([
	Runtyper.getType<C>(),
	{a: 5},
	null
])

validationTests.push([
	Runtyper.getType<C>(),
	{b: "nya-nya"},
	null
])

validationTests.push([
	Runtyper.getType<C>(),
	{},
	"bad value at path value.b (of type undefined): failed at expression typeof(obj.b) !== \"string\""
])

validationTests.push([
	Runtyper.getType<C>(),
	{a: 5, b: "uwu"},
	"<unknown field found>"
])

validationTests.push([
	Runtyper.getType<XPoint>(),
	{z: {i: {j: {x: 5, y: 10}}}},
	null
])

validationTests.push([
	Runtyper.getType<XPoint>(),
	{z: {i: {j: {x: 5, y: 10, z: 15}}}},
	"at path value.z.i.j.z"
])


validationTests.push([
	Runtyper.getType<XXPoint>(),
	{x: {z: {i: {j: 5}}}, y: {z: {i: {j: 10}}}},
	null
])

validationTests.push([
	Runtyper.getType<XXPoint>(),
	{x: {z: {i: {j: 5}}}},
	"at path value.y"
])
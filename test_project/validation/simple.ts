import {validationTests} from "test_project_main"
import {Runtyper} from "@nartallax/runtyper"
import {Point, TypePoint} from "types/simple"

validationTests.push([
	Runtyper.getType<Point>(),
	{x: 5, y: 10, z: 15},
	null
])

validationTests.push([
	Runtyper.getType<Point>(),
	{x: 5, y: 10},
	null
])

validationTests.push([
	Runtyper.getType<Point>(),
	{x: 5, y: 10, z: undefined},
	null
])

validationTests.push([
	Runtyper.getType<Point>(),
	{x: 5, y: 10, zzzzz: false},
	"!(\"zzzzz\" in obj)"
])

validationTests.push([
	Runtyper.getType<Point>(),
	{x: 5, y: 10, z: false},
	"at path value.z (of type boolean)"
])

validationTests.push([
	Runtyper.getType<TypePoint>(),
	{x: 5},
	null
])

validationTests.push([
	Runtyper.getType<TypePoint>(),
	{y: 5},
	"at path value.x (of type undefined)"
])
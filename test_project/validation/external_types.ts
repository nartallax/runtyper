import {validationTests} from "test_project_main"
import {Runtyper} from "@nartallax/runtyper"

interface Point {
	x: number
	y: number
	z: number
}

export interface NamedZ extends Omit<Point, "y"> {
	name: string
}

validationTests.push([
	Runtyper.getType<NamedZ>(),
	{x: 5, z: 10, name: "uwu"},
	null
])

validationTests.push([
	Runtyper.getType<NamedZ>(),
	{x: 5, y: 15, z: 10, name: "uwu"},
	"!(\"y\" in obj)"
])

validationTests.push([
	Runtyper.getType<Record<string, null>>(),
	{},
	null
])

validationTests.push([
	Runtyper.getType<Runtyper.BrokenType>(),
	{type: "broken", file: "", node: "", message: ""},
	null
])
import {simplificationTests} from "test_project_main"
import {Runtyper} from "@nartallax/runtyper"

simplificationTests.push([
	Runtyper.getType<NamedZ>(),
	{type: "object", properties: {x: {type: "number"}, z: {type: "number"}, name: {type: "string"}}, refName: "NamedZ", fullRefName: "/simplified/external_types:NamedZ"}

])

interface Point {
	x: number
	y: number
	z: number
}

export interface NamedZ extends Omit<Point, "y"> {
	name: string
}


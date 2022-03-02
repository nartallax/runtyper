import {Runtyper} from "@nartallax/runtyper"

interface Point {
	x: number
	y: number
	z: number
}

export interface NamedZ extends Omit<Point, "y"> {
	name: string
}

export type SimpleType = Runtyper.PrimitiveType

export type MyFn = NodeJS.CallSite
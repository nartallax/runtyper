import {Point} from "types/simple"
import {Runtyper} from "@nartallax/runtyper"

export let pointStructure = Runtyper.getType<Point>()
export let numberStructure = Runtyper.getType<number>()
export let pointCopyStructure = Runtyper.getType<{x: number, y: number}>()
export let constStructure = Runtyper.getType<5 | "nope">()

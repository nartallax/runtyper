import {Point} from "types/simple"

interface X {
	(arg: number): number
}

export let myX: X = arg => arg + 5

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function add(a: number, b: number) {
	return a + b
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function getPoint() {
	return {x: 5, y: 10, z: 15} as Point
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export let varFunc2 = (x: string) => x === "5" ? 5 : null
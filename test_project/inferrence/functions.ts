import {Point} from "types/simple"

export function mul2(value: number): number {
	return value * 2
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function add(a: number, b: number) {
	return a + b
}

interface X {
	(arg: number): number
}

export let myX: X = arg => arg + 5

export let varFunc: (x: string) => number | null = x => x === "5" ? 5 : null
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export let varFunc2 = (x: string) => x === "5" ? 5 : null

export function destFn({a, b}: {a: number, b: string}): void {
	console.log(b, a)
}

export function valueOrDefault(value?: number): number {
	return value || 5
}

export function valueOrDefault2(value = 5): number {
	return value
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function getPoint() {
	return {x: 5, y: 10, z: 15} as Point
}


export function reverseType(x: number): string
export function reverseType(x: string): number
export function reverseType(x: string | number): string | number {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return x as any // whatever
}
export function mul2(value: number): number {
	return value * 2
}

// all of these functions should be considered completely types
export let varFunc: (x: string) => number | null = x => x === "5" ? 5 : null
export let varFunc2 = (x: number): void => console.log(x)
export let varFunc3 = (x => console.log(x)) as ((x: number) => void)

export function destFn({a, b}: {a: number, b: string}): void {
	console.log(b, a)
}

export function valueOrDefault(value?: number): number {
	return value || 5
}

export function valueOrDefault2(value = 5): number {
	return value
}


export function reverseType(x: number): string
export function reverseType(x: string): number
export function reverseType(x: string | number): string | number {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return x as any // whatever
}
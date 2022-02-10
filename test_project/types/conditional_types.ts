type MyExclude<T, U> = T extends U ? never : T
type MyPick<T, K extends keyof T> = {
	[P in K]: T[P];
}
type MyOmit<T, K extends keyof T> = MyPick<T, MyExclude<keyof T, K>>

interface Point {
	x: number
	y: number
	z: number
}

export interface NamedZ extends MyOmit<Point, "x" | "y"> {
	name: string
}
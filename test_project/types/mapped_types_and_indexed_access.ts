interface Point {
	x: number
	y: number
}

export type PointCopy = {
	[k in keyof Point]: Point[k]
}

export type PointStupidCopy = {
	[k in keyof Point]: Point["x"]
}

export type PointY = Point["y"]

export type ReadonlyCopy<T> = {
	readonly [k in keyof T]: T[k]
}

export type OptionalCopy<T> = {
	[k in keyof T]?: T[k]
}

export type MappedPoint = {
	[k in "x" | "y"]: number
}

export interface MyRecordA {
	x: number
	[k: string]: number
}

export type MyRecordCopyA = {
	[k in keyof MyRecordA]: MyRecordA[k]
}

export type MyRecordB = {[k: string]: string}

export type MyRecordCopyB = {
	[k in keyof MyRecordB]: MyRecordB[k]
}

export type MyRecordCopyBB = {
	[k in keyof MyRecordB]: boolean
}

export interface X<Y>{
	z: {i: {j: {[k in keyof Y]: number}}}
}

export type XPoint = X<Point>

export type XX<Y> = {
	[k in keyof Y]: {z: {i: {j: Y[k]}}}
}

export type XXPoint = XX<OptionalCopy<Point>>

interface PointWithOpt {
	z?: number
}

export type ZOfPoint = PointWithOpt["z"]

export type OptCopiedPoint = OptionalCopy<Point>

export type A<T> = {a: T}
export type B<T> = {b: T}
export type C = A<number> | B<string>
export const constFromMappedTypeFile: A<string> = {a: ""}
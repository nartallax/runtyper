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

// TODO: вот тут нужно будет очень интересно валидировать
// мы проходимся по всем ключам объекта, и проверяем, что они все соответствуют MyRecordA[k]
// причем нужно понять, что MyRecordA[k] - это number всегда...?
// вероятно, нужно класть в k специальный тип, который будет говорить, что из объекта нужно взять значение поля-индекса?
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

export type XX<Y> = {
	[k in keyof Y]: {z: {i: {j: Y[k]}}}
}
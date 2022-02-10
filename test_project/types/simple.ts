export interface Point {
	x: number
	readonly y: number
	z?: number
}

export type TypePoint = {x: number, y?: number}
export const typePointToBeRequiredExternally = {x: 1, y: 2} as TypePoint

export type MyNumber = number
export type MyString = string
export type MyBool = boolean
export type MyAny = any
export type MyUnknown = unknown

export namespace SimpleNS {
	export type MyMy = "cow" | "dog"
}

export namespace SimpleNS2 {
	export type Awoo = "werewolf" | "dog"
}
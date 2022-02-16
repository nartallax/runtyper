export interface MyField<T>{
	name: string
	value: T
}

export type FieldValue<F> = F extends MyField<infer Z>? Z: never


export type IsInUnion<T> = T extends "a" | "b" | "c"? number: never
export type ThisShouldBeNumber = IsInUnion<"a" | "z">

interface TwoVals<A, B>{
	valueA: A
	valueB: B
}

export type IsTwoVals<T> = T extends TwoVals<infer A, infer B>? A | B: null
export type NullOrFive = IsTwoVals<{valueA: 5, valueB: null}>
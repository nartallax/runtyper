interface A<T>{
	valueA: T
}
interface B<T>{
	valueB: T
}

export type AorBArg<X> = X extends A<infer T> | B<infer T>? T: never
export type ThisShouldBeStringOrNull = AorBArg<{valueB: string | null}>
export type ThisShouldBeString2 = AorBArg<{valueA: string}>


export type BinA<X> = X extends A<B<infer T>>? T: never
export type ThisShouldBeStringOrBoolean = BinA<{valueA: {valueB: string | boolean}}>

export type BinSomethingLikeA<X> = X extends {valueA: B<infer T>}? T: never
export type ThisShouldBeAorB = BinSomethingLikeA<{valueA: {valueB: "a" | "b"}}>


interface OptValue<T> {
	value: string | T | null
}

export type IsOptVal<T> = T extends OptValue<infer Z>? Z: never

export type ThisShouldBeNull = IsOptVal<{value: null}>
export type ThisShouldBeNullOrString = IsOptVal<{value: null | string}>
export type ThisShouldBeBoolean = IsOptVal<{value: null | string | boolean}>


// eslint-disable-next-line @typescript-eslint/no-unused-vars
// interface NoGenArg<T>{
// 	value: number
// }

// export type InferNoGenArg<T> = T extends NoGenArg<infer Z>? Z: null
// export type ThisShouldBeUnknown = InferNoGenArg<{value: number}>
// // imagine more complex examples of this
// export type ThisShouldBeString3 = InferNoGenArg<NoGenArg<string>>




interface AA<T>{
	valueA: T
}
interface BB<T, Z>{
	valueB: T | null
	valueZ: Z
}

export type AAorBBArg<X> = X extends AA<infer T> | BB<infer T, infer Z>? T | Z: never
export type ThisShouldBeStringOrNumber = AAorBBArg<{valueB: string, valueZ: number}>
export type ThisShouldBeUnknown2 = AAorBBArg<{valueA: boolean}>

interface BBB<Z>{
	valueZ: Z
}
export type AAorBBBArg<X> = X extends AA<infer T> | BBB<infer Z>? T & Z: never

export interface OptValueNoUnion<V>{
	value?: V
}
export type OptValArg<T> = T extends OptValueNoUnion<infer V>? V: never
export type ThisShouldBeBoolean4 = OptValArg<{value: boolean}>


interface NotOptValueYesUnion<V>{
	value: V | null
}
export type OptValArg2<T> = T extends NotOptValueYesUnion<infer V>? V: never
export type ThisShouldBeBoolean5 = OptValArg2<{value: boolean}>
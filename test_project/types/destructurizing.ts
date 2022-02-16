import {typePointToBeRequiredExternally} from "types/simple"

namespace ObjWithExplicitType {
	export const {a, b: {c, d}}: {a: number, b: {c: number, d: number}} = {a: 5, b: {c: 10, d: 15}}
}
export type TypeFromObjDestr1 = typeof ObjWithExplicitType.c

namespace ObjWithoutExplicitType {
	export const {a, b: {c, d}} = {a: 5, b: {c: 10, d: 15}}
}
export type TypeFromObjDestr2 = typeof ObjWithoutExplicitType.a

namespace ArrayWithExplicitType {
	export const [c, d]: [number, string] = [1, "f"]
}
export type TypeFromArrayDestr1 = typeof ArrayWithExplicitType.d

namespace ArrayWithoutExplicitType {
	export const [c, d] = [1, "f"]
	export let [a, b] = [false, null]
	export let h = [false, null]
}
export type TypeFromArrayDestr2 = typeof ArrayWithoutExplicitType.c
export type TypeFromArrayDestr3 = typeof ArrayWithoutExplicitType.b
export type TypeFromArrayDestr4 = typeof ArrayWithoutExplicitType.h

namespace ObjectRenamingAtDestructurization {
	export const {a: aaa, b: {c: ccc}} = {a: 5, b: {c: 10}}
}
export type RenamedTypeA = typeof ObjectRenamingAtDestructurization.aaa
export type RenamedTypeC = typeof ObjectRenamingAtDestructurization.ccc


namespace MixedDestr {
	export const [,{a: [b]}] = [null, {a: [6]}]
	export const {c: [{d}]} = {c: [{d: "yep"}]}
}

export type MixedTypeB = typeof MixedDestr.b
export type MixedTypeD = typeof MixedDestr.d

namespace RestDestr {
	export const [a, b, ...c] = [1, 2, 3, 4, 5] as number[]
	export const {x: [x, y, ...z]} = {x: [1, 2, 3, 4, 5]} // tuple
}
export type RestA = typeof RestDestr.a
export type RestC = typeof RestDestr.c
export type RestZ = typeof RestDestr.z

namespace NamedTypedDestruct {
	interface Point {
		x: number
		y: number
	}
	export const {x}: Point = {x: 5, y: 10}

	type PointArr = [number, number]
	export const [,y]: PointArr = [5, 10]
	export const [z]: [Point | null] = [{x: 5, y: 10}]

	interface TwoPoints{
		a: Point
		b: Point
	}

	let pp: TwoPoints = {a: {x: 1, y: 1}, b: {x: 2, y: 2}}
	export const {a: p} = pp
	export const {a: {x: pppppp}} = pp

	let myPoint: Point = {x: 1, y: 2}
	export const [ppp] = [[myPoint]] // ppp = array of Point

	interface Point2<T>{
		x: T
		y: T
	}
	export const [pppp] = [[{x: 1, y: 2} as Point2<number>]]

	export const [ppppp] = [[typePointToBeRequiredExternally]]

}

export type NamedDestrX = typeof NamedTypedDestruct.x
export type NamedDestrY = typeof NamedTypedDestruct.y
export type NamedDestrZ = typeof NamedTypedDestruct.z
export type NamedDestrA = typeof NamedTypedDestruct.p

// export namespace RestTuples {
// 	export const [a, b, ...c] = null as unknown as [number, ...number[], string]
// 	export const [x, y, ...z] = null as unknown as [number, number, string, ...number[], boolean]
// 	// WHY c IS ARRAY AND z IS TUPLE? I DONT UNDERSTAND
// 	export const [d, e, f] = [undefined, 1, 2, 3, 4] as [string?, ...number[]]
// }

// export type RestTupleA = typeof RestTuples.a
// export type RestTupleB = typeof RestTuples.b
// export type RestTupleC = typeof RestTuples.c
// export type RestTupleD = typeof RestTuples.d
// export type RestTupleE = typeof RestTuples.e
// export type RestTupleF = typeof RestTuples.f
// export type RestTupleX = typeof RestTuples.x
// export type RestTupleY = typeof RestTuples.y
// export type RestTupleZ = typeof RestTuples.z
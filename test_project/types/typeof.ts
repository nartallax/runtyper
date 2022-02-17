let obj = [{a: 5, b: {c: "a" as const}}]
let tup: [number, {a: {b: "c"}}] = [0, {a: {b: "c"}}]
const x = "b"
export type TupleTypeof = typeof tup[1]["a"]["b"]
export type ObjectTypeof = typeof obj[0][typeof x]["c"]

let y = 5

export type ConstTypeof = typeof x
export type VarTypeof = typeof y

const bigObj = {a: 5, b: 10, z: {y: {x: [1, 2, 3]}}}

export type BigObjTypeof = typeof bigObj


namespace NS {
	export let obj = {a: 5, b: {c: "a" as const}}
}

export type NamespacedObjectType = typeof NS.obj["b"]["c"]

const {f} = {f: 5}
export type DestructuredVarType = typeof f
import {validationTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {ManyMath, NotManyMath, NullableNumber, Primitive, Zero} from "types/union_intersection"

validationTests.push([
	Runtyper.getType<Primitive>(),
	"nya",
	null
])

validationTests.push([
	Runtyper.getType<Primitive>(),
	-0.123,
	null
])

validationTests.push([
	Runtyper.getType<Primitive>(),
	false,
	null
])

validationTests.push([
	Runtyper.getType<Primitive>(),
	NaN,
	"at path value"
])

validationTests.push([
	Runtyper.getType<Primitive>(),
	null,
	"at path value"
])

validationTests.push([
	Runtyper.getType<Primitive>(),
	undefined,
	"at path value"
])


validationTests.push([
	Runtyper.getType<Zero>(),
	"nya",
	"at path value"
])

validationTests.push([
	Runtyper.getType<Zero>(),
	null,
	null
])

validationTests.push([
	Runtyper.getType<Zero>(),
	undefined,
	null
])

validationTests.push([
	Runtyper.getType<Zero>(),
	false,
	"at path value"
])


validationTests.push([
	Runtyper.getType<NullableNumber>(),
	null,
	null
])

validationTests.push([
	Runtyper.getType<NullableNumber>(),
	1231.32142,
	null
])

validationTests.push([
	Runtyper.getType<NullableNumber>(),
	undefined,
	"at path value"
])



validationTests.push([
	Runtyper.getType<ManyMath>(),
	{x: 5, y: 10, z: 15},
	null
])

validationTests.push([
	Runtyper.getType<ManyMath>(),
	{x: 5, y: 10},
	"at path value.z"
])

validationTests.push([
	Runtyper.getType<ManyMath>(),
	{x: 5, z: 10},
	"at path value.y"
])


validationTests.push([
	Runtyper.getType<NotManyMath>(),
	{x: 5, y: 10, z: 15},
	null
])

// TODO: test this:
export type IntersectionOfUnions = ({a: number} | {b: number}) & ({c: number} | {d: number})
// let x: Runtyper.SimpleType = {type: "constant", value: 5, types: []} ????????
// TODO: stack more of this nested shit
// TODO: add non-object types to the mix (like (string | {a: number}) & {b: number})
// TODO: tests for what will happen with nested objects in intersections/unions
export type IntersectionOfNestedTypes = {a: {b: number}} | {a: {b: string, c: boolean}}
let xx: IntersectionOfNestedTypes = {a: {b: 5, c: false}}

export type IntersectionOfObjects = {a: string, b: number} | {c: true, d: false}
let xxx: IntersectionOfObjects = {a: "123", b: 5, c: true}
void xxx


export type DiscriminatedUnionA = {type: 1, a: string} | {type: 2, a: number} | {type: 3, a: boolean}
export type DiscriminatedUnionB = {size: 1, b: string} | {size: 2, b: number} | {size: 3, b: boolean}
export type DiscriminatedUnionMix = DiscriminatedUnionA | DiscriminatedUnionB | {name: string}

let x: DiscriminatedUnionMix = {size: 1, a: 5, b: "", name: "123"}
let y: DiscriminatedUnionMix = {type: 2, a: 5, size: 1, b: 5}
let yy: DiscriminatedUnionMix = {type: 2, a: 5, b: ""}


export type DiscriminatedUnionC = {type: 1, a: string} | {type: 2, b: string} | {type: 3, c: string}
export type DiscriminatedUnionD = {size: 1, d: string} | {size: 2, e: string} | {size: 3, f: string}
export type DiscriminatedUnionMix2 = DiscriminatedUnionC | DiscriminatedUnionD

let z: DiscriminatedUnionMix2 = {type: 1 as const, a: "", b: "", size: 2 as const, e: "", f: ""}
// let zz: DiscriminatedUnionC = {type: 1, a: "", b: ""}

void x, xx, y, yy, z
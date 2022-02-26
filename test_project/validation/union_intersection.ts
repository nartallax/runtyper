import {validationTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {IntersectionOfUnions, IntersectionOfUnionsOfIntersections, ManyMath, NotManyMath, NullableNumber, Primitive, UnionOfIntersections, UnionOfIntersectionsOfUnions, Zero} from "types/union_intersection"

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
	"bad value at path value.y (of type number): failed at expression <unknown field found>"
])

validationTests.push([
	Runtyper.getType<UnionOfIntersections>(),
	{b: 5, a: 5},
	null
])

validationTests.push([
	Runtyper.getType<UnionOfIntersections>(),
	{c: 5, d: 5},
	null
])

// following four test are to catch some tricky bug
// when sometimes validator will allow some fields of previously applied objects to be present
validationTests.push([
	Runtyper.getType<UnionOfIntersections>(),
	{a: 5, c: 5, d: 5},
	"bad value at path value.a"
])

validationTests.push([
	Runtyper.getType<UnionOfIntersections>(),
	{b: 5, c: 5, d: 5},
	"bad value at path value.b"
])

validationTests.push([
	Runtyper.getType<UnionOfIntersections>(),
	{a: 5, b: 5, c: 5},
	"bad value at path value.c"
])

validationTests.push([
	Runtyper.getType<UnionOfIntersections>(),
	{a: 5, b: 5, d: 5},
	"bad value at path value.d"
])

validationTests.push([
	Runtyper.getType<IntersectionOfUnions>(),
	{b: 5, d: 5},
	null
])

validationTests.push([
	Runtyper.getType<IntersectionOfUnions>(),
	{a: 5, d: 5},
	null
])

validationTests.push([
	Runtyper.getType<IntersectionOfUnions>(),
	{a: 5, c: 5},
	null
])

validationTests.push([
	Runtyper.getType<IntersectionOfUnions>(),
	{a: 5, b: 5, d: 5},
	"bad value at path value.b"
])

validationTests.push([
	Runtyper.getType<IntersectionOfUnions>(),
	{a: 5, c: 5, d: 5},
	"bad value at path value.d"
])


validationTests.push([
	Runtyper.getType<IntersectionOfUnionsOfIntersections>(),
	{a: 5, b: 5, e: 5, f: 5},
	null
])

validationTests.push([
	Runtyper.getType<IntersectionOfUnionsOfIntersections>(),
	{c: 5, d: 5, g: 5, h: 5},
	null
])

validationTests.push([
	Runtyper.getType<IntersectionOfUnionsOfIntersections>(),
	{a: 5, c: 5, e: 5, f: 5},
	"bad value at path value.d" // acceptable, whatever
])

validationTests.push([
	Runtyper.getType<IntersectionOfUnionsOfIntersections>(),
	{a: 5, b: 5, e: 5, h: 5},
	"bad value at path value.g"
])

validationTests.push([
	Runtyper.getType<IntersectionOfUnionsOfIntersections>(),
	{a: 5, b: 5, e: 5},
	"bad value at path value.g"
])

validationTests.push([
	Runtyper.getType<IntersectionOfUnionsOfIntersections>(),
	{b: 5, e: 5, f: 5, h: 5},
	"bad value at path value.c"
])


validationTests.push([
	Runtyper.getType<UnionOfIntersectionsOfUnions>(),
	{a: 5, d: 5},
	null
])

validationTests.push([
	Runtyper.getType<UnionOfIntersectionsOfUnions>(),
	{e: 5, h: 5},
	null
])

validationTests.push([
	Runtyper.getType<UnionOfIntersectionsOfUnions>(),
	{a: 5, b: 5, c: 5},
	"bad value at path value.b"
])

validationTests.push([
	Runtyper.getType<UnionOfIntersectionsOfUnions>(),
	{a: 5, d: 5, c: 5},
	"bad value at path value.d"
])

validationTests.push([
	Runtyper.getType<UnionOfIntersectionsOfUnions>(),
	{e: 5, f: 5, h: 5},
	"bad value at path value.f"
])


validationTests.push([
	Runtyper.getType<{a: {b: number}} | {a: {b: string, c: boolean}}>(),
	{a: {b: 5}},
	null
])

validationTests.push([
	Runtyper.getType<{a: {b: number}} | {a: {b: string, c: boolean}}>(),
	{a: {b: "nya", c: false}},
	null
])

validationTests.push([
	Runtyper.getType<{a: {b: number}} | {a: {b: string, c: boolean}}>(),
	{a: {b: "nya"}},
	"value.a.c"
])

validationTests.push([
	Runtyper.getType<{a: {b: number}} | {a: {b: string, c: boolean}}>(),
	{a: {b: null}},
	"value.a.b"
])

validationTests.push([
	Runtyper.getType<{a: {b: number}} | {a: {b: string, c: boolean}}>(),
	{a: null},
	"value.a"
])

validationTests.push([
	Runtyper.getType<{a: {b: number}} | {a: {b: string, c: boolean}}>(),
	{a: {b: 5, c: false}},
	"value.a.b"
])


validationTests.push([
	Runtyper.getType<{a: {b: number}} & {a: {b: number, c: boolean}}>(),
	{a: {b: 5}},
	"value.a.c"
])

validationTests.push([
	Runtyper.getType<{a: {b: number}} & {a: {b: number, c: boolean}}>(),
	{a: {b: null}},
	"value.a.b"
])

validationTests.push([
	Runtyper.getType<{a: {b: number}} & {a: {b: number, c: boolean}}>(),
	{a: {b: 5, c: false}},
	null
])

// let x: ({a: {b: number}} | {a: {c: number}}) & ({a: {d: number}} | {a: {e: number}}) = null as any
// let xx: ({a: {b: number}, b: {b: string}} | {a: {c: number}, b: {c: string}}) & ({a: {d: number}, b: {d: string}} | {a: {e: number}, b: {e: string}}) = null as any

// TODO: test this:
// export type IntersectionOfUnions = ({a: number} | {b: number}) & ({c: number} | {d: number})
// TODO: stack more of this nested shit
// TODO: add non-object types to the mix (like (string | {a: number}) & {b: number})
// TODO: tests for what will happen with nested objects in intersections/unions
// export type IntersectionOfNestedTypes = {a: {b: number}} | {a: {b: string, c: boolean}}
// let xx: IntersectionOfNestedTypes = {a: {b: 5, c: false}}

// export type IntersectionOfObjects = {a: string, b: number} | {c: true, d: false}
// let xxx: IntersectionOfObjects = {a: "123", b: 5, c: true}
// void xxx


// export type DiscriminatedUnionA = {type: 1, a: string} | {type: 2, a: number} | {type: 3, a: boolean}
// export type DiscriminatedUnionB = {size: 1, b: string} | {size: 2, b: number} | {size: 3, b: boolean}
// export type DiscriminatedUnionMix = DiscriminatedUnionA | DiscriminatedUnionB | {name: string}

// let x: DiscriminatedUnionMix = {size: 1, a: 5, b: "", name: "123"}
// let y: DiscriminatedUnionMix = {type: 2, a: 5, size: 1, b: 5}
// let yy: DiscriminatedUnionMix = {type: 2, a: 5, b: ""}


// export type DiscriminatedUnionC = {type: 1, a: string} | {type: 2, b: string} | {type: 3, c: string}
// export type DiscriminatedUnionD = {size: 1, d: string} | {size: 2, e: string} | {size: 3, f: string}
// export type DiscriminatedUnionMix2 = DiscriminatedUnionC | DiscriminatedUnionD

// let z: DiscriminatedUnionMix2 = {type: 1 as const, a: "", b: "", size: 2 as const, e: "", f: ""}
// // let zz: DiscriminatedUnionC = {type: 1, a: "", b: ""}

// void x, xx, y, yy, z
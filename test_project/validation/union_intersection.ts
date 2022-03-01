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
	"bad value"
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
	"bad value"
])

validationTests.push([
	Runtyper.getType<UnionOfIntersections>(),
	{b: 5, c: 5, d: 5},
	"bad value"
])

validationTests.push([
	Runtyper.getType<UnionOfIntersections>(),
	{a: 5, b: 5, c: 5},
	"bad value"
])

validationTests.push([
	Runtyper.getType<UnionOfIntersections>(),
	{a: 5, b: 5, d: 5},
	"bad value"
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
	"!(\"b\" in value)"
])

validationTests.push([
	Runtyper.getType<IntersectionOfUnions>(),
	{a: 5, c: 5, d: 5},
	"!(\"d\" in value)"
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
	"bad value"
])

validationTests.push([
	Runtyper.getType<IntersectionOfUnionsOfIntersections>(),
	{a: 5, b: 5, e: 5, h: 5},
	"bad value"
])

validationTests.push([
	Runtyper.getType<IntersectionOfUnionsOfIntersections>(),
	{a: 5, b: 5, e: 5},
	"bad value"
])

validationTests.push([
	Runtyper.getType<IntersectionOfUnionsOfIntersections>(),
	{b: 5, e: 5, f: 5, h: 5},
	"bad value"
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
	"bad value"
])

validationTests.push([
	Runtyper.getType<UnionOfIntersectionsOfUnions>(),
	{a: 5, d: 5, c: 5},
	"bad value"
])

validationTests.push([
	Runtyper.getType<UnionOfIntersectionsOfUnions>(),
	{e: 5, f: 5, h: 5},
	"bad value"
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
	"bad value"
])

validationTests.push([
	Runtyper.getType<{a: {b: number}} | {a: {b: string, c: boolean}}>(),
	{a: {b: null}},
	"bad value"
])

validationTests.push([
	Runtyper.getType<{a: {b: number}} | {a: {b: string, c: boolean}}>(),
	{a: null},
	"bad value"
])

validationTests.push([
	Runtyper.getType<{a: {b: number}} | {a: {b: string, c: boolean}}>(),
	{a: {b: 5, c: false}},
	"bad value"
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


type InterleavedUnionIntersection = (
	{a: {b: number}, b: {b: string}} |
	{a: {c: number}, b: {c: string}}
) & (
	{a: {d: number}, b: {d: string}} |
	{a: {e: number}, b: {e: string}}
)

validationTests.push([
	Runtyper.getType<InterleavedUnionIntersection>(),
	{a: {b: 5, d: 5}, b: {b: "nya", d: "nya"}},
	null
])

validationTests.push([
	Runtyper.getType<InterleavedUnionIntersection>(),
	{a: {c: 5, d: 5}, b: {c: "nya", d: "nya"}},
	null
])

validationTests.push([
	Runtyper.getType<InterleavedUnionIntersection>(),
	{a: {b: 5, e: 5}, b: {b: "nya", e: "nya"}},
	null
])

validationTests.push([
	Runtyper.getType<InterleavedUnionIntersection>(),
	{a: {b: 5, d: 5}, b: {c: "nya", d: "nya"}},
	"bad value"
])

validationTests.push([
	Runtyper.getType<InterleavedUnionIntersection>(),
	{a: {c: 5, e: 5}, b: {c: "nya", d: "nya"}},
	"bad value"
])

validationTests.push([
	Runtyper.getType<InterleavedUnionIntersection>(),
	{a: {b: 5}, b: {c: "nya", d: "nya"}},
	"bad value"
])

validationTests.push([
	Runtyper.getType<InterleavedUnionIntersection>(),
	{a: {b: 5}, b: {b: "nya"}},
	"bad value"
])

validationTests.push([
	Runtyper.getType<InterleavedUnionIntersection>(),
	{a: {b: 5}, b: {c: "nya"}},
	"bad value"
])


// does not make sense, still need to test though
type InterleavedWithNonObjectTypes = (string | {a: number}) & {b: number}
validationTests.push([
	Runtyper.getType<InterleavedWithNonObjectTypes>(),
	"123",
	"bad value"
])

validationTests.push([
	Runtyper.getType<InterleavedWithNonObjectTypes>(),
	{a: 5},
	"bad value"
])

validationTests.push([
	Runtyper.getType<InterleavedWithNonObjectTypes>(),
	{a: 5, b: 5},
	null
])
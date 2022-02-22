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
// TODO: stack more of this nested shit
let x: IntersectionOfUnions = {c: 5, a: 0, b: 0, d: 0}
void x

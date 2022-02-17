import {simplifiedTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {I_AnyAndConst, I_AnyAndConsts, I_AnyAndType, I_AnyUnknown, I_AnyUnknownNever, I_NeverAndConst, I_NeverAndConsts, I_NeverAndType, I_UnknownAndConst, I_UnknownAndConsts, I_UnknownAndType, ManyMath, MathAndName, MathAndSomethingElseWithDefault, NullableNumber, Primitive, Shapeless, U_AnyAndConst, U_AnyAndConsts, U_AnyAndType, U_AnyUnknownNever, U_NeverAndConst, U_NeverAndConsts, U_NeverAndType, U_UnknownAndConst, U_UnknownAndConsts, U_UnknownAndType, U_UnknownNever, Zero} from "types/union_intersection"

simplifiedTests.push([
	Runtyper.getType<Primitive>(),
	{type: "union", types: [{type: "number"}, {type: "string"}, {type: "boolean"}]}
])

simplifiedTests.push([
	Runtyper.getType<Zero>(),
	{type: "constant_union", value: [null, undefined]}
])

simplifiedTests.push([
	Runtyper.getType<NullableNumber>(),
	{type: "union", types: [{type: "number"}, {type: "constant", value: null}]}
])

simplifiedTests.push([
	Runtyper.getType<Shapeless>(),
	{type: "any"}
])

simplifiedTests.push([
	Runtyper.getType<ManyMath>(),
	{type: "intersection", types: [{type: "object", properties: {x: {type: "number"}, z: {type: "number"}}, refName: "MathProblem", fullRefName: "/types/union_intersection:MathProblem"}, {type: "object", properties: {x: {type: "number"}, y: {type: "number"}}, refName: "Point", fullRefName: "/types/union_intersection:Point"}]}
])

simplifiedTests.push([
	Runtyper.getType<MathAndName>(),
	{type: "intersection", types: [{type: "union", types: [{type: "object", properties: {x: {type: "number"}, z: {type: "number"}}, refName: "MathProblem", fullRefName: "/types/union_intersection:MathProblem"}, {type: "object", properties: {x: {type: "number"}, y: {type: "number"}}, refName: "Point", fullRefName: "/types/union_intersection:Point"}]}, {type: "object", properties: {name: {type: "string"}}}]}
])

simplifiedTests.push([
	Runtyper.getType<MathAndSomethingElseWithDefault>(),
	{type: "intersection", types: [{type: "object", properties: {x: {type: "number"}, y: {type: "number"}}, refName: "Point", fullRefName: "/types/union_intersection:Point"}, {type: "object", properties: {x: {type: "number"}, z: {type: "number"}}, refName: "MathProblem", fullRefName: "/types/union_intersection:MathProblem"}]}
])


simplifiedTests.push([Runtyper.getType<U_AnyUnknownNever>(), {type: "any"}])
simplifiedTests.push([Runtyper.getType<U_UnknownNever>(), {type: "unknown"}])
simplifiedTests.push([Runtyper.getType<U_AnyAndType>(), {type: "any"}])
simplifiedTests.push([Runtyper.getType<U_AnyAndConst>(), {type: "any"}])
simplifiedTests.push([Runtyper.getType<U_AnyAndConsts>(), {type: "any"}])
simplifiedTests.push([Runtyper.getType<U_UnknownAndType>(), {type: "unknown"}])
simplifiedTests.push([Runtyper.getType<U_UnknownAndConst>(), {type: "unknown"}])
simplifiedTests.push([Runtyper.getType<U_UnknownAndConsts>(), {type: "unknown"}])
simplifiedTests.push([Runtyper.getType<U_NeverAndType>(), {type: "string"}])
simplifiedTests.push([Runtyper.getType<U_NeverAndConst>(), {type: "constant", value: 5}])
simplifiedTests.push([Runtyper.getType<U_NeverAndConsts>(), {type: "constant_union", value: [10, 5]}])


simplifiedTests.push([Runtyper.getType<I_AnyUnknownNever>(), {type: "never"}])
simplifiedTests.push([Runtyper.getType<I_AnyUnknown>(), {type: "intersection", types: [{type: "any"}, {type: "unknown"}]}])
simplifiedTests.push([Runtyper.getType<I_AnyAndType>(), {type: "intersection", types: [{type: "any"}, {type: "string"}]}])
simplifiedTests.push([Runtyper.getType<I_AnyAndConst>(), {type: "intersection", types: [{type: "any"}, {type: "constant", value: 5}]}])
simplifiedTests.push([Runtyper.getType<I_AnyAndConsts>(), {type: "intersection", types: [{type: "any"}, {type: "constant", value: 5}, {type: "constant", value: 10}]}])
simplifiedTests.push([Runtyper.getType<I_UnknownAndType>(), {type: "intersection", types: [{type: "unknown"}, {type: "string"}]}])
simplifiedTests.push([Runtyper.getType<I_UnknownAndConst>(), {type: "intersection", types: [{type: "unknown"}, {type: "constant", value: 5}]}])
simplifiedTests.push([Runtyper.getType<I_UnknownAndConsts>(), {type: "intersection", types: [{type: "unknown"}, {type: "constant", value: 5}, {type: "constant", value: 10}]}])
simplifiedTests.push([Runtyper.getType<I_NeverAndType>(), {type: "never"}])
simplifiedTests.push([Runtyper.getType<I_NeverAndConst>(), {type: "never"}])
simplifiedTests.push([Runtyper.getType<I_NeverAndConsts>(), {type: "never"}])
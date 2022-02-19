import {simplificationTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {I_AnyAndConst, I_AnyAndConsts, I_AnyAndType, I_AnyUnknown, I_AnyUnknownNever, I_NeverAndConst, I_NeverAndConsts, I_NeverAndType, I_UnknownAndConst, I_UnknownAndConsts, I_UnknownAndType, ManyMath, MathAndName, MathAndSomethingElseWithDefault, NullableNumber, Primitive, Shapeless, U_AnyAndConst, U_AnyAndConsts, U_AnyAndType, U_AnyUnknownNever, U_NeverAndConst, U_NeverAndConsts, U_NeverAndType, U_UnknownAndConst, U_UnknownAndConsts, U_UnknownAndType, U_UnknownNever, Zero} from "types/union_intersection"

simplificationTests.push([
	Runtyper.getType<Primitive>(),
	{type: "union", types: [{type: "number"}, {type: "string"}, {type: "boolean"}], fullRefName: "/types/union_intersection:Primitive", refName: "Primitive"}
])

simplificationTests.push([
	Runtyper.getType<Zero>(),
	{type: "constant_union", value: [null, undefined], fullRefName: "/types/union_intersection:Zero", refName: "Zero"}
])

simplificationTests.push([
	Runtyper.getType<NullableNumber>(),
	{type: "union", types: [{type: "number"}, {type: "constant", value: null}], fullRefName: "/types/union_intersection:NullableNumber", refName: "NullableNumber"}
])

simplificationTests.push([
	Runtyper.getType<Shapeless>(),
	{type: "any", fullRefName: "/types/union_intersection:Shapeless", refName: "Shapeless"}
])

simplificationTests.push([
	Runtyper.getType<ManyMath>(),
	{type: "intersection", types: [{type: "object", properties: {x: {type: "number"}, z: {type: "number"}}, refName: "MathProblem", fullRefName: "/types/union_intersection:MathProblem"}, {type: "object", properties: {x: {type: "number"}, y: {type: "number"}}, refName: "Point", fullRefName: "/types/union_intersection:Point"}], fullRefName: "/types/union_intersection:ManyMath", refName: "ManyMath"}
])

simplificationTests.push([
	Runtyper.getType<MathAndName>(),
	{type: "intersection", types: [{type: "union", types: [{type: "object", properties: {x: {type: "number"}, z: {type: "number"}}, refName: "MathProblem", fullRefName: "/types/union_intersection:MathProblem"}, {type: "object", properties: {x: {type: "number"}, y: {type: "number"}}, refName: "Point", fullRefName: "/types/union_intersection:Point"}]}, {type: "object", properties: {name: {type: "string"}}}], fullRefName: "/types/union_intersection:MathAndName", refName: "MathAndName"}
])

simplificationTests.push([
	Runtyper.getType<MathAndSomethingElseWithDefault>(),
	{type: "intersection", types: [{type: "object", properties: {x: {type: "number"}, y: {type: "number"}}, refName: "Point", fullRefName: "/types/union_intersection:Point"}, {type: "object", properties: {x: {type: "number"}, z: {type: "number"}}, refName: "MathProblem", fullRefName: "/types/union_intersection:MathProblem"}], fullRefName: "/types/union_intersection:MathAndSomethingElseWithDefault", refName: "MathAndSomethingElseWithDefault"}
])


simplificationTests.push([Runtyper.getType<U_AnyUnknownNever>(), {type: "any", fullRefName: "/types/union_intersection:U_AnyUnknownNever", refName: "U_AnyUnknownNever"}])
simplificationTests.push([Runtyper.getType<U_UnknownNever>(), {type: "unknown", fullRefName: "/types/union_intersection:U_UnknownNever", refName: "U_UnknownNever"}])
simplificationTests.push([Runtyper.getType<U_AnyAndType>(), {type: "any", fullRefName: "/types/union_intersection:U_AnyAndType", refName: "U_AnyAndType"}])
simplificationTests.push([Runtyper.getType<U_AnyAndConst>(), {type: "any", fullRefName: "/types/union_intersection:U_AnyAndConst", refName: "U_AnyAndConst"}])
simplificationTests.push([Runtyper.getType<U_AnyAndConsts>(), {type: "any", fullRefName: "/types/union_intersection:U_AnyAndConsts", refName: "U_AnyAndConsts"}])
simplificationTests.push([Runtyper.getType<U_UnknownAndType>(), {type: "unknown", fullRefName: "/types/union_intersection:U_UnknownAndType", refName: "U_UnknownAndType"}])
simplificationTests.push([Runtyper.getType<U_UnknownAndConst>(), {type: "unknown", fullRefName: "/types/union_intersection:U_UnknownAndConst", refName: "U_UnknownAndConst"}])
simplificationTests.push([Runtyper.getType<U_UnknownAndConsts>(), {type: "unknown", fullRefName: "/types/union_intersection:U_UnknownAndConsts", refName: "U_UnknownAndConsts"}])
simplificationTests.push([Runtyper.getType<U_NeverAndType>(), {type: "string", fullRefName: "/types/union_intersection:U_NeverAndType", refName: "U_NeverAndType"}])
simplificationTests.push([Runtyper.getType<U_NeverAndConst>(), {type: "constant", value: 5, fullRefName: "/types/union_intersection:U_NeverAndConst", refName: "U_NeverAndConst"}])
simplificationTests.push([Runtyper.getType<U_NeverAndConsts>(), {type: "constant_union", value: [10, 5], fullRefName: "/types/union_intersection:U_NeverAndConsts", refName: "U_NeverAndConsts"}])


simplificationTests.push([Runtyper.getType<I_AnyUnknownNever>(), {type: "never", fullRefName: "/types/union_intersection:I_AnyUnknownNever", refName: "I_AnyUnknownNever"}])
simplificationTests.push([Runtyper.getType<I_AnyUnknown>(), {type: "intersection", types: [{type: "any"}, {type: "unknown"}], fullRefName: "/types/union_intersection:I_AnyUnknown", refName: "I_AnyUnknown"}])
simplificationTests.push([Runtyper.getType<I_AnyAndType>(), {type: "intersection", types: [{type: "any"}, {type: "string"}], fullRefName: "/types/union_intersection:I_AnyAndType", refName: "I_AnyAndType"}])
simplificationTests.push([Runtyper.getType<I_AnyAndConst>(), {type: "intersection", types: [{type: "any"}, {type: "constant", value: 5}], fullRefName: "/types/union_intersection:I_AnyAndConst", refName: "I_AnyAndConst"}])
simplificationTests.push([Runtyper.getType<I_AnyAndConsts>(), {type: "intersection", types: [{type: "any"}, {type: "constant", value: 5}, {type: "constant", value: 10}], fullRefName: "/types/union_intersection:I_AnyAndConsts", refName: "I_AnyAndConsts"}])
simplificationTests.push([Runtyper.getType<I_UnknownAndType>(), {type: "intersection", types: [{type: "unknown"}, {type: "string"}], fullRefName: "/types/union_intersection:I_UnknownAndType", refName: "I_UnknownAndType"}])
simplificationTests.push([Runtyper.getType<I_UnknownAndConst>(), {type: "intersection", types: [{type: "unknown"}, {type: "constant", value: 5}], fullRefName: "/types/union_intersection:I_UnknownAndConst", refName: "I_UnknownAndConst"}])
simplificationTests.push([Runtyper.getType<I_UnknownAndConsts>(), {type: "intersection", types: [{type: "unknown"}, {type: "constant", value: 5}, {type: "constant", value: 10}], fullRefName: "/types/union_intersection:I_UnknownAndConsts", refName: "I_UnknownAndConsts"}])
simplificationTests.push([Runtyper.getType<I_NeverAndType>(), {type: "never", fullRefName: "/types/union_intersection:I_NeverAndType", refName: "I_NeverAndType"}])
simplificationTests.push([Runtyper.getType<I_NeverAndConst>(), {type: "never", fullRefName: "/types/union_intersection:I_NeverAndConst", refName: "I_NeverAndConst"}])
simplificationTests.push([Runtyper.getType<I_NeverAndConsts>(), {type: "never", fullRefName: "/types/union_intersection:I_NeverAndConsts", refName: "I_NeverAndConsts"}])
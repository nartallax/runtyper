function (exports, require, __RuntyperAutogeneratedImport) {
    __RuntyperAutogeneratedImport.Runtyper.internal.t([[
            "/types/union_intersection:I_AnyAndConst",
            { type: "alias", body: { type: "intersection", types: [{ type: "any" }, { type: "constant", value: 5 }] } }
        ], [
            "/types/union_intersection:I_AnyAndConsts",
            { type: "alias", body: { type: "intersection", types: [{ type: "any" }, { type: "constant", value: 5 }, { type: "constant", value: 10 }] } }
        ], [
            "/types/union_intersection:I_AnyAndType",
            { type: "alias", body: { type: "intersection", types: [{ type: "any" }, { type: "string" }] } }
        ], [
            "/types/union_intersection:I_AnyUnknown",
            { type: "alias", body: { type: "intersection", types: [{ type: "any" }, { type: "unknown" }] } }
        ], [
            "/types/union_intersection:I_AnyUnknownNever",
            { type: "alias", body: { type: "intersection", types: [{ type: "any" }, { type: "unknown" }, { type: "never" }] } }
        ], [
            "/types/union_intersection:I_NeverAndConst",
            { type: "alias", body: { type: "intersection", types: [{ type: "never" }, { type: "constant", value: 5 }] } }
        ], [
            "/types/union_intersection:I_NeverAndConsts",
            { type: "alias", body: { type: "intersection", types: [{ type: "never" }, { type: "constant", value: 5 }, { type: "constant", value: 10 }] } }
        ], [
            "/types/union_intersection:I_NeverAndType",
            { type: "alias", body: { type: "intersection", types: [{ type: "never" }, { type: "string" }] } }
        ], [
            "/types/union_intersection:I_UnknownAndConst",
            { type: "alias", body: { type: "intersection", types: [{ type: "unknown" }, { type: "constant", value: 5 }] } }
        ], [
            "/types/union_intersection:I_UnknownAndConsts",
            { type: "alias", body: { type: "intersection", types: [{ type: "unknown" }, { type: "constant", value: 5 }, { type: "constant", value: 10 }] } }
        ], [
            "/types/union_intersection:I_UnknownAndType",
            { type: "alias", body: { type: "intersection", types: [{ type: "unknown" }, { type: "string" }] } }
        ], [
            "/types/union_intersection:IntersectionOfUnions",
            { type: "alias", body: { type: "intersection", types: [{ type: "union", types: [{ type: "object", properties: { a: { type: "number" } } }, { type: "object", properties: { b: { type: "number" } } }] }, { type: "union", types: [{ type: "object", properties: { c: { type: "number" } } }, { type: "object", properties: { d: { type: "number" } } }] }] } }
        ], [
            "/types/union_intersection:IntersectionOfUnionsOfIntersections",
            { type: "alias", body: { type: "intersection", types: [{ type: "union", types: [{ type: "intersection", types: [{ type: "object", properties: { a: { type: "number" } } }, { type: "object", properties: { b: { type: "number" } } }] }, { type: "intersection", types: [{ type: "object", properties: { c: { type: "number" } } }, { type: "object", properties: { d: { type: "number" } } }] }] }, { type: "union", types: [{ type: "intersection", types: [{ type: "object", properties: { e: { type: "number" } } }, { type: "object", properties: { f: { type: "number" } } }] }, { type: "intersection", types: [{ type: "object", properties: { g: { type: "number" } } }, { type: "object", properties: { h: { type: "number" } } }] }] }] } }
        ], [
            "/types/union_intersection:ManyMath",
            { type: "alias", body: { type: "intersection", types: [{ type: "type_reference", name: "/types/union_intersection:MathProblem" }, { type: "type_reference", name: "/types/union_intersection:Point" }] } }
        ], [
            "/types/union_intersection:MathAndName",
            { type: "alias", body: { type: "intersection", types: [{ type: "union", types: [{ type: "type_reference", name: "/types/union_intersection:MathProblem" }, { type: "type_reference", name: "/types/union_intersection:Point" }] }, { type: "object", properties: { name: { type: "string" } } }] } }
        ], [
            "/types/union_intersection:MathAndSomethingElse",
            { type: "alias", body: { type: "intersection", types: [{ type: "generic_parameter", name: "T" }, { type: "type_reference", name: "/types/union_intersection:MathProblem" }] }, typeParameters: [{ name: "T" }] }
        ], [
            "/types/union_intersection:MathAndSomethingElseWithDefault",
            { type: "alias", body: { type: "intersection", types: [{ type: "generic_parameter", name: "T" }, { type: "type_reference", name: "/types/union_intersection:MathProblem" }] }, typeParameters: [{ name: "T", default: { type: "type_reference", name: "/types/union_intersection:Point" } }] }
        ], [
            "/types/union_intersection:MathProblem",
            { type: "interface", properties: { x: { type: "number" }, z: { type: "number" } } }
        ], [
            "/types/union_intersection:NotManyMath",
            { type: "alias", body: { type: "union", types: [{ type: "type_reference", name: "/types/union_intersection:MathProblem" }, { type: "type_reference", name: "/types/union_intersection:Point" }] } }
        ], [
            "/types/union_intersection:NullableNumber",
            { type: "alias", body: { type: "union", types: [{ type: "number" }, { type: "constant", value: null }] } }
        ], [
            "/types/union_intersection:Point",
            { type: "interface", properties: { x: { type: "number" }, y: { type: "number" } } }
        ], [
            "/types/union_intersection:Primitive",
            { type: "alias", body: { type: "union", types: [{ type: "number" }, { type: "string" }, { type: "boolean" }] } }
        ], [
            "/types/union_intersection:Shapeless",
            { type: "alias", body: { type: "union", types: [{ type: "any" }, { type: "unknown" }] } }
        ], [
            "/types/union_intersection:U_AnyAndConst",
            { type: "alias", body: { type: "union", types: [{ type: "any" }, { type: "constant", value: 5 }] } }
        ], [
            "/types/union_intersection:U_AnyAndConsts",
            { type: "alias", body: { type: "union", types: [{ type: "any" }, { type: "constant_union", value: [10, 5] }] } }
        ], [
            "/types/union_intersection:U_AnyAndType",
            { type: "alias", body: { type: "union", types: [{ type: "any" }, { type: "string" }] } }
        ], [
            "/types/union_intersection:U_AnyUnknownNever",
            { type: "alias", body: { type: "union", types: [{ type: "any" }, { type: "unknown" }, { type: "never" }] } }
        ], [
            "/types/union_intersection:U_NeverAndConst",
            { type: "alias", body: { type: "union", types: [{ type: "never" }, { type: "constant", value: 5 }] } }
        ], [
            "/types/union_intersection:U_NeverAndConsts",
            { type: "alias", body: { type: "union", types: [{ type: "never" }, { type: "constant_union", value: [10, 5] }] } }
        ], [
            "/types/union_intersection:U_NeverAndType",
            { type: "alias", body: { type: "union", types: [{ type: "never" }, { type: "string" }] } }
        ], [
            "/types/union_intersection:U_UnknownAndConst",
            { type: "alias", body: { type: "union", types: [{ type: "unknown" }, { type: "constant", value: 5 }] } }
        ], [
            "/types/union_intersection:U_UnknownAndConsts",
            { type: "alias", body: { type: "union", types: [{ type: "unknown" }, { type: "constant_union", value: [10, 5] }] } }
        ], [
            "/types/union_intersection:U_UnknownAndType",
            { type: "alias", body: { type: "union", types: [{ type: "unknown" }, { type: "string" }] } }
        ], [
            "/types/union_intersection:U_UnknownNever",
            { type: "alias", body: { type: "union", types: [{ type: "unknown" }, { type: "never" }] } }
        ], [
            "/types/union_intersection:UnionOfIntersections",
            { type: "alias", body: { type: "union", types: [{ type: "intersection", types: [{ type: "object", properties: { a: { type: "number" } } }, { type: "object", properties: { b: { type: "number" } } }] }, { type: "intersection", types: [{ type: "object", properties: { c: { type: "number" } } }, { type: "object", properties: { d: { type: "number" } } }] }] } }
        ], [
            "/types/union_intersection:UnionOfIntersectionsOfUnions",
            { type: "alias", body: { type: "union", types: [{ type: "intersection", types: [{ type: "union", types: [{ type: "object", properties: { a: { type: "number" } } }, { type: "object", properties: { b: { type: "number" } } }] }, { type: "union", types: [{ type: "object", properties: { c: { type: "number" } } }, { type: "object", properties: { d: { type: "number" } } }] }] }, { type: "intersection", types: [{ type: "union", types: [{ type: "object", properties: { e: { type: "number" } } }, { type: "object", properties: { f: { type: "number" } } }] }, { type: "union", types: [{ type: "object", properties: { g: { type: "number" } } }, { type: "object", properties: { h: { type: "number" } } }] }] }] } }
        ], [
            "/types/union_intersection:Zero",
            { type: "alias", body: { type: "constant_union", value: [null, void 0] } }
        ]]);
}

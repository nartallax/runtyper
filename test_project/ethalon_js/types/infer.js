function (exports, require, __RuntyperAutogeneratedImport) {
    __RuntyperAutogeneratedImport.internal.t([[
            "/types/infer:FieldValue",
            { type: "alias", body: { type: "conditional", checkType: { type: "generic_parameter", name: "F" }, extendsType: { type: "type_reference", name: "/types/infer:MyField", typeArguments: [{ type: "infer", name: "Z" }] }, trueType: { type: "generic_parameter", name: "Z" }, falseType: { type: "never" } }, typeParameters: [{ name: "F" }] }
        ], [
            "/types/infer:IsInUnion",
            { type: "alias", body: { type: "conditional", checkType: { type: "generic_parameter", name: "T" }, extendsType: { type: "constant_union", value: ["a", "b", "c"] }, trueType: { type: "number" }, falseType: { type: "never" } }, typeParameters: [{ name: "T" }] }
        ], [
            "/types/infer:IsTwoVals",
            { type: "alias", body: { type: "conditional", checkType: { type: "generic_parameter", name: "T" }, extendsType: { type: "type_reference", name: "/types/infer:TwoVals", typeArguments: [{ type: "infer", name: "A" }, { type: "infer", name: "B" }] }, trueType: { type: "union", types: [{ type: "generic_parameter", name: "A" }, { type: "generic_parameter", name: "B" }] }, falseType: { type: "constant", value: null } }, typeParameters: [{ name: "T" }] }
        ], [
            "/types/infer:MyField",
            { type: "interface", properties: { name: { type: "string" }, value: { type: "generic_parameter", name: "T" } }, typeParameters: [{ name: "T" }] }
        ], [
            "/types/infer:NullOrFive",
            { type: "alias", body: { type: "type_reference", name: "/types/infer:IsTwoVals", typeArguments: [{ type: "object", properties: { valueA: { type: "constant", value: 5 }, valueB: { type: "constant", value: null } } }] } }
        ], [
            "/types/infer:ThisShouldBeNumber",
            { type: "alias", body: { type: "type_reference", name: "/types/infer:IsInUnion", typeArguments: [{ type: "constant_union", value: ["a", "z"] }] } }
        ], [
            "/types/infer:TwoVals",
            { type: "interface", properties: { valueA: { type: "generic_parameter", name: "A" }, valueB: { type: "generic_parameter", name: "B" } }, typeParameters: [{ name: "A" }, { name: "B" }] }
        ]]);
}

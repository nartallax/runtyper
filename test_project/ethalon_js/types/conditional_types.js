function (exports, require, __RuntyperAutogeneratedImport) {
    __RuntyperAutogeneratedImport.internal.t([[
            "/types/conditional_types:MyExclude",
            { type: "alias", body: { type: "conditional", checkType: { type: "generic_parameter", name: "T" }, extendsType: { type: "generic_parameter", name: "U" }, trueType: { type: "never" }, falseType: { type: "generic_parameter", name: "T" } }, typeParameters: [{ name: "T" }, { name: "U" }] }
        ], [
            "/types/conditional_types:MyOmit",
            { type: "alias", body: { type: "type_reference", name: "/types/conditional_types:MyPick", typeArguments: [{ type: "generic_parameter", name: "T" }, { type: "type_reference", name: "/types/conditional_types:MyExclude", typeArguments: [{ type: "keyof", target: { type: "generic_parameter", name: "T" } }, { type: "generic_parameter", name: "K" }] }] }, typeParameters: [{ name: "T" }, { name: "K" }] }
        ], [
            "/types/conditional_types:MyPick",
            { type: "alias", body: { type: "mapped_type", keyName: "P", keyType: { type: "generic_parameter", name: "K" }, valueType: { type: "index_access", index: { type: "generic_parameter", name: "P" }, object: { type: "generic_parameter", name: "T" } } }, typeParameters: [{ name: "T" }, { name: "K" }] }
        ], [
            "/types/conditional_types:NamedZ",
            { type: "interface", properties: { name: { type: "string" } }, extends: [{ type: "type_reference", name: "/types/conditional_types:MyOmit", typeArguments: [{ type: "type_reference", name: "/types/conditional_types:Point" }, { type: "constant_union", value: new Set(["x", "y"]) }] }] }
        ], [
            "/types/conditional_types:Point",
            { type: "interface", properties: { x: { type: "number" }, y: { type: "number" }, z: { type: "number" } } }
        ]]);
}

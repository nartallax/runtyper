function (exports, require, __RuntyperAutogeneratedImport) {
    __RuntyperAutogeneratedImport.internal.t([[
            "/types/recursive_type:Div",
            { type: "alias", body: { type: "object", properties: { child: { type: "union", types: [{ type: "type_reference", name: "/types/recursive_type:Div" }, { type: "type_reference", name: "/types/recursive_type:Img" }], optional: true }, text: { type: "string" } } } }
        ], [
            "/types/recursive_type:Img",
            { type: "alias", body: { type: "object", properties: { child: { type: "union", types: [{ type: "type_reference", name: "/types/recursive_type:Div" }, { type: "type_reference", name: "/types/recursive_type:Img" }], optional: true }, src: { type: "string" } } } }
        ], [
            "/types/recursive_type:TreeNode",
            { type: "interface", properties: { value: { type: "generic_parameter", name: "T" }, left: { type: "type_reference", name: "/types/recursive_type:TreeNode", typeArguments: [{ type: "generic_parameter", name: "T" }], optional: true }, right: { type: "union", types: [{ type: "type_reference", name: "/types/recursive_type:TreeNode", typeArguments: [{ type: "generic_parameter", name: "T" }] }, { type: "constant", value: null }] } }, typeParameters: [{ name: "T" }] }
        ]]);
}

function (exports, require, __RuntyperAutogeneratedImport) {
    __RuntyperAutogeneratedImport.Runtyper.internal.t([[
            "/types/array:MyArr",
            { type: "alias", body: { type: "array", valueType: { type: "number" } } }
        ], [
            "/types/array:MyArr2",
            { type: "alias", body: { type: "array", valueType: { type: "string" } } }
        ], [
            "/types/array:MyArr3",
            { type: "alias", body: { type: "array", valueType: { type: "constant", value: null } } }
        ], [
            "/types/array:MyArr4",
            { type: "alias", body: { type: "type_reference", name: "typescript/lib/lib.es5:ArrayLike", typeArguments: [{ type: "constant", value: 5 }] } }
        ], [
            "/types/array:MyArr5",
            { type: "alias", body: { type: "object", properties: {}, index: { keyType: { type: "union", types: [{ type: "string" }, { type: "number" }] }, valueType: { type: "number" } } } }
        ], [
            "typescript/lib/lib.es5:ArrayLike",
            { type: "interface", properties: { length: { type: "number" } }, index: { keyType: { type: "number" }, valueType: { type: "generic_parameter", name: "T" } }, typeParameters: [{ name: "T" }] }
        ]]);
}

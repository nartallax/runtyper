function (exports, require, __RuntyperAutogeneratedImport) {
    __RuntyperAutogeneratedImport.Runtyper.internal.t([[
            "/types/external_types:ExampleFnType",
            { type: "alias", body: { type: "broken", file: "/types/external_types", node: "export type ExampleFnType = typeof version", message: "External type from package @typescript-eslint/parser was not converted to type description: version (of kind ImportSpecifier)" } }
        ], [
            "/types/external_types:MyErrorSpec",
            { type: "alias", body: { type: "type_reference", name: "@nartallax/clamsensor/clamsensor:ClamsensorExceptionSpecification" } }
        ], [
            "/types/external_types:MyFn",
            { type: "alias", body: { type: "broken", file: "/types/external_types", node: "export type MyFn = NodeJS.CallSite", message: "Can only process index and property signatures, got something else instead: getThis(): unknown; (of kind MethodSignature)" } }
        ], [
            "/types/external_types:MyNyaNya",
            { type: "alias", body: { type: "union", types: [{ type: "type_reference", name: "/types/exportequals_to_be_imported:TestNS.Nya" }, { type: "type_reference", name: "/types/exportequals_to_be_imported:TestNS.NyaNya" }] } }
        ], [
            "/types/external_types:MyRmOptions",
            { type: "alias", body: { type: "type_reference", name: "@types/node/fs:RmOptions" } }
        ], [
            "/types/external_types:MySyntaxKind",
            { type: "alias", body: { type: "type_reference", name: "typescript/lib/typescript:ts.ReadonlyTextRange" } }
        ], [
            "/types/external_types:MyVerEntry",
            { type: "alias", body: { type: "type_reference", name: "@nartallax/clamsensor/clamsensor:ClamsensorVerificationEntryDescription" } }
        ], [
            "/types/external_types:NamedZ",
            { type: "interface", properties: { name: { type: "string" } }, heritage: [{ type: "type_reference", name: "typescript/lib/lib.es5:Omit", typeArguments: [{ type: "type_reference", name: "/types/external_types:Point" }, { type: "constant", value: "y" }] }] }
        ], [
            "/types/external_types:Point",
            { type: "interface", properties: { x: { type: "number" }, y: { type: "number" }, z: { type: "number" } } }
        ], [
            "/types/external_types:SimpleType",
            { type: "alias", body: { type: "type_reference", name: "@nartallax/runtyper/runtyper:Runtyper.PrimitiveType" } }
        ], [
            "@nartallax/clamsensor/clamsensor:ClamsensorExceptionSpecification",
            { type: "broken", file: "/types/external_types", node: "export type MyErrorSpec = ClamsensorExceptionSpecification", message: "More than one declaration of RegExp (of kind TypeReference)" }
        ], [
            "@nartallax/clamsensor/clamsensor:ClamsensorVerificationEntryDescription",
            { type: "interface", properties: { name: { type: "string" }, description: { type: "string" }, moduleName: { type: "string" } } }
        ], [
            "@nartallax/runtyper/runtyper:Runtyper.PrimitiveType",
            { type: "interface", properties: { type: { type: "constant_union", value: ["any", "boolean", "never", "number", "string", "unknown"] } } }
        ], [
            "@types/node/fs:RmOptions",
            { type: "interface", properties: { force: { type: "union", types: [{ type: "boolean" }, { type: "constant", value: void 0 }], optional: true }, maxRetries: { type: "union", types: [{ type: "number" }, { type: "constant", value: void 0 }], optional: true }, recursive: { type: "union", types: [{ type: "boolean" }, { type: "constant", value: void 0 }], optional: true }, retryDelay: { type: "union", types: [{ type: "number" }, { type: "constant", value: void 0 }], optional: true } } }
        ], [
            "@types/node/globals:NodeJS.CallSite",
            { type: "broken", file: "/types/external_types", node: "export type MyFn = NodeJS.CallSite", message: "Can only process index and property signatures, got something else instead: getThis(): unknown; (of kind MethodSignature)" }
        ], [
            "typescript/lib/lib.es5:Exclude",
            { type: "alias", body: { type: "conditional", checkType: { type: "generic_parameter", name: "T" }, extendsType: { type: "generic_parameter", name: "U" }, trueType: { type: "never" }, falseType: { type: "generic_parameter", name: "T" } }, typeParameters: [{ name: "T" }, { name: "U" }] }
        ], [
            "typescript/lib/lib.es5:Omit",
            { type: "alias", body: { type: "type_reference", name: "typescript/lib/lib.es5:Pick", typeArguments: [{ type: "generic_parameter", name: "T" }, { type: "type_reference", name: "typescript/lib/lib.es5:Exclude", typeArguments: [{ type: "keyof", target: { type: "generic_parameter", name: "T" } }, { type: "generic_parameter", name: "K" }] }] }, typeParameters: [{ name: "T" }, { name: "K" }] }
        ], [
            "typescript/lib/lib.es5:Pick",
            { type: "alias", body: { type: "mapped_type", keyName: "P", keyType: { type: "generic_parameter", name: "K" }, valueType: { type: "index_access", index: { type: "generic_parameter", name: "P" }, object: { type: "generic_parameter", name: "T" } } }, typeParameters: [{ name: "T" }, { name: "K" }] }
        ], [
            "typescript/lib/typescript:ts.ReadonlyTextRange",
            { type: "interface", properties: { pos: { type: "number" }, end: { type: "number" } } }
        ]]);
    __RuntyperAutogeneratedImport.Runtyper.internal.f([[
            "typescript/lib/lib.es5:Error",
            Error
        ], [
            "typescript/lib/lib.es5:RegExp",
            RegExp
        ]]);
}

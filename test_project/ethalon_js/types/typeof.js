function (exports, require, __RuntyperAutogeneratedImport) {
    let obj = [{ a: 5, b: { c: "a" } }];
    let tup = [0, { a: { b: "c" } }];
    const x = "b";
    let y = 5;
    const bigObj = { a: 5, b: 10, z: { y: { x: [1, 2, 3] } } };
    var NS;
    (function (NS) {
        NS.obj = { a: 5, b: { c: "a" } };
        __RuntyperAutogeneratedImport.Runtyper.internal.f([[
                "/types/typeof:NS.obj",
                NS.obj
            ]]);
    })(NS || (NS = {}));
    const { f } = { f: 5 };
    __RuntyperAutogeneratedImport.Runtyper.internal.t([[
            "/types/typeof:BigObjTypeof",
            { type: "alias", body: { type: "value_reference", name: "/types/typeof:bigObj" } }
        ], [
            "/types/typeof:ConstTypeof",
            { type: "alias", body: { type: "value_reference", name: "/types/typeof:x" } }
        ], [
            "/types/typeof:DestructuredVarType",
            { type: "alias", body: { type: "value_reference", name: "/types/typeof:f" } }
        ], [
            "/types/typeof:NamespacedObjectType",
            { type: "alias", body: { type: "index_access", index: { type: "constant", value: "c" }, object: { type: "index_access", index: { type: "constant", value: "b" }, object: { type: "value_reference", name: "/types/typeof:NS.obj" } } } }
        ], [
            "/types/typeof:ObjectTypeof",
            { type: "alias", body: { type: "index_access", index: { type: "constant", value: "c" }, object: { type: "index_access", index: { type: "value_reference", name: "/types/typeof:x" }, object: { type: "index_access", index: { type: "constant", value: 0 }, object: { type: "value_reference", name: "/types/typeof:obj" } } } } }
        ], [
            "/types/typeof:TupleTypeof",
            { type: "alias", body: { type: "index_access", index: { type: "constant", value: "b" }, object: { type: "index_access", index: { type: "constant", value: "a" }, object: { type: "index_access", index: { type: "constant", value: 1 }, object: { type: "value_reference", name: "/types/typeof:tup" } } } } }
        ], [
            "/types/typeof:VarTypeof",
            { type: "alias", body: { type: "value_reference", name: "/types/typeof:y" } }
        ]]);
    __RuntyperAutogeneratedImport.Runtyper.internal.v([[
            "/types/typeof:NS.obj",
            { type: "object", properties: { a: { type: "number" }, b: { type: "object", properties: { c: { type: "constant", value: "a" } } } } }
        ], [
            "/types/typeof:bigObj",
            { type: "object", properties: { a: { type: "number" }, b: { type: "number" }, z: { type: "object", properties: { y: { type: "object", properties: { x: { type: "array", valueType: { type: "number" } } } } } } } }
        ], [
            "/types/typeof:f",
            { type: "index_access", index: { type: "constant", value: "f" }, object: { type: "object", properties: { f: { type: "number" } } } }
        ], [
            "/types/typeof:obj",
            { type: "array", valueType: { type: "object", properties: { a: { type: "number" }, b: { type: "object", properties: { c: { type: "constant", value: "a" } } } } } }
        ], [
            "/types/typeof:tup",
            { type: "tuple", valueTypes: [{ type: "number" }, { type: "object", properties: { a: { type: "object", properties: { b: { type: "constant", value: "c" } } } } }] }
        ], [
            "/types/typeof:x",
            { type: "constant", value: "b" }
        ], [
            "/types/typeof:y",
            { type: "number" }
        ]]);
    __RuntyperAutogeneratedImport.Runtyper.internal.f([[
            "/types/typeof:bigObj",
            bigObj
        ], [
            "/types/typeof:f",
            f
        ], [
            "/types/typeof:obj",
            obj
        ], [
            "/types/typeof:tup",
            tup
        ], [
            "/types/typeof:x",
            x
        ], [
            "/types/typeof:y",
            y
        ]]);
}

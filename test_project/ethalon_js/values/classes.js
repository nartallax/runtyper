function (exports, require, __RuntyperAutogeneratedImport) {
    class MyClass {
        woof(count) {
            return new Array(count + 1).join("woof");
        }
        moo(count) {
            return count === undefined ? "moo!" : ["moo", "moo"];
        }
    }
    exports.MyClass = MyClass;
    __RuntyperAutogeneratedImport.internal.v([[
            "/values/classes:MyClass",
            { type: "class", methods: { woof: { functionName: "/values/classes:MyClass.prototype.woof", access: "public" }, moo: { functionName: "/values/classes:MyClass.prototype.moo", access: "public" } } }
        ], [
            "/values/classes:MyClass.prototype.moo",
            { type: "function", signatures: [{ returnType: { type: "string" } }, { parameters: [{ type: "parameter", name: "count", valueType: { type: "number" } }], returnType: { type: "array", valueType: { type: "string" } } }, { parameters: [{ type: "parameter", name: "count", valueType: { type: "number" }, optional: true }], hasImplementation: true, returnType: { type: "union", types: [{ type: "string" }, { type: "array", valueType: { type: "string" } }] } }] }
        ], [
            "/values/classes:MyClass.prototype.woof",
            { type: "function", signatures: [{ parameters: [{ type: "parameter", name: "count", valueType: { type: "number" } }], hasImplementation: true, returnType: { type: "string" } }] }
        ]]);
    __RuntyperAutogeneratedImport.internal.f([[
            "/values/classes:MyClass",
            MyClass
        ], [
            "/values/classes:MyClass.prototype.moo",
            MyClass.prototype.moo
        ], [
            "/values/classes:MyClass.prototype.woof",
            MyClass.prototype.woof
        ]]);
}

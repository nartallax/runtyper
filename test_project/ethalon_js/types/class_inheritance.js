function (exports, require, __RuntyperAutogeneratedImport) {
    class A {
        getName() {
            return "a";
        }
        getBoolean() {
            return true;
        }
    }
    class B extends A {
        constructor() {
            super(...arguments);
            this.name = "uwu";
        }
        getName() {
            return this.name;
        }
        getNumber() {
            return 5;
        }
    }
    exports.B = B;
    __RuntyperAutogeneratedImport.Runtyper.internal.v([[
            "/types/class_inheritance:A",
            { type: "class", methods: { getName: { functionName: "/types/class_inheritance:A.prototype.getName", access: "public" }, getBoolean: { functionName: "/types/class_inheritance:A.prototype.getBoolean", access: "public" } } }
        ], [
            "/types/class_inheritance:A.prototype.getBoolean",
            { type: "function", signatures: [{ hasImplementation: true, returnType: { type: "boolean" } }] }
        ], [
            "/types/class_inheritance:A.prototype.getName",
            { type: "function", signatures: [{ hasImplementation: true, returnType: { type: "string" } }] }
        ], [
            "/types/class_inheritance:B",
            { type: "class", heritage: [{ type: "value_reference", name: "/types/class_inheritance:A" }], instanceProperties: { name: { type: "string", access: "public" } }, methods: { getName: { functionName: "/types/class_inheritance:B.prototype.getName", access: "public" }, getNumber: { functionName: "/types/class_inheritance:B.prototype.getNumber", access: "public" } } }
        ], [
            "/types/class_inheritance:B.prototype.getName",
            { type: "function", signatures: [{ hasImplementation: true, returnType: { type: "string" } }] }
        ], [
            "/types/class_inheritance:B.prototype.getNumber",
            { type: "function", signatures: [{ hasImplementation: true, returnType: { type: "number" } }] }
        ]]);
    __RuntyperAutogeneratedImport.Runtyper.internal.f([[
            "/types/class_inheritance:A",
            A
        ], [
            "/types/class_inheritance:A.prototype.getBoolean",
            A.prototype.getBoolean
        ], [
            "/types/class_inheritance:A.prototype.getName",
            A.prototype.getName
        ], [
            "/types/class_inheritance:B",
            B
        ], [
            "/types/class_inheritance:B.prototype.getName",
            B.prototype.getName
        ], [
            "/types/class_inheritance:B.prototype.getNumber",
            B.prototype.getNumber
        ]]);
}
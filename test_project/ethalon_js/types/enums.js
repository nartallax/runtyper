function (exports, require, __RuntyperAutogeneratedImport) {
    var Direction;
    (function (Direction) {
        Direction[Direction["Up"] = 1] = "Up";
        Direction[Direction["Down"] = 2] = "Down";
        Direction[Direction["Left"] = 3] = "Left";
        Direction[Direction["Right"] = 4] = "Right";
    })(Direction = exports.Direction || (exports.Direction = {}));
    var Named;
    (function (Named) {
        Named[Named["B"] = 0] = "B";
        Named["A"] = "sss";
    })(Named = exports.Named || (exports.Named = {}));
    __RuntyperAutogeneratedImport.internal.t([[
            "/types/enums:Direction",
            { type: "enum", values: [1, 2, 3, 4] }
        ], [
            "/types/enums:DirectionOrNamed",
            { type: "alias", body: { type: "union", types: [{ type: "type_reference", name: "/types/enums:Named" }, { type: "type_reference", name: "/types/enums:Direction" }] } }
        ], [
            "/types/enums:Named",
            { type: "enum", values: [0, "sss"] }
        ]]);
}

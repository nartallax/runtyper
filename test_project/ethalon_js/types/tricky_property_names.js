function (exports, require, __RuntyperAutogeneratedImport) {
    const { x: propname } = { x: "pew-pew\"-pew" };
    __RuntyperAutogeneratedImport.Runtyper.internal.t([[
            "/types/tricky_property_names:ConstStringPropName",
            { type: "broken", file: "/types/tricky_property_names", node: "export interface ConstStringPropName {\n\t[propname]: number\n}", message: "Unsupported property name: [propname]" }
        ], [
            "/types/tricky_property_names:TrickyProperties",
            { type: "interface", properties: { 5: { type: "number" }, "\u044B\u044B\u044B\u044B": { type: "number" }, "\"": { type: "number" }, "\"\"": { type: "number" }, "\\": { type: "number" }, "\\\"": { type: "number" }, "0.5": { type: "number" }, "0.05": { type: "number" }, "0.005": { type: "number" }, "0.0005": { type: "number" }, "0.00005": { type: "number" }, "0.000005": { type: "number" }, "5e-7": { type: "number" }, "5e-8": { type: "number" }, "5e-9": { type: "number" }, "5e+22": { type: "number" } } }
        ]]);
    __RuntyperAutogeneratedImport.Runtyper.internal.v([[
            "/types/tricky_property_names:propname",
            { type: "index_access", index: { type: "constant", value: "x" }, object: { type: "object", properties: { x: { type: "constant", value: "pew-pew\"-pew" } } } }
        ]]);
    __RuntyperAutogeneratedImport.Runtyper.internal.f([[
            "/types/tricky_property_names:propname",
            propname
        ]]);
}

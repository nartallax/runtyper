// import {Runtyper} from "entrypoint"
// import {valueTypes} from "runtime/runtime"

// function constantValueToString(v: Runtyper.ConstantType["value"]): string {
// 	if(v === true || v === false || v === null || v === undefined || typeof(v) === "number"){
// 		return v + ""
// 	} else {
// 		return JSON.stringify(v)
// 	}
// }

// function genArgsToString(args?: (Runtyper.Type | Runtyper.InferType)[]): string {
// 	if(!args || args.length === 0){
// 		return ""
// 	}
// 	return "<" + args.map(arg => {
// 		if(arg.type === "infer"){
// 			return "infer " + arg.name
// 		} else {
// 			return typeToString(arg)
// 		}
// 	}) + ">"
// }

// export function typeToString(type: Runtyper.Type): string {

// 	switch(type.type){
// 		case "broken": return "<broken type: " + type.message + ">"
// 		case "constant": return constantValueToString(type.value)
// 		case "constant_union": return "(" + type.value.map(x => constantValueToString(x)).join(" | ") + ")"
// 		case "string": return "string"
// 		case "number": return "number"
// 		case "boolean": return "boolean"
// 		case "any": return "any"
// 		case "unknown": return "unknown"
// 		case "never": return "never"
// 		case "array": return "(" + typeToString(type.valueType) + ")[]"
// 		case "tuple": return "[" + type.valueTypes.map(x => {
// 			if(x.type === "rest"){
// 				return "..." + typeToString(x.valueType)
// 			} else {
// 				return typeToString(x)
// 			}
// 		}).join(", ") + "]"
// 		case "call_result_reference": return "(typeof " + type.functionName + "(???))"
// 		case "value_reference": return "(typeof " + type.name + ")"
// 		case "type_reference": return type.name + genArgsToString(type.typeArguments)
// 		case "generic_parameter": return type.name
// 		case "conditional": return typeToString(type.checkType) + " extends " + typeToString(type.extendsType) + " ? " + typeToString(type.trueType) + " : " + typeToString(type.falseType)
// 		case "enum": return "enum <name unknown> { <value names also not known>: " + JSON.stringify(valueTypes) + " }"
// 		case "object":
// 			let result = "{"

// 			return result + "}"
// 	}

// }
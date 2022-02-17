import {Runtyper} from "entrypoint"

function constantValueToString(v: Runtyper.ConstantType["value"]): string {
	if(v === true || v === false || v === null || v === undefined || typeof(v) === "number"){
		return v + ""
	} else {
		return JSON.stringify(v)
	}
}

export function isValidIdentifier(name: string): boolean {
	return !!name.match(/[a-zA-Z_][a-zA-Z\d_]*/)
}

export function simpleTypeToString(type: Runtyper.SimpleType, includeModuleName: boolean): string {

	switch(type.type){
		case "constant": return constantValueToString(type.value)
		case "constant_union": return "(" + type.value.map(x => constantValueToString(x)).join(" | ") + ")"
		case "string": return "string"
		case "number": return "number"
		case "boolean": return "boolean"
		case "any": return "any"
		case "unknown": return "unknown"
		case "never": return "never"
		case "array": return "(" + simpleTypeToString(type.valueType, includeModuleName) + ")[]"
		case "tuple": return "[" + type.valueTypes.map(x => {
			if(x.type === "rest"){
				return "..." + simpleTypeToString(x.valueType, includeModuleName)
			} else {
				return simpleTypeToString(x, includeModuleName)
			}
		}).join(", ") + "]"
		case "object":{
			if(type.refName){
				return type.refName
			}
			let result = "{"
			let hasProps = false
			for(let propName in type.properties){
				if(hasProps){
					result += ", "
				}
				hasProps = true
				if(isValidIdentifier(propName)){
					result += propName + ": "
				} else {
					result += "[" + JSON.stringify(propName) + "]: "
				}

				result += simpleTypeToString(type.properties[propName]!, includeModuleName)
			}

			if(type.index){
				if(hasProps){
					result += "; "
				}
				result += "[k: " + simpleTypeToString(type.index.keyType, includeModuleName) + "]: " + simpleTypeToString(type.index.valueType, includeModuleName)
			}

			return result + "}"
		}
		case "union": return "(" + type.types.map(x => simpleTypeToString(x, includeModuleName)).join(" | ") + ")"
		case "intersection": return "(" + type.types.map(x => simpleTypeToString(x, includeModuleName)).join(" & ") + ")"
	}

}
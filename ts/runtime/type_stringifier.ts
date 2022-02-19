import {Runtyper} from "entrypoint"

function constantValueToString(v: Runtyper.ConstantType["value"]): string {
	if(v === true || v === false || v === null || v === undefined || typeof(v) === "number"){
		return v + ""
	} else {
		return JSON.stringify(v)
	}
}

export function isValidIdentifier(name: string): boolean {
	return !!name.match(/^[a-zA-Z_][a-zA-Z\d_]*$/)
}

export function simpleTypeToString(type: Runtyper.SimpleType, opts?: Partial<Runtyper.SimpleTypeStringificationOptions>): string {

	if(!opts?.useLessName){
		if(opts?.fullNames && type.fullRefName){
			return type.fullRefName
		} else if(type.refName){
			return type.refName
		}
	}

	switch(type.type){
		case "constant": return constantValueToString(type.value)
		case "constant_union": return "(" + type.value.map(x => constantValueToString(x)).join(" | ") + ")"
		case "string": return "string"
		case "number": return "number"
		case "boolean": return "boolean"
		case "any": return "any"
		case "unknown": return "unknown"
		case "never": return "never"
		case "array": return "(" + simpleTypeToString(type.valueType, opts) + ")[]"
		case "tuple": return "[" + type.valueTypes.map(x => {
			if(x.type === "rest"){
				return "..." + simpleTypeToString(x.valueType, opts)
			} else {
				return simpleTypeToString(x, opts)
			}
		}).join(", ") + "]"
		case "object":{
			if(opts?.fullNames && type.fullRefName){
				return type.fullRefName
			} else if(type.refName){
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

				result += simpleTypeToString(type.properties[propName]!, opts)
			}

			if(type.index){
				if(hasProps){
					result += "; "
				}
				result += "[k: " + simpleTypeToString(type.index.keyType, opts) + "]: " + simpleTypeToString(type.index.valueType, opts)
			}

			return result + "}"
		}
		case "union": return "(" + type.types.map(x => simpleTypeToString(x, opts)).join(" | ") + ")"
		case "intersection": return "(" + type.types.map(x => simpleTypeToString(x, opts)).join(" & ") + ")"
	}

}
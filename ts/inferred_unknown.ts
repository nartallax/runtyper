import {Runtyper} from "entrypoint"


/** This is special type that mimicks `unknown`
 * it acts as a marker that helps to find types that needs inferrence in type tree */
interface InferredUnknownType {
	readonly type: "unknown"
	readonly isThisSpecialUnknownForInferring: true
	readonly name: string
}

export function makeInferredUnknown(name: string): InferredUnknownType & Runtyper.SimpleType {
	return {type: "unknown", isThisSpecialUnknownForInferring: true, name}
}

export function getInferredUnknownName(type: Runtyper.SimpleType): string | null {
	let iut = type as InferredUnknownType
	return iut.isThisSpecialUnknownForInferring ? iut.name : null
}
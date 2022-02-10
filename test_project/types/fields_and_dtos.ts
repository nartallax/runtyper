export interface FieldDefinition<T> {
	defaultValue: T
}

export type FieldType<F> = F extends FieldDefinition<infer T>? T: never

export type DtoByFields<T> = {[P in keyof T]: FieldType<T[P]>}

export function textField(params: {label: string}): FieldDefinition<string> {
	void params
	throw new Error("Not implemented")
}

export function dateField(params: {label: string}): FieldDefinition<number> {
	void params
	throw new Error("Not implemented")
}

export const CarFields = {
	model: textField({label: "Model of car"}),
	color: textField({label: "Color of car"}),
	manufacturingDate: dateField({label: "Date when car was manufactured"})
}

export type Car = DtoByFields<typeof CarFields>
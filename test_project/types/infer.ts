export interface MyField<T>{
	name: string
	value: T
}

export type FieldValue<F> = F extends MyField<infer Z>? Z: never
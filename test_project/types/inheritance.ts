interface A {
	x: number
}

interface B extends A {
	y?: number
}

export interface C extends B {
	z: number
}

type Wrap<T> = {value: T}

interface WrapWithName<T> extends Wrap<T> {
	name?: string
}

export interface WrappedNamedNumber extends WrapWithName<number>{
	isNumber: true
}


interface Name {
	name: string
	[otherProps: string]: string | boolean
}

export interface NameWithValue extends Name, Wrap<string> {
	isNameWithValue: true
}
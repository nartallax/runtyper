export type Primitive = number | string | boolean
export type Zero = null | undefined
export type NullableNumber = null | number
export type Shapeless = any | unknown

interface Point {
	x: number
	y: number
}

interface MathProblem {
	x: number
	z: number
}

export type ManyMath = MathProblem & Point
export type NotManyMath = MathProblem | Point
export type MathAndName = (MathProblem | Point) & {name: string}
export type MathAndSomethingElse<T> = T & MathProblem
export type MathAndSomethingElseWithDefault<T = Point> = T & MathProblem

export type U_AnyUnknownNever = any | unknown | never
export type U_UnknownNever = unknown | never
export type U_AnyAndType = any | string
export type U_AnyAndConst = any | 5
export type U_AnyAndConsts = any | 5 | 10
export type U_UnknownAndType = unknown | string
export type U_UnknownAndConst = unknown | 5
export type U_UnknownAndConsts = unknown | 5 | 10
export type U_NeverAndType = never | string
export type U_NeverAndConst = never | 5
export type U_NeverAndConsts = never | 5 | 10

export type I_AnyUnknownNever = any & unknown & never
export type I_AnyUnknown = any & unknown
export type I_AnyAndType = any & string
export type I_AnyAndConst = any & 5
export type I_AnyAndConsts = any & 5 & 10
export type I_UnknownAndType = unknown & string
export type I_UnknownAndConst = unknown & 5
export type I_UnknownAndConsts = unknown & 5 & 10
export type I_NeverAndType = never & string
export type I_NeverAndConst = never & 5
export type I_NeverAndConsts = never & 5 & 10
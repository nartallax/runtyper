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
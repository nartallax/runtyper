export type MyFalse = false
export type MyNull = null
export type MyUndefined = undefined
export type AnswerToEverything = 42
export type MyDogName = "I have\" \\ no dog!"

export type Goodness = "very_good" | "moderately_good" | "not_good"

export type Parens = (((1 | 2) | 3) | 4)

export type Quality = null | false | 1 | 2 | 3 | "absolutely_perfect"

// probably not a good idea to have fraction as constant types, but let's test it anyway
export type Fraction = 0.5 | 1.5 | -0.3
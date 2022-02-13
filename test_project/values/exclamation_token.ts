let x: number | null = 5
let y: string | undefined = "asdasd"
const qwert = 5
let rewq = 5 as null | 5 | undefined

let xx = x!
let yy = y!
let zz = (false as boolean | null | undefined)!
const zzz = (false)!
let qwert2 = qwert!
let rewq2 = rewq!
let rewq3 = (5 as null | 5 | undefined)!
let wut = (x as unknown as undefined)!

export type XNoNull = typeof xx
export type YNoUndef = typeof yy
export type ZNoEmptyVal = typeof zz
export type ZConstNoEmptyVal = typeof zzz
export type QwertNoEmptyVal = typeof qwert2
export type RewqNoEmptyVal = typeof rewq2
export type RewqInlineNoEmptyVal = typeof rewq3
export type ThisShoultBeNever = typeof wut
import {Runtyper} from "@nartallax/runtyper"
import {RmOptions} from "fs"
import {ReadonlyTextRange} from "typescript"
import {ClamsensorExceptionSpecification} from "@nartallax/clamsensor"
import * as Clmsnsr from "@nartallax/clamsensor"
import {Nya, NyaNya} from "types/exportequals_to_be_imported"
import {version} from "@typescript-eslint/parser"

interface Point {
	x: number
	y: number
	z: number
}

// external type from global
export interface NamedZ extends Omit<Point, "y"> {
	name: string
}

// external type from namespace
export type SimpleType = Runtyper.PrimitiveType

// external type from global
export type MyFn = NodeJS.CallSite

// external type from ambient module
export type MyRmOptions = RmOptions

// external type from export = namespace module
export type MySyntaxKind = ReadonlyTextRange

// external type just plainly exported
export type MyErrorSpec = ClamsensorExceptionSpecification

// external type imported with `import *`
export type MyVerEntry = Clmsnsr.ClamsensorVerificationEntryDescription

// non-external imports from exportequals namespace
export type MyNyaNya = Nya | NyaNya

// here we test that function imported from non-whitelisted module won't add a value in values array
export type ExampleFnType = typeof version
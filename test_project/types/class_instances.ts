import {MyHamster} from "types/class_instances_to_be_imported"
import {Runtyper} from "@nartallax/runtyper"
import {ReadStream} from "fs"
import {ClamsensorTestRunner} from "@nartallax/clamsensor"
import {MyNyaNya} from "types/exportequals_to_be_imported"

export class DogCls {
	name = "Sharique"
	bark(): void {
		// nothing
	}
}

export interface MyDogs {
	firstDog: DogCls
	secondDog: DogCls
}

export interface NamedFile {
	name: string
	binary: Buffer | ArrayBuffer
	creationDate: Date
}

export namespace ClsNamespace {
	class CatCls {
		walksOnSelf = true
		meow(): void {
			// nothing
		}
	}

	export type CatOrDog = CatCls | DogCls
}


// our classes
export type MyAnimal = ClsNamespace.CatOrDog | MyHamster

// external class from global
export type MyBuffer = Buffer

// external class from namespace
export type MyValidationError = Runtyper.ValidationError

// external class from ambient module
export type StreamOrType = Runtyper.PrimitiveType | ReadStream

// external class from non-ambient module
export type MyRunner = ClamsensorTestRunner

// our `export = namespace` class
export type MyNyaNyaNya = MyNyaNya
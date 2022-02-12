/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export interface MeowingThing {
	meow(name: string): string
}

export class MyClass implements MeowingThing {

	meow(name) {
		return name + " meow!"
	}

}

// yes, this class WILL produce bad type structures
// not much I can/want/know to do about this
export class Itrbl implements Iterable<null> {
	[Symbol.iterator](): never {
		throw new Error("nope")
	}
}
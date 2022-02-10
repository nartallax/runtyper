/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export interface MeowingThing {
	meow(name: string): string
}

class ProtoClass {
	protoName = "protoVasya"
}

export class MyClass extends ProtoClass implements MeowingThing {
	static clsStaticMember = 5

	name = "vasya"

	constructor(readonly whoopsie?: number) {
		super()
	}

	woof(count: number): string {
		return new Array(count + 1).join("woof")
	}

	meow(name) {
		return name + " meow!"
	}

	moo(): string
	moo(count: number): string[]
	moo(count?: number): string | string[] {
		return count === undefined ? "moo!" : ["moo", "moo"]
	}

}

export let myClassInstance = new MyClass(111)

export type MyClsStaticField = typeof MyClass.clsStaticMember
export type MyClsInstanceFieldA = typeof myClassInstance.name
export type MyClsInstanceFieldB = typeof myClassInstance.whoopsie
export type MyClsInstanceFieldC = typeof myClassInstance.protoName
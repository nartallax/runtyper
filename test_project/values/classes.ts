export class MyClass {

	woof(count: number): string {
		return new Array(count + 1).join("woof")
	}

	moo(): string
	moo(count: number): string[]
	moo(count?: number): string | string[] {
		return count === undefined ? "moo!" : ["moo", "moo"]
	}

}
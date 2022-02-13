export class MyClass {

	woof(count: number): string {
		return new Array(count + 1).join("woof")
	}

	moo(): string
	moo(count: number): string[]
	moo(count?: number): string | string[] {
		return count === undefined ? "moo!" : ["moo", "moo"]
	}

	// see tricky props for explaination
	["moo2"](): string {
		return "moo2-moo2"
	}

	["\"\"\""](): string {
		throw new Error("not implemented")
	}

	["\\\\"](): string {
		throw new Error("not implemented")
	}

	// eslint-disable-next-line @typescript-eslint/quotes
	['"'](): string {
		throw new Error("not implemented")
	}

	[5](): number {
		throw new Error("not implemented")
	}

	[0.0000005](): number {
		throw new Error("not implemented")
	}

	[50000000000000000000000](): number {
		throw new Error("not implemented")
	}

}
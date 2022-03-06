class A {
	getName(): string {
		return "a"
	}
	getBoolean(): boolean {
		return true
	}
}

export class B extends A {
	name = "uwu"

	getName(): string {
		return this.name
	}
	getNumber(): number {
		return 5
	}
}
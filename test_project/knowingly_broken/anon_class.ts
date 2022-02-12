// this will generate invalid type
// the test just checks that it won't just crash the compiler
export const MyEnum = new class extends newEnum() {
	readonly Good = this.value(1, "Good!")
	readonly Bad = this.value(2, "Bad!")
}()


function newEnum(): {new (): EnumImpl} {
	return class extends EnumImpl {}
}

interface Enum {
	readonly values: ReadonlyArray<EnumElement>
}

interface EnumElement {
	label: string
	value: number
}

class EnumImpl implements Enum {
	readonly values = [] as EnumElement[]

	protected value(value: number, label: string): EnumElement {
		let result = {value, label}
		this.values.push(result)
		return result
	}

}
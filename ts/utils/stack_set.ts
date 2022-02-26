/** Set that keeps order of insertion and acts like a stack */
export class StackSet<T> {

	private readonly stack = [] as T[]
	private readonly set = new Set<T>()

	push(value: T): void {
		if(this.set.has(value)){
			throw new Error("Duplicate value: " + value)
		}
		this.stack.push(value)
		this.set.add(value)
	}

	pop(): T | undefined {
		if(this.stack.length < 1){
			return undefined
		}

		let value = this.stack.pop()!
		this.set.delete(value)
		return value
	}

	has(value: T): boolean {
		return this.set.has(value)
	}

	get size(): number {
		return this.stack.length
	}

	/** Pop()s values until stopCondition() returns true
	 * Values on top of stack are placed at start of the resulting array
	 * Value that met stopCondition() is also popped and placed into result array
	 * If no value is found - throws an error */
	rewindPopUntil(stopCondition: (value: T) => boolean): T[] {
		let result = [] as T[]
		while(this.stack.length > 0){
			let value = this.pop()!
			result.push(value)
			if(stopCondition(value)){
				return result
			}
		}

		throw new Error("Rewind did not found the item")
	}

	clear(): void {
		this.stack.length = 0
		this.set.clear()
	}

}
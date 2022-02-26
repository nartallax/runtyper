/** Map that keeps order of insertion and acts like a stack */
export class StackMap<K, V> {

	private readonly stack = [] as K[]
	private readonly map = new Map<K, V>()

	push(key: K, value: V): void {
		if(this.map.has(key)){
			throw new Error("Duplicate key: " + value)
		}
		this.stack.push(key)
		this.map.set(key, value)
	}

	pop(): [K, V] | undefined {
		if(this.stack.length < 1){
			return undefined
		}

		let key = this.stack.pop()!
		let value = this.map.get(key)!
		this.map.delete(key)
		return [key, value]
	}

	has(key: K): boolean {
		return this.map.has(key)
	}

	get size(): number {
		return this.stack.length
	}

	/** Pop()s values until stopCondition() returns true
	 * Values on top of stack are placed at start of the resulting array
	 * Value that met stopCondition() is also popped and placed into result array
	 * If no value is found - throws an error */
	rewindPopUntil(stopCondition: (key: K, value: V) => boolean): [K, V][] {
		let result = [] as [K, V][]
		while(this.stack.length > 0){
			let pair = this.pop()!
			result.push(pair)
			if(stopCondition(pair[0], pair[1])){
				return result
			}
		}

		throw new Error("Rewind did not found the item")
	}

}
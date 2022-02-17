export class CountingSeq<T> {

	private readonly map = new Map<T, number>()
	private readonly stack = [] as T[]

	push(value: T): void {
		this.stack.push(value)
		this.map.set(value, (this.map.get(value) || 0) + 1)
	}

	pop(): T | undefined {
		let hadValue = this.stack.length > 0
		let result = this.stack.pop()
		if(hadValue){
			let v = this.map.get(result!)!
			v -= 1
			if(v === 0){
				this.map.delete(result!)
			} else {
				this.map.set(result!, v)
			}
		}
		return result
	}

	countOf(value: T): number {
		return this.map.get(value) || 0
	}

	clear(): void {
		this.map.clear()
		this.stack.length = 0
	}

}
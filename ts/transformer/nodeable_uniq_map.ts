import {RuntyperTricks} from "transformer/tricks"
import * as Tsc from "typescript"

export abstract class NodeableUniqMap<K, V> {
	protected readonly map = new Map<K, V>()

	constructor(private readonly fnName: string) {}

	protected abstract keyToNode(key: K): Tsc.Expression
	protected valueToNode(tricks: RuntyperTricks, value: V): Tsc.Expression {
		return tricks.createLiteralOfValue(value)
	}

	clear(): void {
		this.map.clear()
	}

	get size(): number {
		return this.map.size
	}

	maybeAdd(key: K, value: V): void {
		if(!this.map.has(key)){
			this.map.set(key, value)
		}
	}

	get(key: K): V | undefined {
		return this.map.get(key)
	}

	has(key: K): boolean {
		return this.map.has(key)
	}

	add(key: K, value: V): void {
		if(this.map.has(key)){
			throw new Error("There is more than one value or type named " + key + "! This should never happen. Maybe you did something overly smart with module resolution?")
		}
		this.map.set(key, value)
	}

	addMaybeOverwrite(key: K, value: V): void {
		this.map.set(key, value)
	}

	private callExpr(importName: string, arrValues: Tsc.Expression[]): Tsc.ExpressionStatement | null {
		let factory = Tsc.factory
		return arrValues.length < 1 ? null : factory.createExpressionStatement(
			factory.createCallExpression(
				factory.createPropertyAccessExpression(
					factory.createPropertyAccessExpression(
						factory.createPropertyAccessExpression(
							factory.createIdentifier(importName),
							factory.createIdentifier("Runtyper")
						),
						factory.createIdentifier("internal")
					),
					factory.createIdentifier(this.fnName)
				),
				undefined,
				[factory.createArrayLiteralExpression(
					arrValues,
					false
				)]
			))
	}

	toNode(tricks: RuntyperTricks, moduleIdentifier: string): Tsc.ExpressionStatement | null {
		let factory = Tsc.factory

		return this.callExpr(moduleIdentifier, [...this.map.entries()].sort((a, b) => a[0] > b[0] ? 1 : -1).map(([k, v]) => {
			return factory.createArrayLiteralExpression([
				this.keyToNode(k),
				this.valueToNode(tricks, v)
			], true)
		}))
	}

}

export class StringNodeableUniqMap<T> extends NodeableUniqMap<string, T> {
	protected keyToNode(key: string): Tsc.Expression {
		return Tsc.factory.createStringLiteral(key)
	}
}

export class FunctionNameMap extends StringNodeableUniqMap<Tsc.PropertyName[] | Tsc.Expression> {

	protected valueToNode(tricks: RuntyperTricks, value: Tsc.PropertyName[]): Tsc.Expression {
		return Array.isArray(value) ? tricks.propNamesToAccessChain(value) : value
	}

}
import {RuntyperTricks} from "transformer/tricks"
import * as Tsc from "typescript"

export abstract class NodeableUniqMap<K, V> {
	protected readonly map = new Map<K, V>()

	constructor(private readonly destinationMapName: string) {}

	protected abstract keyToNode(key: K): Tsc.Expression
	protected valueToNode(tricks: RuntyperTricks, value: V): Tsc.Expression {
		return tricks.createLiteralOfValue(value)
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

	add(key: K, value: V): void {
		if(this.map.has(key)){
			throw new Error("There is more than one value or type named " + key + "! This should never happen. Maybe you did something overly smart with module resolution?")
		}
		this.map.set(key, value)
	}

	addMaybeOverwrite(key: K, value: V): void {
		this.map.set(key, value)
	}

	protected toNode(key: K, value: V, tricks: RuntyperTricks, moduleIdentifier: string): Tsc.Expression {
		let factory = Tsc.factory
		return factory.createCallExpression(
			factory.createPropertyAccessExpression(
				factory.createPropertyAccessExpression(
					factory.createIdentifier(moduleIdentifier),
					factory.createIdentifier(this.destinationMapName)
				),
				factory.createIdentifier("set")
			),
			undefined,
			[this.keyToNode(key), this.valueToNode(tricks, value)]
		)
	}

	toNodes(tricks: RuntyperTricks, moduleIdentifier: string): Tsc.ExpressionStatement[] {
		let factory = Tsc.factory

		return [...this.map.entries()].sort((a, b) => a[0] > b[0] ? 1 : -1).map(([k, v]) => {
			return factory.createExpressionStatement(
				this.toNode(k, v, tricks, moduleIdentifier)
			)
		})

	}

}

export class StringNodeableUniqMap<T> extends NodeableUniqMap<string, T> {
	protected keyToNode(key: string): Tsc.Expression {
		return Tsc.factory.createStringLiteral(key)
	}
}

export class FunctionNameMap extends StringNodeableUniqMap<Tsc.PropertyName[]> {

	protected valueToNode(tricks: RuntyperTricks, value: Tsc.PropertyName[]): Tsc.Expression {
		return tricks.propNamesToAccessChain(value)
	}

	toNodes(tricks: RuntyperTricks, moduleIdentifier: string): Tsc.ExpressionStatement[] {

		let factory = Tsc.factory

		return [...this.map.entries()].sort((a, b) => a[0] > b[0] ? 1 : -1).map(([k, v]) => {
			return factory.createExpressionStatement(
				factory.createBinaryExpression(
					factory.createBinaryExpression(
						factory.createTypeOfExpression(this.valueToNode(tricks, v)),
						factory.createToken(Tsc.SyntaxKind.EqualsEqualsEqualsToken),
						factory.createStringLiteral("function")
					)
					,
					factory.createToken(Tsc.SyntaxKind.AmpersandAmpersandToken),
					this.toNode(k, v, tricks, moduleIdentifier)
				)
			)
		})
	}
}
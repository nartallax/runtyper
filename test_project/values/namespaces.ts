/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export namespace NestedA {
	export namespace NestedB {
		export namespace NestedC {
			export namespace NestedD {
				export let veryNestedVar = (x: number): void => console.log(x)
				export function veryNestedFn(x: string): void {
					console.log(x)
				}
				export function veryNestedFn2(x: string): number {
					return parseInt(x)
				}
			}
		}
	}
}

export let resultOfVeryNestedCall = NestedA.NestedB.NestedC.NestedD.veryNestedFn2("12345")
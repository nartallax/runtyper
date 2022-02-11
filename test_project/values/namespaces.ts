/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export namespace NestedA {
	export namespace NestedB {
		export namespace NestedC {
			export namespace NestedD {
				// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
				export let veryNestedVar = (x: number) => console.log(x)
				export function veryNestedFn(x: string) {
					console.log(x)
				}
			}
		}
	}
}
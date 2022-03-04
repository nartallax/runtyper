namespace TestNS {
	export type Nya = "cat"
}

namespace TestNS {
	export type NyaNya = "cat-cat"

	export class MyNyaNya {
		makeSound(): NyaNya {
			return "cat-cat"
		}
	}
}

export = TestNS
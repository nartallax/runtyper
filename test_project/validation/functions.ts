import {functionTests} from "test_project_main"

function sumTwoNumbers(a: number, b: number): number {
	return a + b
}

functionTests.push([
	sumTwoNumbers,
	[2, 2],
	4
])

functionTests.push([
	sumTwoNumbers,
	[2, "ne-ne-ne"],
	"at path b "
])

functionTests.push([
	sumTwoNumbers,
	[2],
	"at path b "
])

functionTests.push([
	sumTwoNumbers,
	[2, 3, 4],
	"1 extra argument"
])

functionTests.push([
	sumTwoNumbers,
	[2, 3, 4],
	5,
	{onExtraArguments: "allow_anything"}
])

functionTests.push([
	sumTwoNumbers,
	{a: 3, b: 3},
	6
])

functionTests.push([
	sumTwoNumbers,
	null,
	"Expected map of arguments to be object"
])

functionTests.push([
	sumTwoNumbers,
	{a: 3, b: 4, c: 5},
	"extra argument: c"
])

functionTests.push([
	sumTwoNumbers,
	{a: 3, b: 4, c: 5},
	7,
	{onExtraArguments: "allow_anything"}
])



class MyApiClass {

	sumOfTwo(a: number, b: number): number
	sumOfTwo(a: string, b: string): string
	sumOfTwo(a: number | string, b: number | string): number | string {
		return a as string + b as string // eh
	}

}


functionTests.push([
	MyApiClass.prototype.sumOfTwo,
	{a: 3, b: 4},
	7
])

functionTests.push([
	MyApiClass.prototype.sumOfTwo,
	{a: 3, b: "owo"},
	"bad value"
])

functionTests.push([
	MyApiClass.prototype.sumOfTwo,
	{a: "o_", b: "_o"},
	"o__o"
])



function box<T>(value: T): {value: T} {
	return {value}
}

functionTests.push([
	box,
	"uwu",
	"Failed to simplify"
])



class Box<T> {
	add(value: T): void {
		void value
	}
}

functionTests.push([
	Box.prototype.add,
	"owo",
	"Failed to simplify"
])



function addTwoOrThree(a: number, b: number, c?: number): number {
	return a + b + (c === undefined ? 0 : c)
}

functionTests.push([
	addTwoOrThree,
	[1, 2, 3],
	6
])

functionTests.push([
	addTwoOrThree,
	{a: 1, b: 2, c: 3},
	6
])

functionTests.push([
	addTwoOrThree,
	[1, 2],
	3
])

functionTests.push([
	addTwoOrThree,
	{a: 1, b: 2},
	3
])


function addTwoOrThreeWithDefault(a: number, b: number, c = 3): number {
	return a + b + c
}

functionTests.push([
	addTwoOrThreeWithDefault,
	{a: 1, b: 2},
	6
])

functionTests.push([
	addTwoOrThreeWithDefault,
	{a: 1, b: 2, c: 1},
	4
])

functionTests.push([
	addTwoOrThreeWithDefault,
	[1, 2],
	6
])

functionTests.push([
	addTwoOrThreeWithDefault,
	[1, 2, 1],
	4
])


function addEverything(...args: number[]): number {
	let result = 0
	for(let i = 0; i < args.length; i++){
		result += args[i]!
	}
	return result
}

functionTests.push([
	addEverything,
	[1, 2, 3, 4, 5],
	15
])

functionTests.push([
	addEverything,
	[1, 2, 3, "uwu", 5],
	"at path args"
])

functionTests.push([
	addEverything,
	{args: [1, 2, 3, 4, 5]},
	15
])

functionTests.push([
	addEverything,
	{args: [1, "uwu", 3, 4, 5]},
	"bad value"
])

functionTests.push([
	addEverything,
	{args: 1},
	"at path args"
])


function namedMul(base: number, name = "addition", postfix?: boolean, ...otherNums: number[]): string {
	otherNums.forEach(x => base *= x)
	return postfix ? base + ": " + name : name + ": " + base
}

functionTests.push([
	namedMul,
	[2],
	"addition: 2"
])

functionTests.push([
	namedMul,
	[2, "uwu"],
	"uwu: 2"
])

functionTests.push([
	namedMul,
	[2, "uwu", false],
	"uwu: 2"
])

functionTests.push([
	namedMul,
	[2, "uwu", true],
	"2: uwu"
])

functionTests.push([
	namedMul,
	[2, "uwu", false, 2, 3],
	"uwu: 12"
])

functionTests.push([
	namedMul,
	[2, "uwu", 2, 3],
	"bad value"
])

functionTests.push([
	namedMul,
	[2, false, 2, 3],
	"bad value"
])

functionTests.push([
	namedMul,
	[2, false],
	"bad value"
])

functionTests.push([
	namedMul,
	{base: 2},
	"addition: 2"
])

functionTests.push([
	namedMul,
	{base: 2, name: "uwu"},
	"uwu: 2"
])

functionTests.push([
	namedMul,
	{base: 2, name: "uwu", postfix: false},
	"uwu: 2"
])

functionTests.push([
	namedMul,
	{base: 2, name: "uwu", postfix: true},
	"2: uwu"
])

functionTests.push([
	namedMul,
	{base: 2, name: "uwu", postfix: false, otherNums: [2, 3]},
	"uwu: 12"
])

functionTests.push([
	namedMul,
	{base: 2, name: "uwu", otherNums: [2, 3]},
	"uwu: 12"
])

functionTests.push([
	namedMul,
	{base: 2, postfix: true, otherNums: [2, 3]},
	"12: addition"
])

functionTests.push([
	namedMul,
	{base: 2, postfix: true},
	"2: addition"
])

functionTests.push([
	namedMul,
	{base: 2, postfix: true, otherNums: [2, 3, undefined]},
	"bad value"
])
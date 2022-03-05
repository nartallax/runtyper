import {validationTests} from "test_project_main"
import {Runtyper} from "@nartallax/runtyper"

type MyOddNumber = number
Runtyper.attachValidator<MyOddNumber>(value => value % 2 !== 1)

validationTests.push([
	Runtyper.getType<MyOddNumber>(),
	2,
	"bad value"
])

validationTests.push([
	Runtyper.getType<MyOddNumber>(),
	5,
	null
])

validationTests.push([
	Runtyper.getType<MyOddNumber>(),
	"niet",
	"bad value"
])


type MyNaturalNumber = number
Runtyper.attachValidator<MyNaturalNumber>(value => value % 1 !== 0)
Runtyper.attachValidator<MyNaturalNumber>(value => value < 0)

validationTests.push([
	Runtyper.getType<MyNaturalNumber>(),
	5,
	null
])

validationTests.push([
	Runtyper.getType<MyNaturalNumber>(),
	-3,
	"bad value"
])

validationTests.push([
	Runtyper.getType<MyNaturalNumber>(),
	1.5,
	"bad value"
])


interface MyBox<T> {
	content: T | null
	name: string | null
}

Runtyper.attachValidator<MyBox<number>>(value => {
	if(value.content !== null){
		return value.name === null
	}
	return false
})

Runtyper.attachValidatorWithSpecificGenericParams<MyBox<string>>(value => {
	if(value.content !== null){
		return value.name !== value.content
	}
	return false
})

validationTests.push([
	Runtyper.getType<MyBox<number>>(),
	{content: null, name: null},
	null
])

validationTests.push([
	Runtyper.getType<MyBox<number>>(),
	{content: 5, name: "five"},
	null
])

validationTests.push([
	Runtyper.getType<MyBox<number>>(),
	{content: 5, name: null},
	"bad value"
])

validationTests.push([
	Runtyper.getType<MyBox<string>>(),
	{content: "five", name: "five"},
	null
])

validationTests.push([
	Runtyper.getType<MyBox<string>>(),
	{content: "six", name: "five"},
	"bad value"
])



export const anyOrUnknown = (value: Runtyper.PrimitiveType): boolean => value.type === "any" || value.type === "unknown"
Runtyper.attachValidator<Runtyper.PrimitiveType>(anyOrUnknown)

validationTests.push([
	Runtyper.getType<Runtyper.PrimitiveType>(),
	{type: "any"},
	"bad value"
])

validationTests.push([
	Runtyper.getType<Runtyper.PrimitiveType>(),
	{type: "string"},
	null
])


class Octopus {
	constructor(readonly handsCount: number) {}
}

Runtyper.attachValidator<Octopus>(value => value.handsCount !== 8)

validationTests.push([
	Runtyper.getType<Octopus>(),
	new Octopus(8),
	null,
	{onClassInstance: "check_by_instanceof"}
])

validationTests.push([
	Runtyper.getType<Octopus>(),
	new Octopus(7),
	"bad value",
	{onClassInstance: "check_by_instanceof"}
])



type Whatever = {type: "cat", meows: boolean} | {type: "dog", barks: boolean} | {type: "mice", squeaks: boolean}

Runtyper.attachValidator<Whatever>(value => {
	for(let k in value){
		if(value[k] === false){
			return true
		}
	}
	return false
})

validationTests.push([
	Runtyper.getType<Whatever>(),
	{type: "cat", meows: false},
	"bad value"
])

validationTests.push([
	Runtyper.getType<Whatever>(),
	{type: "cat", meows: true},
	null
])

validationTests.push([
	Runtyper.getType<Whatever>(),
	{type: "dog", barks: false},
	"bad value"
])

validationTests.push([
	Runtyper.getType<Whatever>(),
	{type: "dog", barks: true},
	null
])



let threeLetterString = "uwu"
Runtyper.attachValidator<typeof threeLetterString>(value => value.length !== 3)

validationTests.push([
	Runtyper.getType<typeof threeLetterString>(),
	"owo",
	null
])

validationTests.push([
	Runtyper.getType<typeof threeLetterString>(),
	"o__o",
	"bad value"
])
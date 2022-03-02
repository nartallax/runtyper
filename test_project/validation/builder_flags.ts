import {validationTests} from "test_project_main"
import {Runtyper} from "@nartallax/runtyper"

validationTests.push([
	Runtyper.getType<any>(),
	"nya",
	null,
	{onAny: "allow_anything"}
])

validationTests.push([
	Runtyper.getType<any>(),
	undefined,
	null,
	{onAny: "allow_anything"}
])



validationTests.push([
	Runtyper.getType<unknown>(),
	"nya",
	"type is not allowed",
	{onAny: "allow_anything"}
])

validationTests.push([
	Runtyper.getType<unknown>(),
	"nya",
	null,
	{onUnknown: "allow_anything"}
])



validationTests.push([
	Runtyper.getType<number>(),
	NaN,
	null,
	{onNaNWhenExpectedNumber: "allow"}
])

validationTests.push([
	Runtyper.getType<number>(),
	NaN,
	"bad value"
])



validationTests.push([
	Runtyper.getType<{a: number}>(),
	{a: 5},
	null,
	{onUnknownFieldInObject: "allow_anything"}
])

validationTests.push([
	Runtyper.getType<{a: number}>(),
	{a: 5, b: "nya"},
	null,
	{onUnknownFieldInObject: "allow_anything"}
])

validationTests.push([
	Runtyper.getType<{a: number}>(),
	{a: 5, b: NaN},
	null,
	{onUnknownFieldInObject: "allow_anything"}
])

validationTests.push([
	Runtyper.getType<{a: number, [k: string]: number | null}>(),
	{a: 5, b: null},
	null,
	{onUnknownFieldInObject: "allow_anything"}
])

validationTests.push([
	Runtyper.getType<{a: number, [k: string]: number | null}>(),
	{a: 5, b: "owo"},
	"value.b",
	{onUnknownFieldInObject: "allow_anything"}
])

validationTests.push([
	Runtyper.getType<{a: number} & {b: string}>(),
	{a: 5, b: "uwu", c: false},
	null,
	{onUnknownFieldInObject: "allow_anything"}
])

validationTests.push([
	Runtyper.getType<{a: number} | {b: string}>(),
	{a: 5, b: "uwu", c: false},
	null,
	{onUnknownFieldInObject: "allow_anything"}
])
import {validationTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"

type DiscriminatedUnionA = {type: 1, a: string} | {type: 2, a: number} | {type: 3, a: boolean}

validationTests.push([
	Runtyper.getType<DiscriminatedUnionA>(),
	{type: 1, a: "nya"},
	null
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionA>(),
	{type: 2, a: 5},
	null
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionA>(),
	{type: 3, a: true},
	null
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionA>(),
	{type: 4, a: null},
	"bad value"
])

type DiscriminatedUnionB = {size: 1, b: string} | {size: 2, b: number} | {size: 3, b: boolean}
type DiscriminatedUnionMix1 = DiscriminatedUnionA | DiscriminatedUnionB | {name: string}

validationTests.push([
	Runtyper.getType<DiscriminatedUnionMix1>(),
	{type: 1, a: "nya"},
	null
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionMix1>(),
	{type: 2, a: 5},
	null
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionMix1>(),
	{type: 3, a: false},
	null
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionMix1>(),
	{type: 4, a: "yuppi"},
	"bad value"
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionMix1>(),
	{size: 1, b: "nya"},
	null
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionMix1>(),
	{size: 2, b: 5},
	null
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionMix1>(),
	{size: 3, b: true},
	null
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionMix1>(),
	{size: 0, b: 100500},
	"bad value"
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionMix1>(),
	{name: "bubenchik"},
	null
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionMix1>(),
	{},
	"bad value"
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionMix1>(),
	{name: 5},
	"bad value"
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionMix1>(),
	{size: 1, b: "nya", type: 1, a: "uwu"},
	"bad value"
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionMix1>(),
	{size: 2, b: 5, a: 5},
	"bad value"
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionMix1>(),
	{size: 2},
	"bad value"
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionMix1>(),
	{size: 2, b: "owo"},
	"bad value"
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionMix1>(),
	{size: 2, b: 5, type: 1},
	"bad value"
])

type DiscriminatedUnionC = {type: 1, a: string} | {type: 2, b: string} | {type: 3, c: string}
type DiscriminatedUnionD = {size: 1, d: string} | {size: 2, e: string} | {size: 3, f: string}
type DiscriminatedUnionMix2 = DiscriminatedUnionC | DiscriminatedUnionD

validationTests.push([
	Runtyper.getType<DiscriminatedUnionMix2>(),
	{type: 1, a: "nya"},
	null
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionMix2>(),
	{type: 2, b: "nya"},
	null
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionMix2>(),
	{type: 2, b: "nya", a: "owo"},
	"bad value"
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionMix2>(),
	{type: 3, c: "nya"},
	null
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionMix2>(),
	{type: 4, d: "nya"},
	"bad value"
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionMix2>(),
	{size: 1, d: "nya"},
	null
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionMix2>(),
	{size: 2, e: "nya"},
	null
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionMix2>(),
	{size: 3, f: "nya"},
	null
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionMix2>(),
	{size: 4, g: "nya"},
	"bad value"
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionMix2>(),
	{type: 1, a: "nya", size: 1, d: "owo"},
	"bad value"
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionMix2>(),
	{type: 1, b: "nya"},
	"bad value"
])


validationTests.push([
	Runtyper.getType<DiscriminatedUnionMix2>(),
	{type: 2, b: 5},
	"bad value"
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionMix2>(),
	{},
	"bad value"
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionMix2>(),
	{type: 2},
	"bad value"
])


type DiscriminatedUnionWildMix = {animal: "cat", breed: "siamese", age: number}
| {animal: "cat", breed: "garfield", lasagnaLove: number}
| {animal: "cat", breed: "rat", isHideous: boolean}
| {animal: "cat", fluffLevel: "naked" | "short" | "long"}
| {breed: "goblin", isGreen: boolean}
| {animal: "dog", breed: "beagle", hasWhiteTail: boolean}
| {animal: "dog", breed: "rat", squeaknessLevel: number}

validationTests.push([
	Runtyper.getType<DiscriminatedUnionWildMix>(),
	{animal: "cat", fluffLevel: "short"},
	null
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionWildMix>(),
	{animal: "cat", breed: "siamese", fluffLevel: "short"},
	"bad value"
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionWildMix>(),
	{animal: "cat", breed: "siamese", age: 5},
	null
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionWildMix>(),
	{animal: "cat", breed: "garfield", age: 5},
	"bad value"
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionWildMix>(),
	{animal: "cat", breed: "siamese", lasagnaLove: 5},
	"bad value"
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionWildMix>(),
	{animal: "cat", breed: "garfield", lasagnaLove: 5},
	null
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionWildMix>(),
	{breed: "goblin", lasagnaLove: 5},
	"bad value"
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionWildMix>(),
	{breed: "goblin", isGreen: true},
	null
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionWildMix>(),
	{animal: "dog", breed: "goblin", isGreen: true},
	"bad value"
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionWildMix>(),
	{animal: "dog", breed: "rat", hasWhiteTail: true},
	"bad value"
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionWildMix>(),
	{animal: "dog", breed: "beagle", hasWhiteTail: true},
	null
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionWildMix>(),
	{animal: "dog", breed: "rat", squeaknessLevel: 100500},
	null
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionWildMix>(),
	{animal: "dog", breed: "goblin", squeaknessLevel: 100500},
	"bad value"
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionWildMix>(),
	{animal: "cat", breed: "rat", isHideous: true},
	null
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionWildMix>(),
	{animal: "dog", breed: "rat", isHideous: true},
	"bad value"
])

validationTests.push([
	Runtyper.getType<DiscriminatedUnionWildMix>(),
	{animal: "cat", breed: "rat", squeaknessLevel: 0},
	"bad value"
])
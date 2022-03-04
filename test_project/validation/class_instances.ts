import {validationTests} from "test_project_main"
import {Runtyper} from "@nartallax/runtyper"
import {DogCls, MyAnimal, MyBuffer, MyDogs, MyNyaNyaNya, MyRunner, MyValidationError, NamedFile, StreamOrType} from "types/class_instances"
import * as Fs from "fs"
import {ClamsensorTestRunner} from "@nartallax/clamsensor"
import {MyNyaNya} from "types/exportequals_to_be_imported"

validationTests.push([
	Runtyper.getType<DogCls>(),
	new DogCls(),
	"checking of class instances is disabled"
])

validationTests.push([
	Runtyper.getType<DogCls>(),
	new DogCls(),
	null,
	{onClassInstance: "check_by_instanceof"}
])

validationTests.push([
	Runtyper.getType<MyDogs>(),
	{firstDog: new DogCls(), secondDog: new DogCls()},
	null,
	{onClassInstance: "check_by_instanceof"}
])

validationTests.push([
	Runtyper.getType<MyDogs>(),
	{firstDog: new DogCls()},
	"value.secondDog",
	{onClassInstance: "check_by_instanceof"}
])

validationTests.push([
	Runtyper.getType<MyDogs>(),
	{firstDog: new DogCls(), secondDog: {name: "Sharique", bark: () => {/* nothing */}}},
	"value.secondDog",
	{onClassInstance: "check_by_instanceof"}
])

validationTests.push([
	Runtyper.getType<NamedFile>(),
	{name: "nya", binary: Buffer.alloc(0), creationDate: new Date()},
	null,
	{onClassInstance: "check_by_instanceof"}
])

validationTests.push([
	Runtyper.getType<MyAnimal>(),
	new DogCls(),
	null,
	{onClassInstance: "check_by_instanceof"}
])

validationTests.push([
	Runtyper.getType<MyBuffer>(),
	Buffer.alloc(0),
	null,
	{onClassInstance: "check_by_instanceof"}
])

validationTests.push([
	Runtyper.getType<MyValidationError>(),
	new Runtyper.ValidationError(false, [], "", null),
	null,
	{onClassInstance: "check_by_instanceof"}
])

validationTests.push([
	Runtyper.getType<StreamOrType>(),
	{type: "string"},
	null,
	{onClassInstance: "check_by_instanceof"}
])

validationTests.push([
	Runtyper.getType<StreamOrType>(),
	Fs.createReadStream(process.argv[1]),
	null,
	{onClassInstance: "check_by_instanceof"}
])

validationTests.push([
	Runtyper.getType<MyRunner>(),
	new ClamsensorTestRunner(),
	null,
	{onClassInstance: "check_by_instanceof"}
])

validationTests.push([
	Runtyper.getType<MyNyaNyaNya>(),
	new MyNyaNya(),
	null,
	{onClassInstance: "check_by_instanceof"}
])
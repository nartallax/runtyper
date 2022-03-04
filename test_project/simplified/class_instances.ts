import {simplificationTests} from "test_project_main"
import {Runtyper} from "@nartallax/runtyper"
import {DogCls, MyBuffer, MyDogs, MyNyaNyaNya, MyRunner, MyValidationError, NamedFile, StreamOrType} from "types/class_instances"
import {ClamsensorTestRunner} from "@nartallax/clamsensor"
import {MyNyaNya} from "types/exportequals_to_be_imported"
import {ReadStream} from "fs"

simplificationTests.push([
	Runtyper.getType<DogCls>(),
	{type: "instance", cls: DogCls}
])

simplificationTests.push([
	Runtyper.getType<Buffer>(),
	{type: "instance", cls: Buffer}
])

simplificationTests.push([
	Runtyper.getType<Uint8Array>(),
	{type: "instance", cls: Uint8Array}
])

class MyOptional<T> {
	constructor(public value: T | null) {}
}

simplificationTests.push([
	Runtyper.getType<MyOptional<string>>(),
	"class has generic arguments"
])

simplificationTests.push([
	Runtyper.getType<MyDogs>(),
	{type: "object", properties: {firstDog: {type: "instance", cls: DogCls}, secondDog: {type: "instance", cls: DogCls}}, refName: "MyDogs", fullRefName: "/types/class_instances:MyDogs"}
])

simplificationTests.push([
	Runtyper.getType<NamedFile>(),
	{type: "object", properties: {name: {type: "string"}, binary: {type: "union", types: [{type: "instance", cls: Buffer}, {type: "instance", cls: ArrayBuffer}]}, creationDate: {type: "instance", cls: Date}}, refName: "NamedFile", fullRefName: "/types/class_instances:NamedFile"}
])

simplificationTests.push([
	Runtyper.getType<MyBuffer>(),
	{type: "instance", cls: Buffer, fullRefName: "/types/class_instances:MyBuffer", refName: "MyBuffer"}
])

simplificationTests.push([
	Runtyper.getType<MyValidationError>(),
	{type: "instance", cls: Runtyper.ValidationError, fullRefName: "/types/class_instances:MyValidationError", refName: "MyValidationError"}
])

simplificationTests.push([
	Runtyper.getType<StreamOrType>(),
	{type: "union", types: [{type: "object", properties: {type: {type: "constant_union", value: ["any", "boolean", "never", "number", "string", "unknown"]}}, refName: "Runtyper.PrimitiveType", fullRefName: "@nartallax/runtyper/runtyper:Runtyper.PrimitiveType"}, {type: "instance", cls: ReadStream}], refName: "StreamOrType", fullRefName: "/types/class_instances:StreamOrType"}

])

simplificationTests.push([
	Runtyper.getType<MyRunner>(),
	{type: "instance", cls: ClamsensorTestRunner, fullRefName: "/types/class_instances:MyRunner", refName: "MyRunner"}
])

simplificationTests.push([
	Runtyper.getType<MyNyaNyaNya>(),
	{type: "instance", cls: MyNyaNya, fullRefName: "/types/class_instances:MyNyaNyaNya", refName: "MyNyaNyaNya"}
])
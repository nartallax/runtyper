import {validationTests} from "test_project_main"
import {Runtyper} from "@nartallax/runtyper"
import {Awoo2, MyMyMy, MyStringNumber} from "types/other_module_type_ref"

validationTests.push([
	Runtyper.getType<MyMyMy>(),
	"moo-moo",
	null
])

validationTests.push([
	Runtyper.getType<MyMyMy>(),
	"dog",
	null
])

validationTests.push([
	Runtyper.getType<MyMyMy>(),
	"cat",
	"at path value (of type string)"
])

validationTests.push([
	Runtyper.getType<Awoo2>(),
	"me",
	null
])

validationTests.push([
	Runtyper.getType<Awoo2>(),
	"werewolf",
	null
])

validationTests.push([
	Runtyper.getType<Awoo2>(),
	"cat",
	"at path value (of type string)"
])

validationTests.push([
	Runtyper.getType<MyStringNumber>(),
	"dog",
	null
])

validationTests.push([
	Runtyper.getType<MyStringNumber>(),
	5,
	null
])

validationTests.push([
	Runtyper.getType<MyStringNumber>(),
	false,
	"at path value (of type boolean)"
])
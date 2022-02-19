import {codeGenerationTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {MyAny, MyUnknown, Point} from "types/simple"

codeGenerationTests.push([
	Runtyper.getType<Point>(),
	"return validate_Point"
])

codeGenerationTests.push([
	Runtyper.getType<Point>(),
	"/* for Point */"
])

codeGenerationTests.push([
	Runtyper.getType<MyAny>(),
	"build validator: `any` type is not allowed"
])

codeGenerationTests.push([
	Runtyper.getType<MyAny>(),
	"return /* any allows everything */ false",
	{onAny: "allow_anything"}
])

codeGenerationTests.push([
	Runtyper.getType<MyUnknown>(),
	"build validator: `unknown` type is not allowed"
])

codeGenerationTests.push([
	Runtyper.getType<MyUnknown>(),
	"return /* unknown allows everything */ false",
	{onUnknown: "allow_anything"}
])
import {simplificationTests} from "test_project_main"
import {Runtyper} from "@nartallax/runtyper"
import {Awoo2, MyStringNumber} from "types/other_module_type_ref"

simplificationTests.push([
	Runtyper.getType<MyStringNumber>(),
	{type: "union", types: [{type: "number", fullRefName: "/types/simple:MyNumber", refName: "MyNumber"}, {type: "string", fullRefName: "/types/simple:MyString", refName: "MyString"}], fullRefName: "/types/other_module_type_ref:MyStringNumber", refName: "MyStringNumber"}
])

simplificationTests.push([
	Runtyper.getType<Awoo2>(),
	{type: "constant_union", value: ["dog", "me", "werewolf"], fullRefName: "/types/other_module_type_ref:Awoo2", refName: "Awoo2"}
])
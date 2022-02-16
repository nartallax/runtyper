import {simplifiedTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {Awoo2, MyStringNumber} from "types/other_module_type_ref"

simplifiedTests.push([
	Runtyper.getType<MyStringNumber>(),
	{type: "union", types: [{type: "number"}, {type: "string"}]}
])

simplifiedTests.push([
	Runtyper.getType<Awoo2>(),
	{type: "constant_union", value: ["dog", "me", "werewolf"]}
])
import {simplifiedTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {Fraction, Goodness, MyDogName, MyFalse} from "types/constant_types"

simplifiedTests.push([
	Runtyper.getType<MyFalse>(),
	{type: "constant", value: false}
])

simplifiedTests.push([
	Runtyper.getType<Goodness>(),
	{type: "constant_union", value: ["very_good", "moderately_good", "not_good"].sort()}
])

simplifiedTests.push([
	Runtyper.getType<MyDogName>(),
	{type: "constant", value: "I have\" \\ no dog!"}
])

simplifiedTests.push([
	Runtyper.getType<Fraction>(),
	{type: "constant_union", value: [0.5, 1.5, -0.3].sort()}
])
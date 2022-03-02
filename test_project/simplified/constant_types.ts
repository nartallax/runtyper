import {simplificationTests} from "test_project_main"
import {Runtyper} from "@nartallax/runtyper"
import {Fraction, Goodness, MyDogName, MyFalse} from "types/constant_types"

simplificationTests.push([
	Runtyper.getType<MyFalse>(),
	{type: "constant", value: false, fullRefName: "/types/constant_types:MyFalse", refName: "MyFalse"}
])

simplificationTests.push([
	Runtyper.getType<Goodness>(),
	{type: "constant_union", value: ["moderately_good", "not_good", "very_good"], fullRefName: "/types/constant_types:Goodness", refName: "Goodness"}
])

simplificationTests.push([
	Runtyper.getType<MyDogName>(),
	{type: "constant", value: "I have\" \\ no dog!", fullRefName: "/types/constant_types:MyDogName", refName: "MyDogName"}
])

simplificationTests.push([
	Runtyper.getType<Fraction>(),
	{type: "constant_union", value: [-0.3, 0.5, 1.5], fullRefName: "/types/constant_types:Fraction", refName: "Fraction"}
])
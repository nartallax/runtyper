import {simplifiedTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {MixedTypeD, NamedDestrA, NamedDestrX, RenamedTypeC, RestZ, TypeFromArrayDestr1, TypeFromArrayDestr2, TypeFromObjDestr1, TypeFromObjDestr2} from "types/destructurizing"

simplifiedTests.push([Runtyper.getType<TypeFromObjDestr1>(), {type: "number"}])
simplifiedTests.push([Runtyper.getType<TypeFromObjDestr2>(), {type: "number"}])
simplifiedTests.push([Runtyper.getType<TypeFromArrayDestr1>(), {type: "string"}])
simplifiedTests.push([Runtyper.getType<TypeFromArrayDestr2>(), "when the variable is destructurized, array value may or may not infer to a tuple type"])
simplifiedTests.push([Runtyper.getType<RenamedTypeC>(), {type: "number"}])
simplifiedTests.push([Runtyper.getType<MixedTypeD>(), "when the variable is destructurized, array value may or may not infer to a tuple type"])
simplifiedTests.push([Runtyper.getType<RestZ>(), "when the variable is destructurized, array value may or may not infer to a tuple type"])

simplifiedTests.push([Runtyper.getType<NamedDestrX>(), {type: "number"}])
simplifiedTests.push([Runtyper.getType<NamedDestrA>(), {type: "object", properties: {x: {type: "number"}, y: {type: "number"}}}])
import {simplifiedTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {QwertNoEmptyVal, RewqInlineNoEmptyVal, RewqNoEmptyVal, ThisShoultBeNever, XNoNull, YNoUndef, ZConstNoEmptyVal, ZNoEmptyVal} from "values/exclamation_token"

simplifiedTests.push([Runtyper.getType<XNoNull>(), {type: "number"}])
simplifiedTests.push([Runtyper.getType<YNoUndef>(), {type: "string"}])
simplifiedTests.push([Runtyper.getType<ZNoEmptyVal>(), {type: "boolean"}])
simplifiedTests.push([Runtyper.getType<ZConstNoEmptyVal>(), {type: "constant", value: false}])
simplifiedTests.push([Runtyper.getType<QwertNoEmptyVal>(), {type: "constant", value: 5}])
simplifiedTests.push([Runtyper.getType<RewqNoEmptyVal>(), {type: "constant", value: 5}])
simplifiedTests.push([Runtyper.getType<RewqInlineNoEmptyVal>(), {type: "constant", value: 5}])
simplifiedTests.push([Runtyper.getType<ThisShoultBeNever>(), {type: "never"}])
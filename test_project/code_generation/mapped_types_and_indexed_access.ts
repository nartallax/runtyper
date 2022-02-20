import {codeGenerationTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {MappedPoint} from "types/mapped_types_and_indexed_access"

codeGenerationTests.push([
	Runtyper.getType<MappedPoint>(),
	"known_fields_of_MappedPoint.has(propName)"
])
/* eslint-disable quote-props */
import {validationTests} from "test_project_main"
import {Runtyper} from "runtyper/runtyper"
import {TrickyProperties} from "types/tricky_property_names"

validationTests.push([
	Runtyper.getType<TrickyProperties>(),
	{
		// ["pew-pew\"-pew"]: 1,
		ыыыы: 2,
		"\"": 3,
		// eslint-disable-next-line @typescript-eslint/quotes
		'""': 4,
		"\\": 5,
		"\\\"": 6,
		5: 7,
		// intentional no quotes
		0.5: 8,
		0.05: 9,
		0.005: 10,
		0.0005: 11,
		0.00005: 12,
		0.000005: 13,
		0.0000005: 14,
		0.00000005: 15,
		0.000000005: 16,
		50000000000000000000000: 17
	},
	null
])
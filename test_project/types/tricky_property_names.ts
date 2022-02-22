const {x: propname} = {x: "pew-pew\"-pew" as const}

export interface TrickyProperties {
	ыыыы: number
	"\"": number
	// eslint-disable-next-line @typescript-eslint/quotes
	'""': number
	"\\": number
	"\\\"": number
	5: number
	0.5: number
	0.05: number
	0.005: number
	0.0005: number
	0.00005: number
	0.000005: number
	0.0000005: number // here it should start to convert numbers to scientific notation
	0.00000005: number
	0.000000005: number
	50000000000000000000000: number // this is also should trigger scientific notation
}

export interface ConstStringPropName {
	[propname]: number
}
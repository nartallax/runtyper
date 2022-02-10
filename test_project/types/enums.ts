export enum Direction {
	Up = 1,
	Down = 2,
	Left = 3,
	Right = 4
}

export enum Named {
	B,
	A = "sss"
}

export type DirectionOrNamed = Named | Direction
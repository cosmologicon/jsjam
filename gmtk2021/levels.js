let leveldata = {}

let unlocked = {
	"t0": true,
	"t1": true,
	"t2": true,
}


leveldata.free = {
	info: "Free play mode: Press 1 to add. Press 2 to remove.",
	w: 20,
	pieces: [
	],
	devices: [
		{ pos: [20, 100], nspec: {e:0, d:5, t:"r"} },
		{ pos: [50, 140], nspec: {e:0, d:5, t:"r"} },
		{ pos: [140, 140], nspec: {e:0, d:5, t:"r"} },
		{ pos: [170, 100], nspec: {e:0, d:5, t:"r"} },
	],
}


leveldata.t0 = {
	info: "Arrows/WASD: move. Up/Tab: cycle. Down: crouch.",
	w: 7,
	pieces: [
		{pos: [0, 0], h: 1, pspec: "F-R-"},
		{pos: [10, 0], h: 2, pspec: "F--R--"},
		{pos: [20, 0], h: 3, pspec: "F---R---"},
	],
	devices: [
		{ pos: [40, 30], nspec: {e:0, d:5, t:"r"} },
		{ pos: [50, 20], nspec: {e:0, d:5, t:"r"} },
		{ pos: [60, 10], nspec: {e:0, d:5, t:"r"} },
	],
}


leveldata.t1 = {
	info: "Press left/right while crouching to tilt.",
	w: 9,
	pieces: [
		{pos: [0, 0], w: 1, pspec: "F--R"},
		{pos: [20, 0], w: 2, pspec: "F----R"},
		{pos: [50, 0], w: 2, pspec: "F-R---"},
		{pos: [80, 0], w: 1, pspec: "FR--"},
	],
	devices: [
		{ pos: [0, 10], nspec: {e:0, d:5, t:"r"} },
		{ pos: [10, 20], nspec: {e:0, d:5, t:"r"} },
		{ pos: [70, 20], nspec: {e:0, d:5, t:"r"} },
		{ pos: [80, 10], nspec: {e:0, d:5, t:"r"} },
	],
}

leveldata.t2 = {
	info: "Space/enter: connect. Backspace: undo. Esc: to menu.",
	w: 7,
	pieces: [
		{pos: [0, 0], w: 1, pspec: "F-R-"},
		{pos: [20, 0], w: 1, pspec: "Fr-R"},
		{pos: [40, 0], w: 1, pspec: "FR-R"},
		{pos: [60, 0], w: 1, pspec: "Fr-r"},
	],
	devices: [
		{ pos: [30, 40], nspec: {e:0, d:5, t:"r"} },
	],
}

leveldata.t3 = {
	info: "Once joined, pieces may not be unjoined. Backspace: undo.",
	w: 17,
	pieces: [
		{pos: [0, 0], w: 1, h: 1, pspec: "F-R-"},
		{pos: [20, 0], w: 1, h: 2, pspec: "F--R--"},
		{pos: [40, 0], w: 3, h: 1, pspec: "-F-r---R"},
		{pos: [70, 0], w: 4, h: 1, pspec: "-F--R----r"},
		{pos: [120, 0], w: 5, h: 1, pspec: "--F--R------"},
	],
	devices: [
		{ pos: [40, 50], nspec: {e:0, d:5, t:"r"} },
		{ pos: [80, 50], nspec: {e:0, d:5, t:"r"} },
		{ pos: [120, 50], nspec: {e:0, d:5, t:"r"} },
	],
}


leveldata.s0 = {
	w: 7,
	pieces: [
		{pos: [0, 0], w: 1, h: 3, pspec: "F-RR--RR"},
		{pos: [10, 0], w: 1, h: 1, pspec: "FrRr"},
		{pos: [20, 0], w: 1, h: 1, pspec: "F-r-"},
		{pos: [30, 0], w: 1, h: 2, pspec: "FrrR--"},
		{pos: [40, 0], w: 1, h: 2, pspec: "FRRRRR"},
	],
	devices: [
		{ pos: [60, 50], nspec: {e:0, d:5, t:"r"} },
	],
}


leveldata.h0 = {
	w: 7,
	pieces: [
		{pos: [0, 0], w: 1, h: 2, pspec: "F-R--R"},
//		{pos: [10, 0], w: 2, h: 1, pspec: "F----R"},
		{pos: [20, 0], w: 1, h: 1, pspec: "F-rR"},
		{pos: [40, 0], w: 1, h: 1, pspec: "Frr-"},
		{pos: [60, 0], w: 1, h: 2, pspec: "Fr-R-r"},
	],
	devices: [
		{ pos: [30, 40], nspec: {e:0, d:5, t:"r"} },
	],
}



leveldata.c0 = {
	w: 7,
	pieces: [
		{pos: [0, 0], pspec: "FrR-"},
		{pos: [10, 0], pspec: "F-Rr"},
		{pos: [20, 0], pspec: "FrR-"},
		{pos: [30, 0], pspec: "F-Rr"},
		{pos: [40, 0], pspec: "F-rR"},
		{pos: [50, 0], pspec: "FRr-"},
		{pos: [60, 0], pspec: "F-rR"},
	],
	devices: [
		{ pos: [30, 40], nspec: {e:0, d:5, t:"r"} },
	],
}




leveldata.two0 = {
	w: 5,
	pieces: [
		{pos: [10, 0], h: 2, pspec: "Fr--R-"},
		{pos: [30, 0], h: 2, pspec: "F-R--r"},
	],
	devices: [
		{ pos: [20, 20], nspec: {e:0, d:5, t:"r"} },
	],
}


leveldata.two1 = {
	w: 5,
	pieces: [
		{pos: [10, 0], h: 2, pspec: "F--R--"},
		{pos: [30, 0], h: 2, pspec: "FR--r-"},
	],
	devices: [
		{ pos: [20, 30], nspec: {e:0, d:5, t:"r"} },
	],
}



leveldata.three0 = {
	w: 7,
	pieces: [
		{pos: [10, 0], pspec: "F-rR"},
		{pos: [30, 0], h: 3, pspec: "FR-R--r-"},
		{pos: [50, 0], h: 3, pspec: "Fr--R---"},
	],
	devices: [
		{ pos: [20, 40], nspec: {e:0, d:5, t:"r"} },
		{ pos: [40, 40], nspec: {e:0, d:5, t:"r"} },
	],
}


leveldata.three1 = {
	w: 7,
	pieces: [
		{pos: [10, 0], pspec: "F-rR"},
		{pos: [30, 0], h: 3, pspec: "FR-R--r-"},
		{pos: [50, 0], h: 3, pspec: "Fr--R---"},
	],
	devices: [
		{ pos: [0, 50], nspec: {e:0, d:5, t:"r"} },
	],
}





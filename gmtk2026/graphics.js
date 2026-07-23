"use strict"

let graphics = {
	drawcircleG: function (posG, rG, color) {
		let rA = view.AscaleG * rG
		let posA = view.AconvertG(posG)
		UFX.draw("[ t", posA, "z", rA, 0.5 * rA, "b o 0 0 1 fs", color, "f ]")
	},
}


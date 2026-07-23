"use strict"

let graphics = {
	drawcircleG: function (posG, rG, color) {
		UFX.draw("[", view.lookG(posG), "z", rG, rG/2, "b o 0 0 1 fs", color, "f ]")
	},
}


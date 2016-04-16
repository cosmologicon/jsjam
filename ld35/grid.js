"use strict"

// "1,2" => [1, 2]
function getcell(cstring) {
	return cstring.split(",").map(x => +x)
}

// Handles the camera
var grid = {
	x0: 0,  // center of grid window
	y0: 0,
	R: 4,  // approximate height of grid window, in blocks
	z: 20,  // scale of a single block, in pixels (set by calling think)

	cells: {},
	updatecells: function () {
		var cells = this.cells = {}
		UFX.scenes.play.things.forEach(function (thing) {
			thing.cells.forEach(function (cell) {
				var x = thing.x + cell[0]
				var y = thing.y + cell[1]
				cells[[x, y]] = thing
			})
		})
	},

	togame: function (p) {
		return [
			this.x0 + (p[0] - sx / 2) / this.z,
			this.y0 + (p[1] - sy / 2) / this.z,
		]
	},
	think: function (dt) {
		this.x0 += 0.1 * dt
		this.y0 += 0.1 * dt
		var s = Math.min(sx, sy)
		this.z = s / this.R
	},
	look: function () {
		UFX.draw("t", sx / 2, sy / 2, "z", this.z, this.z, "t", -this.x0, -this.y0)
	},
}


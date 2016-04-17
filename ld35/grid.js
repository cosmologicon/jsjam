"use strict"

// "1,2" => [1, 2]
function getcell(cstring) {
	return cstring.split(",").map(x => +x)
}

var ocache = {}
function celloutline(cells) {
	if (ocache[cells]) return ocache[cells]
	var sides = []
	cells.forEach(function (cell) {
		var x0 = cell[0], y0 = cell[1], x1 = x0 + 1, y1 = y0 + 1
		sides.push([x0, y0, x0, y1])
		sides.push([x0, y1, x1, y1])
		sides.push([x1, y1, x1, y0])
		sides.push([x1, y0, x0, y0])
	})
	sides = sides.filter(s => !sides.map(a => a.join()).includes([s[2], s[3], s[0], s[1]].join()))
	var steps = {}
	sides.forEach(s => steps[s.slice(0, 2)] = s.slice(2, 4))
	var outline = [sides[0].slice(0, 2)]
	while (outline.length == 1 || outline[0].join() != outline[outline.length - 1].join()) {
		outline.push(steps[outline[outline.length - 1]])
	}
	return ocache[cells] = outline
}

// Handles the camera
var grid = {
	x0: 0,  // center of grid window
	y0: 0,
	R: 7,  // approximate height of grid window, in blocks
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


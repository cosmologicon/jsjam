"use strict"

var WorldBound = {
	init: function (x, y) {
		this.x = x || 0
		this.y = y || 0
	},
	construct: function (obj) {
		if ("x" in obj) this.x = obj.x
		if ("y" in obj) this.y = obj.y
	},
	draw: function () {
		UFX.draw("t", this.x, this.y)
	},
	think: function (dt) {
	},
}

var Shifts = {
	init: function (tshift) {
		this.tshift = tshift || 0.2
		this.fshift = 0
		this.shiftable = true
	},
	setshift: function (x, y) {
		this.fshift = 1
		this.xshift = x
		this.yshift = y
	},
	think: function (dt) {
		this.fshift = Math.max(this.fshift - dt / this.tshift, 0)
	},
	draw: function () {
		if (!this.fshift) return
		UFX.draw("t", this.fshift * (this.xshift - this.x), this.fshift * (this.yshift - this.y))
	},
}

var Blocky = {
	init: function () {
	},
	construct: function (obj) {
		this.cells = obj.cells || []
		this.color = obj.color || "white"
		this.outline = celloutline(this.cells).map((p, j) => [j ? "l" : "m", p])
		console.log(this.outline)
	},
	draw: function () {
		UFX.draw("[ b", this.outline, "clip fs", this.color, "f ss white lw 0.2 alpha 0.2 s ]")
	},
	canslide: function (off) {
		return !this.cells.some(function (cell) {
			var x = this.x + cell[0] + off[0]
			var y = this.y + cell[1] + off[1]
			var other = grid.cells[[x, y]]
			return other && other !== this
		}.bind(this))
	},

}

var Peepers = {
	construct: function (obj) {
		this.peepx = obj.peepx || 0
		this.peepy = obj.peepy || 0
	},
	draw: function () {
		UFX.draw("[ t", 0.5, 0.5, "z", 0.01, 0.01,
			"[ t 14 0",
				"[ r 0.1 z 1 1.6 b o 0 0 12 lw 2 ss black fs white s f ]",
				"b o 0 0 10 fs blue f b o 0 0 7 fs black f b o 3 -3 2 fs white f",
				"[ vflip t 0 22 b [ z 1 0.8 a 0 0 12 0", tau/2, "] [ z 1 1.1 aa 0 0 12", tau/2, "0 ] fs black f ]",
			"]",
			"[ t -14 0",
				"[ r -0.1 z 1 1.6 b o 0 0 12 lw 2 ss black fs white s f ]",
				"b o 0 0 10 fs blue f b o 0 0 7 fs black f b o 3 -3 2 fs white f",
				"[ vflip t 0 22 b [ z 1 0.8 a 0 0 12 0", tau/2, "] [ z 1 1.1 aa 0 0 12", tau/2, "0 ] fs black f ]",
			"]",
		"]")
	},
}

function You() {
	this.construct({
		cells: [[0, 0]],
		color: "#A44",
	})
}
You.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Shifts)
	.addcomp(Blocky)
	.addcomp(Peepers)

function Shape(x, y, cells) {
	var color = "#" + UFX.random.word(3, "234567")
	this.construct({
		x: x,
		y: y,
		cells: cells,
		color: color,
	})
}
Shape.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Shifts)
	.addcomp(Blocky)
	.addcomp(Peepers)

function Block(x, y, cells) {
	this.construct({
		x: x,
		y: y,
		cells: cells,
		color: "gray",
	})
}
Block.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Blocky)


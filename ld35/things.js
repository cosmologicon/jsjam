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
}

var Blocky = {
	init: function () {
	},
	construct: function (obj) {
		this.blocks = obj.blocks || []
		this.color = obj.color || "white"
	},
	draw: function () {
		this.blocks.forEach(function (block) {
			UFX.draw("[ t", block, "fs", this.color, "fr 0.05 0.05 0.9 0.9 ]")
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
		blocks: [[0, 0]],
		color: "red",
	})
}
You.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Blocky)
	.addcomp(Peepers)


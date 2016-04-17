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
	init: function (tshift, shiftable) {
		this.tshift = tshift || 0.2
		this.fshift = 0
		this.shiftable = shiftable || false
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
		this.cells = obj.cells
		this.color = obj.color || "white"
		this.outline = celloutline(this.cells).map((p, j) => [j ? "l" : "m", p])
		var ttype = obj.ttype || null
		if (ttype == null) {
			this.texture = null
		} else if (ttype == "cement") {
			this.texture = UFX.texture.cement()
		} else if (ttype == "clouds") {
			this.texture = UFX.texture.clouds()
		} else if (ttype == "marble") {
			this.texture = UFX.texture.marble()
		} else if (ttype == "ocean") {
			this.texture = UFX.texture.ocean()
		} else if (ttype == "spots") {
			this.texture = UFX.texture.spots()
		} else if (ttype == "stone") {
			this.texture = UFX.texture.stone()
			UFX.draw(this.texture.getContext("2d"), "drawimage0", UFX.texture.roughshade())
		}
		
		if (this.texture) {
			UFX.draw(this.texture.getContext("2d"), "alpha 0.5 fs", this.color, "f0")
			var xmin = Math.min.apply(Math, this.cells.map(cell => cell[0]))
			var ymin = Math.min.apply(Math, this.cells.map(cell => cell[1]))
			this.texturecommand = [
				"[ t", xmin-0.1, ymin-0.1, "z 0.02 0.02 drawimage0", this.texture, "]",
			]
		} else {
			this.texturecommand = ["fs", this.color, "f"]
		}
	},
	draw: function () {
		UFX.draw("[ b", this.outline, "clip", this.texturecommand, "ss black lw 0.2 alpha 0.3 s ]")
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
		this.iriscolor = UFX.random.choice([
			"#00F", "#66F", "#009",
			"#333", "#666",
			"#420", "#630",
			"#0F0", "#6F6", "#090",
		])
		this.xgaze = 0
		this.ygaze = 0
		this.fopen = 0
		this.targetgaze = null
		this.jostle = 0
		this.jpos = null
		this.awake = false
		this.restopen = -0.4
	},
	awaken: function () {
		this.awake = true
		this.restopen = 0.4
		this.shiftable = true
	},
	think: function (dt) {
		if (UFX.random() * 5 < dt) {
			if (this.targetgaze) {
				this.targetgaze = null
			} else if (this.awake && UFX.random() < 0.3) {
				this.targetgaze = [UFX.random(-1, 1), UFX.random(-1, 1)]
			}
		}
		var tx = 0, ty = 0, fopen = this.restopen, snap = 1.5
		if (this.targetgaze) {
			tx = this.targetgaze[0]
			ty = this.targetgaze[1]
		}
		if (this.awake && control.gmpos) {
			var dx = control.gmpos[0] - (this.x + this.peepx + 0.5)
			var dy = control.gmpos[1] - (this.y + this.peepy + 0.5)
			if (dx * dx + dy * dy < 2.5 * 2.5) {
				var d = Math.sqrt(dx * dx + dy * dy)
				var f = d ? Math.min(d, 1 / d) : 0
				tx = dx * f
				ty = dy * f
				snap = 10
				fopen = 1
			}
		}
		var f = 1 - Math.exp(-snap * dt)
		this.xgaze += (tx - this.xgaze) * f
		this.ygaze += (ty - this.ygaze) * f
		this.fopen += (fopen - this.fopen) * f

		var x = this.x + (this.xshift || 0), y = this.y + (this.yshift || 0)
		if (this.jpos == null) {
			this.jostlex = 0
			this.jostley = 0
		} else {
			var f = 1 - Math.exp(-10 * dt)
			var jx = clamp(-(x - this.jpos[0]) / Math.max(dt, 0.001), -10, 10)
			var jy = clamp(-(y - this.jpos[1]) / Math.max(dt, 0.001), -10, 10)
			this.jostlex += (jx ? f : 0.4 * f) * (jx - this.jostlex)
			this.jostley += f * (jy - this.jostley)
		}		
		this.jpos = [x, y]
		this.jostle = clamp(this.jostle - 2 * dt, 0, 1)
		this.jostle = 0
	},
	draw: function () {
		if (!this.awake) return
		UFX.draw("[ t", this.peepx + 0.5, this.peepy + 0.5)
		drawpeeper({
			iriscolor: this.iriscolor,
			fopen: this.fopen,
			xgaze: clamp(this.xgaze * (1 - this.jostle) + this.jostlex * this.jostle, -1, 1),
			ygaze: clamp(this.ygaze * (1 - this.jostle) + this.jostley * this.jostle, -1, 1),
		})
		UFX.draw("]")
	},
}

function You() {
	this.construct({
		cells: [[0, 0]],
		color: "#FFF",
		ttype: "marble",
	})
	this.awaken()
	this.restopen = 1
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
		ttype: UFX.random.choice(["cement", "clouds", "ocean", "spots", "stone"])
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
		color: "#444",
	})
}
Block.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Blocky)


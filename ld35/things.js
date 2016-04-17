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


function fiery () {
    var obj = UFX.texture.reduceargs(arguments)
    var w = obj.width || obj.size || 256
    var h = obj.height || obj.size || 256
    var r0 = 250, dr = 0
    var g0 = 150, dg = 100
    var b0 = 100, db = 0
    var canvas = UFX.texture.makecanvas(w, h), data = canvas.data
    var ndata = UFX.texture.noisedata(obj, {fraclevel: 0, scale: 4})
    for (var j = 0, k = 0 ; k < w*h ; j += 4, ++k) {
        var v = Math.sin(20 * ndata[k])
        data[j] = r0 + v*dr
        data[j+1] = g0 + v*dg
        data[j+2] = b0 + v*db
        data[j+3] = 255
    }
    canvas.applydata()
    return canvas
}

    UFX.texture.noisedata = function () {
        var obj = this.reduceargs(arguments)
        var w = obj.width || obj.size || 256
        var h = obj.height || obj.size || 256
        var xscale = obj.xscale || obj.scale || 8
        var yscale = obj.yscale || obj.scale || 8
        var zscale = obj.zscale || obj.scale || 8
        var fraclevel = obj.fraclevel || 0
        if (obj.seed) UFX.random.setseed(obj.seed)
        var xoffset = ("xoffset" in obj) ? obj.xoffset : UFX.random(xscale)
        var yoffset = ("yoffset" in obj) ? obj.yoffset : UFX.random(yscale)
        var zoffset = ("zoffset" in obj) ? obj.zoffset : UFX.random(zscale)
        var ndata = UFX.noise.wrapslice([w, h], zoffset, [xscale, yscale, zscale], [xoffset, yoffset, zoffset])
        if (fraclevel) UFX.noise.fractalize(ndata, [w, h], fraclevel)
        return ndata
    }

var Ntexture = 32
var Ftextures = {}
function getFtexture(x) {
	var n = Math.floor(x * Ntexture) % Ntexture / Ntexture
	if (!Ftextures[n]) {
		Ftextures[n] = fiery({size: 128, xoffset: 1.1, yoffset: 2.3, zoffset: n * 4})
	}
	if (Object.keys(Ftextures).length == Ntexture && UFX.ticker.wfps * 3 > Ntexture) {
		Ntexture *= 2
	}
	return Ftextures[n]
}


var Blocky = {
	init: function () {
	},
	construct: function (obj) {
		this.cells = obj.cells
		this.color = obj.color || "white"
		this.outline = celloutline(this.cells).map((p, j) => [j ? "l" : "m", p])
		var ttype = this.ttype = obj.ttype || null
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
		} else if (ttype == "nightsky") {
			this.texture = UFX.texture.nightsky()
		} else if (ttype == "enlightened") {
			this.texture = UFX.texture.cement()
			this.textures = {}
		} else if (ttype == "stone") {
			this.texture = UFX.texture.stone()
			UFX.draw(this.texture.getContext("2d"), "drawimage0", UFX.texture.roughshade())
		}
		
		if (this.texture) {
			UFX.draw(this.texture.getContext("2d"), "alpha 0.5 fs", this.color, "f0")
			var xmin = Math.min.apply(Math, this.cells.map(cell => cell[0]))
			var ymin = Math.min.apply(Math, this.cells.map(cell => cell[1]))
			this.texturecommand = [
				"[ t", xmin-0.1, ymin-0.1, "z 0.01 0.01 drawimage0", this.texture, "]",
			]
		} else {
			this.texturecommand = ["fs", this.color, "f"]
		}
		this.ttypet = 0
	},
	draw: function () {
		UFX.draw("[ b", this.outline, "clip", this.texturecommand, "ss black lw 0.2 alpha 0.3 s ]")
	},
	think: function (dt) {
		this.ttypet += dt
		if (this.ttype == "enlightened") {
			this.texturecommand = [
				"[ t", -0.1, -0.1, "z 0.01 0.01 drawimage0", getFtexture(this.ttypet * 0.1), "]",
			]
		}
	},
	canslide: function (off) {
		return !this.cells.some(function (cell) {
			var x = this.x + cell[0] + off[0]
			var y = this.y + cell[1] + off[1]
			var other = grid.cells[[x, y]]
			return other && other !== this
		}.bind(this))
	},
	reposition: function (x, y) {
		this.x = x
		this.y = y
		grid.updatecells()
	},

}

var Peepers = {
	construct: function (obj) {
		var xs = [], ys = []
		obj.cells.forEach(function (cell) {
			xs.push(cell[0])
			ys.push(cell[1])
		})
		this.peepx = xs.sort()[Math.floor(obj.cells.length / 2)]
		this.peepy = ys.sort()[Math.floor(obj.cells.length / 2)]
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

var DrawIdea = {
	init: function () {
		this.t = UFX.random(1000)
	},
	think: function (dt) {
		this.t += dt
	},
	draw: function () {
		var h1 = 20 * Math.sin(this.t * 4)
		var h2 = 20 * Math.sin(this.t * 4 + tau/3)
		var h3 = 20 * Math.sin(this.t * 4 + 2*tau/3)
		UFX.draw("[ t 0.5 0.5 z 0.01 0.01 r", this.t,
			"b o 0 0 6 sh white 0 0 30 fs white f f f f",
			"fs red sh red 0 0 10 b o 0", h1, "4 f b o 0", -h1, "4 f",
			"r", tau / 3,
			"fs #77F sh #77F 0 0 10 b o 0", h2, "4 f b o 0", -h2, "4 f",
			"r", tau / 3,
			"fs #4F4 sh #4F4 0 0 10 b o 0", h3, "4 f b o 0", -h3, "4 f",
		"]")
	},
}

var CollectsIdeas = {
	reposition: function (x, y) {
		for (var j = 0 ; j < UFX.scenes.play.ideas.length ; ++j) {
			var idea = UFX.scenes.play.ideas[j]
			if (idea.x == x && idea.y == y) {
				UFX.scenes.play.C += 1
				UFX.scenes.play.ideas.splice(j, 1)
			}
		}
	},
}

function You(x, y) {
	this.construct({
		x: x,
		y: y,
		cells: [[0, 0]],
		color: "#FFF",
		ttype: "enlightened",
	})
	this.awaken()
	this.restopen = 1
}
You.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(CollectsIdeas)
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
		color: "black",
	})
}
Block.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Blocky)

function Idea(pos) {
	this.construct({
		x: pos[0],
		y: pos[1],
	})
}
Idea.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(DrawIdea)


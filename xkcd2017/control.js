"use strict"

let WorldBound = {
	setup: function (obj) {
		this.x = obj.x
		this.y = obj.y
	},
	draw: function () {
		UFX.draw("t", this.x, this.y)
	},
	relativepos: function (pos) {
		return [pos[0] - this.x, pos[1] - this.y]
	},
}
let Focusable = {
	setup: function (obj) {
		this.focused = null
	},
	focusat: function () {
	},
	release: function () {
	},
}
let SquarePanel = {
	setup: function (obj) {
		this.w = obj.w
		this.h = obj.h
	},
	centerpos: function () {
		return [this.x + this.w / 2, this.y + this.h / 2]
	},
	dcenterpos: function (pos) {
		let [x, y] = pos
		let [x0, y0] = this.centerpos()
		return [x - x0, y - y0]
	},
}
let DrawPanel = {
	draw: function () {
		UFX.draw("rr", 4, 4, this.w - 8, this.h - 8, 5, "fs #666 f lw 3 ss #111 s")
	},
}
let Shaped = {
	setup: function (obj) {
		this.shape = obj.shape
		this.color = obj.color
	},
	draw: function () {
		UFX.draw("[ t", this.w / 2, this.h / 2)
		UFX.draw("z", this.r, this.r)
		if (this.shape == "circle") {
			UFX.draw("b o 0 0 0.5")
		} else if (this.shape == "square") {
			UFX.draw("rr -0.45 -0.45 0.9 0.9 0.1")
		} else if (this.shape == "star") {
			UFX.draw("( m", 0, -0.6)
			for (let j = 1 ; j < 10 ; ++j) {
				let r = j % 2 ? 0.3 : 0.6
				UFX.draw("l", r * Math.sin(j * tau / 10), -r * Math.cos(j * tau / 10))
			}
			UFX.draw(")")
		}
		UFX.draw("z", 1 / this.r, 1 / this.r)
		if (this.focused == 1) UFX.draw("sh white 0 0", 0.2 * this.r)
		UFX.draw("fs", this.color, "f lw 3 ss black s")
		UFX.draw("]")
	},
}
let Graduated = {
	setup: function (obj) {
		this.min = obj.min
		this.max = obj.max
		this.setting = "setting" in obj ? obj.setting : this.min
		this.range = []
		for (let j = this.min ; j <= this.max ; ++j) this.range.push(j)
	},
}

let Ranged = {
	setup: function (obj) {
		this.min = obj.min
		this.max = obj.max
		this.setting = "setting" in obj ? obj.setting : this.min
	},
	fsetting: function () {
		return (this.setting - this.min) / (this.max - this.min)
	},
}

function Panel(obj) {
	this.setup(obj)
}
Panel.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Focusable)
	.addcomp(SquarePanel)
	.addcomp(DrawPanel)


function Knob(obj) {
	this.setup(obj)
	this.r = 0.25 * Math.min(this.w, this.h)
}
Knob.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Focusable)
	.addcomp(SquarePanel)
	.addcomp(Graduated)
	.addcomp({
		angleof: function (j) {
			return (j - this.min) / (this.max - this.min) * 4 - 2
		},
		draw: function () {
			UFX.draw("[ t", this.w / 2, this.h / 2, "lw 0.03 ss #111",
				"[ r", this.angleof(this.setting), "z", this.r, this.r)
			if (this.focused == 1) {
				UFX.draw("[ b o 0 0 1 fs white sh white 0 0", 0.25 * this.r, "f ]")
			}
			UFX.draw(
				"b o 0 0 1 fs #aaa f",
				"( m 0 0 l 0.1 -1 l -0.1 -1 ) fs orange f",
				"b o 0 0 1 s",
				"b o 0 0 0.7 fs #777 f s ]")
			words.setfont(context, 0.5 * this.r, "Architects Daughter", true)
			UFX.draw("fs black tab center middle")
			for (let j = this.min ; j <= this.max ; ++j) {
				let theta = this.angleof(j)
				let dx = 1.4 * this.r * Math.sin(theta)
				let dy = -1.4 * this.r * Math.cos(theta)
				UFX.draw("ft", "" + j, dx, dy)
			}
			UFX.draw("]")
		},
		focusat: function (pos) {
			let [x, y] = this.relativepos(pos)
			let dx = x - this.w / 2, dy = y - this.h / 2
			if (dx * dx + dy * dy <= this.r * this.r) return 1
		},
		grabify: function (pos, kpoint) {
			let [x, y] = this.relativepos(pos)
			let dx = x - this.w / 2, dy = y - this.h / 2
			let ds = this.range.map(j => {
				let theta = this.angleof(j)
				return dx * Math.sin(theta) - dy * Math.cos(theta)
			})
			let jmax = ds.indexOf(Math.max.apply(Math, ds))
			this.setting = clamp(this.setting + dsetting, this.min, this.max)
		},
	})

function VSlider(obj) {
	this.setup(obj)
}
VSlider.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Focusable)
	.addcomp(SquarePanel)
	.addcomp(Graduated)
	.addcomp({
		heightof: function (j) {
			return (j - this.min) / (this.max - this.min) * 0.7 + 0.15
		},
		fracpos: function (pos) {
			return [pos[0] * this.w, (1 - pos[1]) * this.h]
		},
		yset: function () {
			return this.fracpos([0, this.heightof(this.setting)])[1]
		},
		draw: function () {
			UFX.draw("[ ss #333")
			this.range.forEach(j => {
				let h = this.heightof(j)
				let lw = j == this.min || j == this.max ? 5 : 2.5
				UFX.draw("b m", this.fracpos([0.25, h]), "l", this.fracpos([0.75, h]), "lw", lw, "s")
			})
			UFX.draw("b m", this.fracpos([0.5, 0.12]), "l", this.fracpos([0.5, 0.88]), "lw 15 ss black s")
			UFX.draw("t", this.fracpos([0.5, this.heightof(this.setting)]))
			UFX.draw("tr", -0.2 * this.w, -0.05 * this.h, 0.4 * this.w, 0.1 * this.h)
			UFX.draw("[ sh white 0 0", (this.focused == 1 ? 0.2 * this.w : 0), "fs #963 f ]")
			UFX.draw("lw 3 ss black s")
			UFX.draw("]")
		},
		focusat: function (pos) {
			let [x, y] = this.relativepos(pos)
			let dx = x - this.w / 2, dy = y - this.yset()
			let r = this.w / 3
			if (dx * dx + dy * dy <= r * r) return 1
		},
		grabify: function (pos, kpoint) {
			let [x, y] = this.relativepos(pos)
			let ds = this.range.map(j => Math.abs(y - this.fracpos([0, this.heightof(j)])[1]))
			let jmin = ds.indexOf(Math.min.apply(Math, ds))
			this.setting = this.range[jmin]
		},
	})
	
function Coil(obj) {
	this.setup(obj)
	this.R = 0.35 * Math.min(this.w, this.h)
	this.r = 0.1 * this.R	
}
Coil.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Focusable)
	.addcomp(SquarePanel)
	.addcomp(DrawPanel)
	.addcomp(Ranged)
	.addcomp({
		Rthetaset: function () {
			return [(1 - 0.1 * this.fsetting()) * this.R, tau * this.setting]
		},
		xyset: function () {
			let [R, theta] = this.Rthetaset()
			return [R * Math.sin(theta), -R * Math.cos(theta)]
		},
		draw: function () {
			let nseg = Math.floor(10 * this.setting)
			let R0 = 0.2 * this.R
			let [R1, theta1] = this.Rthetaset()
			let Rs = []
			for (let j = 0 ; j <= nseg ; ++j) {
				let R = j / nseg * (R1 - R0) + R0
				let theta = tau * j / nseg * this.setting
				let S = Math.sin(theta), C = Math.cos(theta)
				let a = 2 * R * this.setting / nseg
				Rs.push([
					[R * S - a * C, -R * C - a * S],
					[R * S, -R * C],
					[R * S + a * C, -R * C + a * S],
				])
			}
			UFX.draw("[ t", this.w / 2, this.h / 2)
			let [x0, y0] = Rs[0][0]
			UFX.draw("b m 0 0 c", y0/2, 0, y0/2, y0, 0, y0)
			for (let j = 0 ; j < nseg ; ++j) {
				UFX.draw("c", Rs[j][2], Rs[j+1][0], Rs[j+1][1])
			}
			UFX.draw("ss black lw 10 s ss #588 lw 6 s")
			if (this.focused == 1) UFX.draw("sh white 0 0", 0.5 * this.r)
			UFX.draw("b o", this.xyset(), this.r, "fs orange f ss black lw 3 s")
			UFX.draw("]")
		},
		focusat: function (pos) {
			let [x, y] = this.dcenterpos(pos)
			let [x0, y0] = this.xyset()
			let dx = x - x0, dy = y - y0
			if (dx * dx + dy * dy <= 4 * this.r * this.r) return 1
		},
		grabify: function (pos, kpoint) {
			let [x, y] = this.dcenterpos(pos)
			if (!x && !y) return
			let theta = Math.atan2(x, -y) / tau
			let dsetting = (theta - this.setting + 100.5) % 1 - 0.5
			if (Math.abs(dsetting) > 0.2) return
			this.setting = clamp(this.setting + dsetting, this.min, this.max)
		},
	})

function Screw(obj) {
	this.setup(obj)
	this.R = 0.25 * Math.min(this.w, this.h)
	if (!("setting" in obj)) this.setting = this.max
	this.screwed = true
}
Screw.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Focusable)
	.addcomp(SquarePanel)
//	.addcomp(DrawPanel)
	.addcomp(Ranged)
	.addcomp({
		draw: function () {
			UFX.draw("t", this.w / 2, this.h / 2)
			if (!this.screwed) {
				UFX.draw("b o 0 0", 0.4 * this.R, "fs black f")
				return
			}
			UFX.draw("b o 0 0", this.R, "fs #555")
			UFX.draw("[")
			if (this.focused == 1) UFX.draw("sh white 0 0", this.R, "f")
			else UFX.draw("f")
			UFX.draw("] ss black lw 3 s")
			UFX.draw("r", this.setting * tau, "b m", 0, -this.R, "l", 0, this.R, "lw 7 s")
		},
		focusat: function (pos) {
			if (!this.screwed) return
			let [dx, dy] = this.dcenterpos(pos)
			if (dx * dx + dy * dy <= this.R * this.R) return 1
		},
		grabify: function (pos, kpoint) {
			if (!this.screwed) return
			let [x, y] = this.dcenterpos(pos)
			if (!x && !y) return
			let theta = Math.atan2(x, -y) / tau
			let dsetting = (theta - this.setting + 100.5) % 1 - 0.5
			if (Math.abs(dsetting) > 0.2) return
			this.setting = clamp(this.setting + dsetting, this.min, this.max)
			if (this.setting == this.min) this.screwed = false
		},
	})

function Button(obj) {
	this.setup(obj)
	this.r = 0.8 * Math.min(this.w, this.h)
}
Button.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Focusable)
	.addcomp(SquarePanel)
	.addcomp(Shaped)
	.addcomp({
		focusat: function (pos) {
			let [x, y] = this.dcenterpos(pos)
			if (x * x + y * y <= this.r * this.r) return 1
		},
		grabify: function (pos, kpoint) {
		},
	})

function ChargeButton(obj) {
	obj.min = 0
	obj.max = obj.colors.length
	this.setup(obj)
	this.r = 0.8 * Math.min(this.w, this.h)
	this.colors = obj.colors
}
ChargeButton.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Focusable)
	.addcomp(SquarePanel)
	.addcomp(Shaped)
	.addcomp(Ranged)
	.addcomp({
		nlit: function () {
			return this.setting == this.max ? this.colors.length : Math.ceil(this.setting) - 1
		},
		draw: function () {
			UFX.draw("[ t", this.w / 2, this.h / 2)
			UFX.draw("z", this.r, this.r)
			let n = this.colors.length
			this.colors.forEach((color, j) => {
				let theta = 0.5 * (j - (n - 1) / 2)
				UFX.draw("[ r", theta, "t", 0, -0.8, "b o 0 0 0.15 fs black f",
					"fs", color, "alpha", (j < this.nlit() ? 1 : 0.4), "b o 0 0 0.12 f ]")
			})
			UFX.draw("]")
		},
		focusat: function (pos) {
			let [x, y] = this.dcenterpos(pos)
			if (x * x + y * y <= this.r * this.r) return 1
		},
		grabify: function (pos, kpoint, dt) {
			let dsetting = dt
			this.setting = clamp(this.setting + dsetting, this.min, this.max)
		},
	})


function Switch(obj) {
	this.setup(obj)
	this.on = false
	this.labels = obj.labels || "  "
	if (this.labels.split) this.labels = this.labels.split("")
}
Switch.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Focusable)
	.addcomp(SquarePanel)
	.addcomp(DrawPanel)
	.addcomp({
		draw: function () {
			UFX.draw("[ t", this.w / 2, this.h / 2)
			words.setfont(context, 0.2 * this.h, "Architects Daughter", true)
			UFX.draw("tab center middle fs black")
			if (this.labels[0] != " ") UFX.draw("ft", this.labels[0], 0, -0.35 * this.h)
			if (this.labels[1] != " ") UFX.draw("ft", this.labels[1], 0, 0.35 * this.h)
			UFX.draw("tr", -0.25 * this.w, -0.05 * this.h, 0.5 * this. w, 0.1 * this.h, "[")
			if (this.focused === 1) UFX.draw("sh white 0 0", this.w * 0.2)
			UFX.draw("fs #999 f ] lw", this.w * 0.02, "ss black s")
			if (this.on) UFX.draw("vflip")
			UFX.draw("(",
				"m", 0.1 * this.w, 0 * this.h,		
				"l", 0.1 * this.w, 0.1 * this.h,		
				"l", 0.2 * this.w, 0.15 * this.h,
				"l", 0.25 * this.w, 0.25 * this.h,
				"l", -0.25 * this.w, 0.25 * this.h,
				"l", -0.2 * this.w, 0.15 * this.h,
				"l", -0.1 * this.w, 0.1 * this.h,
				"l", -0.1 * this.w, 0 * this.h,
			") fs #666 f ss black s")
			UFX.draw("(",
				"m", 0.25 * this.w, 0.25 * this.h,
				"l", 0.22 * this.w, 0.29 * this.h,
				"l", -0.22 * this.w, 0.29 * this.h,
				"l", -0.25 * this.w, 0.25 * this.h,
			") fs #666 f ss black s")
			UFX.draw("]")
		},
		focusat: function (pos) {
			let [x, y] = this.dcenterpos(pos)
			if (Math.abs(x) < 0.3 * this.w && Math.abs(y) < 0.3 * this.h) return 1
		},
		grabify: function (pos, kpoint) {
		},
		release: function () {
			this.on = !this.on
		},
	})

function Contact(obj) {
	this.setup(obj)
	this.R = 0.25 * Math.min(this.w, this.h)
	if (!("setting" in obj)) this.setting = this.max
	this.labels = obj.labels
	if (this.labels.split) this.labels = this.labels.split("")
	this.n = this.labels.length
	this.connections = []
	this.taken = {}
	this.start = null
	this.ps = this.labels.map((label, j) => {
		let theta = j / this.n * tau
		return [this.R * Math.sin(theta), -this.R * Math.cos(theta)]
	})
}
Contact.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Focusable)
	.addcomp(SquarePanel)
	.addcomp(DrawPanel)
	.addcomp({
		draw: function () {
			UFX.draw("t", this.w / 2, this.h / 2, "tab center middle")
			let connect = (p0, p1) => {
				UFX.draw("b m", p0, "q", 0, 0, p1,
					"ss black lw", 0.2 * this.R, "s ss blue lw", 0.12 * this.R, "s")
			}
			this.connections.forEach(con => connect(this.ps[con[0]], this.ps[con[1]]))
			if (this.start !== null) {
				connect(this.ps[this.start], this.end)
			}
			words.setfont(context, 0.6 * this.R, "Architects Daughter", true)
			for (let j = 0 ; j < this.n ; ++j) {
				let theta = j / this.n * tau, S = Math.sin(theta), C = Math.cos(theta)
				UFX.draw("[ t", 1.5 * this.R * S, -1.5 * this.R * C,
					"fs black ft0", this.labels[j], "]")
				UFX.draw("[ r", theta, "z", this.R, this.R,
					"tr", -0.2, -1.1, 0.4, 0.2)
				UFX.draw("[")
				if (j === this.focused) UFX.draw("sh white 0 0", 0.2 * this.R)
				UFX.draw("fs #aaa f ] ss black lw 0.04 s ]")
			}
		},
		focusat: function (pos) {
			if (this.start !== null) {
				this.end = this.dcenterpos(pos)
			}
			let [x, y] = this.dcenterpos(pos)
			x /= this.R
			y /= this.R
			for (let j = 0 ; j < this.n ; ++j) {
				if (this.taken[j] || j === this.start) continue
				let theta = j / this.n * tau, S = Math.sin(theta), C = Math.cos(theta)
				let dx = x - S, dy = y + C
				if (dx * dx + dy * dy < 0.2 * 0.2) return j
			}
		},
		grabify: function (pos, kpoint) {
			if (this.start == null) {
				this.start = kpoint
			}
			this.focused = this.focusat(pos)
			this.end = this.dcenterpos(pos)
		},
		release: function () {
			if (this.start !== null && this.focused !== null && this.focused !== undefined) {
				this.connect(this.start, this.focused)
			}
			this.start = null
		},
		connect: function (x, y) {
			this.taken[x] = true
			this.taken[y] = true
			this.connections.push([x, y])
		},
	})

function Tiles(obj) {
	this.setup(obj)
	this.labels = obj.labels
	if (this.labels.split) this.labels = this.labels.split("")
	this.n = this.labels.length
	this.order = this.labels.map((label, j) => j)
	this.tw = this.w * 0.75 / this.n
	this.dw = this.w * 0.9 / this.n
	this.th = this.h * 0.7
	this.xs = this.labels.map((label, j) => this.dw * (j - (this.n - 1) / 2))
	this.grabbed = null
}
Tiles.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Focusable)
	.addcomp(SquarePanel)
	.addcomp(DrawPanel)
	.addcomp({
		draw: function () {
			UFX.draw("t", this.w / 2, this.h / 2, "tab center middle")
			words.setfont(context, 0.7 * this.th, "Architects Daughter", true)
			let drawtileat = (pos, label, glow) => {
				UFX.draw("[ t", pos, "tr", -this.tw / 2, -this.th / 2, this.tw, this.th, "[")
				if (glow) UFX.draw("sh white 0 0", this.dw * 0.3)
				UFX.draw("fs #676 f ] ss black lw", this.dw * 0.04, "s")
				UFX.draw("fs black ft0", label, "]")
			}
			for (let j = 0 ; j < this.n ; ++j) {
				let k = this.order[j]
				if (k === this.grabbed) continue
				let glow = this.grabbed === null && k === this.focused
				drawtileat([this.xs[j], 0], this.labels[k], glow)
			}
			if (this.grabbed !== null) {
				drawtileat(this.holdpos, this.labels[this.grabbed], false)
			}
		},
		focusat: function (pos) {
			if (this.grabbed !== null) {
				this.holdpos = this.dcenterpos(pos)
			}
			let [x, y] = this.dcenterpos(pos)
			if (Math.abs(y) > this.th / 2) return null
			for (let j = 0 ; j < this.n ; ++j) {
				if (Math.abs(x - this.xs[j]) < this.tw / 2) return this.order[j]
			}
		},
		grabify: function (pos, kpoint) {
			if (this.grabbed == null) {
				this.grabbed = kpoint
			}
			this.focused = this.focusat(pos)
			if (this.focused !== null && this.focused !== undefined && this.focused !== this.grabbed) {
				this.align(this.grabbed, this.focused)
			}
			this.holdpos = this.dcenterpos(pos)
		},
		align: function (from, to) {
			let index = this.order.indexOf(to)
			this.order.splice(this.order.indexOf(from), 1)
			this.order.splice(index, 0, from)
		},
		release: function () {
			this.grabbed = null
		},
	})


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
		this.focused = false
	},
}
let SquarePanel = {
	setup: function (obj) {
		this.w = obj.w
		this.h = obj.h
	},
	draw: function () {
		UFX.draw("rr", 4, 4, this.w - 8, this.h - 8, 5, "fs #666 f lw 3 ss #111 s")
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


function Knob(obj) {
	this.setup(obj)
	this.r = 0.25 * Math.min(this.w, this.h)
}
Knob.prototype = UFX.Thing()
	.addcomp(WorldBound)
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
			this.setting = this.range[jmax]
		},
	})

function VSlider(obj) {
	this.setup(obj)
}
VSlider.prototype = UFX.Thing()
	.addcomp(WorldBound)
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
	
	


"use strict"

let words = {
	font: "Architects Daughter",
	fsize: 20,
	setfont: function (context, size, font, bold) {
		context.font = (bold ? "bold " : "") + size + "px '" + font + "'"
	},
	init: function () {
		this.canvas = document.createElement("canvas")
		this.context = this.canvas.getContext("2d")
	},
	onlist: function (word) {
		return words.list.includes(word.toLowerCase())
	},
	getwidth: function (text, size, font, bold) {
		size = size || this.fsize
		font = font || this.font
		this.setfont(this.context, size, font, bold)
		return this.context.measureText(text).width
	},
	breaktext: function (text) {
		let isletter = c => /[A-Za-z0-9\']/.test(c)
		let isspace = c => " " == c
		let ret = []
		for (let i = 0, j = 1 ; i < text.length ; ++j) {
			if (j == text.length || isletter(text[i]) != isletter(text[j]) || isspace(text[i]) != isspace(text[j])) {
				ret.push({
					text: text.substr(i, j - i),
					isword: isletter(text[i]),
					isspace: isspace(text[i]),
				})
				i = j
			}
		}
		return ret
	},
	splittext: function (text, opts) {
		opts = opts || {}
		let width = opts.width || 200
		let ret = []
		let x = 0, jline = 0
		this.breaktext(text).forEach(obj => {
			let w = this.getwidth(obj.text, opts.size, opts.font, opts.bold)
			if (x + w > width && obj.isspace) {
				jline += 1
				x = 0
			} else if (x + w > width && obj.isword) {
				jline += 1
				x = w
				ret.push({
					text: obj.text,
					x: 0,
					w: w,
					jline: jline,
					isspace: obj.isspace,
					isword: obj.isword,
				})
			} else {
				ret.push({
					text: obj.text,
					x: x,
					w: w,
					jline: jline,
					isspace: obj.isspace,
					isword: obj.isword,
				})
				x += w
			}
		})
		return ret
	},
}
words.init()

function Statement(text, pos) {
	this.size = 32
	this.lineheight = this.size * 1.2
	this.width = 320
	this.font = "Architects Daughter"
	this.bold = true
	this.text = text
	this.texts = words.splittext(this.text, { size: this.size, width: this.width, font: this.font, bold: this.bold })
	this.pos = pos
	this.drawables = []
	this.targets = []
	this.texts.forEach((t, j) => {
		t.y = this.lineheight * t.jline
		t.pos = [t.x, t.y]
		t.j = j
		if (!t.isspace) this.drawables.push(t)
		if (t.isword) this.targets.push(t)
	})
	this.nline = this.texts[this.texts.length - 1].jline + 1
	this.ymax = this.pos[1] + this.lineheight * this.nline
}
Statement.prototype = {
	draw: function () {
		UFX.draw("t", this.pos)
		words.setfont(context, this.size, this.font, this.bold)
		this.drawables.forEach(obj => {
			let color = !obj.isword ? "white" : words.onlist(obj.text) ? "#77F" : "#F77"
			UFX.draw("[")
			if (obj.j === this.focused) {
				UFX.draw("sh black 0 0", 0.2 * this.size)
				color = "white"
			}
			UFX.draw("fs", color, "ft", obj.text, obj.pos, "]")
		})
	},
	focusat: function (pos) {
		let x = pos[0] - this.pos[0], y = pos[1] - this.pos[1]
		for (let j = 0 ; j < this.targets.length ; ++j) {
			let target = this.targets[j]
			let dx = x - target.x, dy = y - target.y
			if (0 <= dx && dx < target.w && -this.size <= dy && dy < 0) return target.j
		}
		return null
	},
}


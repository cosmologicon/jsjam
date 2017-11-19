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
	makelist_old: function (words) {
		this.list = {}
		words.split("\n").forEach(word => {
			word = word.toLowerCase()
			this.list[word] = 1
			;["ing", "er", "ed", "s"].forEach(suffix => {
				this.list[word + suffix] = 1
			})
			if (word.endsWith("e")) {
				let sword = word.slice(0, -1)
				;["ing", "er", "ed"].forEach(suffix => {
					this.list[sword + suffix] = 1
				})
			}
			;["ing", "er", "ed"].forEach(suffix => {
				this.list[word + word.slice(-1) + suffix] = 1
			})
		})
	},
	makelist: function () {
		this.list = {}
		__WORDS.split("|").forEach(word => this.list[word.toLowerCase()] = 1)
	},
	onlist: function (word) {
		return !!this.list[word.toLowerCase()]
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

function Statement(text, pos, opts) {
	opts = opts || {}
	this.size = opts.size || 32
	this.lineheight = this.size * 1.2
	this.width = opts.width || this.size * 10
	this.font = opts.font || "Architects Daughter"
	this.bold = "bold" in opts ? opts.bold : true
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
	this.xsize = Math.max.apply(Math, this.texts.map(t => t.x + t.w))
	this.ysize = this.lineheight * this.nline
	if (opts.center) {
		this.pos[0] -= this.xsize / 2
		this.pos[1] -= this.ysize / 2
	}
	this.ymax = this.pos[1] + this.lineheight * this.nline
}
Statement.prototype = {
	draw: function () {
		UFX.draw("t", this.pos, "ss black lw", 0.1 * this.size)
		words.setfont(context, this.size, this.font, this.bold)
		this.drawables.forEach(obj => {
			if (UFX.scenes.play.grabbing && obj === UFX.scenes.play.wpoint) return
			let color = !obj.isword || !lesson.learned[obj.text] ? "white" : words.onlist(obj.text) ? "#aaF" : "#Faa"
			UFX.draw("[")
			if (obj.j === this.focused) {
				UFX.draw("st", obj.text, obj.pos)
				UFX.draw("sh yellow 0 0", Z(0.2 * this.size))
				UFX.draw("fs", color, "ft", obj.text, obj.pos, "]")
			} else {
				UFX.draw("fs", color, "sft", obj.text, obj.pos, "]")
			}
		})
	},
	drawat: function (pos, kword) {
		let obj = this.texts[kword]
		UFX.draw("[ t", pos, "tab center middle ss black lw", 0.1 * this.size)
		words.setfont(context, this.size, this.font, this.bold)
		let color = !obj.isword || !lesson.learned[obj.text] ? "white" : words.onlist(obj.text) ? "#aaF" : "#Faa"
		UFX.draw("fs", color, "sft0", obj.text)
		UFX.draw("]")
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
	getobj: function (kword) {
		return this.texts[kword]
	},
	getword: function (kword) {
		return this.texts[kword].text
	},
	panel: function () {
		let d = this.size * 0.1
		return new Panel({
			x: this.pos[0] - 2 * d, y: this.pos[1] - this.ysize + this.size * 0.2 - d,
			w: this.xsize + 4 * d, h: this.ysize + 2 * d,
		})
	},

}


"use strict"

let words = {
	font: "Architects Daughter",
	fsize: 20,
	init: function () {
		this.canvas = document.createElement("canvas")
		this.context = this.canvas.getContext("2d")
	},
	onlist: function (word) {
		return words.list.includes(word.toLowerCase())
	},
	getwidth: function (text, size, font) {
		size = size || this.fsize
		font = font || this.font
		this.context.font = size + "px '" + font + "'"
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
			let w = this.getwidth(obj.text, opts.size, opts.font)
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



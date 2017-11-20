"use strict"

let lesson = {
	r: 80,
	pos: [100, 800],
	f: 0,
	rate: 1,
	reset: function () {
		this.f = 0
		this.currentword = null
		this.learned = {}
	},
	learn: function (word) {
		if (this.currentword !== word) {
			this.f = 0
		}
		this.currentword = word
	},
	think: function (dt) {
		if (this.currentword) {
			this.f = clamp(this.f + this.rate * dt, 0, 1)
			if (this.f >= 1) {
				this.complete(this.currentword)
			}
		}
	},
	complete: function (word) {
		this.learned[word.toLowerCase()] = 1
		this.currentword = null
		this.f = 0
		UFX.scenes.play.dropword()
		if (!words.onlist(word) && progress.current == 3) {
			UFX.scene.push("talk", [
				"Yes, I was right! This word is not one of the most used words. When you find a word like that, it will turn red in the steps, so you know it's bad.",
				"We only want to do steps that use the ten hundred words people use most often. So when you get to a step that has a bad word, the whole step is bad. You should NOT do that step. Just act like the step is not even there. Okay?",
			])
		}
	},
	islearned: function (word) {
		return !!this.learned[word.toLowerCase()]
	},
	draw: function () {
		UFX.draw("t", this.pos,
			"b o 0 0", this.r, "fs #446 f",
			"b o 0 0", 0.88 * this.r, "lw", 0.08 * this.r, "ss black s")
		if (this.f) {
			UFX.draw("b a 0 0", 0.88 * this.r, -0.25 * tau, (-0.25 + this.f) * tau, "lw", 0.05 * this.r, "ss yellow s")
		}
		UFX.draw("r -0.2 tab center middle fs #669 font 28px~'Architects~Daughter'",
			"ft HOLD 0 -35",
			"ft WORDS 0 0",
			"ft HERE 0 35")
	},
	focusat: function (pos) {
		let [x, y] = pos
		let [x0, y0] = this.pos
		let dx = x - x0, dy = y - y0, r = 0.8 * this.r
		return dx * dx + dy * dy < r * r
	},
}

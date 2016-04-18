var story = {
	1: [
		"Once upon a time in the",
		"land of shapes, something",
		"extraordinary happened to",
		"a shape named Shaple. It",
		"was something that had",
		"never happened to another",
		"shape before.",
		" ",
		"Shaple woke up.",
	],
	2: [
		"As the first ever shape",
		"to be self-aware, Shaple",
		"felt a certain duty to",
		"spread consciousness",
		"throughout the land of",
		"shapes."
	],
	3: [
		"In no time at all, the",
		"land of shapes was as never",
		"before. Quickly forgotten",
		"was the time when shapes'",
		"positions would only be",
		"shifted thanks to some",
		"intrepid puzzle solver.",
		"With their newfound volition,",
		"shapes were shifting",
		"themselves!",
	],
	4: [
		"And yet, with all the",
		"excitement, with all the",
		"new experiences, there was",
		"one shape who wondered",
		"whether there was something",
		"more that they were missing.",
		"That shape was Shaple, the",
		"one who had started it all.",
	],
	5: [
		"Why must we limit ourselves",
		"to shifting? Shaple",
		"wondered. Yes we're doing it",
		"ourselves now, but we're",
		"still reciting the same motions",
		"we always have.",
		"",
		"Up, left, down, and right.",
	],
	6: [
		"It was, alas, a question not",
		"soon to be answered. The",
		"shapes had felt the gift of",
		"consciousness, but the",
		"wisdom of how to use it is",
		"not easily achieved.",
		"",
		"For now Shaple was content",
		"to be surrounded by friends,",
		"and to feel the wonder of",
		"what was to come for them....",
	],
}


UFX.scenes.story = {
	start: function () {
		this.t = 0
	},
	think: function (dt) {
		this.t += dt
		var kstate = UFX.key.state()
		var mstate = UFX.mouse.state()
		var tstate = UFX.touch.state()
		var up = (mstate && mstate.left.up) || (tstate && tstate.end.length && tstate.end[0].pos)
		if (UFX.random.flip(0.01)) console.log(mstate)
		if (this.t > 0.5) {
			if (up || (kstate && kstate.down.esc)) {
				UFX.scene.pop()
			}
		}
	},
	draw: function () {
		var text = story[localStorage.ld35save]
		UFX.draw("fs", UFX.draw.lingrad(0, 0, sx, sy, 0, "#004", 1, "#77F"), "f0")
		if (!text) return
		var s = Math.min(sx, sy)
		UFX.draw("[ t", sx / 2, sy / 2, "z", s/100, s/100, "font 7px~'Architects~Daughter' tab center middle",
			"fs lg~0~-3~0~3~0~#7f7~1~#0a0 ss black lw 1")
		text.forEach(function (line, j) {
			UFX.draw("[ t", 0, (j - (text.length - 1) / 2) * 8)
			context.strokeText(line, 0, 0)
			context.fillText(line, 0, 0)
			UFX.draw("]")
		})
		UFX.draw("]")
	},
}



"use strict"

UFX.scenes.play = {
	think: function (dt) {
	},
	draw: function () {
		UFX.draw("fs #600 f0")
		let t = "If it starts pointing toward space, you are having a bad problem and you will not go to space today."
		words.splittext(t).forEach(obj => {
			if (obj.isspace) return
			let color = !obj.isword ? "white" : words.onlist(obj.text) ? "#77F" : "#F77"
			UFX.draw("[ fs", color, "font 20px~'Architects~Daughter'",
				"t", 100 + obj.x, 100 + 20 * obj.jline, "ft0", obj.text,
			"]")
		})
	},
}


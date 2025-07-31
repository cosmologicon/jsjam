let world = {
	init: function () {
		this.R = 2000
		this.D = 2 * this.R
		this.ys = []
		for (let x = 0 ; x <= this.D ; ++x) {
			let f = x / this.D
			y = -250 + 4 * (
				40 * UFX.noise([14 * f + 5.1234], [14]) +
				30 * UFX.noise([15 * f + 6.2345], [15]) +
				20 * UFX.noise([16 * f + 7.3456], [16]) +
				15 * UFX.noise([17 * f + 8.4567], [17]) +
				10 * UFX.noise([18 * f + 9.5678], [18])
			)
			this.ys.push(y)
		}
		this.you = new You()
		this.bubbles = UFX.random.spread(50, 0.8, this.R, 440, 0, -220).map(([x, y]) => new Bubble(x, y))
		this.signs = [
			[0, -350, 0.2, "LOOP"],
			[1289, -350, -0.1, "SPACE:~JUMP"],
			[3012, -350, -0, "BOUNCE~OFF~BUBBLES"],
		]
	},
	floorat: function (x) {
		let x0 = Math.floor(x)
		let f = x - x0
		let y0 = this.ys[x0 % this.D], y1 = this.ys[(x0 + 1) % this.D]
		return y0 + f * (y1 - y0)
	},
	slopeat: function (x) {
		return this.floorat(x + 0.5) - this.floorat(x - 0.5)
	},
	draw: function () {
		;[false, true].forEach(flip => {
			UFX.draw("[", view.look(flip))
			this.bubbles.forEach(bubble => bubble.draw(flip))
			let [x0, x1] = view.xrange(flip)
			UFX.draw("( m", x0, -500)
			for (let x = x0 ; x <= x1 ; ++x) {
				UFX.draw("l", x, this.ys[x % this.D])
			}
			UFX.draw("l", x1, -500, ") fs #642 f lw 10 ss #864 s")
			if (!flip) this.you.draw(flip)
			this.signs.forEach(([x, y, tilt, text]) => {
				UFX.draw("[ t", view.mod(x, flip), y, "vflip r", tilt,
					"font 60px~Viga fs black ss white lw 2 sft0", text, "]")
			})
			UFX.draw("]")
		})
	},
}



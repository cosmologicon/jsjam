let world = {
	init: function () {
		this.R = 2000
		this.D = 2 * this.R
		this.ys = []
		for (let x = 0 ; x <= this.D ; ++x) {
			let omegax = tau * x / this.D
			let y = (
				40 * Math.sin(4 * omegax + 1234) +
				30 * Math.sin(5 * omegax + 2345) +
				20 * Math.sin(6 * omegax + 3456) +
				15 * Math.sin(7 * omegax + 4567) +
				10 * Math.sin(8 * omegax + 5678)
			)
			let f = x / this.D
			y = 4 * (
				40 * UFX.noise([14 * f + 5.1234], [14]) +
				30 * UFX.noise([15 * f + 6.2345], [15]) +
				20 * UFX.noise([16 * f + 7.3456], [16]) +
				15 * UFX.noise([17 * f + 8.4567], [17]) +
				10 * UFX.noise([18 * f + 9.5678], [18])
			)
			this.ys.push(y)
		}
		this.you = new You()
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
		UFX.draw("[", view.look())
		UFX.draw("[ t", view.mod(0), -100, "vflip r 0.2 font 60px~Viga fs black ss white lw 2 sft0 LOOP ]")

		let [x0, x1] = view.xrange()
		x0 = Math.round(x0)
		x1 = Math.round(x1)
		UFX.draw("( m", x0, -300)
		for (let x = x0 ; x <= x1 ; ++x) {
			UFX.draw("l", x, this.ys[x % this.D])
		}
		UFX.draw("l", x1, -300, ") fs #642 f lw 10 ss #864 s")
		this.you.draw()
		UFX.draw("[ t", view.mod(0), -100, "vflip r 0.2 font 60px~Viga fs black ss white lw 2 sft0 LOOP ]")
		UFX.draw("[ t", view.mod(2789), -100, "vflip r -0.1 font 60px~Viga fs black ss white lw 2 sft0 SPACE:~JUMP ]")
		UFX.draw("]")

		UFX.draw("[", view.vlook())
		x0 += this.R
		x1 += this.R
		UFX.draw("( m", x0, -300)
		for (let x = x0 ; x <= x1 ; ++x) {
			UFX.draw("l", x, this.ys[x % this.D])
		}
		UFX.draw("l", x1, -300, ") fs #642 f lw 10 ss #864 s")
		UFX.draw("[ t", view.vmod(0), -100, "vflip r 0.2 font 60px~Viga fs black ss white lw 2 sft0 LOOP ]")
		UFX.draw("[ t", view.vmod(2789), -100, "vflip r -0.1 font 60px~Viga fs black ss white lw 2 sft0 SPACE:~JUMP ]")
		UFX.draw("]")
	},

}



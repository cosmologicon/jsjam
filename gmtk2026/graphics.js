"use strict"

let graphics = {
	drawcircleG: function (posG, rG, color) {
		UFX.draw("[", view.lookG(posG), "z", rG, rG/2, "b o 0 0 1 fs", color, "f ]")
	},
	gearpath: function (rG, Ntooth) {
		let path = ["b m 0", -rG]
		let CSs = range(0, 2 * Ntooth + 1, 1).map(j => j * tau / (2 * Ntooth)).map(A => CS(A))
		range(0, 2 * Ntooth, 1).forEach(j => {
			let dr = 1, dc = 1
			let r0 = rG, r1 = rG + dr
			if (j % 2) [r0, r1] = [r1, r0]
			let [C0, S0] = CSs[j], [C1, S1] = CSs[j + 1]
			let [x0, y0] = [r0 * S0, -r0 * C0]
			let [x1, y1] = [r1 * S1, -r1 * C1]
			let [dx0, dy0] = [dc * C0, dc * S0]
			let [dx1, dy1] = [dc * C1, dc * S1]
			path.push("c", x0 + dx0, y0 + dy0, x1 - dx1, y1 - dy1, x1, y1)
		})
		path.push(")")
		return path
	},
	drawgearG: function (posG, rG, Ntooth, A, color) {
		UFX.draw("[", view.lookG(posG), "zy 0.5 r", A, this.gearpath(rG, Ntooth),
			"fs", color, "ss black lw 0.3 s f ]")
	},
}


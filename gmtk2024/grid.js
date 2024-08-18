

let grid = {
	tasks: [],
	score: 0,
	solve: function (task) {
		this.tasks = this.tasks.filter(t => !poseq(t, task))
	},
	addrandomtask: function (bounds) {
		let [x0, x1, y0, y1] = bounds
		let atargets = root.atargets().map(atarget => atarget.pos)
		while (true) {
			let x = UFX.random.rand(x0, x1 + 1)
			let y = UFX.random.rand(y0, y1 + 1)
			if (posincludes(this.tasks, [x, y])) continue
			if (posincludes(atargets, [x, y])) continue
			this.tasks.push([x, y])
			break
		}
	},
	
	draw: function () {
		let [xmax, ymin] = view.GconvertV([1610, 910])
		UFX.draw("fs #aa1 fr", -xmax, 0, 2 * xmax, ymin, "fs black")
		for (let x = Math.floor(-xmax) ; x < xmax - 3 * ymin ; ++x) {
			UFX.draw("( m", x, 0, "l", x + 0.5, 0,
				"l", x + 0.5 + 3 * ymin, ymin,
				"l", x + 3 * ymin, ymin, ") f")
		}
		let grad = UFX.draw.lingrad(0, 0, 0, -1,
			0, "rgba(20,20,20,1)",
			1, "rgba(100,100,100,0.8)")
		UFX.draw("fs", grad, "fr", -xmax, 0, 2 * xmax, ymin)
		
		this.tasks.forEach(task => {
			UFX.random.pushseed(task)
			UFX.draw("[ t", task)
			let f = Date.now() * 0.001 % 1
			let r = mix(0.5, 0.2, f), alpha = mix(0.5, 0, f)
			UFX.draw("[ r", Date.now() * 0.002 % tau, "b o 0 0", r, "lw 0.03 alpha", alpha,
				"ss blue s b alpha 0.6")
			for (let j = 0 ; j < 5 ; ++j) {
				UFX.draw("m 0 0.3 l 0.1 0.5 l -0.1 0.5 r", tau / 5)
			}
			UFX.draw("fs blue f ]")
			for (let j = 0 ; j < 40 ; ++j) {
				let v = UFX.random(1, 2), A = UFX.random.angle()
				let t = Date.now() * 0.001 * v % 1
				let color = `#4${UFX.random.choice("3579b")}${UFX.random.choice("9bdf")}`
				let r = 0.8 * t
				UFX.draw("b o", r * Math.sin(A), r * Math.cos(A) - 0.1 * t ** 2, 0.03,
					"alpha", 1 - t, "fs", color, "f")
			}
			UFX.draw("]")
			UFX.random.popseed()
		})
		UFX.draw("fs #654 ss #333 lw 0.01")
		for (let x = -6 ; x < 7 ; ++x) {
			for (let y = 1 ; y < 4 ; ++y) {
				UFX.draw("[ t", x, y, "b rr -0.2 -0.2 0.4 0.4 0.05 f s ]")
			}
		}
				
	},
}


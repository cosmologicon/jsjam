
function maketexture() {
	let s = 256
	let canvas = document.createElement("canvas")
	canvas.width = canvas.height = s
	let context = canvas.getContext("2d")
    let idata = context.createImageData(s, s)
    let data = idata.data
    let ndata1 = UFX.noise.wrapslice([s, s], 0, [16, 16, 256], [0, 0])
    UFX.noise.fractalize(ndata1, [s, s])
    for (let y = 0, j = 0, k = 0 ; y < s ; ++y) {
        for (let x = 0 ; x < s; ++x, j += 4, ++k) {
            let v = (ndata1[k] + 1) / 2
            val1 = Math.floor(mix(60, 100, v))
            data[j] = data[j+1] = data[j+2] = val1
            data[j+3] = 255
        }
    }
    context.putImageData(idata, 0, 0)
    return canvas
}


let grid = {
	tasks: [],
	ttasks: {},
	tsparks: {},
	score: 0,
	texture: null,
	solve: function (task) {
		this.tasks = this.tasks.filter(t => !poseq(t, task))
		delete this.ttasks[task]
	},
	addrandomtask: function (bounds) {
		playsound("break")
		let [x0, x1, y0, y1] = bounds
		let atargets = root.atargets().map(atarget => atarget.pos)
		while (true) {
			let x = UFX.random.rand(x0, x1 + 1)
			let y = UFX.random.rand(y0, y1 + 1)
			if (posincludes(this.tasks, [x, y])) continue
			if (posincludes(atargets, [x, y])) continue
			this.tasks.push([x, y])
			this.ttasks[[x, y]] = 0
			this.tsparks[[x, y]] = 0
			break
		}
	},
	think: function (dt) {
		for (let task of this.tasks) {
			this.ttasks[task] = (this.ttasks[task] || 0) + dt
			if (this.tsparks[task] === null && UFX.random.flip(dt / 20)) {
				this.tsparks[task] = this.ttasks[task]
			}
			if (this.tsparks[task] !== null && this.ttasks[task] - this.tsparks[task] > 1) {
				this.tsparks[task] = null
			}
		}
	},
	
	draw: function () {
		if (this.texture === null) this.texture = maketexture()
		let [xmax, ymin] = view.GconvertV([1610, 910])
		let [xmin, ymax] = view.GconvertV([-10, -10])
		UFX.draw("fs #black fr", xmin, 0.2, xmax - xmin, ymin - 0.2, "fs #aa1")
		for (let x = Math.floor(xmin) ; x < xmax - 3 * ymin ; ++x) {
			UFX.draw("( m", x, 0.2, "l", x + 0.5, 0.2,
				"l", x + 0.5 + 3 * ymin, ymin,
				"l", x + 3 * ymin, ymin, ") f")
		}
		UFX.draw("[ z 0.1 0.1 drawimage", this.texture, "-128 2 ]")
		UFX.draw("[ t 3 2 z 0.01 -0.01 font 20px~'Viga'",
			"fs rgba(0,0,0,0) sh black -2 -2 0 ft0 GAMENAME ]")

		UFX.draw("fs #888 ss #333 lw 0.01")
		for (let x = -view.N - 1 ; x <= view.N + 1 ; ++x) {
			for (let y = 1 ; y <= view.N ; ++y) {
				UFX.draw("[ t", x, y, "b rr -0.4 -0.4 0.8 0.8 0.05")
				if (posincludes(this.tasks, [x, y])) {
					let tspark = this.tsparks[[x, y]], ttask = this.ttasks[[x, y]]
					let dt = tspark === null ? null : ttask - tspark
					let color = dt !== null && dt < 0.5 && UFX.random.flip(0.2) ? "yellow" : "black"
					UFX.draw("[ clip fs", color, "f ]")

					if (dt !== null) {
						UFX.random.pushseed([x, y])
						for (let j = 0 ; j < 100 ; ++j) {
							let x0 = UFX.random(-0.2, 0.2), y0 = UFX.random(-0.2, 0.2)
							let v = 1.4 * UFX.random() ** 0.5, A = UFX.random.angle()
							let y = UFX.random.choice("9bdf"), color = `#${y}${y}4`
							let r = 0.8 * dt * v
							UFX.draw("b o",
								x0 + r * Math.sin(A),
								y0 + r * Math.cos(A) - 0.4 * dt ** 2,
								0.03, "alpha", 1 - dt, "fs", color, "f")
						}
						UFX.random.popseed()
					}
					if (ttask < 1) {
						let alpha = clamp(1 - 2 * (ttask - 0.5), 0, 1)
						UFX.draw("[ t", 0, -(ttask ** 2), "r", 0.1 * ttask,
							"b rr -0.4 -0.4 0.8 0.8 0.05",
							"alpha", alpha, "fs #888 f ]")
					}
				} else {
					UFX.draw("f s fs #777",
						"b o 0.35 0.35 0.02 f",
						"b o -0.35 0.35 0.02 f",
						"b o 0.35 -0.35 0.02 f",
						"b o -0.35 -0.35 0.02 f")
				}
				UFX.draw("]")
			}
		}

		this.tasks.forEach(task => {
			UFX.random.pushseed(task)
			UFX.draw("[ t", task)
			let f = Date.now() * 0.001 % 1
			let falpha = clamp(this.ttasks[task] / 2, 0, 1)
			let r = mix(0.5, 0.2, f), alpha = mix(0.5, 0, f) * falpha
			UFX.draw("[ r", Date.now() * 0.002 % tau, "b o 0 0", r, "lw 0.03 alpha", alpha,
				"ss blue s b alpha", falpha)
			if (true) {
				for (let j = 0 ; j < 5 ; ++j) {
					UFX.draw("m 0 0.3 l 0.1 0.5 l -0.1 0.5 r", tau / 5)
				}
				UFX.draw("fs blue f")
			}
			UFX.draw("]")
			if (false) {
				for (let j = 0 ; j < 40 ; ++j) {
					let v = UFX.random(1, 2), A = UFX.random.angle()
					let t = Date.now() * 0.001 * v % 1
					let color = `#4${UFX.random.choice("3579b")}${UFX.random.choice("9bdf")}`
					let r = 0.8 * t
					UFX.draw("b o", r * Math.sin(A), r * Math.cos(A) - 0.1 * t ** 2, 0.03,
						"alpha", 1 - t, "fs", color, "f")
				}
			}
			UFX.draw("]")
			UFX.random.popseed()
		})

		let grad = UFX.draw.lingrad(0, 1, 0, -1,
			0, "rgba(100,100,100,0)",
			0.4, "rgba(40,40,40,1)",
			1, "rgba(100,100,100,0.6)")
		UFX.draw("fs", grad, "fr", xmin, ymin, xmax - xmin, ymax - ymin)

				
	},
}


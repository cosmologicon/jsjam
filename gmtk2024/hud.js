function Button(text, box) {
	this.text = text
	this.box = box
	let [x0, y0, w, h] = this.box
	this.center = [x0 + w / 2, y0 + h / 2]
}
Button.prototype = {
	contains: function (pos) {
		let [x0, y0, w, h] = this.box
		let [x, y] = pos
		return x0 <= x && x <= x0 + w && y0 <= y && y <= y0 + h
	},
	draw: function () {
		UFX.draw("[ tr", this.box, "fs #333 ss #888 f s",
			"t", this.center, "tab center middle font 30px~'Viga' fs #aaa")
		context.fillText(this.text, 0, 0)
		UFX.draw("]")
	},
}

let hud = {
	banner: null,
	tbanner: 0,
	init: function () {
		this.buttons = {
//			extend: new Button("Extend", [10, 810, 80, 80]),
		}
	},
	buttonat: function (pos) {
		for (let bname in this.buttons) {
			if (this.buttons[bname].contains(pos)) return this.buttons[bname]
		}
		return null
	},
	think: function (dt) {
		this.tbanner += dt
		if (this.tbanner > 5) this.banner = null
	},
	onbuild: function () {
		this.banner = "BUILD"
		this.tbanner = 0
	},
	draw: function () {
		if (control.mode === "extend") {
			UFX.draw("[ alpha 0.5 fs black fr 0 0 1600 900 ]")
			view.scale()
			for (let node of root.allnodes()) {
				if (node.canextend()) {
					let cost = node.extendcost()
					let A = Date.now() * 0.01 + 123.123 * node.pos[0] + 234.234 * node.pos[1]
					let b = Math.floor(215 + 40 * Math.sin(A))
					let gcolor = `rgb(255,255,${b})`
					let color = cost <= quest.money ? gcolor : "#f44"
					let fsize = Math.floor(0.2 * view.VscaleG)
					let ssize = Math.floor(0.02 * view.VscaleG)
					fsize = 32
					ssize = 3
					UFX.draw("[ t", node.pos, "z", 1/100, -1/100,
						`font ${fsize}px~'Viga' lw ${ssize}`,
						"tab center middle ss black",
						"fs", color, "sft0", `$${cost}`,
						"]")
				}
			}
			UFX.draw("]")
		}
//		UFX.draw("[ t", control.pos, "b o 0 0 5 fs orange f ]")
		let text
		if (DEBUG) {
			UFX.draw("fs white font 30px~'Viga' tab left top")
			text = `Stage ${quest.stage} | Money ${quest.money} | Pos ${control.tile} | N ${view.N} | bounds ${quest.getbounds()}`
			context.fillText(text, 20, 300)
			context.fillText(UFX.ticker.getrates(), 20, 340)
		}
		text = `$${quest.money}`
		UFX.draw("[ fs white ss black lw 4 font bold~100px~'Roboto~Mono'",
			"tab left top shadow black 4 4 2 sft", text, 20, 20, "]")
		for (let n = 1 ; n <= quest.record ; ++n) {
			text = `${n}~repair:~+$${rewards[n]}`
			UFX.draw("fs white ss black lw 2 font bold~26px~'Roboto~Mono'",
				"tab left top sft", text, 20, 100 + 28 * n)
		}
		for (let bname in this.buttons) {
			this.buttons[bname].draw()
		}
		if (this.banner !== null) {
			let grad = UFX.draw.lingrad(0, 50, 0, -50, 0, "#ffc", 1, "#bba")
			let dt = this.tbanner - 1
			let x = 800 - 200 * dt
			if (dt < -0.5) x -= 2000 * (dt + 0.5)
			if (dt > 0.5) x -= 2000 * (dt - 0.5)
			UFX.draw("[ t", x, 450, "shadow black 8 8 2 fs", grad, "ss black lw 5",
				"tab center middle font 200px~'Days~One' sft0", this.banner, "]")
		}
	},
	
}
hud.init()


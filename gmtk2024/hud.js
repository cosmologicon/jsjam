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
					let color = cost <= quest.money ? "white" : "red"
					UFX.draw("[ t", node.pos, "z", 1/100, -1/100,
						"font 30px~'Viga' tab center middle fs", color, "ft0", `$${cost}`,
						"]")
				}
			}
			UFX.draw("]")
		}
//		UFX.draw("[ t", control.pos, "b o 0 0 5 fs orange f ]")
		let text
		UFX.draw("fs white font 30px~'Viga' tab left top")
		text = `Stage ${quest.stage} | Money ${quest.money} | Pos ${control.tile}`
		context.fillText(text, 200, 200)
		text = `$${quest.money}`
		UFX.draw("[ fs white ss black lw 4 font bold~100px~'Roboto~Mono'",
			"tab left top shadow black 4 4 2 sft", text, 20, 20, "]")
		for (let n = 1 ; n <= quest.record ; ++n) {
			text = `${n}~repair:~+$${rewards[n]}`
			UFX.draw("fs white ss black lw 2 font bold~20px~'Roboto~Mono'",
				"tab left top sft", text, 20, 100 + 20 * n)
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


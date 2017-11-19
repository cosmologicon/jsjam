"use strict"

function comparestate(x, y) {
	if (x === null || y === null) return true
	if (Array.isArray(x) && !Array.isArray(y)) return x.length == 2 && x[0] <= y && y <= x[1]
	if (!Array.isArray(x) && Array.isArray(y)) return comparestate(y, x)
	if (Array.isArray(x) && Array.isArray(y)) return x.length == y.length && x.every((a, j) => comparestate(a, y[j]))
	return x === y
}

UFX.scenes.play = {
	start: function () {
		let ldata = levels[1]
		this.t0 = this.t = ldata.t
		this.todo = ldata.winsequence.slice()
		let y = 160
		this.statements = ldata.steps.map(text => {
			let s = new Statement(text, [40, y], { width: 540 })
			y = s.ymax + 20
			return s
		})
		this.statements.push(
			new Statement("Cut the Red Power Stick", [800, 120], { size: 70, width: 900, center: true })
		)
		this.done = new Button({ x: 400, y: 740, w: 160, h: 160, shape: "star", color: "#aa6", label: "DONE", })
		this.lcontrols = ldata.controls.map(cdata => {
			let [cname, opts] = cdata
			return new (window[cname])(opts)
		})
		this.controls = [
			this.done,
			this.statements.slice(-1)[0].panel(),
			new Panel({ x: 20, y: 100, w: 600, h: 600 }),
			new Panel({ x: 620, y: 100, w: 960, h: 780 }),
		].concat(this.lcontrols)
		this.jpoint = null
		this.kpoint = null
		this.grabbing = false

		this.wjpoint = null
		this.wkpoint = null
		this.wpoint = null
		this.grabbing = false
		
		this.pos = [0, 0]

		lesson.reset()
	},
	think: function (dt) {
		this.t = clamp(this.t - dt, 0, this.t0)
		if (this.t == 0) {
			UFX.scene.push("timeup")
			return
		}
		let pstate = UFX.pointer()
		let pos = this.pos = pstate.pos ? pstate.pos.slice() : [0, 0]
		pos[0] *= sx0 / sx
		pos[1] *= sy0 / sy
		if (!this.grabbing) {
			this.setfocused(pos)
			if (this.jpoint !== null && pstate.down) {
				this.grabbing = true
			} else if (this.wjpoint !== null && pstate.down) {
				this.grabbing = true
			}
		}

		if (this.grabbing) {
			if (this.jpoint !== null) {
				this.controls[this.jpoint].grabify(pos, this.kpoint, dt)
			}
			if (pstate.up) {
				this.grabbing = false
				if (this.jpoint !== null) {
					this.controls[this.jpoint].release()
					this.checkstate()
				}
			}
		}
		canvas.style.cursor = this.grabbing ? "move" : this.jpoint == null ? "default" : "pointer"
		if (this.grabbing && this.wjpoint != null && lesson.focusat(pos)) {
			lesson.learn(this.statements[this.wjpoint].getword(this.wkpoint))
		} else {
			lesson.learn(null)
		}
		lesson.think(dt)
		if (this.done.nclick > 0) {
			this.checkstate(true)
			UFX.scene.push(this.todo.length == 0 ? "win" : "fail")
		}
	},
	setfocused: function (pos) {
		this.jpoint = null
		this.kpoint = null
		for (let j = 0 ; j < this.controls.length ; ++j) {
			let control = this.controls[j]
			let k = control.focusat(pos)
			if (k !== null && k !== undefined) {
				this.jpoint = j
				this.kpoint = k
				control.focused = k
				break
			}
		}
		this.controls.forEach((control, j) => {
			if (j != this.jpoint) control.focused = null
		})

		this.wjpoint = null
		this.wkpoint = null
		this.wpoint = null
		for (let j = 0 ; j < this.statements.length ; ++j) {
			let statement = this.statements[j]
			let k = statement.focusat(pos)
			if (k !== null && k !== undefined) {
				this.wjpoint = j
				this.wkpoint = k
				statement.focused = k
				this.wpoint = statement.getobj(k)
				break
			}
		}
		this.statements.forEach((statement, j) => {
			if (j != this.wjpoint) statement.focused = null
		})
	},
	dropword: function () {
		this.wjpoint = null
		this.wkpoint = null
		this.wpoint = null
		this.grabbing = false
	},
	checkstate: function (final) {
		if (this.todo.length <= (final ? 0 : 1)) return
		let state = this.lcontrols.map(control => control.state())
		if (comparestate(state, this.todo[0])) this.todo.shift()
	},
	draw: function () {
		UFX.draw("fs", UFX.draw.lingrad(0, 0, sx, sy, 0, "#228", 1, "#006"), "fr", 0, 0, sx, sy)
		UFX.draw("[ z", sx / sx0, sy / sy0)
		function draw(obj) {
			context.save()
			obj.draw()
			context.restore()
		}
		this.controls.forEach(draw)
		this.statements.forEach(draw)
		words.setfont(context, 60, "Passion One", false)
		UFX.draw("[ tab center top fs orange sh black", Z(6), Z(6), 0,
			"ft time:", 260, 760,
			"ft", this.t.toFixed(this.t >= 10 ? 0 : 1), 260, 820,
		"]")
		draw(lesson)
		if (this.grabbing && this.wpoint) {
			this.statements[this.wjpoint].drawat(this.pos, this.wkpoint)
		}
		if (DEBUG) {
			UFX.draw("font 22px~'Passion~One' tab left top fs white")
			context.fillText(UFX.ticker.getrates(), 10, 10)
		}
		UFX.draw("]")
	},
}

let ShowMessage = {
	init: function (message) {
		this.message = message
	},
	start: function () {
		this.t = 0
		this.f = 0
	},
	think: function (dt) {
		this.f = clamp(this.f + 2 * dt, 0, 1)
		let pstate = UFX.pointer()
		if (this.f == 1 && pstate.down) {
			UFX.scene.pop()
			UFX.scene.swap("play")
		}
	},
	draw: function () {
		UFX.scenes.play.draw()
		let alpha = 0.9 * this.f
		UFX.draw("fs", "rgba(80,80,80," + alpha + ")", "f0")
		if (this.f < 1) return
		UFX.draw("[ z", sx / sx0, sy / sy0, "tab center middle")
		UFX.draw("t", 800, 450, "r", 0.1)
		UFX.draw("font bold~120px~'Architects~Daughter'",
			"fs", UFX.draw.lingrad(0, -50, 0, 50, 0, "#fbb", 1, "#c77"),
			"sh black", Z(9), Z(9), 0,
			"ft0", this.message)
		UFX.draw("]")
	},
}

UFX.scenes.fail = UFX.Thing()
	.addcomp(ShowMessage, "Job~not~done~right")
UFX.scenes.win = UFX.Thing()
	.addcomp(ShowMessage, "Job~done~right!")
UFX.scenes.timeup = UFX.Thing()
	.addcomp(ShowMessage, "Out~of~time")



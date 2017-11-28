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
		let ldata = levels[savestate.current]
		this.t0 = this.t = ldata.t
		this.todo = ldata.winsequence.slice()
		this.tounlock = ldata.unlock
		let y = 120
		this.statements = ldata.steps.map(text => {
			let s = new Statement(text, [80, y], { width: 440, size: 40, })
			y = s.ymax + 40
			return s
		})
		let title = new Statement("Simple Machines", [1260, 120], { size: 60, width: 900, center: true })
		this.statements.push(title)
		this.done = new Button({
			x: 390, y: 810, w: 144, h: 144, centered: true,
			shape: "circle", color: "#77f", label: "DONE",
		})
		this.lcontrols = ldata.controls.map(cdata => {
			let [cname, opts] = cdata
			return new (window[cname])(opts)
		})
		this.controls = [
			new Cable({ x: 560, y: 280, x1: 630, y1: 280 }),
			new Cable({ x: 560, y: 600, x1: 630, y1: 600 }),
			new Cable({ x: 390, y: 750, x1: 390, y1: 700 }),
			new Cable({ x: 450, y: 800, x1: 630, y1: 800 }),
			new Cable({ x: 950, y: 45, x1: 1040, y1: 45, width: 25, }),
			new Cable({ x: 560, y: 80, x1: 670, y1: 80, width: 25, }),
			new Cable({ x: 1100, y: 90, x1: 1100, y1: 130 }),
			new Cable({ x: 1200, y: 90, x1: 1200, y1: 130 }),
			new Readout({ x: 20, y: 40, w: 560, h: 680, bcolor: "#bbb", }),
			new Readout({ x: 660, y: 20, w: 300, h: 80, text: "Stage " + savestate.current, }),
			title.panel(),
			new Panel({ x: 620, y: 120, w: 960, h: 760 }),
			new Panel({ x: 320, y: 740, w: 140, h: 140 }),
			this.done,
		]
		if (ldata.fakescrews) {
			this.controls.push(
				new FakeScrew({ x: 620, y: 100, w: 70, h: 70, }),
				new FakeScrew({ x: 1510, y: 100, w: 70, h: 70, }),
				new FakeScrew({ x: 620, y: 810, w: 70, h: 70, }),
				new FakeScrew({ x: 1510, y: 810, w: 70, h: 70, })
			)
		}
		this.controls = this.controls.concat(this.lcontrols)
		this.jpoint = null
		this.kpoint = null
		this.grabbing = false

		this.wjpoint = null
		this.wkpoint = null
		this.wpoint = null
		this.grabbing = false
		
		this.pos = [0, 0]

		lesson.reset()
		
		this.dolesson = !ldata.hidelesson
		if (ldata.intro) UFX.scene.push("talk", ldata.intro)
		this.outro = ldata.outro
	},
	think: function (dt) {
		if (this.t0) {
			this.t = clamp(this.t - dt, 0, this.t0)
			if (this.t == 0) {
				UFX.scene.iswap("menu")
				UFX.scene.push("timeup")
				playsound("fail")
				return
			}
		}
		let pstate = UFX.pointer()
		let pos = this.pos = pstate.pos ? pstate.pos.slice() : [0, 0]
		pos[0] *= sx0 / sx
		pos[1] *= sy0 / sy
		if (!this.grabbing) {
			this.setfocused(pos)
			if (this.jpoint !== null && pstate.down) {
				this.grabbing = true
				playsound("grab")
			} else if (this.wjpoint !== null && pstate.down) {
				this.grabbing = true
				playsound("grabword")
			}
		}

		if (this.grabbing) {
			if (this.jpoint !== null) {
				this.controls[this.jpoint].grabify(pos, this.kpoint, dt)
			}
			if (pstate.up) {
				this.grabbing = false
				if (this.jpoint !== null) {
					playsound("release")
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
		if (this.dolesson) {
			lesson.think(dt)
		}
		if (this.done.nclick > 0) {
			this.checkstate(true)
			if (this.todo.length == 0 && this.tounlock) savestate.unlock(this.tounlock)
			UFX.scene.swap("menu")
			if (this.todo.length == 0) {
				if (this.outro) {
					UFX.scene.push("talk", this.outro)
				}
				UFX.scene.iswap("menu")
				UFX.scene.push("win")
				playsound("win")
			} else {
				UFX.scene.iswap("menu")
				UFX.scene.push("fail")
				playsound("fail")
			}
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
		if (!this.dolesson) return

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
		if (savestate.easy && this.wpoint) {
			lesson.complete(this.wpoint.text)
		}
	},
	dropword: function () {
		this.wjpoint = null
		this.wkpoint = null
		this.wpoint = null
		this.grabbing = false
	},
	checkstate: function (final) {
		let state = this.lcontrols.map(control => control.state())
		if (DEBUG) {
			console.log(JSON.stringify(state))
		}
		if (this.todo.length <= 0) return
		if (DEBUG) {
			console.log(JSON.stringify(this.todo[0]))
			console.log(comparestate(state, this.todo[0]))
		}
		if (comparestate(state, this.todo[0])) {
			if (savestate.easy) playsound("righttrack")
			if (final || this.todo.length > 1) {
				this.todo.shift()
			}
		}
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
		if (this.t0) {
			UFX.draw("[ tab center top fs orange sh black", Z(6), Z(6), 0, "t", 300, 730,
				"ft0 time:",
				"t", 0, 60, "ft0", this.t.toFixed(this.t >= 10 ? 0 : 1),
			"]")
			if (this.dolesson) draw(lesson)
		}
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

let SceneTransition = {
	init: function (tmove, wait, twait) {
		this.tmove = tmove || 0.5
		this.wait = wait
		this.twait = twait || 0
	},
	start: function () {
		this.f = 0
		this.done = false
	},
	think: function (dt) {
		if (this.done) {
			this.f = clamp(this.f - dt / this.tmove, 0, 1)
			if (this.f == 0) UFX.scene.pop()
		} else {
			this.f = clamp(this.f + dt / this.tmove, 0, 1)
		}
	},
	control: function (pstate) {
		if (!this.done && this.t >= this.tmove + this.twait) {
			if (!this.wait || pstate.down) this.done = true
		}
	},
}

let DrawUnderscene = {
	init: function (oldscene) {
		this.oldscene = oldscene
	},
	draw: function () {
		if (this.f >= 1) return
		if (this.done) {
			UFX.scene.top(1).draw()
		} else {
			UFX.scenes[this.oldscene].draw()
		}
	},
}

let DrawCurtain = {
	init: function (curtaincolor) {
		this.curtaincolor = curtaincolor || "black"
	},
	draw: function () {
		let alpha = clamp(this.f, 0, 1)
		UFX.draw("[ fs", this.curtaincolor, "alpha", alpha, "f0 ]")
	},
}

let DrawDoor = {
	draw: function () {
		let h = 600 * this.f
		let screw = "fs #555 b o 0 0 30 f lw 5 ss black s b m 0 -30 l 0 30 lw 12 s"

		UFX.draw("[ z", sx / sx0, sy / sy0,
			"[ t", 0, -150 + h,
				"fs #666 fr -50 -500 1700 400",
				"( m -50 -100 l 400 -100 l 600 100 l 1000 100 l 1200 -100 l 1650 -100",
				"l 1650 -300 l 1150 -300 l 950 -100 l 650 -100 l 450 -300 l -50 -300 )",
				"fs gray ss black lw 20 f s",
				"[ t 425 -200", screw, "]",
				"[ t 625 0", screw, "]",
				"[ t 975 0", screw, "]",
				"[ t 1175 -200", screw, "]",
			"]",
			"[ t", 0, 1050 - h,
				"fs #666 fr -50 100 1700 400",
				"( m -50 -100 l 400 -100 l 600 100 l 1000 100 l 1200 -100 l 1650 -100",
				"l 1650 100 l 1250 100 l 1050 300 l 550 300 l 350 100 l -50 100 )",
				"fs gray ss black lw 20 f s",
				"[ t 375 0", screw, "]",
				"[ t 575 200", screw, "]",
				"[ t 1025 200", screw, "]",
				"[ t 1225 0", screw, "]",
			"]",
		"]")
	},
}

let ShowMessage = {
	init: function (message) {
		this.message = message
	},
	draw: function () {
		if (this.f < 1) return
		UFX.draw("[ z", sx / sx0, sy / sy0)
		UFX.draw.text(this.message, [800, 450], 120, "Architects Daughter", {
			align: "center",
			baseline: "middle",
			bold: true,
			fill: "#fbb",
			shade: 2,
			shadow: ["black", Z(1), Z(1), 0],
		})
		UFX.draw("]")
	},
}

UFX.scenes.startgame = UFX.Thing()
	.addcomp(Lives)
	.addcomp(SceneControl)
	.addcomp(SceneTransition, 0.4, false, 0.3)
	.addcomp(DrawUnderscene, "load")
	.addcomp(DrawDoor)

UFX.scenes.startlevel = UFX.Thing()
	.addcomp(Lives)
	.addcomp(SceneControl)
	.addcomp(SceneTransition, 0.4, false, 0.3)
	.addcomp(DrawUnderscene, "menu")
	.addcomp(DrawDoor)

UFX.scenes.fail = UFX.Thing()
	.addcomp(Lives)
	.addcomp(SceneControl)
	.addcomp(SceneTransition, 0.3, true)
	.addcomp(DrawUnderscene, "play")
	.addcomp(DrawDoor)
	.addcomp(ShowMessage, "Job not done right")

UFX.scenes.timeup = UFX.Thing()
	.addcomp(Lives)
	.addcomp(SceneControl)
	.addcomp(SceneTransition, 0.3, true)
	.addcomp(DrawUnderscene, "play")
	.addcomp(DrawDoor)
	.addcomp(ShowMessage, "Out of time")

UFX.scenes.win = UFX.Thing()
	.addcomp(Lives)
	.addcomp(SceneControl)
	.addcomp(SceneTransition, 0.3, true)
	.addcomp(DrawUnderscene, "play")
	.addcomp(DrawDoor)
	.addcomp(ShowMessage, "Job done right!")

UFX.scenes.talk = {
	start: function (texts) {
		this.texts = texts
		this.t = 0
		this.f = 0
		this.ttext = 0
		this.balloons = texts.map(text => new WordBalloon(text, [800, 200], { width: 1000, }))
	},
	think: function (dt) {
		this.f = clamp(this.f + 2 * dt, 0, 1)
		if (this.f == 1) {
			this.ttext += dt
		}
		let pstate = UFX.pointer()
		if (this.ttext > 0.4 && pstate.down) {
			this.ttext = 0
			if (this.balloons.length) this.balloons.shift()
			if (!this.balloons.length) {
				UFX.scene.pop()
			} else {
				playsound("saynext")
			}
		}
	},
	draw: function () {
		UFX.scenes.play.draw()
		let alpha = 0.9 * this.f
		UFX.draw("fs", "rgba(80,80,80," + alpha + ")", "f0")
		if (this.f < 1) return
		if (!this.balloons.length) return
		UFX.draw("[ z", sx / sx0, sy / sy0)
		function draw(obj) {
			context.save()
			obj.draw()
			context.restore()
		}
		draw(this.balloons[0])
		UFX.draw("]")
	},
}


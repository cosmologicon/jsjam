"use strict"

UFX.scenes.play = {
	start: function () {
		let texts = [
			"Press red button.",
			"Twist knob to nine.",
			"Push green piece up two and down three.",
			"Press thing below green light.",
		]
		let y = 100
		this.statements = texts.map(text => {
			let s = new Statement(text, [100, y])
			y = s.ymax + 20
			return s
		})
		this.controls = [
			new Knob({ x: 1000, y: 200, w: 400, h: 400, min: 0, max: 5, setting: 2 }),
		]
		this.jpoint = null
		this.kpoint = null
		this.grabbing = false
	},
	think: function (dt) {
		let pstate = UFX.pointer()
		let pos = pstate.pos ? pstate.pos.slice() : [0, 0]
		pos[0] *= sx0 / sx
		pos[1] *= sy0 / sy
		if (this.grabbing) {
			this.controls[this.jpoint].grabify(pos, this.kpoint)
			if (pstate.up) {
				this.grabbing = false
			}
		} else {
			this.setfocused(pos)
			if (this.jpoint !== null && pstate.down) {
				this.grabbing = true
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
	},
	draw: function () {
		UFX.draw("fs #600 f0")
		UFX.draw("[ z", sx / sx0, sy / sy0)
		function draw(obj) {
			context.save()
			obj.draw()
			context.restore()
		}
		this.statements.forEach(draw)
		this.controls.forEach(draw)
		UFX.draw("]")
	},
}


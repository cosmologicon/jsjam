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
//			new VSlider({ x: 700, y: 200, w: 250, h: 500, min: 0, max: 5, setting: 3 }),
			new Coil({ x: 500, y: 200, w: 400, h: 400, min: 2, max: 4, setting: 3 }),
		]
		this.jpoint = null
		this.kpoint = null
		this.grabbing = false

		this.wjpoint = null
		this.wkpoint = null
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
		canvas.style.cursor = this.grabbing ? "move" : this.jpoint == null ? "default" : "pointer"
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
		for (let j = 0 ; j < this.statements.length ; ++j) {
			let statement = this.statements[j]
			let k = statement.focusat(pos)
			if (k !== null && k !== undefined) {
				this.wjpoint = j
				this.wkpoint = k
				statement.focused = k
				break
			}
		}
		this.statements.forEach((statement, j) => {
			if (j != this.wjpoint) statement.focused = null
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


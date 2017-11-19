"use strict"

let levels = {}

let progress = {
	current: null,
	reset: function () {
		this.unlocked = ["1"]
		this.current = "1"
		this.save()
	},
	save: function () {
		localStorage.xkcd2017save = JSON.stringify([this.unlocked, this.current])
	},
	load: function () {
		if (!localStorage.xkcd2017save) {
			this.reset()
		} else {
			;[this.unlocked, this.current] = JSON.parse(localStorage.xkcd2017save)
		}
	},
	unlock: function (levelname) {
		if (this.unlocked.includes(levelname)) return
		this.unlocked.push(levelname)
		this.save()
	},
	unlockall: function () {
		for (let levelname in levels) this.unlock(levelname)
	},
}
if (window.location.href.includes("RESET")) progress.reset()
else progress.load()



levels[1] = {
	t: 40,
	steps: [
		"Turn the thing you can turn as high as it can go.",
		"Slide the thing you can slide all the way to the bottom.",
	],
	controls: [
		["Knob", { x: 1000, y: 300, w: 500, h: 500, min: 0, max: 10, setting: 2, }],
		["VSlider", { x: 700, y: 200, w: 300, h: 590, min: 0, max: 6, setting: 5, }],
	],
	winsequence: [
		[[10], [5]],
		[[10], [0]],
	],
	intro: [
		"hi. you're new here. I'll show you how we do things. See those steps? Follow each step exactly, and then pick Done."
	],
	fakescrews: true,
}

levels[2] = {
	t: 100,
	steps: [
		"Press the shape that there's one of, once for each leg on two birds.",
		"Raise the left turn thing by half the number on the right turn thing.",
	],
	controls: [
		["Knob", { x: 600, y: 600, w: 300, h: 300, min: 1, max: 10, setting: 6, }],
		["Knob", { x: 900, y: 600, w: 300, h: 300, min: 1, max: 10, setting: 6, }],
		["Button", { x: 1450, y: 120, w: 100, h: 100, shape: "circle", color: "red", }],
		["Button", { x: 1450, y: 220, w: 100, h: 100, shape: "star", color: "orange", }],
		["Button", { x: 1450, y: 320, w: 100, h: 100, shape: "square", color: "yellow", }],
		["Button", { x: 1450, y: 420, w: 100, h: 100, shape: "circle", color: "green", }],
		["Button", { x: 1450, y: 520, w: 100, h: 100, shape: "star", color: "blue", }],
	],
	winsequence: [
		[[6], [6], [0], [0], [4], [0], [0]],
		[[9], [6], [0], [0], [4], [0], [0]],
	],
	fakescrews: true,
}

levels.test = {
	t: 999,
	steps: [
		"Push the sliding thing up to the top.",
		"Depress the two round things with colors that add to make purple.",
		"Touch the yellow thing that is where a horse from a well known board game can move to if it is on the round green thing.",
		"Press the thing on the left side of the blue stellar object.",
		"See the thing with the outside part that moves but the middle part does not move?  Turn it in the way that hands go on a time telling thing.  Turn it half of the way around.",
	],
	controls: [
		["Coil", { x: 640, y: 120, w: 280, h: 280, min: 2, max: 4, setting: 3 }],
		["Knob", { x: 640, y: 420, w: 280, h: 280, min: 1, max: 10, setting: 3 }],
		["Button", { x: 1000, y: 200, w: 100, h: 100, color: "red", shape: "square" }],
		["Button", { x: 1000, y: 300, w: 100, h: 100, color: "red", shape: "circle" }],
		["Button", { x: 1000, y: 400, w: 100, h: 100, color: "red", shape: "star" }],
		["Button", { x: 1100, y: 200, w: 100, h: 100, color: "orange", shape: "square" }],
		["Button", { x: 1100, y: 300, w: 100, h: 100, color: "orange", shape: "circle" }],
		["Button", { x: 1100, y: 400, w: 100, h: 100, color: "orange", shape: "star" }],
		["Button", { x: 1200, y: 200, w: 100, h: 100, color: "blue", shape: "square" }],
		["Button", { x: 1200, y: 300, w: 100, h: 100, color: "blue", shape: "circle" }],
		["Button", { x: 1200, y: 400, w: 100, h: 100, color: "blue", shape: "star" }],
		["VSlider", { x: 1300, y: 150, w: 150, h: 300, min: 0, max: 5, setting: 3 }],
		["Screw", { x: 620, y: 100, w: 70, h: 70, min: 0, max: 4 }],
		["Screw", { x: 620, y: 810, w: 70, h: 70, min: 0, max: 4 }],
		["Screw", { x: 1510, y: 100, w: 70, h: 70, min: 0, max: 4 }],
		["Screw", { x: 1510, y: 810, w: 70, h: 70, min: 0, max: 4 }],
		["Contact", { x: 1200, y: 500, w: 300, h: 300, labels: "ABCDE", }],
		["ChargeButton", { x: 1000, y: 580, w: 100, h: 100, colors: ["red", "orange", "yellow", "white"], color: "blue", shape: "circle" }],
		["Switch", { x: 1450, y: 150, w: 100, h: 200, labels: "AB", }],
		["Tiles", { x: 700, y: 700, w: 400, h: 100, labels: "ABCDE", }],
	],
	winsequence: [null],
}


UFX.scenes.menu = {
	start: function () {
		this.t = 0
		this.f = 1
		this.title = new Statement("Cut the Red Power Stick", [800, 120], { size: 70, width: 900, center: true })
		this.controls = progress.unlocked.map((levelname, j) => {
			let w = 150, h = 150
			let jx = j % 5, jy = Math.floor(j / 5)
			return new Button({
				w: w, h: h, label: "" + levelname, color: UFX.random.color(), shape: "star",
				x: 800 + (jx - 2) * 300,
				y: 200 + jy * 300,
			})
		})
		lesson.reset()
	},
	think: function (dt) {
		this.t += dt
		this.f = clamp(this.f - 2 * dt, 0, 1)
		let pstate = UFX.pointer()
		let pos = this.pos = pstate.pos ? pstate.pos.slice() : [0, 0]
		pos[0] *= sx0 / sx
		pos[1] *= sy0 / sy
		this.jpoint = null
		for (let j = 0 ; j < this.controls.length ; ++j) {
			let control = this.controls[j]
			let k = control.focusat(pos)
			if (k !== null && k !== undefined) {
				this.jpoint = j
				control.focused = k
				break
			}
		}
		this.controls.forEach((control, j) => {
			if (j != this.jpoint) control.focused = null
		})
		if (this.t > 0.5 && pstate.down && this.jpoint !== null) {
			progress.current = progress.unlocked[this.jpoint]
			UFX.scene.swap("play")
		}
		canvas.style.cursor = this.jpoint == null ? "default" : "pointer"
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
		draw(this.title)
		UFX.draw("]")

		let alpha = this.f
		if (alpha) UFX.draw("fs", "rgba(255,255,255," + alpha + ")", "f0")
	},
}


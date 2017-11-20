"use strict"

let levels = {}

let progress = {
	current: null,
	reset: function () {
		this.unlocked = ["1"]
		this.current = "1"
		this.done = {}
		this.easy = false
		this.save()
	},
	save: function () {
		localStorage.xkcd2017save = JSON.stringify([this.unlocked, this.current, this.done, this.easy])
	},
	load: function () {
		if (!localStorage.xkcd2017save) {
			this.reset()
		} else {
			;[this.unlocked, this.current, this.done, this.easy] = JSON.parse(localStorage.xkcd2017save)
		}
	},
	unlock: function (levelname) {
		if (this.unlocked.includes(levelname)) return
		this.unlocked.push(levelname)
		this.save()
	},
	do: function (thing) {
		this.done[thing] = 1
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
	hidelesson: true,
	unlock: 2,
}

levels[2] = {
	t: 100,
	steps: [
		"Press the shape that there's one of, once for each leg on two birds.",
		"Raise the left turn thing by half the number on the right turn thing.",
		"Turn the thing that wraps around itself by how much the minute hand moves in one hundred minutes.",
	],
	controls: [
		["Knob", { x: 600, y: 600, w: 300, h: 300, min: 1, max: 10, setting: 6, }],
		["Knob", { x: 900, y: 600, w: 300, h: 300, min: 1, max: 10, setting: 6, }],
		["Button", { x: 1450, y: 120, w: 100, h: 100, shape: "circle", color: "red", }],
		["Button", { x: 1450, y: 220, w: 100, h: 100, shape: "star", color: "orange", }],
		["Button", { x: 1450, y: 320, w: 100, h: 100, shape: "square", color: "yellow", }],
		["Button", { x: 1450, y: 420, w: 100, h: 100, shape: "circle", color: "green", }],
		["Button", { x: 1450, y: 520, w: 100, h: 100, shape: "star", color: "blue", }],
		["Coil", { x: 600, y: 100, w: 400, h: 400, min: 1, max: 5, setting: 2, }],
	],
	winsequence: [
		[[6], [6], [0], [0], [4], [0], [0], [2]],
		[[9], [6], [0], [0], [4], [0], [0], [2]],
		[[9], [6], [0], [0], [4], [0], [0], [[3.57, 3.77]]],
	],
	fakescrews: true,
	hidelesson: true,
	unlock: 3,
}

levels[3] = {
	t: 100,
	steps: [
		"Put the letters in the order you sing them.",
		"Set the thing that turns to the number of words in this instruction.", // instruction
	],
	controls: [
		["Tiles", { x: 700, y: 700, w: 400, h: 100, labels: "CBDEA", }],
		["Knob", { x: 1200, y: 500, w: 300, h: 300, min: 10, max: 15, setting: 10, }],
	],
	winsequence: [
		[[[4, 1, 0, 2, 3]], [10]],
	],
	fakescrews: true,
	intro: [
		"Wait a minute. Something is wrong. Do you see that long word in the second step? I don't recognize that word, and I don't like the look of it.",
		"Let's see if it should be here. Grab that word and drag it down to the word check area. Hold it there for a second.",
		"Again, that's the long word at the end of the second step.",
	],
	unlock: 4,
}


levels[4] = {
	t: 100,
	steps: [
		"Change the second switch from the left twice.",  // switch
		"Move exactly one slider exactly two spaces, so that three of the sliders form a straight line.",
		"Connect one of the letters to the letter that comes exactly three letters after it.",  // connect
		"Hold the blue circle until its yellow light becomes lit.",
	],
	controls: [
		["VSlider", { x: 1080, y: 110, w: 180, h: 300, min: 0, max: 5, setting: 3 }],
		["VSlider", { x: 1180, y: 110, w: 180, h: 300, min: 0, max: 5, setting: 4 }],
		["VSlider", { x: 1280, y: 110, w: 180, h: 300, min: 0, max: 5, setting: 4 }],
		["VSlider", { x: 1380, y: 110, w: 180, h: 300, min: 0, max: 5, setting: 0 }],
		["ChargeButton", { x: 1000, y: 580, w: 100, h: 100, colors: ["red", "orange", "yellow", "white"], color: "blue", shape: "circle" }],
	],
	winsequence: [
		[[3], [2], [4], [0], [0]],
		[[3], [2], [4], [0], [[3, 3.999]]],
	],
	fakescrews: true,
	intro: [
		"Great, you figured out how to ignore the words that should not be there.",
		"I see two more words like that in this set of steps. Remember, ignore any step that has a bad word. And if you're not sure about a word, use the word help area and see if it turns red.",
	],
	unlock: 5,
}

// Controls starting at level 5 on.
let controlset = [
	["Screw", { x: 620, y: 100, w: 70, h: 70, min: 0, max: 3 }],
	["Screw", { x: 620, y: 810, w: 70, h: 70, min: 0, max: 3 }],
	["Screw", { x: 1510, y: 100, w: 70, h: 70, min: 0, max: 3 }],
	["Screw", { x: 1510, y: 810, w: 70, h: 70, min: 0, max: 3 }],
	["Contact", { x: 1200, y: 500, w: 300, h: 300, labels: "ABCDE", }],
	["Coil", { x: 640, y: 120, w: 280, h: 280, min: 2, max: 4, setting: 3 }],
	["Button", { x: 1000, y: 200, w: 100, h: 100, color: "red", shape: "triangle" }],
	["Button", { x: 1100, y: 200, w: 100, h: 100, color: "yellow", shape: "triangle" }],
	["Button", { x: 1200, y: 200, w: 100, h: 100, color: "blue", shape: "triangle" }],
	["Button", { x: 1000, y: 300, w: 100, h: 100, color: "red", shape: "square" }],
	["Button", { x: 1100, y: 300, w: 100, h: 100, color: "yellow", shape: "square" }],
	["Button", { x: 1200, y: 300, w: 100, h: 100, color: "blue", shape: "square" }],
	["Button", { x: 1000, y: 400, w: 100, h: 100, color: "red", shape: "star" }],
	["Button", { x: 1100, y: 400, w: 100, h: 100, color: "yellow", shape: "star" }],
	["Button", { x: 1200, y: 400, w: 100, h: 100, color: "blue", shape: "star" }],
	["Switch", { x: 650, y: 150, w: 100, h: 200, labels: "25", }],
	["Switch", { x: 750, y: 150, w: 100, h: 200, labels: "35", }],
	["Switch", { x: 850, y: 150, w: 100, h: 200, labels: "14", on: true, }],
	["Switch", { x: 950, y: 150, w: 100, h: 200, labels: "25", }],
	["ChargeButton", { x: 1000, y: 580, w: 100, h: 100, colors: ["red", "yellow", "blue", "white"], color: "red", shape: "circle" }],
	["ChargeButton", { x: 1100, y: 580, w: 100, h: 100, colors: ["red", "yellow", "blue", "white"], color: "yellow", shape: "circle" }],
	["ChargeButton", { x: 1200, y: 580, w: 100, h: 100, colors: ["red", "yellow", "blue", "white"], color: "blue", shape: "circle" }],
	["Knob", { x: 640, y: 420, w: 280, h: 280, min: 1, max: 8, setting: 3, }],
	["Knob", { x: 840, y: 420, w: 280, h: 280, min: 1, max: 8, setting: 7, }],
	["Knob", { x: 1040, y: 420, w: 280, h: 280, min: 1, max: 8, setting: 1, }],
]

/*
		[
			[null, true], [null, true], [null, true], [null, true], [], [3],
			[0], [0], [0], [0], [0], [0], [0], [0], [0],
			[false], [false], [true], [false],
			[0], [0], [0],
			[3], [7], [1],
		],
*/

levels[5] = {
	t: 100,
	steps: [
		"Change the turn thing on the right to the average of the other two.",  // average
		"Make a line between the two letters whose small forms are mirror images of each other.",
		"See those things you use to turn on the lights in your house? Change each one that's pointing toward the floor so that it's pointing toward the ceiling.",
		"Hold each circle until its light is the same color as a fire truck.",
	],
	controls: controlset,
	winsequence: [
	],
	intro: [
		"Did you ever hear the story of how we came to use only the ten hundred most used words? It happened a long time ago.",
		"It started as a sort of game, to make yourself think in new and interesting ways.",
		"It seems like it would make it hard to explain things, but once you get used to it, it comes pretty easily, doesn't it?",
	],
	unlock: 6,
}

levels[6] = {
	t: 100,
	steps: [
		"Make it so that each number chosen by a light changers is larger than the number chosen by the light changer immediately to its left.",
		"Remove three of the four tiny metal things that hold the plate in place. Leave only the one on the top left.",
		"Touch the two three-sided shapes whose colors are before and after orange on a colorful sky track that appears after a storm.",  // orange
		"Set all three turns things to their largest values, then set them all to their lowest settings.",  // values
	],
	controls: controlset,
	winsequence: [
	],
	fakescrews: false,
	intro: [
	],
	unlock: 7,
}


levels[7] = {
	t: 100,
	steps: [
		"Wind the gray spring all the way up to the right. Also, at the very end of these steps, bring it all the way back to its starting position.",
		"Make it so every light changer with both an even and an odd number is set to the even one.",  // odd
		"Make a bridge between the pair of letters that aren't part of the word BED.",
		"Touch the red and blue shapes whose number of points is equal to the number of letters in their colors.",  // equal
	],
	controls: controlset,
	winsequence: [
	],
	fakescrews: false,
	intro: [
	],
	unlock: 8,
}


levels[8] = {
	t: 100,
	steps: [
		"Change exactly two of the light changers so that the numbers chosen add up to ten.",
		"Touch the two shapes that a horse-shaped piece in a well-known board game could reach from the red star.",
		"Change each of the three turn things to their current number taken away from ten.", // current
	],
	controls: controlset,
	winsequence: [
	],
	fakescrews: false,
	intro: [
	],
	unlock: 9,
}

levels[9] = {
	t: 100,
	steps: [
		"Hold each of the circles until their lights match the colors of the circles themselves.",  // match
		"Find the five shapes that together form the letter that begins the thing made of wooden blocks that you hit to make music. Touch them one time each, in any order.",
		"Consider the three turn things to be one number (in the hundreds), and make that number be twice as big.",
	],
	controls: controlset,
	winsequence: [
	],
	fakescrews: false,
	intro: [
	],
	unlock: "BONUS",
}

levels.BONUS = {
	t: 100,
	steps: [
		"Hold the third circle until its second light is on, and the first circle until its fourth light is on.",
		"Put the letters in order from last to first, then switch the last and first two.",
		"Wind up the spring until it's in the direction of the hour hand at nine.",
		"Join the letter that's the same when it flips left to right to any other letter.",
	],
	controls: controlset,
	winsequence: [
	],
	fakescrews: false,
	intro: [
		"You don't have to play this one. You've already beaten the game. This one is just extra, for fun. But if you do try it, you should know that it doesn't work the same way as the others. Can you figure out what you're supposed to do? I hope you're lucky!",
	],
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
		this.title = new Statement("Simple Machines", [800, 120], { size: 70, width: 900, center: true })
		this.controls = progress.unlocked.map((levelname, j) => {
			let w = 250, h = 250
			let jx = j % 5, jy = Math.floor(j / 5)
			return new Button({
				w: w, h: h, label: "" + levelname, color: UFX.random.color(), shape: "star",
				x: -w/2 + 700 + (jx - 2) * 250 + jy * 125,
				y: -h/2 + 250 + jy * 250,
			})
		})
		this.easy = new Switch({ x: 100, y: 650, w: 100, h: 200, on: !progress.easy, labels: ["EASY", "NORMAL"] })
		this.easyballoon = new WordBalloon(
			"If you set it to EASY, you can take as much time as you want, and you can check a word just by pointing to it.",
			[800, 200], { width: 1000, })
		this.controls.push(this.easy)
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
			if (this.controls[this.jpoint] === this.easy) {
				this.easy.release()
				progress.easy = !this.easy.on
			} else {
				progress.current = progress.unlocked[this.jpoint]
				UFX.scene.swap("play")
			}
		}
		canvas.style.cursor = this.jpoint == null ? "default" : "pointer"
	},
	draw: function () {
		UFX.draw("fs", UFX.draw.lingrad(0, 0, sx, sy, 0, "#aaa", 1, "#777"), "fr", 0, 0, sx, sy)
		UFX.draw("[ z", sx / sx0, sy / sy0)
		function draw(obj) {
			context.save()
			obj.draw()
			context.restore()
		}
		this.controls.forEach(draw)
		draw(this.title)

		if (this.controls[this.jpoint] === this.easy) {
			this.easyballoon.draw()
		}

		UFX.draw("]")

		let alpha = this.f
		if (alpha) UFX.draw("fs", "rgba(255,255,255," + alpha + ")", "f0")
	},
}


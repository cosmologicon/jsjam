"use strict"

let levels = {}

let Serializable = {
	init: function (name, version) {
		this._savename = name
		this._versionname = name + "_version"
		this._version = "" + version
	},
	getobj: function () {
		let obj = {}
		for (let s in this) {
			if (this.hasOwnProperty(s)) obj[s] = this[s]
		}
		return obj
	},
	save: function () {
		localStorage[this._savename] = JSON.stringify(this.getobj())
		localStorage[this._versionname] = this._version
	},
	load: function () {
		let obj = JSON.parse(localStorage[this._savename])
		for (let s in obj) this[s] = obj[s]
	},
	start: function (forcereset) {
		if (forcereset || localStorage[this._versionname] != this._version) {
			this.reset()
			this.save()
		} else {
			this.load()
		}
	},
	reset: function () {},
}
function SaveState(forcereset) {
	this.start(forcereset)
}
SaveState.prototype = UFX.Thing()
	.addcomp(Serializable, "xkcd2017save", 1)
	.addcomp({
		reset: function () {
			this.current = "1"
			this.unlocked = ["1"]
		},
		unlock: function (levelname) {
			if (this.unlocked.includes(levelname)) return
			this.unlocked.push(levelname)
			this.save()
		},
		unlockall: function () {
			for (let levelname in levels) this.unlock(levelname)
		},
	})
	.addcomp({
		start: function () {
			this.fullscreen = false
		},
		reset: function () {
			this.easy = false
			this.sound = 4
			this.music = 4
			this.fullscreen = false
		},
	})
let savestate = new SaveState(window.location.href.includes("RESET"))


levels[1] = {
	t: 30,
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
		"Hi. Looks like you're new here. I'll show you how we do things. See those steps? Follow each step exactly, and then pick Done."
	],
	fakescrews: true,
	hidelesson: true,
	unlock: 2,
}

levels[2] = {
	t: 45,
	steps: [
		"Press the shape that there's one of, once for each leg on two birds.",
		"Raise the left turn thing by half the number on the right turn thing.",
		"Turn the thing that wraps around itself by how much the minute hand moves in one hundred minutes.",
	],
	controls: [
		["Knob", { x: 700, y: 540, w: 300, h: 300, min: 1, max: 10, setting: 6, }],
		["Knob", { x: 960, y: 540, w: 300, h: 300, min: 1, max: 10, setting: 6, }],
		["Button", { x: 1350, y: 160, w: 120, h: 120, shape: "circle", color: "red", }],
		["Button", { x: 1350, y: 280, w: 120, h: 120, shape: "star", color: "orange", }],
		["Button", { x: 1350, y: 400, w: 120, h: 120, shape: "square", color: "yellow", }],
		["Button", { x: 1350, y: 520, w: 120, h: 120, shape: "circle", color: "green", }],
		["Button", { x: 1350, y: 640, w: 120, h: 120, shape: "star", color: "blue", }],
		["Coil", { x: 800, y: 150, w: 400, h: 400, min: 1, max: 5, setting: 2, }],
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
	t: 45,
	steps: [
		"Put the letters in the order you sing them.",
		"Set the thing that turns to the number of words in this instruction.", // instruction
		"See those things you use to turn on the lights in your house? Change each one starting at the right and going left.",
	],
	controls: [
		["Tiles", { x: 700, y: 700, w: 500, h: 160, labels: "CBDEA", }],
		["Knob", { x: 1100, y: 300, w: 400, h: 400, min: 12, max: 20, setting: 12, }],
		["Switch", { x: 700, y: 180, w: 100, h: 200, }],
		["Switch", { x: 800, y: 180, w: 100, h: 200, on: true, }],
		["Switch", { x: 900, y: 180, w: 100, h: 200, }],
		["Switch", { x: 1000, y: 180, w: 100, h: 200, }],
	],
	winsequence: [
		[[[4, 1, 0, 2, 3]], [12], [false], [true], [false], [false]],
		[[[4, 1, 0, 2, 3]], [12], [false], [true], [false], [true]],
		[[[4, 1, 0, 2, 3]], [12], [false], [true], [true], [true]],
		[[[4, 1, 0, 2, 3]], [12], [false], [false], [true], [true]],
		[[[4, 1, 0, 2, 3]], [12], [true], [false], [true], [true]],
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
	t: 60,
	steps: [
		"Change the second switch from the left twice.",  // switch
		"Move exactly one slider exactly three spaces, so that three of the sliders form a straight line.",
		"Connect one of the letters to the letter that comes exactly three letters after it.",  // connect
		"Hold the blue circle until its yellow light becomes lit.",
	],
	controls: [
		["VSlider", { x: 1080, y: 110, w: 180, h: 300, min: 0, max: 6, setting: 3 }],
		["VSlider", { x: 1180, y: 110, w: 180, h: 300, min: 0, max: 6, setting: 5 }],
		["VSlider", { x: 1280, y: 110, w: 180, h: 300, min: 0, max: 6, setting: 5 }],
		["VSlider", { x: 1380, y: 110, w: 180, h: 300, min: 0, max: 6, setting: 0 }],
		["ChargeButton", { x: 720, y: 580, w: 160, h: 160, colors: ["red", "orange", "yellow", "white"], color: "blue", shape: "circle" }],
		["Switch", { x: 700, y: 180, w: 100, h: 200, }],
		["Switch", { x: 800, y: 180, w: 100, h: 200, }],
		["Switch", { x: 900, y: 180, w: 100, h: 200, }],
		["Contact", { x: 1200, y: 540, w: 260, h: 260, labels: "AMQRTZ", }],
	],
	winsequence: [
		[[3], [2], [5], [0], [0], [false], [false], [false], [[]]],
		[[3], [2], [5], [0], [[3, 3.999]], [false], [false], [false], [[]]],
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
	["Contact", { x: 900, y: 600, w: 260, h: 260, labels: "ABCDE", }],
	["Coil", { x: 620, y: 100, w: 320, h: 320, min: 2, max: 4, setting: 3 }],
	["Button", { x: 1250, y: 350, w: 100, h: 100, color: "red", shape: "triangle" }],
	["Button", { x: 1350, y: 350, w: 100, h: 100, color: "yellow", shape: "triangle" }],
	["Button", { x: 1450, y: 350, w: 100, h: 100, color: "blue", shape: "triangle" }],
	["Button", { x: 1250, y: 450, w: 100, h: 100, color: "red", shape: "square" }],
	["Button", { x: 1350, y: 450, w: 100, h: 100, color: "yellow", shape: "square" }],
	["Button", { x: 1450, y: 450, w: 100, h: 100, color: "blue", shape: "square" }],
	["Button", { x: 1250, y: 550, w: 100, h: 100, color: "red", shape: "star" }],
	["Button", { x: 1350, y: 550, w: 100, h: 100, color: "yellow", shape: "star" }],
	["Button", { x: 1450, y: 550, w: 100, h: 100, color: "blue", shape: "star" }],
	["Switch", { x: 1050, y: 120, w: 100, h: 200, labels: "25", }],
	["Switch", { x: 1150, y: 120, w: 100, h: 200, labels: "34", }],
	["Switch", { x: 1250, y: 120, w: 100, h: 200, labels: "14", on: true, }],
	["Switch", { x: 1350, y: 120, w: 100, h: 200, labels: "35", }],
	["ChargeButton", { x: 650, y: 600, w: 100, h: 100, colors: ["red", "yellow", "blue", "white"], color: "red", shape: "circle" }],
	["ChargeButton", { x: 800, y: 600, w: 100, h: 100, colors: ["red", "yellow", "blue", "white"], color: "yellow", shape: "circle" }],
	["ChargeButton", { x: 725, y: 720, w: 100, h: 100, colors: ["red", "yellow", "blue", "white"], color: "blue", shape: "circle" }],
	["Knob", { x: 660, y: 360, w: 180, h: 180, min: 1, max: 8, setting: 3, }],
	["Knob", { x: 820, y: 360, w: 180, h: 180, min: 1, max: 8, setting: 7, }],
	["Knob", { x: 980, y: 360, w: 180, h: 180, min: 1, max: 8, setting: 1, }],
	["Tiles", { x: 1200, y: 720, w: 320, h: 120, labels: "ENSW", }],
]

/*
		[
			[null, true], [null, true], [null, true], [null, true], [[]], [3],
			[0], [0], [0], [0], [0], [0], [0], [0], [0],
			[false], [false], [true], [false],
			[0], [0], [0],
			[3], [7], [1],
			[[0, 1, 2, 3]],
		],
*/

levels[5] = {
	t: 80,
	steps: [
		"Change each light changer that's pointing toward the floor so that it's pointing toward the ceiling.",
		"Change the turn thing on the right to the average of the other two.",  // average
		"Make a line between the two letters whose small forms are mirror images of each other.",
		"Hold each circle until its light is the same color as a fire truck.",
	],
	controls: controlset,
	winsequence: [
		[
			[null, true], [null, true], [null, true], [null, true], [[]], [3],
			[0], [0], [0], [0], [0], [0], [0], [0], [0],
			[true], [true], [true], [true],
			[0], [0], [0],
			[3], [7], [1],
			[[0, 1, 2, 3]],
		],
		[
			[null, true], [null, true], [null, true], [null, true], [[[1, 3]]], [3],
			[0], [0], [0], [0], [0], [0], [0], [0], [0],
			[true], [true], [true], [true],
			[0], [0], [0],
			[3], [7], [1],
			[[0, 1, 2, 3]],
		],
		[
			[null, true], [null, true], [null, true], [null, true], [[[1, 3]]], [3],
			[0], [0], [0], [0], [0], [0], [0], [0], [0],
			[true], [true], [true], [true],
			[[1,2]], [[1,2]], [[1,2]],
			[3], [7], [1],
			[[0, 1, 2, 3]],
		],
	],
	intro: [
		"Did you ever hear the story of how we came to use only the ten hundred most used words? It happened a long time ago.",
		"It started as a sort of game, to make yourself think in new and interesting ways.",
		"It seems like it would make it hard to explain things, but once you get used to it, it comes pretty easily, doesn't it?",
	],
	unlock: 6,
}

levels[6] = {
	t: 50,
	steps: [
		"Change exactly two of the light changers so that the numbers chosen add up to ten.",
		"Touch the two shapes that a horse-shaped piece in a well-known board game could reach from the red star.",
		"Change each of the three turn things to their current number taken away from eight.", // current
	],
	controls: controlset,
	winsequence: [
		[
			[null, true], [null, true], [null, true], [null, true], [[]], [3],
			[0], [0], [0], [0], [0], [0], [0], [0], [0],
			[false], [true], [false], [false],
			[0], [0], [0],
			[3], [7], [1],
			[[0, 1, 2, 3]],
		],
		[
			[null, true], [null, true], [null, true], [null, true], [[]], [3],
			[0], [1], [0], [0], [0], [1], [0], [0], [0],
			[false], [true], [false], [false],
			[0], [0], [0],
			[3], [7], [1],
			[[0, 1, 2, 3]],
		],
	],
	fakescrews: false,
	intro: [
		"Long story short, talking like this turned out to be a much better way of explaining things than anyone expected. And since you don't have all those big words filling up your brain, there's more room for the important things, like television. People are much happier now.",
		"Also it's a lot easier to write a game that understands what a person is saying if the person only has ten hundred words to choose from. So that's nice too!",
	],
	unlock: 7,
}

levels[7] = {
	t: 50,
	steps: [
		"Wind the gray spring all the way up to the right. Also, at the very end of these steps, bring it all the way back to its starting position.",
		"Make it so every light changer with both an even and an odd number is set to the even one.",  // odd
		"Make a bridge between the pair of letters that aren't part of the word BED.",
		"Touch the red and blue shapes whose number of points equal the number of letters in their colors.",  // equal
	],
	controls: controlset,
	winsequence: [
		[
			[null, true], [null, true], [null, true], [null, true], [[]], [[3.9, 4.1]],
			[0], [0], [0], [0], [0], [0], [0], [0], [0],
			[false], [false], [true], [false],
			[0], [0], [0],
			[3], [7], [1],
			[[0, 1, 2, 3]],
		],
		[
			[null, true], [null, true], [null, true], [null, true], [[[0, 2]]], [[3.9, 4.1]],
			[0], [0], [0], [0], [0], [0], [0], [0], [0],
			[false], [false], [true], [false],
			[0], [0], [0],
			[3], [7], [1],
			[[0, 1, 2, 3]],
		],
		[
			[null, true], [null, true], [null, true], [null, true], [[[0, 2]]], [[2.9, 3.1]],
			[0], [0], [0], [0], [0], [0], [0], [0], [0],
			[false], [false], [true], [false],
			[0], [0], [0],
			[3], [7], [1],
			[[0, 1, 2, 3]],
		],
	],
	fakescrews: false,
	intro: [
		"But, as you can see, we always have to watch out for these less often used words. They keep showing up here and there. It's just the way we humans are: we keep making more and more words no matter how much we don't need them. No matter how much trouble they cause.",
	],
	unlock: 8,
}


levels[8] = {
	t: 60,
	steps: [
		"Set all three turn things to their largest values, then set them to their lowest settings.",  // values
		"Make it so each light changer number is larger than the changer number immediately to its left.",
		"Remove three of the four tiny metal things that hold the plate in place. Leave the top left one.",
		"Touch the two three-sided shapes whose colors are next to orange on a colorful sky track after a storm.",  // orange
	],
	controls: controlset,
	winsequence: [
		[
			[null, true], [null, true], [null, true], [null, true], [[]], [3],
			[0], [0], [0], [0], [0], [0], [0], [0], [0],
			[false], [false], [true], [true],
			[0], [0], [0],
			[3], [7], [1],
			[[0, 1, 2, 3]],
		],
		[
			[null, true], [null, false], [null, false], [null, false], [[]], [3],
			[0], [0], [0], [0], [0], [0], [0], [0], [0],
			[false], [false], [true], [true],
			[0], [0], [0],
			[3], [7], [1],
			[[0, 1, 2, 3]],
		],
	],
	fakescrews: false,
	intro: [
		"So that's what we're building here, in case you were wondering. A computer that can remove these less often used words from the world, all by itself.",
		"Once the computer is finished, we won't have to worry about ever seeing those strange words ever again!",
	],
	unlock: 9,
}

levels[9] = {
	t: 100,
	steps: [
		"Make the letters say the word that means the latest happenings.", //  latest
		"Hold each of the circles until their lights match the colors of the circles themselves.",  // match
		"Find the five shapes that together form the letter that begins the wooden block thing you hit to make music. Touch them one time each.",
		"Consider the three turn things to be one number (in the hundreds), and make that number be twice as big.",
	],
	controls: controlset,
	winsequence: [
		[
			[null, true], [null, true], [null, true], [null, true], [[]], [3],
			[1], [0], [1], [0], [1], [0], [1], [0], [1],
			[false], [false], [true], [false],
			[0], [0], [0],
			[3], [7], [1],
			[[0, 1, 2, 3]],
		],
		[
			[null, true], [null, true], [null, true], [null, true], [[]], [3],
			[1], [0], [1], [0], [1], [0], [1], [0], [1],
			[false], [false], [true], [false],
			[0], [0], [0],
			[7], [4], [2],
			[[0, 1, 2, 3]],
		],
	],
	fakescrews: false,
	intro: [
		"Okay, this is the last set of steps. Once you finish here we can send the computer all over the world!",
	],
	outro: [
		"Good job!",
		"Thank you for playing!",
		"The end.",
	],
	unlock: "EXTRA",
}

levels.EXTRA = {
	t: 100,
	steps: [
		"Hold the third circle until its second light is on, and the first circle until its fourth light is on.",
		"Put the letters in order from last to first, then switch the last and first two.",
		"Wind up the spring until it's in the direction of the hour hand at nine.",
		"Join the letter that's the same when it flips left to right to any other letter.",
	],
	controls: controlset,
	winsequence: [
		[
			[null, true], [null, true], [null, true], [null, true], [[]], [3],
			[0], [0], [0], [0], [0], [0], [0], [0], [0],
			[false], [false], [true], [true],
			[0], [0], [0],
			[3], [7], [1],
			[[0, 1, 2, 3]],
		],
		[
			[null, true], [null, true], [null, true], [null, true], [[]], [3],
			[0], [0], [0], [0], [0], [0], [0], [0], [0],
			[false], [false], [true], [false],
			[0], [0], [0],
			[3], [7], [1],
			[[0, 1, 2, 3]],
		],
		[
			[null, true], [null, true], [null, true], [null, true], [[]], [3],
			[0], [0], [0], [0], [0], [0], [0], [0], [0],
			[false], [false], [true], [true],
			[0], [0], [0],
			[3], [7], [1],
			[[0, 1, 2, 3]],
		],
		[
			[null, true], [null, true], [null, true], [null, true], [[]], [3],
			[0], [0], [0], [0], [0], [0], [0], [0], [0],
			[false], [false], [true], [false],
			[0], [0], [0],
			[3], [7], [1],
			[[0, 1, 2, 3]],
		],
		[
			[null, true], [null, true], [null, true], [null, true], [[]], [3],
			[0], [0], [0], [0], [0], [0], [0], [0], [0],
			[false], [false], [true], [true],
			[0], [0], [0],
			[3], [7], [1],
			[[0, 1, 2, 3]],
		],
		[
			[null, true], [null, true], [null, true], [null, true], [[]], [3],
			[0], [0], [0], [0], [0], [0], [0], [0], [0],
			[false], [false], [true], [false],
			[0], [0], [0],
			[3], [7], [1],
			[[0, 1, 2, 3]],
		],
		[
			[null, true], [null, true], [null, true], [null, true], [[]], [3],
			[0], [0], [0], [0], [0], [0], [0], [0], [0],
			[false], [false], [true], [true],
			[0], [0], [0],
			[3], [7], [1],
			[[0, 1, 2, 3]],
		],
		[
			[null, true], [null, true], [null, true], [null, true], [[]], [3],
			[0], [0], [0], [0], [0], [0], [0], [0], [0],
			[false], [false], [true], [false],
			[0], [0], [0],
			[3], [7], [1],
			[[0, 1, 2, 3]],
		],
		[
			[null, true], [null, true], [null, true], [null, true], [[]], [3],
			[0], [0], [0], [0], [0], [0], [0], [0], [0],
			[false], [false], [true], [true],
			[0], [0], [0],
			[3], [7], [1],
			[[0, 1, 2, 3]],
		],
	],
	fakescrews: false,
	intro: [
		"You don't have to play this one, just so you know. You've already beaten the game. This one is just extra, for fun. But if you do try it, you should know that it doesn't work the same way as the others. Can you figure out what you're supposed to do? I hope you're lucky!",
	],
	outro: [
		"Oh no! What have you done? You've changed the computer... now it's set to ADD strange words everywhere! It was supposed to remove them!",
		"Oh well. The whole idea of talking like this was fun for a while, but I knew it would never last.",
		"One thing's for sure. We're about to have a lot more to say.",
		"True ending.",
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


"use strict"

let levels = {}

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
}

levels[0] = {
	t: 999,
	steps: [
		"Push the sliding thing up to the top.",
		"Depress the two round things with colors that add to make purple.",
		"Touch the yellow thing that is where a horse from a well known board game can move to if it is on the round green thing.",
		"Press the thing on the left side of the blue stellar object.",
		"See the thing with the outside part that moves but the middle part does not move?  Turn it in the way that hands go on a time telling thing.  Turn it half of the way around.",
	],
	controls: [
		["Button", { x: 1000, y: 200, w: 100, h: 100, color: "red", shape: "square" }],
		["Button", { x: 1000, y: 300, w: 100, h: 100, color: "red", shape: "circle" }],
		["Button", { x: 1000, y: 400, w: 100, h: 100, color: "red", shape: "star" }],
		["Button", { x: 1100, y: 200, w: 100, h: 100, color: "orange", shape: "square" }],
		["Button", { x: 1100, y: 300, w: 100, h: 100, color: "orange", shape: "circle" }],
		["Button", { x: 1100, y: 400, w: 100, h: 100, color: "orange", shape: "star" }],
		["Button", { x: 1200, y: 200, w: 100, h: 100, color: "blue", shape: "square" }],
		["Button", { x: 1200, y: 300, w: 100, h: 100, color: "blue", shape: "circle" }],
		["Button", { x: 1200, y: 400, w: 100, h: 100, color: "blue", shape: "star" }],
		["VSlider", { x: 700, y: 200, w: 250, h: 500, min: 0, max: 5, setting: 3 }],
		["Coil", { x: 500, y: 200, w: 400, h: 400, min: 2, max: 4, setting: 3 }],
		["Screw", { x: 500, y: 200, w: 50, h: 50, min: 0, max: 4 }],
		["Screw", { x: 500, y: 550, w: 50, h: 50, min: 0, max: 4 }],
		["Screw", { x: 850, y: 200, w: 50, h: 50, min: 0, max: 4 }],
		["Screw", { x: 850, y: 550, w: 50, h: 50, min: 0, max: 4 }],
		["Screw", { x: 850, y: 550, w: 50, h: 50, min: 0, max: 4 }],
		["Contact", { x: 1200, y: 500, w: 300, h: 300, labels: "ABCDE", }],
		["ChargeButton", { x: 500, y: 700, w: 100, h: 100, colors: ["red", "orange", "yellow", "white"], color: "blue", shape: "circle" }],
		["Switch", { x: 1400, y: 200, w: 100, h: 200, labels: "AB", }],
		["Tiles", { x: 700, y: 700, w: 400, h: 100, labels: "ABCDE", }],
	],
}


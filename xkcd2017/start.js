"use strict"
let tau = 2 * Math.PI
function clamp(x, a, b) { return x < a ? a : x > b ? b : x }
let DEBUG = window.location.href.includes("DEBUG")
if (DEBUG) {
	window.onerror = function (error, url, line) { document.body.innerHTML = "<p>Error in: "+url+"<p>line "+line+"<pre>"+error+"</pre>" }
}
let canvas = document.getElementById("canvas")
let sx0 = canvas.width = 1600
let sy0 = canvas.height = 900
let context = canvas.getContext("2d")
UFX.draw.setcontext(context)
UFX.scene.init({ minups: 5, maxups: 120 })
let sx, sy
UFX.maximize.onadjust = function () {
	sx = canvas.width
	sy = canvas.height
}
let Z = a => a * sx / sx0
UFX.maximize.fill(canvas, "aspect")
let acontext = new AudioContext()
if (DEBUG) {
	progress.unlockall()
	UFX.key.init()
	UFX.key.watchlist = "backspace esc 0 1 2 3 4 5 6".split(" ")
}
UFX.pointer(canvas)

UFX.scenes.load = {
	start: function () {
		this.f = 0
		this.loaded = false
	},
	think: function (dt) {
		let pstate = UFX.pointer()
		if (this.loaded && pstate.down) {
			UFX.scene.swap("play")
			playsound("begin")
			playmusic("lift")

		}
	},
	draw: function () {
		UFX.draw("fs", UFX.draw.lingrad(0, 0, sx, sy, 0, "#228", 1, "#006"), "fr", 0, 0, sx, sy)
		UFX.draw("[ z", sx / sx0, sy / sy0, "tab center middle")
		context.lineJoin = "round"
		context.lineCap = "round"
		UFX.draw("[ t 800 150 font 150px~'Mouse~Memoirs'",
			"fs", UFX.draw.lingrad(0, -40, 0, 40, 0, "#aac", 1, "#77a"),
			"sh black", Z(10), Z(10), 0,
			"ft0 Simple~Machines ]")
		UFX.draw("[ t 400 350 font 80px~'Passion~One'",
			"fs", UFX.draw.lingrad(0, -30, 0, 30, 0, "#cca", 1, "#a77"),
			"sh black", Z(7), Z(7), 0,
			"ft0 by~team",
			"t 0 100 ft0 Universe~Factory",
			"]")
		UFX.draw("[ t 1200 350 font 80px~'Passion~One'",
			"fs", UFX.draw.lingrad(0, -30, 0, 30, 0, "#cca", 1, "#a77"),
			"sh black", Z(7), Z(7), 0,
			"ft0 for~the",
			"t 0 100 ft0 xkcd~game~jam",
			"]")
		UFX.draw("[ t 400 450 ss blue lw 10",
			"b m -220 70 l -100 -50 l -120 40 l 80 -45 l 30 40 l 200 -60 l 140 30",
			"sh black", Z(2), Z(2), 0, "s",
			"]")
		UFX.draw("[ t 1200 450 ss blue lw 10 hflip vflip",
			"b m -220 70 l -100 -50 l -120 40 l 80 -45 l 30 40 l 200 -60 l 140 30",
			"sh black", Z(2), Z(2), 0, "s",
			"]")
		UFX.draw("[ t 400 550 font bold~60px~'Architects~Daughter' r -0.2",
			"fs", UFX.draw.lingrad(0, -20, 0, 20, 0, "#55f", 1, "#33c"),
			"sh black", Z(5), Z(5), 0,
			"ft0 Everything",
			"t 0 70 ft0 Making~Place",
			"]")
		UFX.draw("[ t 1200 550 font bold~60px~'Architects~Daughter' r 0.1",
			"fs", UFX.draw.lingrad(0, -20, 0, 20, 0, "#55f", 1, "#33c"),
			"sh black", Z(5), Z(5), 0,
			"ft0 game~making~event",
			"t 0 70 ft0 that~gets~ideas~from",
			"t 0 70 ft0 well-known~stick~person",
			"t 0 70 ft0 word~&~art~page",
			"]")

		let t = this.f == 1 ? "Ready~to~start" : "Getting~the~game...~" + (this.f * 100).toFixed(0) + "%"
		UFX.draw("[ t 800 800 font 80px~'Mouse~Memoirs'",
			"fs", UFX.draw.lingrad(0, -20, 0, 20, 0, "#aac", 1, "#77a"),
			"sh black", Z(5), Z(5), 0,
			"ft0", t, "]")

		UFX.draw("[ t 180 860 font 30px~'Mouse~Memoirs'",
			"fs", UFX.draw.lingrad(0, -10, 0, 10, 0, "#aac", 1, "#77a"),
			"sh black", Z(2), Z(2), 0,
			"ft0", "Music:~The~Lift,~Kevin~MacLeod~(CC-BY)", "]")
		UFX.draw("]")
	},
}
UFX.scene.push("load")
UFX.resource.onloading = function (f) {
	UFX.scenes.load.f = f
}
UFX.resource.onload = function () {
	UFX.scenes.load.loaded = true
	words.makelist(UFX.resource.data.wordlist)
}
function playsound(aname) {
	if (!UFX.resource.data[aname]) {
		console.log("missing sound", aname)
		return
	}
	let source = acontext.createBufferSource()
	source.buffer = UFX.resource.data[aname]
	source.connect(acontext.destination)
	source.start(0)
}
function playmusic(aname) {
	let source = acontext.createBufferSource()
	source.buffer = UFX.resource.data[aname]
	source.loop = true
	source.connect(acontext.destination)
	source.start(0)
}
UFX.resource.loadwebfonts("Architects Daughter", "Passion One", "Mouse Memoirs")
UFX.resource.load({
	wordlist: "1000.dicin.txt",
})

let afiles = {}
;["badword", "begin", "charge1", "charge2", "charge3", "charge4", "fail", "goodword", "grab",
	"grabword", "release", "righttrack", "saynext", "tick", "unscrew", "win", "lift"].forEach(aname => {
	afiles[aname] = "sound/" + aname + ".ogg"
})
UFX.resource.loadaudiobuffer(acontext, afiles)


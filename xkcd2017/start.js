"use strict"
let tau = 2 * Math.PI
function clamp(x, a, b) { return x < a ? a : x > b ? b : x }
if (window.location.href.includes("DEBUG")) {
	window.onerror = function (error, url, line) { document.body.innerHTML = "<p>Error in: "+url+"<p>line "+line+"<pre>"+error+"</pre>" }
}
// if (!localStorage.xkcd2017save) localStorage.xkcd2017save = 1
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
// UFX.key.init()
// UFX.key.watchlist = "backspace esc 0 1 2 3 4 5 6".split(" ")
UFX.pointer(canvas)

UFX.scenes.load = {
	start: function () {
		this.f = 0
		this.loaded = false
	},
	think: function (dt) {
		let pstate = UFX.pointer()
		if (this.loaded && pstate.down) UFX.scene.swap("play")
	},
	draw: function () {
		UFX.draw("fs", UFX.draw.lingrad(0, 0, sx, sy, 0, "#228", 1, "#006"), "fr", 0, 0, sx, sy)
		UFX.draw("[ z", sx / sx0, sy / sy0, "tab center middle")
		context.lineJoin = "round"
		context.lineCap = "round"
		UFX.draw("[ t 800 150 font 150px~'Passion~One'",
			"fs", UFX.draw.lingrad(0, -40, 0, 40, 0, "#aac", 1, "#77a"),
			"sh black", Z(10), Z(10), 0,
			"ft0 Cut~the~Red~Power~Stick ]")
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
		UFX.draw("[ t 1200 450 ss blue lw 10",
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
UFX.resource.loadwebfonts("Architects Daughter", "Passion One")
UFX.resource.load({
	wordlist: "1000.dicin.txt",
})


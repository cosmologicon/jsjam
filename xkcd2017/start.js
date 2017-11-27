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
context.miterLimit = 2.5
context.lineCap = "round"
UFX.scene.init({ minups: 5, maxups: 120 })

let sx, sy
canvas.requestFullscreen = canvas.requestFullscreen
	|| canvas.mozRequestFullScreen
	|| canvas.webkitRequestFullScreen
document.exitFullscreen = document.exitFullscreen
	|| document.webkitExitFullscreen
	|| document.mozCancelFullScreen
	|| document.msExitFullscreen
window.addEventListener("mozfullscreenchange", UFX.maximize.onfullscreenchange)
window.addEventListener("webkitfullscreenchange", UFX.maximize.onfullscreenchange)
UFX.maximize.getfullscreenelement = (() => document.fullscreenElement
	|| document.mozFullScreenElement
	|| document.webkitFullscreenElement
	|| document.msFullscreenElement)
UFX.maximize.onadjust = function () {
	sx = canvas.width
	sy = canvas.height
}
let Z = a => a * sx / sx0
UFX.maximize.fill(canvas, "aspect")
function draw(obj) {
	context.save()
	obj.draw()
	context.restore()
}


let acontext = new AudioContext()
if (DEBUG) {
	savestate.unlockall()
	UFX.key.init()
	UFX.key.watchlist = "backspace esc 0 1 2 3 4 5 6".split(" ")
}
UFX.pointer(canvas)
UFX.audio.init()
words.makelist()
UFX.scene.push("load")
UFX.resource.onloading = function (f) {
	UFX.scenes.load.f = f
}
UFX.resource.onload = function () {
	UFX.scenes.load.loaded = true
	UFX.audio.makegainnode({ name: "music" })
	UFX.audio.makegainnode({ name: "sound" })
}
function playsound(aname) {
	try {
		UFX.audio.playbuffer(aname, { output: "sound", })
	} catch (e) {
		console.error("missing sound", aname)
		return
	}
}
function playmusic(aname) {
	UFX.audio.playbuffer(aname, { output: "music", loop: true, })
}
UFX.resource.loadwebfonts("Architects Daughter", "Passion One", "Mouse Memoirs", "VT323")

let afiles = {}
;["badword", "begin", "charge1", "charge2", "charge3", "charge4", "fail", "goodword", "grab",
	"grabword", "release", "righttrack", "saynext", "tick", "unscrew", "win", "lift"].forEach(aname => {
	afiles[aname] = "sound/" + aname + ".ogg"
})
UFX.audio.loadbuffers(afiles)


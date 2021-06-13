
function getoutline(w, h, nspecs, color, glow) {
	let tokens = ["[", "(", "m", 0, 0]
	;[w, h, w, h].forEach((d, j) => {
		let ns = nspecs.filter(nspec => nspec.e == j).sort((n0, n1) => n0.d - n1.d)
		ns.forEach(n => {
			tokens.push("t", n.d, 0)
			if (n.t == "r") {
				let a = 3, b = 4
				tokens.push("l", -2, 0, "c", 0, 0, -b, a, 0, a, "c", b, a, 0, 0, 2, 0)
			} else if (n.t == "R") {
				let a = -3, b = 4
				tokens.push("l", -2, 0, "c", 0, 0, -b, a, 0, a, "c", b, a, 0, 0, 2, 0)
			}
			tokens.push("t", -n.d, 0)
		})
		tokens.push("t", d, 0, "l", 0, 0, "r", tau/4)
	})
	tokens.push(")", "fs", color, "f")
//	if (glow) tokens.push("[ fs white alpha", glow, "f ]")
	tokens.push("lw", 0.3, "ss", (glow ? "#333333" : "black"), "s", "]")
	return tokens
}


let bcolor0 = "#333355"
let background = null
function fillbackground0() {
	background = document.createElement("canvas")
	background.width = 1600
	background.height = 900
	let con = background.getContext("2d")
	let color0 = "#224444"
	UFX.draw(con, "fs", bcolor0, "f0")
	for (let j = 0 ; j < 1000 ; ++j) {
		let s = 2.1 * Math.exp(3 * j / 1000), a = UFX.random.angle()
		let R = UFX.random(30, 40) * s
		let x = 800 + R * Math.cos(a), y = R * Math.sin(a)
		let w = 10, h = 10, r = UFX.random.angle()
		let nspecs = [0, 1, 2, 3].map(j => ({e: j, d: 5, t: UFX.random.choice("rR")}))
		let color = UFX.random.color()
		UFX.draw(con, "[ t", x, y, "z", s, s, "r", r, "t", -w/2, -h/2,
			getoutline(w, h, nspecs, color), "]")
		if (j % 100 == 0) UFX.draw(con, "[ fs", bcolor0, "alpha", 0.2, "f0 ]")
	}
	UFX.draw(con, "[ fs", bcolor0, "alpha", 0.8, "f0 ]")
}
function drawbackground0() {
	if (!background) fillbackground0()
	UFX.draw("drawimage0", background)
}


let blayers = []
let bjfs = [-3, -2, -1, 0, 1, 2, 3, 4, 5, 6]
function fillbackground() {
	let scale0 = 2, f = 1.5
	let jf = bjfs[blayers.length]
	let s0 = scale0 * f ** jf
	let c = document.createElement("canvas")
	let B = Math.round(60 * s0)
	c.width = 2 * B
	c.height = 2 * B
	let con = c.getContext("2d")
	for (let j = 0 ; j < 200 ; ++j) {
		let s = s0 * f ** (j/200), a = UFX.random.angle()
		let R = UFX.random(30, 40) * s
		let x = B + R * Math.cos(a), y = B + R * Math.sin(a)
		let w = 10, h = 10, r = UFX.random.angle()
		let nspecs = [0, 1, 2, 3].map(j => ({e: j, d: 5, t: UFX.random.choice("rR")}))
		let color = UFX.random.color()
		UFX.draw(con, "[ t", x, y, "z", s, s, "r", r, "t", -w/2, -h/2,
			getoutline(w, h, nspecs, color), "]")
	}
	let alpha = blayers.length == bjfs.length - 1 ? 0.9 : 0.2
	UFX.draw(con, "[ fs", bcolor0, "alpha", alpha, "f0 ]")
	blayers.push(c)
}
function drawbackground() {
	while (blayers.length < bjfs.length) fillbackground()
	UFX.draw("fs", bcolor0, "fr 0 0 1600 900 [ t 800 50")
	blayers.forEach((blayer, j) => {
		let r = Math.sin(Date.now() * 0.001 * (0.1 / (1 + j) ** 2) * tau)
		UFX.draw("[ r", r, "drawimage", blayer, -blayer.width / 2, -blayer.height / 2, "]")
	})
	UFX.draw("]")
}
function killtime() {
	if (blayers.length < bjfs.length) fillbackground()
}


function drawshutter(a) {
	a = clamp(a, 0, 1)
	let d = clamp(80 * Math.abs(a - 0.5) - 20, 0, 20)
	let b = clamp(2 * (a - 0.25), 0, 1) * tau/2
	let nspecs = [
		{ e: 0, d: 10, t: "R" },
		{ e: 0, d: 20, t: "r" },
	]
	UFX.draw("[ t 800 450 z 80 80 r", b)
	UFX.draw("[ t -15", d, getoutline(30, 20, nspecs, "#ffaa99"), "]")
	UFX.draw("[ r", tau/2, "t -15", d, getoutline(30, 20, nspecs, "#aabbff"), "]")
	UFX.draw("]")
	
}

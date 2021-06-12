
function getoutline(w, h, nspecs, color) {
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
	tokens.push(")", "fs", color, "f", "lw", 0.3, "ss", "black", "s", "]")
	return tokens
}


let background = null
function fillbackground() {
	background = document.createElement("canvas")
	background.width = 1600
	background.height = 900
	let con = background.getContext("2d")
	let color0 = "#224444"
	UFX.draw(con, "fs", color0, "f0")
	for (let j = 0 ; j < 1000 ; ++j) {
		let s = 2.1 * Math.exp(3 * j / 1000), a = UFX.random.angle()
		let R = UFX.random(30, 40) * s
		let x = 800 + R * Math.cos(a), y = 450 + R * Math.sin(a) - 600 * (1 - j/1000)
		let w = 10, h = 10, r = UFX.random.angle()
		let nspecs = [0, 1, 2, 3].map(j => ({e: j, d: 5, t: UFX.random.choice("rR")}))
		let color = UFX.random.color()
		UFX.draw(con, "[ t", x, y, "z", s, s, "r", r, "t", -w/2, -h/2,
			getoutline(w, h, nspecs, color), "]")
		if (j % 100 == 0) UFX.draw(con, "[ fs", color0, "alpha", 0.1, "f0 ]")
	}
	UFX.draw(con, "[ fs", color0, "alpha", 0.9, "f0 ]")
}
function drawbackground() {
	if (!background) fillbackground()
	UFX.draw("drawimage0", background)
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

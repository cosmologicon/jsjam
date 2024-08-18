
function drawjoiner(pos0, pos1, rmax) {
	let P0 = postimes(pos0, 100), P1 = postimes(pos1, 100)
	let [dx, dy] = possub(P1, P0), d = Math.hypot(dx, dy)
	if (!d) return
	UFX.draw("[ t", P0, "r", Math.atan2(dx, -dy))
	let w = mix(25, 5, (d - 1) / (100 * rmax - 80)), w0 = 10
	let xs = [w0]
	while (xs.length < rmax) xs.push(w)
	xs.push(w0)
	xs = xs.map((x, j) => x * (j % 2 ? 1 : -1))
	let ps = xs.map((x, j) => [x, d * j / (xs.length - 1)])
	let [x0, y0] = ps[0]
	y0 -= 3
	ps.unshift([x0, y0])
	let [xf, yf] = ps[ps.length - 1]
	ps.push([xf, yf + 3])
	UFX.draw("b m", x0, y0, ps.map(p => ["l", p]),
		"m", -x0, y0, ps.map(([x, y]) => ["l", -x, y]))
	context.miterLimit = 1
	UFX.draw("lw 9 ss #333 s lw 7 ss #555 s lw 5 ss #777 s lw 3 ss #888 s ]")
}

function backward(dir) {
	return { u: "d", l: "r", d: "u", r: "l" }[dir]
}

function drawarrow(pos, from, lit) {
	
	UFX.draw("[ t", pos, "r", angleto(from, pos),
		"( m 0 0 l -0.3 -0.2 l -0.15 -0.2 l -0.15 -0.6 l 0.15 -0.6 l 0.15 -0.2 l 0.3 -0.2 )")
	if (lit) {
		UFX.draw("fs #f44 ss white lw 0.03 s f")
	} else {
		let grad = UFX.draw.lingrad(0, 0, 0, -0.6, 0, "rgba(255,0,0,0.5)", 1, "rgba(255,0,0,0)")
		UFX.draw("fs", grad, "f")
	}
	UFX.draw("]")
}

function drawhead(tanim, lit) {
	let grad = UFX.draw.lingrad(-10, 0, 20, 0, 0, "#666", 0.2, "#999", 1, "#666")

	let coms = [[0, ["fs", grad, "ss #333 lw 3 tr -10 0 20 50 s f"]]]
	grad = UFX.draw.radgrad(-4, 4, 0, 0, 0, 12, 0, "#999", 1, "#555")
	let f = tanim * 0.3 % 1
	for (let j = 0 ; j < 5 ; ++j) {
		let A = (f + j / 5) * tau
		let com = ["[ t", 30 * Math.sin(A), 35, "fs", grad, "ss #333 lw 2 b o 0 0 12 s f ]"]
		coms.push([Math.cos(A), com])
	}
	coms.sort((c0, c1) => c1[0] - c0[0])
	coms.forEach(([z, com]) => UFX.draw(com))



	grad = UFX.draw.lingrad(-40, 0, 40, 0, 0, "#666", 0.2, "#999", 1, "#666")
	UFX.draw("lw 3 ss #333 fs", grad, "rr -40 -40 80 60 3 s f")

	if (true) {
		let t = tanim * 0.7
		let h1 = 5 + Math.sin(t * 1.234) + Math.sin(t * 1.456)
		let h2 = 5 + Math.sin(t * 1.345) + Math.sin(t * 1.567)
		let ps = [[2, -52, 12 * h1], [3, -52, 9 * h1], [5, -52, 6 * h1],
			[2, 52, 12 * h2], [3, 52, 9 * h2], [5, 52, 6 * h2]]
		for (let [w, x, y] of ps) {
			grad = UFX.draw.lingrad(-w, 0, w, 0, 0, "#333", 0.3, "#999", 1, "#333")
			UFX.draw("[ t", x, 0, "fs", grad, "fr", -w, -20, 2 * w, (y + 20), "]")
		}
	}
	if (false) {
		UFX.draw("b",
			"m -50 0 q -40 20 -60 40",
			"m -10 0 q -10 10 20 40 q -10 60 -40 40",
			"ss #333 lw 7 s",
			"ss #666 lw 5 s",
			"ss #888 lw 3 s")
	}

	grad = UFX.draw.lingrad(-70, 0, 70, 0, 0, "#666", 0.2, "#999", 1, "#666")
	UFX.draw("fs", grad, "rr -70 -30 140 40 3 s f")
	let eyecolor0 = lit ? "#fd6" : "#642"
	let eyecolor1 = lit ? "#a94" : "#321"
	grad = UFX.draw.radgrad(-8, 8, 0, 0, 0, 15, 0, eyecolor0, 1, eyecolor1)
	UFX.draw("fs", grad, "[ t -40 -10 b o 0 0 15 f ] [ t 40 -10 b o 0 0 15 f ]")
	UFX.draw("fs #333 rr -20 -26 40 20 3 f")
	for (let j = 0 ; j < 5 ; ++j) {
		let f = (Math.sin(-tanim / 2 * tau + 0.4 * j) + 1) / 2
		let b = Math.floor(mix(40, 120, f))
		let color = `rgb(20,20,${b})`
		UFX.draw("fs", color, "fr", -17 + 7 * j, -23.5, 6, 15)
	}

}


let DisplayPos = {
	setup: function () {
		this.dpos = this.pos
		this.ndpos = 0
	},
	think: function (dt) {
		if (!poseq(this.dpos, this.pos)) {
			let f = 10 / (0.25 * this.ndpos + 1)
			f = 7
			this.dpos = posapproach(this.dpos, this.pos, f * dt)
		}
	},
	frontpos: function (dir) {
		let [x, y] = this.dpos
		let A = { u: 0, r: 1, d: 2, l: 3 }[dir] * tau / 4
		return [x + this.rjoin * Math.sin(A), y + this.rjoin * Math.cos(A)]
	},
	backpos: function (dir) {
		return this.frontpos(backward(dir))
	},
}

let TreeNode = {
	setup: function () {
		this.updatepos(0)
	},
	setparent: function (parent) {
		if (typeof parent == "string") parent = root.byspec(parent)
		if (this.parent) this.parent.removechild(this)
		this.parent = parent
		if (this.parent) this.parent.addchild(this)
	},
	updatepos: function (n) {
		let [x, y] = this.parent.pos
		let [dx, dy] = this.relpos()
		this.pos = [x + dx, y + dy]
		this.ndpos = n
	},
	spots: function () {
		let [x, y] = this.parent.pos
		return this.relspots().map(([dx, dy]) => [x + dx, y + dy])
	},
	drawback0: function () {
		let pos0 = this.parent.frontpos(this.dir)
		let pos1 = this.backpos(this.dir)
		drawjoiner(pos0, pos1, this.rmax)
	},
}

// Non-leaf nodes only
let NonLeaf = {
	setup: function () {
		this.children = []
		this.childdirs = {}
	},
	addchild: function (child) {
		this.children.push(child)
		this.childdirs[child.dir] = child
	},
	removechild: function (child) {
		this.children = this.children.filter(c => c !== child)
		if (this.childdirs[child.dir] === this) delete this.childdirs[child.dir]
	},
	byspec: function (spec) {
		if (spec == "") return this
		let child = this.childdirs[spec[0]]
		if (!child) return null
		return child.byspec(spec.slice(1))
	},
	allnodes: function () {
		let ret = [this]
		this.children.forEach(child => ret.push(...child.allnodes()))
		return ret
	},
	nodeat: function (pos) {
		if (poseq(this.pos, pos)) return this
		for (let child of this.children) {
			let childat = child.nodeat(pos)
			if (childat !== null) return childat
		}
		return null
	},
	updatepos: function (n) {
		this.children.forEach(child => child.updatepos((n || 0) + 1))
	},
	atarget0: function () {},
	atargets: function () {
		let target = this.atarget0()
		let ret = target ? [target] : []
		this.children.forEach(child => ret.push(...child.atargets()))
		return ret
	},
	drawback0: function () {},
	draw0: function () {},
	drawback: function () {
		this.drawback0()
		this.children.forEach(child => child.drawback())
	},
	draw: function () {
		this.draw0()
		this.children.forEach(child => child.draw())
	},
}

// Leaf nodes only
let Leaf = {
	nodeat: function (pos) {
		return poseq(this.pos, pos) ? this : null
	},
	byspec: function (spec) {
		return spec === "" ? this : null
	},
	allnodes: function () {
		return [this]
	},
	atarget0: function () {},
	atargets: function () {
		let target = this.atarget0()
		return target ? [target] : []
	},
	drawback0: function () {},
	draw0: function () {},
	drawback: function () { this.drawback0() },
	draw: function () { this.draw0() },
}


let NonExtendable = {
	canextend: function () {
		return false
	},
}

let Extendable = {
	canextend: function () {
		return true
	},
	extendcost: function () {
		return costs[this.rmax]
	},
	extend: function () {
		this.rmax += 1
	},
	setdir: function (dir, rmax) {
		this.dir = dir
		;[this.dx, this.dy] = this.d = {
			u: [0, 1],
			d: [0, -1],
			l: [-1, 0],
			r: [1, 0],
		}[dir]
		this.r = 1
		this.rmax = rmax
	},
	relpos: function () {
		return [this.dx * this.r, this.dy * this.r]
	},
	relspots: function () {
		let x = 0, y = 0, spots = []
		for (let r = 1 ; r <= this.rmax ; ++r) {
			x += this.dx
			y += this.dy
			spots.push([x, y])
		}
		return spots
	},
	moveto: function (spot0) {
		this.spots().forEach((spot, j) => {
			if (poseq(spot0, spot)) {
				this.r = j + 1
				this.updatepos(0)
			}
		})
	},
}

function Root() {
	this.pos = [0, 0]
	this.xfrom = 0
	this.rjoin = 0.5
	this.Atilt = 0
	this.setup()
}
Root.prototype = UFX.Thing()
	.addcomp(DisplayPos)
	.addcomp(NonLeaf)
	.addcomp(NonExtendable)
	.addcomp({
		spots: function () {
			let ret = []
			for (let x = -view.n ; x <= view.n ; ++x) ret.push([x, 0])
			return ret
		},
		moveto: function (spot) {
			robot.rollto(spot[0])
		},
		think: function (dt) {
			let x = this.dpos[0]
			if (x != this.pos[0]) {
				let f = (x - this.xfrom) / (this.pos[0] - this.xfrom)
				this.Atilt = 0.3 * f * (1 - f) * Math.sqrt(Math.abs(this.pos[0] - this.xfrom))
				if (this.xfrom < this.pos[0]) this.Atilt *= -1
			}
		},
		drawtilt: function () {
			UFX.draw("t", postimes(this.dpos, 100),
				"r", this.Atilt, "t", postimes(this.dpos, -100))
		},
		updatepos: function () {
			if (this.pos[0] == robot.x) return
			this.xfrom = this.pos[0]
			this.pos = [robot.x, 0]
			this.children.forEach(child => child.updatepos(1))
		},
	})

function Head(parent) {
	this.dir = "u"
	this.tanim = 0
	this.rmax = 1
	this.setparent(parent)
	this.rjoin = 0.4
	this.tshower = 0
	this.lshower = null
	this.setup()
}
Head.prototype = UFX.Thing()
	.addcomp(TreeNode)
	.addcomp(DisplayPos)
	.addcomp(Leaf)
	.addcomp(NonExtendable)
	.addcomp({
		relpos: function () {
			return [0, 1]
		},
		shower: function (lshower) {
			this.tshower = 0
			this.lshower = lshower
		},
		think: function (dt) {
			this.tanim += control.pointed === this && robot.toactivate().length ? 3 * dt : dt
			this.tshower += dt
			if (this.tshower >= 1) this.lshower = null
		},
		draw0: function () {
			UFX.draw("[ t", postimes(this.dpos, 100))
			let lit = this === control.pointed && robot.toactivate().length
			drawhead(this.tanim, lit)
			if (this.lshower !== null) {
				UFX.draw("[ alpha", clamp(1 - this.tshower, 0, 1))
				UFX.random.pushseed(1234)
				let ndrop = 20 * this.lshower
				for (let j = 0 ; j < ndrop ; ++j) {
					let gb = UFX.random.choice("9bdf"), color = `#f${gb}${gb}`
					let x0 = UFX.random(-60, 60)
					let y0 = UFX.random(-40, 40)
					let vy = UFX.random(20, 80)
					let vx = UFX.random(0, 40), ax = UFX.random(-100, 0)
					if (UFX.random.flip()) [ax, vx] = [-ax, -vx]
					let x = x0 + vx * this.tshower + ax * this.tshower ** 2
					let y = y0 + vy * this.tshower
					UFX.draw("b o", x, y, 3, "fs", color, "f")
				}
				UFX.random.popseed()
				UFX.draw("]")
			}

			UFX.draw("]")
		},
	})


let stations = { 0: "numtools", 2: "fps", 5: "thanks", 4: "smiley" }

function Block(parent, dir, rmax) {
	this.children = []
	this.jtv = robot.numtvs
	robot.numtvs += 1
	this.setdir(dir, rmax)
	this.setparent(parent)
	this.rjoin = 0.3
	this.tvt0 = UFX.random()
	this.setup()
}
Block.prototype = UFX.Thing()
	.addcomp(TreeNode)
	.addcomp(DisplayPos)
	.addcomp(NonLeaf)
	.addcomp(Extendable)
	.addcomp({
		draw0: function () {
			let color = this === control.pointed ? "#fff" : "#666"
			let grad = UFX.draw.radgrad(-25, 25, 0, -10, 10, 50, 0, "#666", 1, "#888")
			UFX.draw("[ t", postimes(this.dpos, 100))
			UFX.draw("ss #333 lw 2 fs", grad, "rr -30 -30 60 60 4 f s")
			grad = UFX.draw.radgrad(-20, 20, 0, -10, 10, 50, 0, "#333", 1, "#111")
			UFX.draw("ss black lw 3 fs", grad, "b rr -24 -24 48 48 8 f s clip")
			let station = stations[this.jtv]
			if (!station) {
				let xs = [-18]
				while (xs[xs.length - 1] < 18) xs.push(xs[xs.length - 1] + 3)
				let ps = xs.map(x => [x, (x - 18) * (x + 18) * 0.05 * UFX.random(-1, 1)])
				UFX.draw("b m -20 0", ps.map(p => ["l", p]), "l", 20, 0, "lw 1.5 ss #7f7 s")
			} else {
				let text
				if (station == "fps") text = `${UFX.ticker.wups.toFixed(0)}fps`
				if (station == "numtools") text = `${robot.toactivate().length}/${robot.numtools}`
				if (station == "smiley") {
					let t = Date.now() * 0.001 / 6 % 1
					text = t < 0.2 ? ";)" : ":)"
				}
				if (station == "thanks") {
					let t = Date.now() * 0.001 / 3 % 1 * 12
					text = ["THE", "END", "THANK", "YOU", "FOR", "PLAY", "ING"][Math.floor(t)] || ""
				}
				if (text != "") {
					UFX.draw("[ fs #383 tab center middle z 1 -1")
					let d = Date.now() * 0.0001 % 1
					if (d < 0.06 && (d < 0.04 || d > 0.05)) UFX.draw("z 1 1.5 xshear -0.2")
					let fontsize = Math.floor(60 / text.length)
					context.font = `bold ${fontsize}px 'Roboto Mono'`
					UFX.draw("ft0", text, "]")
				}
				let y = (1 - ((Date.now() * 0.0005 + this.tvt0) % 1)) * 100 - 50
				UFX.draw("b m", -50, y, "l", 50, y + 10, "lw 1 ss #383 s")
			}
			UFX.draw("]")
		},
	})


function Tool(parent, dir, rmax) {
	this.setdir(dir, rmax)
	this.setparent(parent)
	this.rjoin = 0.33
	this.setup()
	robot.numtools += 1
}
Tool.prototype = UFX.Thing()
	.addcomp(TreeNode)
	.addcomp(DisplayPos)
	.addcomp(Leaf)
	.addcomp(Extendable)
	.addcomp({
		atarget0: function () {
			return this
		},
		draw0: function () {
			UFX.draw("[ t", postimes(this.dpos, 100))
			UFX.draw("r", { u: 0, l: 1, d: 2, r: 3}[this.dir] * tau / 4)
			let lit = posincludes(grid.tasks, this.pos)
			for (let j = 0 ; j < 5 ; ++j) {
				let color = lit ? "#fff" : `#44${UFX.random.choice("abcdef")}`
				let lw = UFX.random(4, 8)
				UFX.draw("[ alpha 0.03 ss", color, "lw", lw,
					"b m -10 25 l 10 -25 s ]")
			}
			UFX.draw("[ ( m -16 -30 l -30 -20 l -28 20 l -5 30",
				"l -15 18 l -14 -16 l 30 -20 l 16 -30 ) lw 3 ss black s",
				"clip fs gray f",
				"b o -20 17 3 fs #333 f",
				"b o -20 -17 3 fs #333 f",
				"b m 0 0 l -40 10 m 0 -10 l -40 0 lw 5 ss #aa6 s ]")
			let r0 = lit ? 30 : 15
			for (let j = 0 ; j < 6 ; ++j) {
				let color = lit ? "#fff" : `#44${UFX.random.choice("abcdef")}`
				let r = r0 * 0.8 ** j, alpha = 0.1 + 0.05 * j
				UFX.draw("[ z", r, r, "alpha", alpha,
					"t", UFX.random(-0.1, 0.1), UFX.random(-0.1, 0.1),
					"z", UFX.random(0.8, 1.2), UFX.random(0.8, 1.2),
					"xshear", UFX.random(-0.4, 0.4),
					"b o 0 0 1 fs", color, "f ]")
			}
//			UFX.draw("fs gray fr -25 -35 50 10")
			UFX.draw("]")
		},
	})



let robot = {
	x: 0,
	numtools: 0,
	numtvs: 0,
	blocks: [],
	blockat: function (pos) {
		return root.nodeat(pos)
	},
	maxheight: function () {
		let r = 1, node = head
		while (node !== root) {
			if (node.dir === "u") r += node.rmax
			node = node.parent
		}
		return r
	},
	rollto: function (xroll) {
		this.x = xroll
		root.updatepos(0)
	},
	toactivate: function () {
		let atargets = root.atargets().map(atarget => atarget.pos)
		return grid.tasks.filter(task => posincludes(atargets, task))
	},
	activate: function () {
		let solved = this.toactivate()
		if (solved.length > 0) {
			head.shower(solved.length)
			quest.solve(solved)
		} else {
			playsound("no")
		}
	},
	draw: function () {
		UFX.draw("[ z", 1/100, 1/100)
		root.drawtilt()
		root.drawback()
		UFX.draw("[ t", postimes(root.dpos, 100))
		// wheel
		UFX.draw("[ t 0 -10",
			"b o 0 0 40 fs black f",
			"b o 0 0 20 fs #bbb f",
			"b o 0 0 32 ss #111 lw 12 s",
			"b o 0 0 32 ss #222 lw 9 s",
			"b o -3 3 32 ss #fff alpha 0.03 lw 4 s")
		// spokes
		UFX.draw("[ alpha 0.2 fs #006 r", -root.dpos[0] * 3)
		for (let j = 0 ; j < 5 ; ++j) {
			UFX.draw("( a 0 0 12 0 1 aa 0 0 18 1 0 ) f r", tau / 5)
		}
		UFX.draw("]")
		// axle
		UFX.draw("alpha 1 ( m -30 50 q 0 40 -3 0 l 3 0 q 0 40 30 50 )",
			"ss #333 lw 2 fs #777 f s")
		let grad = UFX.draw.radgrad(-3, 3, 0, 0, 0, 8, 0, "#aaa", 1, "#333")
		UFX.draw("b o 0 0 8 fs", grad, "f")
		grad = UFX.draw.radgrad(-30, 60, 0, -30, 60, 100, 0, "#aaa", 1, "#333")
		UFX.draw("rr -40 50 80 10 4 fs", grad, "ss #333 lw 1 f s")
		UFX.draw("]")
		UFX.draw("]")
		root.draw()
		UFX.draw("]")
	},
}

let root = new Root()
let head = new Head("")
root.updatepos(0)




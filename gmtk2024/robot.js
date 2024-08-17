
let TreeNode = {
	setparent: function (parent) {
		if (typeof parent == "string") parent = root.byspec(parent)
		if (this.parent) this.parent.removechild(this)
		this.parent = parent
		if (this.parent) this.parent.addchild(this)
	},
	updatepos: function () {
		let [x, y] = this.parent.pos
		let [dx, dy] = this.relpos()
		this.pos = [x + dx, y + dy]
	},
	spots: function () {
		let [x, y] = this.parent.pos
		return this.relspots().map(([dx, dy]) => [x + dx, y + dy])
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
		return this.childdirs[spec[0]].byspec(spec.slice(1))
	},
	nodeat: function (pos) {
		if (poseq(this.pos, pos)) return this
		for (let child of this.children) {
			let childat = child.nodeat(pos)
			if (childat !== null) return childat
		}
		return null
	},
	updatepos: function () {
		this.children.forEach(child => child.updatepos())
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
		console.assert(spec == "")
		return this
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


function Root() {
	this.pos = [0, 0]
	this.setup()
}
Root.prototype = UFX.Thing()
	.addcomp(NonLeaf)
	.addcomp({
		updatepos: function () {
			this.pos = [robot.x, 0]
			this.children.forEach(child => child.updatepos())
		},
	})


let Extendable = {
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
				this.updatepos()
			}
		})
	},
}


function Block(parent, dir, rmax) {
	this.setup()
	this.setdir(dir, rmax)
	this.setparent(parent)
	this.pos = null
}
Block.prototype = UFX.Thing()
	.addcomp(TreeNode)
	.addcomp(NonLeaf)
	.addcomp(Extendable)
	.addcomp({
		drawback0: function () {
			UFX.draw("[ t", 100 * this.pos[0], 100 * this.pos[1])
			UFX.draw("r", { u: 0, l: 1, d: 2, r: 3}[this.dir] * tau / 4)
			UFX.draw("lw 10 ss blue b m 0 0 l 0", -100 * this.r, "s")
			UFX.draw("]")
		},
		draw0: function () {
			let color = this === control.pointed ? "#fff" : "#666"
			UFX.draw("[ t", 100 * this.pos[0], 100 * this.pos[1])
			UFX.draw("ss #aaa fs", color, "tr -30 -30 60 60 f s")
			UFX.draw("b o 0 0 20 fs #864 ss black f s")
			UFX.draw("]")
		},
	})

function Head(parent) {
	this.dir = "u"
	this.setparent(parent)
	this.pos = null
}
Head.prototype = UFX.Thing()
	.addcomp(TreeNode)
	.addcomp(Leaf)
	.addcomp({
		relpos: function () {
			return [0, 1]
		},
		draw0: function () {
			let eyecolor = this === control.pointed ? "#fa6" : "#642"
			UFX.draw("[ t", 100 * this.pos[0], 100 * this.pos[1])
			UFX.draw("ss #aaa fs #666 tr -40 -40 80 60 f s")
			UFX.draw("tr -70 -30 140 40 f s")
			UFX.draw("fs", eyecolor, "b o -40 -10 15 f b o 40 -10 15 f")
			UFX.draw("]")
		},
	})


function Tool(parent, dir, rmax) {
	this.setdir(dir, rmax)
	this.setparent(parent)
	this.pos = null
}
Tool.prototype = UFX.Thing()
	.addcomp(TreeNode)
	.addcomp(Leaf)
	.addcomp(Extendable)
	.addcomp({
		atarget0: function () {
			return this
		},
		drawback0: function () {
			UFX.draw("[ t", 100 * this.pos[0], 100 * this.pos[1])
			UFX.draw("r", { u: 0, l: 1, d: 2, r: 3}[this.dir] * tau / 4)
			UFX.draw("lw 10 ss blue b m 0 0 l 0", -100 * this.r, "s")
			UFX.draw("]")
		},
		draw0: function () {
			UFX.draw("[ t", 100 * this.pos[0], 100 * this.pos[1])
			UFX.draw("b o 0 0 35 lw 10 ss black s")
			UFX.draw("b o 0 0 35 lw 8 ss gray s")
			UFX.draw("]")
		},
	})



let robot = {
	x: 0,
	blocks: [],
	blockat: function (pos) {
		return root.nodeat(pos)
	},
	rollto: function (xroll) {
		this.x = xroll
		root.updatepos()
	},
	activate: function () {
		let atargets = root.atargets()
		let tasks = {}
		let solved = []
		grid.tasks.forEach(task => tasks[task] = task)
		for (let atarget of atargets) {
			if (tasks[atarget.pos]) {
				solved.push(tasks[atarget.pos])
				delete tasks[atarget.pos]
			}
		}
		quest.solve(solved)
	},
	draw: function () {
		UFX.draw("[ z", 1/100, 1/100)
		root.drawback()
		UFX.draw("[ t", 100 * this.x, -50, "b o 0 40 40 fs black f",
			"( m 0 40 l -30 100 l 30 100 ) ss #aaa fs #666 lw 2 f s ]")
		root.draw()
		UFX.draw("]")
	},
}

let root = new Root()
let head = new Head()
root.updatepos()




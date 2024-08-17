let HasChildren = {
	nodeat: function (pos) {
		if (poseq(this.pos, pos)) return this
		for (let child of this.children) {
			let childat = child.nodeat(pos)
			if (childat !== null) return childat
		}
		return null
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

let Leaf = {
	nodeat: function (pos) {
		return poseq(this.pos, pos) ? this : null
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
	this.children = []
}
Root.prototype = UFX.Thing()
	.addcomp(HasChildren)
	.addcomp({
		updatepos: function () {
			this.pos = [robot.x, 0]
			this.children.forEach(child => child.updatepos())
		},
	})
let root = new Root()


let TreeNode = {
	setparent: function (parent) {
		this.parent = parent
		this.children = []
		this.parent.children.push(this)
	},
	updatepos: function () {
		let [x, y] = this.parent.pos
		let [dx, dy] = this.relpos()
		this.pos = [x + dx, y + dy]
		this.children.forEach(child => child.updatepos())
	},
	spots: function () {
		let [x, y] = this.parent.pos
		return this.relspots().map(([dx, dy]) => [x + dx, y + dy])
	},
}

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
	this.setparent(parent)
	this.setdir(dir, rmax)
	this.pos = null
}
Block.prototype = UFX.Thing()
	.addcomp(HasChildren)
	.addcomp(TreeNode)
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
	this.setparent(parent)
	this.setdir(dir, rmax)
	this.pos = null
}
Tool.prototype = UFX.Thing()
	.addcomp(HasChildren)
	.addcomp(TreeNode)
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
		grid.tasks.forEach(task => tasks[task] = task)
		for (let atarget of atargets) {
			if (tasks[atarget.pos]) {
				grid.solve(tasks[atarget.pos])
			}
		}
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

let block0 = new Block(root, "u", 2)
let block1 = new Block(block0, "u", 2)
let block2 = new Block(block0, "l", 3)
let block3 = new Block(block1, "l", 3)
let tool0 = new Tool(block1, "r", 3)
let tool1 = new Tool(block2, "l", 3)
let tool2 = new Tool(block2, "u", 3)
let tool3 = new Tool(block3, "u", 3)
let head = new Head(block1)
root.updatepos()




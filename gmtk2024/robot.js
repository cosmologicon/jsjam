let HasChildren = {
	nodeat: function (pos) {
		if ("" + this.pos == pos) return this
		for (let child of this.children) {
			let childat = child.nodeat(pos)
			if (childat !== null) return childat
		}
		return null
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

function Block(parent, dir, rmax) {
	this.setparent(parent)
	this.dir = dir
	;[this.dx, this.dy] = this.d = {
		u: [0, 1],
		d: [0, -1],
		l: [-1, 0],
		r: [1, 0],
	}[dir]
	this.r = 1
	this.rmax = rmax
	this.pos = null
}
Block.prototype = UFX.Thing()
	.addcomp(HasChildren)
	.addcomp(TreeNode)
	.addcomp({
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
				if ("" + spot0 == spot) {
					this.r = j + 1
					this.updatepos()
				}
			})
		},
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
	draw: function () {
		UFX.draw("[ z", 1/100, 1/100)
		root.drawback()
		UFX.draw("[ t", 100 * this.x, -50, "b o 0 40 40 fs black f",
			"( m 0 40 l -30 100 l 30 100 ) ss #aaa fs #666 lw 2 f s ]")
		root.draw()
//		UFX.draw("ss #aaa fs #666 tr -40 10 80 60 f s")
//		UFX.draw("tr -70 20 140 40 f s")
//		UFX.draw("fs orange b o -40 40 15 f b o 40 40 15 f")
		UFX.draw("]")
	},
}

let block0 = new Block(root, "u", 2)
let block1 = new Block(block0, "u", 2)
let block2 = new Block(block0, "l", 3)
let block3 = new Block(block1, "r", 3)
root.updatepos()




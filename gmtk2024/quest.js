
function build(spec, block) {
	let parentspec = spec.slice(0, spec.length - 1)
	let dir = spec[spec.length - 1]
	let parent = root.byspec(parentspec)
	let current = root.byspec(spec)
	if (current !== null) {
		let obj = new Block(parent, dir, 1)
		current.setparent(obj)
	} else if (block) {
		new Block(parent, dir, 1)
	} else {
		new Tool(parent, dir, 1)
	}
}

let quest = {
	stage: -1,
	record: 0,
	money: 0,
	n: null,
	advance: function () {
		this.stage += 1
		view.resize()
		switch (this.stage) {
			case 0:
				head.setparent(root)
				break
			case 1:
				build("u")
				build("ul")
				break
			case 4:
				build("ur")
				break
			case 5:
				build("uu")
				build("uur")
				break
			case 6:
				build("ul")
				break
			case 7:
				build("uul")
				break
			case 8:
				build("ur")
				build("uru", true)
				build("urur")
				break
			case 9:
				build("uuu")
				build("uuur")
				break
			case 10:
				build("ull")
				build("ullu")
				break
		}
		view.resize()
		root.updatepos()
		this.addtasks()
	},
	solve: function (solved) {
		solved.forEach(task => grid.solve(task))
		this.money += [0, 1, 5, 20, 50, 100][solved.length]
		this.solverecord = Math.max(this.solverecord, solved.length)
		this.addtasks()
	},
	addtasks: function () {
		let ntask = this.stage
		while (grid.tasks.length < ntask) {
			let bounds = [-view.n, view.n, 1, view.n]
			if (this.stage <= 5) {
				bounds = {
					1: [-3, 2, 1, 1],
					2: [-4, 4, 1, 1],
					3: [-4, 4, 2, 2],
					4: [-4, 4, 1, 2],
					5: [-4, 4, 1, 3],
				}[this.stage]
			}
			grid.addrandomtask(bounds)
		}
	},
	think: function (dt) {
		while (this.done()) this.advance()
	},
	done: function () {
		switch (this.stage) {
			case 0:
				if (robot.x < 0) this.stage0left = true
				if (robot.x > 0) this.stage0right = true
				return this.stage0left && this.stage0right
			case 1:
				return this.money >= 3
			case 2:
				return root.byspec("u").rmax > 1
			case 3:
				return root.byspec("u").r > 1
			case 4:
				return this.record >= 2
			default:
				return false
		}
	},
	text: function () {
		switch (this.stage) {
			case 0:
				return [
					"Thank you for purchasing this state of the art, self-building,",
					"self-scaling repair bot. Click along the ground to move left",
					"and right.",
				]
			case 1:
				return [
					"To conduct repairs, align the robot's arm with a faulty panel",
					"and click on the robot's head.",
				]
			case 2:
				return [
					"Click on the EXTEND button and click on the robot's body to",
					"purchase an extension.",
				]
			case 3:
				return [
					"Click and drag the robot's body up and down to scale to new heights",
				]
			case 4:
				return [
					"Continue making repairs. Try to make multiple repairs at once by",
					"lining up multiple arms if possible.",
				]
			default:
				return []
		}
		
	},
}
quest.advance()
// while (quest.stage < 0) quest.advance()
quest.money = 400
// for (let node of root.allnodes()) if (node.canextend()) node.extend()


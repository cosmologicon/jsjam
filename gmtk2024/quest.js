

let rewards = [0, 1, 5, 20, 50, 100]

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
//				hud.onbuild()
				break
			case 7:
				build("ur")
				break
			case 8:
				build("uu")
				build("uur")
				break
			case 9:
				build("ul")
				break
			case 10:
				build("uul")
				break
			case 11:
				build("ur")
				build("uru", true)
				build("urur")
				break
			case 12:
				build("uuu")
				build("uuur")
				break
			case 13:
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
		if (solved.some(([x, y]) => y > 1)) {
			this.fixedup = true
			console.log(solved)
		}
		this.money += rewards[solved.length]
		this.record = Math.max(this.record, solved.length)
		this.addtasks()
	},
	addtasks: function () {
		let ntask = [0, 1, 1, 1, 1, 1, 2, 3, 5, 5, 6, 8][this.stage]
		while (grid.tasks.length < ntask) {
			let bounds = [-view.n, view.n, 1, Math.floor(view.n * 0.8)]
			if (this.stage <= 7) {
				bounds = {
					1: [-3, 2, 1, 1],
					2: [-3, 2, 1, 1],
					3: [-3, 2, 1, 1],
					4: [-3, 2, 1, 1],
					5: [-4, 3, 2, 2],
					6: [-4, 3, 2, 2],
					7: [-4, 4, 1, 2],
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
				return robot.toactivate().length > 0
			case 2:
				return this.money >= 3
			case 3:
				return control.mode === "extend"
			case 4:
				return root.byspec("u").rmax > 1 && control.mode === null
			case 5:
				return root.byspec("u").r > 1
			case 6:
				return this.fixedup
			case 7:
				return this.record > 1
			default:
				return false
		}
	},
	text: function () {
		switch (this.stage) {
			case 0:
				return [
					"Thank you for purchasing this state of the art, self-building,",
					"self-scaling repair bot.",
					"Click along the ground to move left and right.",
				]
			case 1:
				return [
					"Line up the robot's arm with the faulty panel.",
				]
			case 2:
				return this.money == 0 ? [
					"Once you're lined up with the panel, click on the robot's head",
					"to conduct repairs.",
				] : []
			case 3:
				return [
					"Press TAB or Right Click to purchase upgrades.",
				]
			case 4:
				return [
					"Upgrade the central piece of the robot's body.",
					"TAB or Right Click to go back to the game.",
				]
			case 5:
				return [
					"Click and drag on upgraded pieces to extend them.",
					"Scale to new heights!",
				]
			case 7:
				return [
					"Make two repairs at once by lining up both arms at the same time.",
					"Remember you can upgrade the arms for more options!",
				]
			case 8:
				return [
					"Continue making repairs. To advance, you need to make multiple",
					"repairs at once by lining up multiple arms.",
				]
			default:
				return []
		}
	},
	controls: function () {
		let ret = ["Click along ground: move"]
		if (this.stage >= 2) ret.push("Click on head: make repairs")
		if (this.stage >= 3) ret.push("TAB or Right Click: purchase upgrades")
		if (this.stage >= 5) ret.push("Click and drag: extend")
		return ret
	},
}
quest.advance()
// while (quest.stage < 0) quest.advance()
// quest.money = 400
// for (let node of root.allnodes()) if (node.canextend()) node.extend()


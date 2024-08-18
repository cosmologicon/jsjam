

let rewards = [0, 1, 5, 20, 50, 100, 200, 500, 1000, 2000]
let costs = [0, 3, 10, 100, 1000, 10000, 100000]

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
	tstage: 0,
	n: null,
	advance: function () {
		this.stage += 1
		this.tstage = 0
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
				build("ulu")
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
			case 14:
				build("uuur")
				build("uuurd")
				break
			case 15:
				build("uul")
				build("uulu")
				break
			case 16:
				build("uur")
				build("uurd")
				break
			case 17:
				build("uull")
				build("uulld")
				break
		}
		view.resize()
		root.updatepos()
//		this.addtasks()
		let volume = clamp(0.14 * this.stage, 0, 1)
		UFX.audio.setgain("main", volume)
		UFX.audio.context.resume()
		
	},
	solve: function (solved) {
		solved.forEach(task => grid.solve(task))
		playsound(`fix${clamp(solved.length, 1, 4)}`)
		if (solved.some(([x, y]) => y > 1)) {
			this.fixedup = true
		}
		this.money += rewards[solved.length]
		this.record = Math.max(this.record, solved.length)
//		this.addtasks()
	},
	getn: function () {
		if (this.stage <= 0) return 2
		if (this.stage <= 7) return 3
		if (this.stage <= 8) return 5
		if (this.stage <= 9) return 6
		if (this.stage <= 10) return 7
		if (this.stage <= 12) return 8
		if (this.stage <= 14) return 9
		if (this.stage <= 15) return 10
		if (this.stage <= 16) return 11
		if (this.stage <= 17) return 12
		return 12
	},
	think: function (dt) {
		while (this.done()) this.advance()
		this.tstage += dt

		let ntask = [0, 1, 1, 1, 1, 1, 2, 3][this.stage]
		if (this.stage >= 8) ntask = Math.floor(0.2 * robot.numtools ** 0.4 * view.N ** 2)
		if (grid.tasks.length < ntask && UFX.random.flip(2 * dt)) {
			let bounds = [-view.N, view.N, 1, Math.floor(view.N * 0.85)]
			if (this.stage <= 7) {
				bounds = {
					1: [-3, 2, 1, 1],
					2: [-3, 2, 1, 1],
					3: [-3, 2, 1, 1],
					4: [-3, 2, 1, 1],
					5: [-3, 2, 2, 2],
					6: [-3, 2, 2, 2],
					7: [-3, 3, 1, 2],
				}[this.stage]
			}
			grid.addrandomtask(bounds)
		}

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
			case 8:
			case 9:
			case 10:
			case 11:
				return this.record > this.stage - 6
			default:
				return false
		}
	},
	text: function () {
		switch (this.stage) {
			case 0:
				return [
					"Thank you for purchasing this state of the art, self-building,",
					"self-scaling Extendotron repair bot.",
					"Click along the ground to move left and right.",
				]
			case 1:
				return [
					"Line up the robot's arm with the faulty panel.",
				]
			case 2:
				return this.money == 0 ? [
					"Once you're lined up with the panel, click on the robot's head",
					"or press Space to conduct repairs.",
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
					"Make two repairs at once by lining up both arms with faulty panels.",
					"If you can't do it yet, fix a panel to get a new option.",
					"Remember you can upgrade the arms for more reach!",
				]
			case 8:
				return [
					"Continue making repairs and purchasing upgrades.",
					"To advance, activate all arms at once.",
				]
			case 9:
				return this.tstage < 8 ? [
					"Some customers have reported signs of happiness in their",
					"Extendotron units as they scale.",
				] : []
			case 10:
				return this.tstage < 8 ? [
					"Please rest assured that Extendotrons are programmed without",
					"emotions and are incapable of experiencing happiness.",
				] : []
			case 11:
				return this.tstage < 8 ? [
					"Nevertheless, if your unit should appear motivated or",
					"ambitious, please submit it for a factory reset.",
				] : []
			case 12:
				return this.tstage < 8 ? [
					"We wouldn't want them scaling too large, now would we?",
				] : ["The end. Thank you for playing!"]
			default:
				return []
		}
	},
	controls: function () {
		let ret = ["Click along ground: move"]
		if (this.stage >= 2) ret.push("Click on head or Space: make repairs")
		if (this.stage >= 3) ret.push("TAB or Right Click: purchase upgrades")
		if (this.stage >= 5) ret.push("Click and drag: extend")
		return ret
	},
}
quest.advance()
// while (quest.stage < 0) quest.advance()
// quest.money = 400
// for (let node of root.allnodes()) if (node.canextend()) node.extend()


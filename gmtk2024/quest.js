

let rewards = [0, 1, 5, 20, 50, 100, 200, 500]
while (rewards[rewards.length - 1] < 1000000000) {
	rewards.push(rewards[rewards.length - 3] * 10)
}
let costs = [0, 3, 10, 100]
while (costs[costs.length - 1] < 1000000000) {
	costs.push(costs[costs.length - 1] * 10)
}

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
			case 18:
				build("uuul")
				break
			case 19:
				build("uurr")
				build("uurru")
				break
			case 20:
				build("ullu")
				build("ullul")
				break
		}
		view.resize()
		root.updatepos()
//		this.addtasks()
		let volume = clamp(0.14 * this.stage, 0, 1)
		volume = 1
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
		if (this.stage <= 11) return 7
		if (this.stage <= 12) return 9
		if (this.stage <= 13) return 9
		if (this.stage <= 14) return 10
		if (this.stage <= 15) return 11
		return 12
	},
	getbounds: function () {
		if (this.stage <= 7) {
			return {
				0: [0, 0, 1, 1],
				1: [-3, 2, 1, 1],
				2: [-3, 2, 1, 1],
				3: [-3, 2, 1, 1],
				4: [-3, 2, 1, 1],
				5: [-3, 2, 2, 2],
				6: [-3, 2, 2, 2],
				7: [-3, 3, 1, 2],
			}[this.stage]
		}
		return [-view.N, view.N, 1, Math.floor(view.N * 0.9)]
	},
	think: function (dt) {
		while (this.done()) this.advance()
		this.tstage += dt

		let ntask = [0, 1, 1, 1, 1, 1, 2, 3][this.stage]
		if (this.stage >= 8) ntask = Math.floor(0.2 * robot.numtools ** 0.4 * view.N ** 2)
		if (grid.tasks.length < ntask && UFX.random.flip(2 * dt)) {
			grid.addrandomtask(this.getbounds())
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
			default:
				return this.record > this.stage - 6
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
				return UFX.pointer.touch ? [
					"Tap the UPGRADE button to purchase upgrades.",
				] : [
					"Press TAB or Right Click to purchase upgrades.",
				]
			case 4:
				return UFX.pointer.touch ? [
					"Upgrade the central piece of the robot's body.",
					"Tap elsewhere to go back to the game.",
				] : [
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
				return this.tstage < 30 ? [
					"Some customers have reported signs of happiness in their",
					"Extendotron units as they scale.",
				] : []
			case 10:
				return this.tstage < 30 ? [
					"Please rest assured that all Extendotron units'",
					"emotion subroutines have been disabled, and they",
					"are incapable of experiencing joy.",
				] : []
			case 11:
				return this.tstage < 30 ? [
					"Nevertheless, should your unit should appear to be",
					"enjoying its work too sincerely, please submit it",
					"for a factory reset.",
				] : []
			case 12:
				return this.tstage < 30 ? [
					"Extendotron corporation is not legally liable for",
					"disaster scenarios caused by overly eager robots",
					"exceeding their directives.", 
				] : ["The end. Thank you for playing!"]
			case 13:
				return ["The end. Thank you for playing!"]
			default:
				return []
		}
	},
	controls: function () {
		let ret = ["Click along ground: move"]
		if (this.stage >= 2) ret.push("Click on head or Space: make repairs")
		if (this.stage >= 3) {
			if (UFX.pointer.touch) {
			} else {
				ret.push("TAB or Right Click: purchase upgrades")
			}
		}
		if (this.stage >= 5) ret.push("Click and drag: extend")
		return ret
	},
}
quest.advance()
// while (quest.stage < 0) quest.advance()
// quest.money = 400
// for (let node of root.allnodes()) if (node.canextend()) node.extend()


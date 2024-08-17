let quest = {
	stage: -1,
	record: 0,
	money: 0,
	n: null,
	advance: function () {
		this.stage += 1
		this.n = [2, 3, 4, 4, 5, 5][this.stage] || 20
		view.resize(this.n)
		switch (this.stage) {
			case 0:
				head.setparent(root)
				break
			case 1:
				new Block("", "u", 1)
				new Tool("u", "l", 1)
				head.setparent("u")
				break
			case 4:
				new Tool("u", "r", 1)
				break
			case 5:
				new Block("u", "u", 1)
				new Tool("u", "r", 1)
				head.setparent("uu")
				break
		}
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
			let bounds = {
				1: [-3, 2, 1, 1],
				2: [-4, 4, 1, 1],
				3: [-4, 4, 2, 2],
				4: [-4, 4, 1, 2],
				5: [-4, 4, 1, 3],
			}[this.stage]
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
				return record >= 2
			default:
				return false
		}
	},
	text: function () {
		switch (this.stage) {
			case 0:
				return [
					"Thank you for purchasing the self-building, self-scaling",
					"repair bot. Click along the ground to move left and right.",
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
					"Line up multiple arms to conduct multiple arms at once for",
					"extra money.",
				]
			default:
				return []
		}
		
	},
}
quest.advance()
while (quest.stage < 5) quest.advance()


let quest = {
	stage: -1,
	record: 0,
	money: 0,
	n: null,
	advance: function () {
		this.stage += 1
		this.n = [2, 3, 4][this.stage]
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
			case 2:
				new Tool("u", "r", 1)
				break
		}
		this.addtasks()
		root.updatepos()
	},
	solve: function (solved) {
		solved.forEach(task => grid.solve(task))
		this.money += [0, 1, 5, 20, 40][solved.length]
		this.solverecord = Math.max(this.solverecord, solved.length)
		this.addtasks()
	},
	addtasks: function () {
		let ntask = this.stage
		while (grid.tasks.length < ntask) {
			let bounds = {
				1: [-3, 2, 1, 1],
				2: [-4, 4, 1, 1],
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
				return this.money >= 1
			default:
				return false
		}
	},
}
quest.advance()




let grid = {
	tasks: [],
	score: 0,
	solve: function (task) {
		this.tasks = this.tasks.filter(t => !poseq(t, task))
		this.score += 1
		let ntask = 3 + Math.floor(Math.sqrt(this.score))
		while (this.tasks.length < ntask) this.addrandomtask()
	},
	addrandomtask: function () {
		while (true) {
			let x = UFX.random.rand(-5, 6), y = UFX.random.rand(1, 7)
//			if (posindex(this.tasks, [x, y]) == -1) continue
			this.tasks.push([x, y])
			break
		}
	},
	
	draw: function () {
		this.tasks.forEach(task => {
			UFX.draw("[ t", task, "b o 0 0 0.2 fs yellow f ]")
		})
	},
}
grid.addrandomtask()


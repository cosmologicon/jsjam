

let grid = {
	tasks: [],
	score: 0,
	solve: function (task) {
		this.tasks = this.tasks.filter(t => !poseq(t, task))
	},
	addrandomtask: function (bounds) {
		let [x0, x1, y0, y1] = bounds
		while (true) {
			let x = UFX.random.rand(x0, x1 + 1)
			let y = UFX.random.rand(y0, y1 + 1)
			if (posincludes(this.tasks, [x, y])) continue
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


"use strict"

UFX.scenes.play = {
	start: function () {
		var shapes = [
			// monomino?
			[[0, 0]],
			// dominoes
			[[0, 0], [1, 0]],
			[[0, 0], [0, 1]],
			// triominoes
			[[0, 0], [-1, 0], [1, 0]],
			[[0, 0], [-1, 0], [0, 1]],
			[[0, 0], [-1, 0], [0, -1]],
			[[0, 0], [1, 0], [0, 1]],
			[[0, 0], [1, 0], [0, -1]],
			[[0, 0], [0, 1], [0, -1]],
		]

		this.things = [
			new You(),
		]
		grid.updatecells()
		
		while (this.things.length < 100) {
			var x = UFX.random.rand(-8, 8)
			var y = UFX.random.rand(-8, 8)
			var shape = UFX.random.choice(shapes)
			if (shape.some(cell => grid.cells[[cell[0] + x, cell[1] + y]])) {
				continue
			}
			this.things.push(new Shape(x, y, shape))
			grid.updatecells()
		}
	},
	think: function (dt) {
		var kstate = UFX.key.state()
		var mstate = UFX.mouse.state()
		var tstate = UFX.touch.state()
		control.think(dt, kstate, mstate, tstate)
		grid.think(dt)
		this.things.forEach(thing => thing.think(dt))
	},
	draw: function () {
		UFX.draw("fs blue f0")
		function draw(thing) {
			context.save()
			thing.draw()
			context.restore()
		}

		context.save()
		grid.look()
		this.things.forEach(draw)
		context.restore()
		
		UFX.draw("[ tab left bottom fs white ss black lw 2 font 28px~'sans-serif'",
			"sft", UFX.ticker.getrates().replace(/ /g, "~"), 10, canvas.height - 10, "]")
		
		canvas.style.cursor = control.getcursor()
	},
}


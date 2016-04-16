"use strict"
UFX.scenes.play = {
	start: function () {
		this.things = [
			new You(),
			new Block(1, -1, [[0, 0], [1, 0]]),
			new Shape(-2, -2, [[0, 0], [0, 1], [1, 0]]),
		]
		grid.updatecells()
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


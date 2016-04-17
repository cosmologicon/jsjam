"use strict"

UFX.scenes.play = {
	start: function () {
		var ldata = leveldata[1]
		var things = this.things = [
			new You(ldata.you[0], ldata.you[1]),
		]
		ldata.shapes.forEach(function (shape) {
		
		})
		ldata.blocks.forEach(function (cells) {
			things.push(new Block(0, 0, cells))
		})
		grid.updatecells()
		grid.x0 = ldata.x0
		grid.y0 = ldata.y0
		grid.R = ldata.R
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


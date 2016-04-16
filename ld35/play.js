UFX.scenes.play = {
	start: function () {
		this.things = [new You()]
	},
	think: function (dt) {
		var kstate = UFX.key.state()
		grid.think(dt)
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
	},
}


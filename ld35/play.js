"use strict"

UFX.scenes.play = {
	start: function () {
		var ldata = leveldata[1]
		this.gsize = ldata.gsize
		var things = this.things = [
			new You(ldata.you[0], ldata.you[1]),
		]
		ldata.shapes.forEach(function (cells) {
			things.push(new Shape(0, 0, cells))
		})
		ldata.blocks.forEach(function (cells) {
			things.push(new Block(0, 0, cells))
		})
		grid.updatecells()
		grid.x0 = this.gsize[0] / 2
		grid.y0 = this.gsize[1] / 2
		grid.R = Math.max(this.gsize[0], this.gsize[1]) + 0.8

		this.ideas = ldata.ideas.map(pos => new Idea(pos))
		this.idea0 = new Idea([-0.5, -0.5])
		this.C = 0
		
		this.record = []
		this.step()
	},
	step: function () {
		var state = {
			objs: this.things.map(thing => [thing.x, thing.y, thing.awake, thing.shiftable, thing.restopen]),
			ideas: this.ideas.map(idea => [idea.x, idea.y]),
			C: this.C,
		}
		this.record.push(state)
	},
	backup: function () {
		if (this.record.length < 2) return
		this.record.pop()
		this.load(this.record[this.record.length - 1])
	},
	load: function (state) {
		this.C = state.C
		this.ideas = state.ideas.map(pos => new Idea(pos))
		state.objs.forEach(function (obj, j) {
			this.things[j].x = obj[0]
			this.things[j].y = obj[1]
			this.things[j].awake = obj[2]
			this.things[j].shiftable = obj[3]
			this.things[j].restopen = obj[4]
		}.bind(this))
		grid.updatecells()
	},
	think: function (dt) {
		var kstate = UFX.key.state()
		var mstate = UFX.mouse.state()
		var tstate = UFX.touch.state()
		control.think(dt, kstate, mstate, tstate)
		grid.think(dt)
		this.things.forEach(thing => thing.think(dt))
		this.ideas.forEach(idea => idea.think(dt))
		this.idea0.think(2 * dt)
		if (kstate && kstate.down.backspace) this.backup()
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
		UFX.draw("fs #111 fr 0 0", this.gsize)
		this.things.forEach(draw)
		this.ideas.forEach(draw)
		if (this.C) {
			UFX.draw("[ z 1.5 1.5")
			this.idea0.draw()
			UFX.draw("]")
		}
		context.restore()
		
		UFX.draw("[ tab left bottom fs white ss black lw 2 font 28px~'sans-serif'",
			"sft", UFX.ticker.getrates().replace(/ /g, "~"), 10, canvas.height - 10, "]")
		
		canvas.style.cursor = control.getcursor()
	},
}


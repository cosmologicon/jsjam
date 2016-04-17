"use strict"

UFX.scenes.play = {
	start: function () {
		var jlevel = localStorage.ld35save
		var ldata = leveldata[jlevel]
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

		if (jlevel == 6) {
			while (this.things.length < 60) {
				var x0 = UFX.random.rand(this.gsize[0])
				var y0 = UFX.random.rand(this.gsize[1])
				var cells = UFX.random.choice([
					[[0, 0]],
					[[0, 0], [1, 0]],
					[[0, 0], [0, 1]],
					[[0, 0], [0, 1], [1, 0]],
					[[0, 0], [1, 1], [1, 0]],
					[[0, 0], [0, 1], [1, 1]],
					[[1, 1], [0, 1], [1, 0]],
				])
				var thing = new Shape(x0, y0, cells)
				if (!thing.canslide([0, 0])) continue
				this.things.push(thing)
				thing.cells.forEach(function (cell) {
					var x = thing.x + cell[0]
					var y = thing.y + cell[1]
					grid.cells[[x, y]] = thing
				})
			}
			this.C = 100
		}
		grid.updatecells()
		
		this.record = []
		this.step()
		this.curtain = 1
		this.won = false
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
		UFX.resource.sounds.undo.play()
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
	done: function () {
		return !this.C && this.ideas.length == 0
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
		if (kstate) {
			if (kstate.down.backspace) this.backup()
			if (kstate.down.esc) this.skiptolevel(localStorage.ld35save)
			if (kstate.down[1]) this.skiptolevel(1)
			if (kstate.down[2]) this.skiptolevel(2)
			if (kstate.down[3]) this.skiptolevel(3)
			if (kstate.down[4]) this.skiptolevel(4)
			if (kstate.down[5]) this.skiptolevel(5)
			if (kstate.down[6]) this.skiptolevel(6)
		}
		this.curtain = clamp(this.curtain - 2 * dt, 0, 1)
		if (!this.won && this.done()) {
			this.won = true
		}
	},
	skiptolevel: function (n) {
		localStorage.ld35save = n
		UFX.scene.swap("play")
	},
	draw: function () {
		function getcolor(t) {
			return "rgb(" + [
				Math.sin(t),
				Math.sin(t + tau/3),
				Math.sin(t + 2 * tau/3),
			].map(x => Math.floor(120 + 120 * x)).join() + ")"
		}
		var s = Math.min(sx, sy)
		var grad = "lg~-1~0~1~0~0~" + getcolor(Date.now() * 0.0001) + "~1~" + getcolor(Date.now() * 0.0001 + 2)
		UFX.draw("[ t", sx/2, sy/2, "z", s, s, "r", Date.now() * 0.0002, "fs", grad, "fr -3 -3 6 6 ]")

		function draw(thing) {
			context.save()
			thing.draw()
			context.restore()
		}

		context.save()
		grid.look()
		UFX.draw("fs #004 fr 0 0", this.gsize)
		this.things.forEach(draw)
		this.ideas.forEach(draw)
		if (this.C) {
			UFX.draw("[ z 1.5 1.5")
			this.idea0.draw()
			UFX.draw("]")
		}
		if (this.won) {
			UFX.draw("[ t 0.1 0.1 fs #ccf ss blue lw 0.03 sfr -0.4 -0.25 0.8 0.5",
				"z 0.01 0.01 tab center middle font 24px~'Architects~Daughter'",
				"fs blue ft NEXT 0 -10 ft LEVEL 0 10",
			"]")
		}

		context.restore()
		var title = {
			1: "Level~1",
			2: "Level~2",
			3: "Level~3",
			4: "Level~4",
			5: "Level~5",
			6: "Thank~you~for~playing!",
		}[localStorage.ld35save]
		var message = this.f == 1 ? "Click~to~begin" : "Loading:~" + Math.round(this.f * 100) + "%"
		UFX.draw("[ t", sx / 2, sy / 2, "z", s/100, s/100,
			"[ t 45 -48 font 5px~'Architects~Daughter' fs lg~0~2~0~5~0~white~1~#aaf ss black lw 0.5 tab right top sft0", title, "]",
		"]")

		
		if (this.curtain) UFX.draw("[ alpha", this.curtain, "fs white f0 ]")
		
		UFX.draw("[ tab left bottom fs white ss black lw 2 font 28px~'sans-serif'",
			"sft", UFX.ticker.getrates().replace(/ /g, "~"), 10, canvas.height - 10, "]")
		
		canvas.style.cursor = control.getcursor()
	},
}


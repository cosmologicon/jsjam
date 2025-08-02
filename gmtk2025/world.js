

let world = {
	init: function (levelname, from) {
		this.levelname = levelname
		let level = levels[levelname]
		this.skycolor = level.skycolor
		this.groundcolor = level.groundcolor
		this.edgecolor = level.edgecolor
		this.R = level.R
		this.D = 2 * this.R
		this.ys = []
		this.z = level.z || 1
		for (let x = 0 ; x <= this.D ; ++x) {
			let f = x / this.D
			y = -330 + 4 * (
				40 * UFX.noise([14 * f + 5.1234], [14]) +
				30 * UFX.noise([15 * f + 6.2345], [15]) +
				20 * UFX.noise([16 * f + 7.3456], [16]) +
				15 * UFX.noise([17 * f + 8.4567], [17]) +
				10 * UFX.noise([18 * f + 9.5678], [18])
			)
			this.ys.push(y)
		}
		if ("groundspec" in level) this.setsineground(level.groundspec)
		this.you = new You()
//		this.bubbles = UFX.random.seedmethod(777, "spread", 40, 0.8, this.R, 600, 0, -300).map(([x, y]) => new Bubble(x, y))
		this.bubbles = []
		this.balloons = []
		this.hazards = []
		this.signs = level.signs
		this.graphics = level.graphics.map(spec => new Graphic(spec))
		this.powerups = []
		for (let [x, y, name] of level.powerups) {
			if (!progress.unlocked[name]) {
				this.powerups.push(new Powerup(x, y, name))
			}
		}
		this.platforms = []
		if ("platformspec" in level) this.platforms.push(...level.platformspec.map(spec => makesineplatform(spec)))
		this.stars = level.stars.map(([x, y]) => new Star(x, y))
		if ("hazards" in level) this.hazards.push(...level.hazards.map(([x, y]) => new Hazard(x, y)))
		if ("mushrooms" in level) this.balloons.push(...level.mushrooms.map(([x, y]) => new UpMushroom(x, y)))
		this.NPCs = []
		if ("NPCs" in level) this.NPCs.push(...level.NPCs.map(([x, y, name]) => new NPC(x, y, name)))
		this.portals = []
		for (let [x, y, name, needed] of level.portals) {
			let portal = new Portal(x, y, name, needed)
			this.portals.push(portal)
			this.platforms.push(portal.getplatform())
			if (name === from) {
				this.you.x = x
				this.you.y = y
				this.you.grounded = false
			}
		}
		this.platforms.sort((p0, p1) => p1.y - p0.y)
		this.nextlevel = null
		this.t = 0
	},
	setsineground: function (seq) {
		let wrap = ([x, y], d) => [x + d * this.D, y]
		while (seq[0][0] < 0) {
			seq.push(wrap(seq.shift(), 1))
		}
		seq.unshift(wrap(seq[seq.length - 1], -1))
		seq.push(wrap(seq[1], 1))
		console.log(seq)
		
		this.ys = []
		for (let x = 0 ; x <= this.D ; ++x) {
			let j1 = 0
			while (seq[j1][0] < x) ++j1
			let [x0, y0] = seq[j1 - 1]
			let [x1, y1] = seq[j1]
			let f = (x - x0) / (x1 - x0)
			let g = 0.5 - 0.5 * Math.cos(f * Math.PI)
			this.ys.push(y0 + (y1 - y0) * g)
		}
	},
	floorat: function (x) {
		let x0 = Math.floor(x)
		let f = x - x0
		let y0 = this.ys[mod(x0, this.D)], y1 = this.ys[mod(x0 + 1, this.D)]
		return y0 + f * (y1 - y0)
	},
	ceilingat: function (x) {
		return -this.floorat(x + this.R)
	},
	slopeat: function (x) {
		return this.floorat(x + 0.5) - this.floorat(x - 0.5)
	},
	think: function (dt, jumpheld) {
		this.t += dt
		world.you.think(dt, jumpheld)
		if (jumpheld) {
			world.you.interact(world.portals)
		}
		world.you.hithazards(world.hazards)
		world.you.collect(world.stars.concat(world.powerups))
		let think = obj => obj.think(dt)
		world.bubbles.forEach(think)
		world.balloons.forEach(think)
		world.NPCs.forEach(think)
		let checkalive = obj => obj.alive
		world.balloons = world.balloons.filter(checkalive)
		world.stars = world.stars.filter(checkalive)
		world.powerups = world.powerups.filter(checkalive)
	},
	drawobjs: function (objs) {
		;[false, true].forEach(flip => {
			UFX.draw("[", view.look(flip))
			objs.forEach(obj => obj.draw(flip))
			UFX.draw("]")
		})
	},
	draw: function () {
		this.drawobjs(this.graphics)
		this.drawobjs(this.platforms)
		this.drawobjs(this.portals)
		this.drawobjs(this.bubbles.concat(this.balloons, this.stars))
		this.drawobjs(this.powerups)
		// ground
		;[false, true].forEach(flip => {
			UFX.draw("[", view.look(flip))
			let [x0, x1] = view.xrange(flip)
			let depth = view.screenh() * 1.04
			UFX.draw("( m", x0, -depth)
			for (let x = x0 ; x <= x1 ; ++x) {
				UFX.draw("l", x, this.ys[mod(x, this.D)])
			}
			UFX.draw("l", x1, -depth, ") fs", this.groundcolor, "f lw 10 ss", this.edgecolor, "s")
			UFX.draw("]")
		})
		this.drawobjs(this.hazards)
		this.drawobjs(this.NPCs)
		this.drawobjs([this.you])
		;[false, true].forEach(flip => {
			UFX.draw("[", view.look(flip))
			this.signs.forEach(([x, y, tilt, text]) => {
				UFX.draw("[ t", view.mod(x, flip), y, "vflip r", tilt,
					"font 60px~Viga tab center middle fs black ss white lw 2 sft0", text, "]")
			})
			UFX.draw("]")
		})
		let alpha = Math.min(Math.min(3 * this.t, 1), 1 - 5 * (this.t - 2))
		if (alpha > 0) {
			let grad = UFX.draw.lingrad(0, -40, 0, 100, 0, this.skycolor, 1, "black")
			UFX.draw("[ t 800 840 tab center middle font 90px~'Bokor' lw 4",
				"ss black fs", grad, "alpha", alpha,
				"sft0", levels[this.levelname].title.replaceAll(" ", "~"),
//				"t 0 40 scale 1 -0.3 alpha", alpha / 2,
//				"sft0", levels[this.levelname].title.replaceAll(" ", "~"),
				"]")
		}
	},
}



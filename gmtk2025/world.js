let levels = {
	empty: {
		title: "Kingdom of Starteria",
		skycolor: "#777",
		groundcolor: "#333",
		edgecolor: "#bbb",
		R: 2000,
		signs: [],
		graphics: [],
		stars: [],
		portals: [],
		powerups: [],
	},

	start: {
		title: "Kingdom of Starteria",
		skycolor: "#77f",
		groundcolor: "#080",
		edgecolor: "#4b4",
		R: 2000,
		signs: [
//			[2289, -400, -0.1, "TAP~OR~SPACE:~JUMP"],
		],
		graphics: [
			[700, 0, 1, 400, "castle"],
		],
		stars: [
			[2400, -200],
			[3600, 0],
			[4400, 0],
		],
		portals: [
			[500, -300, "forest", 1],
		],
		powerups: [
			[1000, -200, 2],
		],
	},
	forest: {
		title: "Forest of Mysteriousness",
		skycolor: "#080",
		groundcolor: "#040",
		edgecolor: "#6a6",
		R: 2000,
		signs: [],
		graphics: [],
		stars: [
		],
		portals: [
			[500, -230, "start", 1],
			[800, -230, "ruins", 1],
		],
		powerups: [
			[1000, -150, 2],
		],
	},
	ruins: {
		title: "The Forbidden Ruins",
		skycolor: "#ccf",
		groundcolor: "#ffc",
		edgecolor: "#963",
		R: 2000,
		signs: [],
		graphics: [],
		stars: [
		],
		portals: [
			[500, -230, "forest", 1],
			[800, -230, "under", 1],
			[1300, -230, "water", 1],
		],
		powerups: [],
	},
	mountain: {
		title: "Mountaintop",
		skycolor: "#aaf",
		groundcolor: "#888",
		edgecolor: "#fff",
		R: 2000,
		signs: [],
		graphics: [],
		stars: [
		],
		portals: [
			[500, -230, "forest", 1],
			[800, -230, "water", 1],
			[1300, -230, "win", 1],
		],
		powerups: [],
	},
	water: {
		title: "Underwater City",
		skycolor: "#336",
		groundcolor: "#111",
		edgecolor: "#888",
		R: 2000,
		signs: [],
		graphics: [],
		stars: [
		],
		portals: [
			[500, -230, "mountain", 1],
			[800, -230, "ruins", 1],
			[1300, -230, "fire", 1],
		],
		powerups: [],
	},
	under: {
		title: "Subterrania",
		skycolor: "#111",
		groundcolor: "#345",
		edgecolor: "#89a",
		R: 2000,
		groundspec: [[373,-17],[570,-332],[1268,-407],[1790,-200],[2223,-229],[2637,-399],[3583,-358],[3756,-71]],
		platformspec: [
			[[2086,-92],[2469,-249],[2844,-255],[2844,-255],[3089,-14],[3260,-37]],
		],
		signs: [],
		graphics: [],
		stars: [
			[640, 0],
		],
		portals: [
			[3470, 0, "ruins", 1],
		],
		powerups: [
			[1160, -200, 3],
		],
	},
	space: {
		title: "The Mobius Dimension",
		skycolor: "#fc8",
		groundcolor: "#8ff",
		edgecolor: "#000",
		R: 2000,
		signs: [],
		graphics: [],
		stars: [
		],
		portals: [
			[500, -230, "mountain", 1],
		],
		powerups: [],
	},
	fire: {
		title: "Magma Pits",
		skycolor: "#800",
		groundcolor: "#432",
		edgecolor: "#000",
		R: 2000,
		signs: [],
		graphics: [],
		stars: [
		],
		portals: [
			[500, -230, "water", 1],
		],
		powerups: [
			[500, 0, 1],
		],
	},
}


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
		this.signs = level.signs
		this.graphics = level.graphics.map(spec => new Graphic(spec))
		for (let [x, y, name] of level.powerups) {
			if (!progress.unlocked[name]) {
				console.log(name)
				this.balloons.push(new Powerup(x, y, name))
			}
		}
		this.platforms = []
		if ("platformspec" in level) this.platforms.push(...level.platformspec.map(spec => makesineplatform(spec)))
		this.stars = level.stars.map(([x, y]) => new Star(x, y))
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
			world.you.interact(world.balloons, world.portals)
		}
		world.you.collect(world.stars)
		world.bubbles.forEach(bubble => bubble.think(dt))
		world.balloons.forEach(balloon => balloon.think(dt))
		world.balloons = world.balloons.filter(balloon => balloon.alive)
		world.stars = world.stars.filter(balloon => balloon.alive)
	},
	drawobjs: function (objs) {
		;[false, true].forEach(flip => {
			UFX.draw("[", view.look(flip))
			objs.forEach(obj => obj.draw(flip))
			UFX.draw("]")
		})
	},
	draw: function () {
		this.drawobjs(this.graphics.concat(this.portals))
		this.drawobjs(this.platforms)
		this.drawobjs(this.bubbles.concat(this.balloons, this.stars))
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



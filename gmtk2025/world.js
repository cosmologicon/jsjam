let levels = {
	start: {
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
			[500, -230, "forest", 0],
		],
	},
	forest: {
		skycolor: "#080",
		groundcolor: "#040",
		edgecolor: "#6a6",
		R: 4000,
		signs: [
//			[2289, -400, -0.1, "TAP~OR~SPACE:~JUMP"],
		],
		graphics: [
//			[700, 0, 1, 400, "castle"],
		],
		stars: [
		],
		portals: [
			[500, -230, "start", 0],
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
		this.you = new You()
//		this.bubbles = UFX.random.seedmethod(777, "spread", 40, 0.8, this.R, 600, 0, -300).map(([x, y]) => new Bubble(x, y))
		this.bubbles = []
		this.balloons = []
		this.signs = level.signs
		this.graphics = level.graphics
		this.platforms = [
			makesineplatform(2700, -300, 3500, 100),
			makesineplatform(3700, 100, 4200, 0),
		]
		this.stars = level.stars.map(([x, y]) => new Star(x, y))
		this.portals = []
		for (let [x, y, name, needed] of level.portals) {
			let portal = new Portal(x, y, name, needed)
			this.portals.push(portal)
			this.platforms.push(portal.getplatform())
			if (name === from) {
				this.you.x = x
				this.you.y = y
			}
		}
		this.nextlevel = null
		
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
	draw: function () {
		;[false, true].forEach(flip => {
			UFX.draw("[", view.look(flip))
			this.graphics.forEach(([x0, y0, scale, r, imgname]) => {
				UFX.draw("[ t", view.mod(x0, flip), y0, "z", scale, -scale,
					"drawimage", UFX.resource.images[imgname], -r, -r, "]")
			})
			this.portals.forEach(portal => portal.draw(flip))
			UFX.draw("]")
		})
		;[false, true].forEach(flip => {
			UFX.draw("[", view.look(flip))
			this.platforms.forEach(platform => platform.draw(flip))
			UFX.draw("]")
		})
		;[false, true].forEach(flip => {
			UFX.draw("[", view.look(flip))
			this.bubbles.forEach(bubble => bubble.draw(flip))
			this.balloons.forEach(balloon => balloon.draw(flip))
			this.stars.forEach(star => star.draw(flip))
			UFX.draw("]")
		})
		// ground
		;[false, true].forEach(flip => {
			UFX.draw("[", view.look(flip))
			let [x0, x1] = view.xrange(flip)
			UFX.draw("( m", x0, -500)
			for (let x = x0 ; x <= x1 ; ++x) {
				UFX.draw("l", x, this.ys[mod(x, this.D)])
			}
			UFX.draw("l", x1, -500, ") fs", this.groundcolor, "f lw 10 ss", this.edgecolor, "s")
			UFX.draw("]")
		})
		UFX.draw("[", view.look(false))
		this.you.draw(false)
		UFX.draw("]")
		;[false, true].forEach(flip => {
			UFX.draw("[", view.look(flip))
			this.signs.forEach(([x, y, tilt, text]) => {
				UFX.draw("[ t", view.mod(x, flip), y, "vflip r", tilt,
					"font 60px~Viga tab center middle fs black ss white lw 2 sft0", text, "]")
			})
			UFX.draw("]")
		})
	},
}



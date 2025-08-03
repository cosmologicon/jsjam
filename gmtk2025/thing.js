
let bcolors = {
	1: "red",
	2: "blue",
	3: "yellow",
}
let jumpvy = 500
let blaunches = {
	1: [-500, 300],
	2: [200, 700],
	3: [700, 300],
}


let WorldBound = {
	onscreen: function (flip) {
		return view.onscreen(this.x, this.w, flip)
	},
	
	draw: function (flip) {
		let wfactor = this.wfactor || 1
		let xs = view.mods(this.x, this.w * wfactor, flip)
		if (xs.length == 0) return
		let drawline = this.draw0(flip)
//		console.log(xs, this.y, drawline)
		xs.forEach(x => UFX.draw("[ t", x, this.y, drawline, "]"))
	},
	draw0: function (flip) {
		return []
	},
}

function ysettle(x, y0) {
	let y = world.floorat(x), on = null
	for (let platform of world.platforms) {
		if (platform.within(x)) {
			let yplatform = platform.heightat(x)
			if (yplatform > y && yplatform <= y0) {
				y = yplatform
				on = platform
			}
		}
	}
	return [y, on]
}



function Graphic(spec) {
	// this.r is image radius in pixels, needed for anchoring.
	;[this.x, this.y, this.scale, this.r, this.imgname] = spec
	this.w = this.r * this.scale
}
Graphic.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp({
		draw0: function () {
			return ["z", this.scale, -this.scale, "drawimage", UFX.resource.images[this.imgname], -this.r, -this.r]
		},
	})


let Circular = {
	within: function (obj, dy) {
		let dx0 = zmod(this.x - obj.x, world.D), dy0 = this.y - (obj.y + (dy || 0))
		let dx1 = zmod(this.x - obj.x + world.R, world.D), dy1 = this.y + obj.y
		return Math.hypot(dx0, dy0) <= this.r || Math.hypot(dx1, dy1) <= this.r
	},
	draw: function (flip) {
		UFX.draw("[ b o", view.mod(this.x, flip), this.y, this.r, "ss white lw 1 s ]")
	},
}

let Rectangular = {
	// Returns 1 if colliding with same orientation, -1 if colliding with opposite orientations.
	within: function (obj) {
		let w = obj.w + this.w, h = obj.h + this.h
		let dx0 = zmod(this.x - obj.x, world.D), dy0 = this.y - obj.y
		if (Math.abs(dx0) < w && Math.abs(dy0) < h) return 1
		let dx1 = zmod(this.x - obj.x + world.R, world.D), dy1 = this.y + obj.y
		if (Math.abs(dx1) < w && Math.abs(dy1) < h) return -1
		return 0
	},
	draw: function (flip) {
		if (DEBUG) {
			UFX.draw("[ lw 1 ss white sr", view.mod(this.x, flip) - this.w, this.y - this.h, 2 * this.w, 2 * this.h, "]")
		}
	},
}


let FloatsToCeiling = {
	checkland: function (x0, y0) {
		if (this.landed) return
			for (let platform of world.platforms) {
				if (platform.catches(x0 + world.R, -y0 - this.h, this.x + world.R, -this.y - this.h)) {
					this.y = -platform.heightat(this.x + world.R) - this.h
					this.landed = true
					return
				}
			}
		if (this.y + this.h >= world.ceilingat(this.x)) {
			this.y = world.ceilingat(this.x) - this.h
			this.landed = true
		}
	},
	ready: function () {
		return this.landed
	},
	think: function (dt) {
		if (!this.landed) {
			let a = 500
			let y0 = this.y
			let vy = Math.min(this.vy + a * dt, 200)
			this.y += (this.vy + vy) / 2 * dt
			this.vy = vy
			this.checkland(this.x, y0)
		}
	},
}

let Repoppable = {
	ready: function () {
		return this.tpop == 0
	},
	pop: function () {
		this.tpop = this.Tpop
	},
	think: function (dt) {
		if (!this.ready()) this.tpop = Math.max(this.tpop - dt, 0)
	},
}

let Collectible = {
	collectible: function () {
		return this.alive
	},
	collect: function () {
		this.alive = false
	},
}

let RaisesScore = {
	collect: function () {
		progress.score += 1
		progress.got[[this.x, this.y, world.levelname]] = true
		progress.got[world.levelname] += 1
		save()
	},
}

let PowersUp = {
	collect: function () {
		progress.unlocked[this.n] = true
		save()
	},
}


function You() {
	this.grounded = true
	this.x = 0
	this.y = world.floorat(this.x)
	this.vx0 = 200
	this.vx = this.vx0
	this.vy = 0
	this.w = 20
	this.h = 40
	this.model = UFX.random.seedmethod(world.levelname, "choice", [1, 2, 3])
	this.platform = null
	this.clear = false
	this.thazard = 0
	this.cooldown = {}
}
You.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Rectangular)
	.addcomp({
		jump: function (balloons) {
			if (!this.grounded) return
			if (this.thazard > 0) return
			this.y += 0.1
			this.grounded = false
			progress.tutorial.jump = true
			this.vy = jumpvy
			let bpop = null
			balloons.forEach(balloon => {
				if (balloon.ready() && balloon.within(this) && this.thazard == 0) {
					bpop = balloon
					balloon.pop()
					this.vx = balloon.launchvx
					this.vy = balloon.launchvy
				}
			})
			if (bpop === null) {
				playsound("hop")
			} else if (bpop instanceof UpMushroom) {
				playsound("mushroom")
			} else {
				playsound("pop")
			}
		},
		releaseballoon: function (n) {
			if (this.thazard > 0) return
			if (this.cooldown[n]) {
				playsound("no")
				return
			}
			progress.tutorial["release" + n] = true
			let Balloon = {
				1: BackBalloon,
				2: UpBalloon,
				3: ForwardBalloon,
			}[n]
			world.balloons.push(new Balloon(this.x, this.y + this.h))
			this.cooldown[n] = 1
			playsound("launch")
		},
		interact: function (portals) {
//			if (this.grounded) return
//			if (this.vy > 0) return
			// Can potentially hit two bubbles in one frame.
			this.clear ||= !portals.some(portal => portal.within(this))
			if (this.clear) {
				portals.forEach(portal => {
					if (portal.within(this)) {
						let flip = portal.within(this) == -1
						if (portal.ready(flip)) {
							portal.enter(flip)
							playsound("portal")
						}
					}
				})
			}
		},
		hithazards: function (hazards) {
			hazards.forEach(hazard => {
				if (hazard.within(this)) {
					if (this.thazard == 0) {
						playsound("hazard")
						progress.damage += 1
					}
					this.thazard = 1
				}
			})
		},
		collect: function (stars) {
			stars.forEach(star => {
				if (star.collectible() && star.within(this, this.R)) {
					star.collect()
					if (star instanceof Star) playsound("coin")
					if (star instanceof Powerup) playsound("powerup")
				}
			})
		},
		slopeat: function() {
			if (!this.grounded) return 0
			if (this.platform === null) return world.slopeat(this.x)
			return this.platform.slopeat(this.x)
		},
		heightat: function () {
			if (!this.grounded) return 0
			if (this.platform === null) return world.floorat(this.x)
			return this.platform.heightat(this.x)
		},
		checkland: function (x0, y0) {
			if (this.grounded) return
			if (this.vy > 0) {
				if (this.y + this.h >= world.ceilingat(this.x)) {
					this.vy = 0
					return
				}
			}
			for (let platform of world.platforms) {
				if (platform.catches(x0, y0 - this.h, this.x, this.y - this.h)) {
					this.grounded = true
					this.platform = platform
					return
				}
			}
			if (this.y - this.h <= world.floorat(this.x)) {
				this.grounded = true
				this.platform = null
			}
		},
		think: function (dt, jumpheld) {
			this.thazard = Math.max(this.thazard - dt, 0)
			for (let n of [1, 2, 3]) {
				if (this.cooldown[n]) {
					this.cooldown[n] = Math.max(this.cooldown[n] - 0.5 * dt, 0)
				}
			}
			if (this.grounded) {
				let vx0 = this.vx0
				vx0 -= 120 * clamp(this.slopeat(), -1, 1)
	//			vx0 += 0.2 * (view.x - this.x)
				this.vx = approach(this.vx, vx0, 1000 * dt)
				if (this.slopeat() < -1) {
					this.grounded = false
					this.platform = null
					this.vy = -0.5 * this.vx
				}
			}
			let x0 = this.x, y0 = this.y
			this.x += this.vx * dt
			if (!this.grounded) {
				let a = world.levelname == "water" ? -1400 : -2000
				this.y += this.vy * dt + 0.5 * a * dt ** 2
				this.vy += a * dt
				if (!jumpheld && this.vy > 0) this.vy = 0
				this.checkland(x0, y0)
			}
			if (this.grounded) {
				let y = this.heightat()
				if (y === null) {
					this.grounded = false
					this.platform = null
					this.vy = 0
				} else {
					this.y = y + this.h
				}
				this.vy = 0
			}
		},
		draw0: function () {
			if (this.thazard > 0 && (this.thazard * 20) % 2 > 1) return []
			let f = 1 + 0.0007 * clamp(this.vy, -200, 200)
			let [ax0, ay0] = [78, 152]  // Position of anchor within image
			let scale = 2.4 * this.h / 304
			let frame = Math.floor(this.x / 30) % 4
			let imgname = `you${this.model}run${frame}`
			if (!this.grounded) {
				imgname = this.vy > 0 ? `up${this.model}` : `down${this.model}`
			}
			let r = -0.2 + 0.1 * this.slopeat()
			return ["[ r", r, "z", -scale, -scale, "drawimage", UFX.resource.images[imgname], -ax0, -ay0, "]"]
//				"b o 0", this.r, this.r, "ss orange lw 3 s"]
		},
	})




function NPC(x, y, name) {
	this.x = x
	;[this.y, this.platform] = ysettle(x, y)
	this.tilt = Math.atan(this.platform ? this.platform.slopeat(this.x) : world.slopeat(this.x))
	this.name = name
	this.w = 100
	this.h = 0
	this.t = 0
}
NPC.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp({
		think: function (dt) {
			this.t += dt
		},
		gettext: function (flip) {
			if (this.name == "tojump") {
				if (flip) {
					return "How did you\nget up there?"
				} else if (!progress.tutorial.jump) {
					return "Tap Space to jump"
				} else if (!progress.tutorial.mushroom) {
					return "Tap Space at\na mushroom to\nbounce off it"
				} else if (!progress.levelstars.forest) {
					return "You must collect\nat least one coin\nto visit the forest"
				} else {
					return "Welcome back!"
				}
			}
			if (this.name == "forest") {
				if (flip) return null
				if (!progress.unlocked[2]) {
					return "Get that balloon!"
				} else if (!progress.tutorial.release2) {
					return "Press 2 to\nlaunch a balloon!"
				} else if (progress.score < 4) {
					return "Watch your\ncooldown in\nthe upper right"
				} else {
					return "Press Esc to see\nwhich lands still\nhave coins!"
				}
			}
			if (this.name == "ruins") {
				if (flip) return null
				if (progress.score < 6) {
					return "Arrows or WASD\nto adjust speed"
				} else {
					return "Legend says there\nwere 15 coins"
				}
			}
			if (this.name == "under") {
				if (flip) return null
				if (!progress.unlocked[3]) {
					return "Another balloon!\nI suggest you nab it!"
				} else if (!progress.tutorial.release3) {
					return "Press 3 to\nlaunch a balloon!"
				} else {
					return "You can select\nballoons with Tab\nand Enter"
				}
			}
			if (this.name == "mountain") {
				if (flip) {
					if (progress.score < 15 && progress.score >= 12) {
						return "Huh? Why is\nthe door open?"
					}
					return null
				} else if (progress.score < 15) {
					return "Legend says you'll\nbeat the game\nthrough the W door"
				} else {
					return "The W door is open!\nThanks for playing!"
				}
			}
			if (this.name == "water") {
				if (flip) return null
				return "Legend says the magic\ncoins come from\nthe Mobius Dimension"
			}
			if (this.name == "fire") {
				if (flip) return null
				return "The path to the\nMobius Dimension\nwas forgotten long ago"
			}
		},
		draw0: function (flip) {
			let text = this.gettext(flip)
			let img = UFX.resource.images.gnombert0
			let drawline = ["[ r", -0.18 + this.tilt, "z 0.4 -0.4 drawimage", img, -103, -202, "]"]
			if (!text) return drawline
			let lines = text.split("\n").reverse()
			drawline.push("t 0 80 b rr -110 0 220", 23 + 20 * lines.length, "10 fs white f")
			drawline.push("vflip font 20px~'Viga' tab center middle fs black")
			for (let line of lines) {
				drawline.push(["t 0 -20 ft0", line.replaceAll(" ", "~")])
			}
			return drawline
		},
	})

function Hazard(x, y) {
	this.x = x
	;[this.y, this.platform] = ysettle(x, y)
	this.w = 0
	this.h = 0
	this.hflip = UFX.random.seedmethod([this.x, this.y], "flip")
	this.tilt = Math.atan(this.platform ? this.platform.slopeat(this.x) : world.slopeat(this.x))
}
Hazard.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Rectangular)
	.addcomp({
		draw0: function () {
			return ["r", this.tilt, "z", 0.3 * (this.hflip ? -1 : 1), -0.3,
				"drawimage", UFX.resource.images.hazard, -132, -157]
		},
	})


function Bubble(x, y) {
	this.x = x
	this.y = y
	this.Tpop = 2
	this.tpop = 0
	this.w = 30
	this.h = 30
	this.launchvy = 800
}
Bubble.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Rectangular)
	.addcomp(Repoppable)
	.addcomp({
		draw0: function () {
			let color = this.ready() ? "#fff" : "#666"
			return ["b o 0 0", this.r, "lw 4 ss", color, "s"]
		},
	})

let Balloon = {
	draw0: function () {
		return ["b o 0 0", Math.hypot(this.w, this.h), "lw 4 ss", this.color, "s"]
	},
	ready: function () {
		return true
	},
	pop: function () {
	},
	think: function (dt) {
	},
}
let DrawBalloon = {
	draw0: function () {
		let frame = mod(Math.round(this.y / 50), 2)
		let imgname = `balloon${this.n}${frame}`
		let scale = this.w / 70
		return ["[ z", scale, -scale, "drawimage", UFX.resource.images[imgname], -90, -90, "]"]
	},
}

let DiesOnPop = {
	pop: function () {
		this.alive = false
	},
}


function UpMushroom(x, y) {
	this.x = x
	;[this.y, this.platform] = ysettle(x, y)
	this.tilt = Math.atan(this.platform ? this.platform.slopeat(this.x) : world.slopeat(this.x))
	this.y += 10
	this.w = 30
	this.h = 30
	this.n = 2
	;[this.launchvx, this.launchvy] = blaunches[2]
	this.color = bcolors[2]
	this.alive = true
	this.twobble = 0
}
UpMushroom.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Rectangular)
	.addcomp(Balloon)
	.addcomp({
		pop: function () {
			progress.tutorial.mushroom = true
			save()
			this.twobble = 1
		},
		think: function (dt) {
			this.twobble = Math.max(this.twobble - dt, 0)
		},
		draw0: function (flip) {
			let imgname = "mushroom0"
			let img = UFX.resource.images[imgname]
			let w = img.width
			let f = 1 + 0.3 * this.twobble * Math.sin((1 - this.twobble) * 20)
			return ["r", this.tilt, "z", f, 1/f, "z 0.7 -0.7 drawimage", img, -w / 2, -80]
		},
	})


function UpBalloon(x, y) {
	this.x = x
	this.y = y
	this.vy = 0
	this.w = 30
	this.h = 30
	this.n = 2
	;[this.launchvx, this.launchvy] = blaunches[2]
	this.landed = false
	this.alive = true
	this.color = bcolors[2]
}
UpBalloon.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Rectangular)
	.addcomp(Balloon)
	.addcomp(DrawBalloon)
	.addcomp(FloatsToCeiling)
	.addcomp(DiesOnPop)


function ForwardBalloon(x, y) {
	this.x = x
	this.y = y
	this.vy = 0
	this.w = 30
	this.h = 30
	this.n = 3
	;[this.launchvx, this.launchvy] = blaunches[3]
	this.landed = false
	this.alive = true
	this.color = bcolors[3]
}
ForwardBalloon.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Rectangular)
	.addcomp(Balloon)
	.addcomp(DrawBalloon)
	.addcomp(FloatsToCeiling)
	.addcomp(DiesOnPop)


function BackBalloon(x, y) {
	this.x = x
	this.y = y
	this.vy = 0
	this.w = 30
	this.h = 30
	this.n = 1
	;[this.launchvx, this.launchvy] = blaunches[1]
	this.landed = false
	this.alive = true
	this.color = bcolors[1]
}
BackBalloon.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Rectangular)
	.addcomp(Balloon)
	.addcomp(DrawBalloon)
	.addcomp(FloatsToCeiling)
	.addcomp(DiesOnPop)

function Powerup(x, y, n) {
	this.x = x
	this.y = y
	this.n = n
	this.w = 30
	this.h = 30
	;[this.launchvx, this.launchvy] = blaunches[n]
	this.color = bcolors[n]
	this.alive = true
}
Powerup.prototype = UFX.Thing()
	.addcomp({
		draw: function (flip) {
			let xs = view.mods(this.x, this.w, flip)
			for (let x of xs) {
				UFX.draw("[ b m", x, this.y, "l", x, world.floorat(this.x), "lw 6 ss black s lw 2 ss silver s ]")
			}
		}
	})
	.addcomp(WorldBound)
	.addcomp(Rectangular)
	.addcomp(Balloon)
	.addcomp(DrawBalloon)
	.addcomp(Collectible)
	.addcomp(PowersUp)
	.addcomp({
		think: function (dt) {
		},
	})


function Star(x, y) {
	this.x = x
	this.y = y
	this.w = 20
	this.h = 20
	this.alive = true
}
Star.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Rectangular)
	.addcomp(Collectible)
	.addcomp(RaisesScore)
	.addcomp({
		draw0: function () {
			let scale = 8 / this.w
			let t = Date.now() * 0.001
			let r = 0.2 * Math.sin(2 * t)
			let frame = [0, 1, 2, 1][mod(Math.floor(6 * t), 4)]
			let imgname = `star${frame}`
			let drawline = [
				"z", scale, scale, "r", r,
				"drawimage", UFX.resource.images[imgname], -60, -60]
			return drawline
		},
	})


function Portal(x, y, name, needed) {
	this.x = x
	this.y = y
	this.name = name
	this.needed = needed
	this.w = 40
	this.h = 40
	this.wfactor = 4
}
Portal.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Rectangular)
	.addcomp({
		getplatform: function () {
			return new Platform([[this.x - this.w * 1.2, this.y - this.w], [this.x + this.w * 1.2, this.y - this.w]], true)
		},
		draw0: function (flip) {
			let imgname = this.ready(flip) ? "portalopen" : "portalclosed"
			let drawline = ["[ z 0.64 -0.64 drawimage", UFX.resource.images[imgname], -100, -90, "]"]
			if (this.needed > 0) {
				drawline.push("[ t 100 0 z 0.6 -0.6 drawimage", UFX.resource.images.sign, -118, -30,
					"tab right middle fs black font 40px~'Viga' ft", this.needed + "x", 0, 8,
					"t 30 0 z 0.4 0.4 drawimage", UFX.resource.images.star1, -60, -60,
					"]")
			}
			imgname = `symbol${this.name}`
			let img = UFX.resource.images[imgname]
			drawline.push("[ t 0 60 b o 0 0 25 fs #666 f b o 0 0 23 fs #bbb f",
				"z 0.35 -0.35 drawimage", img, -img.width / 2, -img.height / 2, "]")
			return drawline
		},
		ready: function (flip) {
			let needed = this.needed
			if (flip && this.needed == 2) needed = 5
			if (flip && this.needed == 6) needed = 9
			if (flip && this.needed == 15) needed = 12
			return progress.score >= needed
		},
		enter: function (flip) {
			world.nextlevel = (this.name == "win" && flip) ? "space" : this.name
		},
	})


function Platform(ps, invisible) {
	this.ps = ps
	;[this.x0, this.y0] = ps[0]
	;[this.x1, this.y1] = ps[ps.length - 1]
	this.x = (this.x0 + this.x1) / 2
	this.y = (this.y0 + this.y1) / 2
	this.w = (this.x1 - this.x0) / 2
	this.h = 1000
	this.invisible = invisible
	
	this.drawline = []
	if (!this.invisible) {
		let y0 = 450 / world.z
		this.drawline.push("( m", this.x0 - this.x, -y0 - this.y)
		for (let [x, y] of ps) this.drawline.push("l", x - this.x, y - this.y)
		this.drawline.push("l", this.x1 - this.x, -y0 - this.y, ") fs", world.groundcolor, "f")
		
		this.drawline.push("b m", this.x0 - this.x, this.y0 - this.y)
		for (let [x, y] of ps) this.drawline.push("l", x - this.x, y - this.y)
		this.drawline.push("ss", world.edgecolor, "lw 10 s")
	}
}
Platform.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp({
		within: function (x) {
			return this.x0 <= x && x <= this.x1
		},
		index: function (x) {  // TODO: binary search
			if (!this.within(x)) return null
			let j1 = 1
			while (this.ps[j1][0] < x) j1 += 1
			return j1
		},
		heightat: function (x) {
			x = cmod(x, world.D, this.x)
			let j1 = this.index(x)
			if (j1 === null) return null
			let [x0, y0] = this.ps[j1 - 1]
			let [x1, y1] = this.ps[j1]
			return y0 + (x - x0) / (x1 - x0) * (y1 - y0)
		},
		slopeat: function (x) {
			x = cmod(x, world.D, this.x)
			let j1 = this.index(x)
			if (j1 === null) return null
			let [x0, y0] = this.ps[j1 - 1]
			let [x1, y1] = this.ps[j1]
			return (y1 - y0) / (x1 - x0)
		},
		catches: function (x0, y0, x1, y1) {
			x0 = cmod(x0, world.D, this.x)
			x1 = cmod(x1, world.D, this.x)
			if (!this.within(x0) || !this.within(x1)) return false
			return this.heightat(x0) < y0 && this.heightat(x1) >= y1
		},
		draw0: function () {
			return this.drawline
		},
	})
function makeplatform(x0, x1, f) {
	let ps = []
	for (let x = Math.round(x0) ; x <= Math.round(x1) ; ++x) {
		ps.push([x, f(x)])
	}
	return new Platform(ps)
}
function makesineplatform(ps) {
	let [xmin, ymin] = ps[0]
	let [xmax, ymax] = ps[ps.length - 1]
	function f(x) {
		if (x <= xmin) return ymin
		if (x >= xmax) return ymax
		let j1 = 0
		while (ps[j1][0] < x) ++j1
		let [x0, y0] = ps[j1 - 1]
		let [x1, y1] = ps[j1]
		let f = (x - x0) / (x1 - x0)
		let g = 0.5 - 0.5 * Math.cos(f * Math.PI)
		return y0 + (y1 - y0) * g
	}
	return makeplatform(xmin, xmax, f)
}

function makelinearplatform(ps) {
	let [xmin, ymin] = ps[0]
	let [xmax, ymax] = ps[ps.length - 1]
	function f(x) {
		if (x <= xmin) return ymin
		if (x >= xmax) return ymax
		let j1 = 0
		while (ps[j1][0] < x) ++j1
		let [x0, y0] = ps[j1 - 1]
		let [x1, y1] = ps[j1]
		let f = (x - x0) / (x1 - x0)
		let g = f
		return y0 + (y1 - y0) * g
	}
	return makeplatform(xmin, xmax, f)
}


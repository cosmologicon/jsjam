
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
		let xs = view.mods(this.x, this.w, flip)
		if (xs.length == 0) return
		let drawline = this.draw0()
		xs.forEach(x => UFX.draw("[ t", x, this.y, drawline, "]"))
	},
	draw0: function () {
		return []
	},
}

function ysettle(x, y0) {
	let y = world.floorat(x)
	for (let platform of world.platforms) {
		if (platform.within(x)) {
			let yplatform = platform.heightat(x)
			if (yplatform > y && yplatform <= y0) {
				y = yplatform
			}
		}
	}
	return y
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
		UFX.draw("[ lw 1 ss white sr", view.mod(this.x, flip) - this.w, this.y - this.h, 2 * this.w, 2 * this.h, "]")
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
	},
}

let PowersUp = {
	collect: function () {
		progress.unlocked[this.n] = true
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
	this.model = UFX.random.choice([1, 2, 3])
	this.platform = null
	this.clear = false
	this.thazard = 0
}
You.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Rectangular)
	.addcomp({
		jump: function (balloons) {
			if (!this.grounded) return
			if (this.thazard > 0) return
			this.grounded = false
			this.vy = jumpvy
			balloons.forEach(balloon => {
				if (balloon.ready() && balloon.within(this) && this.thazard == 0) {
					balloon.pop()
					this.vx = balloon.launchvx
					this.vy = balloon.launchvy
				}
			})
		},
		releaseballoon: function (n) {
			let Balloon = {
				1: BackBalloon,
				2: UpBalloon,
				3: ForwardBalloon,
			}[n]
			world.balloons.push(new Balloon(this.x, this.y + this.h))
		},
		interact: function (portals) {
//			if (this.grounded) return
//			if (this.vy > 0) return
			// Can potentially hit two bubbles in one frame.
			this.clear ||= !portals.some(portal => portal.within(this))
			if (this.clear) {
				portals.forEach(portal => {
					if (portal.ready() && portal.within(this)) {
						portal.enter()
					}
				})
			}
		},
		hithazards: function (hazards) {
			hazards.forEach(hazard => {
				if (hazard.within(this)) {
					this.thazard = 1
				}
			})
		},
		collect: function (stars) {
			stars.forEach(star => {
				if (star.collectible() && star.within(this, this.R)) {
					star.collect()
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
			} else {
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
			}
		},
		think: function (dt, jumpheld) {
			this.thazard = Math.max(this.thazard - dt, 0)
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
				let a = -2000
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

function Hazard(x, y) {
	this.x = x
	this.y = ysettle(x, y)
	this.w = 0
	this.h = 0
}
Hazard.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Rectangular)
	.addcomp({
		draw0: function () {
			return ["b o 0 0 10 fs red f"]
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

let DiesOnPop = {
	pop: function () {
		this.alive = false
	},
}


function UpMushroom(x, y) {
	this.x = x
	this.y = ysettle(x, y)
	this.w = 30
	this.h = 30
	;[this.launchvx, this.launchvy] = blaunches[2]
	this.color = bcolors[2]
	this.alive = true
}
UpMushroom.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Rectangular)
	.addcomp(Balloon)


function UpBalloon(x, y) {
	this.x = x
	this.y = y
	this.vy = 0
	this.w = 30
	this.h = 30
	;[this.launchvx, this.launchvy] = blaunches[2]
	this.landed = false
	this.alive = true
	this.color = bcolors[2]
}
UpBalloon.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Rectangular)
	.addcomp(FloatsToCeiling)
	.addcomp(Balloon)
	.addcomp(DiesOnPop)


function ForwardBalloon(x, y) {
	this.x = x
	this.y = y
	this.vy = 0
	this.w = 30
	this.h = 30
	;[this.launchvx, this.launchvy] = blaunches[3]
	this.landed = false
	this.alive = true
	this.color = bcolors[3]
}
ForwardBalloon.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Rectangular)
	.addcomp(FloatsToCeiling)
	.addcomp(Balloon)
	.addcomp(DiesOnPop)


function BackBalloon(x, y) {
	this.x = x
	this.y = y
	this.vy = 0
	this.w = 30
	this.h = 30
	;[this.launchvx, this.launchvy] = blaunches[1]
	this.landed = false
	this.alive = true
	this.color = bcolors[1]
}
BackBalloon.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Rectangular)
	.addcomp(FloatsToCeiling)
	.addcomp(Balloon)
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
	.addcomp(WorldBound)
	.addcomp(Rectangular)
	.addcomp(Balloon)
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
			let r0 = Math.hypot(this.w, this.h), r1 = r0 / 2
			let drawline = ["b m", 0, r0]
			for (let j = 0 ; j < 10 ; ++j) {
				let r = j % 2 == 0 ? r0 : r1, theta = j / 10 * tau
				drawline.push("l", r * Math.sin(theta), r * Math.cos(theta))
			}
			drawline.push(") fs yellow ss black lw 2 s f")
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
}
Portal.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Rectangular)
	.addcomp({
		getplatform: function () {
			return new Platform([[this.x - this.w * 1.2, this.y - this.w], [this.x + this.w * 1.2, this.y - this.w]])
		},
		draw0: function () {
			return ["b fs purple fr", -this.w, -this.h, 2 * this.w, 2 * this.h,
				"tab center middle font 20px~Viga fs black ss white lw 4 vflip sft", this.name, 0, -10,
				"sft", `${this.needed}`, 0, 10]
		},
		ready: function () {
			return progress.score >= this.needed
		},
		enter: function () {
			world.nextlevel = this.name
		},
	})


function Platform(ps) {
	this.ps = ps
	;[this.x0, this.y0] = ps[0]
	;[this.x1, this.y1] = ps[ps.length - 1]
	this.x = (this.x0 + this.x1) / 2
	this.y = (this.y0 + this.y1) / 2
	this.w = (this.x1 - this.x0) / 2
	this.h = 1000
	
	this.drawline = []
	this.drawline.push("( m", this.x0 - this.x, -450 - this.y)
	for (let [x, y] of ps) this.drawline.push("l", x - this.x, y - this.y)
	this.drawline.push("l", this.x1 - this.x, -450 - this.y, ") fs", world.groundcolor, "f")
	
	this.drawline.push("b m", this.x0 - this.x, this.y0 - this.y)
	for (let [x, y] of ps) this.drawline.push("l", x - this.x, y - this.y)
	this.drawline.push("ss", world.edgecolor, "lw 10 s")
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




let WorldBound = {
	onscreen: function (flip) {
		return view.onscreen(this.x, this.r, flip)
	},
	draw: function (flip) {
		UFX.draw("[ t", view.mod(this.x, flip), this.y, this.draw0(), "]")
	},
	draw0: function () {
		return []
	},
}

let Circular = {
	within: function (obj) {
		let dx0 = zmod(this.x - obj.x, world.D), dy0 = this.y - obj.y
		let dx1 = zmod(this.x - obj.x + world.R, world.D), dy1 = this.y + obj.y
		return Math.hypot(dx0, dy0) <= this.r || Math.hypot(dx1, dy1) <= this.r
	},
}

let FloatsToCeiling = {
	checkland: function (x0, y0) {
		if (this.landed) return
			for (let platform of world.platforms) {
				if (platform.catches(x0 + world.R, -y0, this.x + world.R, -this.y)) {
					this.y = -platform.heightat(this.x + world.R) - this.r
					this.landed = true
					return
				}
			}
		if (this.y + this.r >= world.ceilingat(this.x)) {
			this.y = world.ceilingat(this.x) - this.r
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


function You() {
	this.grounded = true
	this.x = 2000
	this.y = world.floorat(this.x)
	this.vx0 = 200
	this.vx = this.vx0
	this.vy = 0
	this.r = 30
	this.model = UFX.random.choice([1, 2, 3])
	this.platform = null
}
You.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp({
		jump: function () {
			if (!this.grounded) return
			this.grounded = false
			this.vy = 800
		},
		releaseballoon: function (n) {
			let Balloon = {
				1: BackBalloon,
				2: UpBalloon,
				3: ForwardBalloon,
			}[n]
			world.balloons.push(new Balloon(this.x, this.y + 2 * this.r))
		},
		interact: function (bubbles) {
			if (this.grounded) return
			if (this.vy > 0) return
			// Can potentially hit two bubbles in one frame.
			bubbles.forEach(bubble => {
				if (bubble.ready() && bubble.within(this)) {
					bubble.pop()
					this.vx = bubble.launchvx
					this.vy = bubble.launchvy
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
				if (this.y + 2 * this.r >= world.ceilingat(this.x)) {
					this.vy = 0
					return
				}
			} else {
				for (let platform of world.platforms) {
					if (platform.catches(x0, y0, this.x, this.y)) {
						this.grounded = true
						this.platform = platform
						return
					}
				}
				if (this.y <= world.floorat(this.x)) {
					this.grounded = true
					this.platform = null
				}
			}
		},
		think: function (dt) {
			let vx0 = this.vx0
			vx0 -= 200 * this.slopeat()
			vx0 += 0.2 * (view.x - this.x)
			this.vx = approach(this.vx, vx0, 1000 * dt)
			let x0 = this.x, y0 = this.y
			this.x += this.vx * dt
			if (!this.grounded) {
				let a = -2000
				this.y += this.vy * dt + 0.5 * a * dt ** 2
				this.vy += a * dt
				this.checkland(x0, y0)
			}
			if (this.grounded) {
				let y = this.heightat()
				if (y === null) {
					this.grounded = false
					this.platform = null
					this.vy = 0
				} else {
					this.y = this.heightat()
				}
				this.vy = 0
			}
		},
		draw0: function () {
			let f = 1 + 0.0007 * clamp(this.vy, -200, 200)
			let [ax0, ay0] = [78, 276]  // Position of anchor within image
			let scale = 3 * this.r / 304
			let frame = Math.floor(this.x / 30) % 4
			let imgname = `you${this.model}run${frame}`
			let r = -0.2 + 0.1 * this.slopeat()
			return ["[ r", r, "z", -scale, -scale, "drawimage", UFX.resource.images[imgname], -ax0, -ay0, "]"]
//				"b o 0", this.r, this.r, "ss orange lw 3 s"]
		},
	})

function Bubble(x, y) {
	this.x = x
	this.y = y
	this.Tpop = 2
	this.tpop = 0
	this.r = 30
	this.launchvy = 800
}
Bubble.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Circular)
	.addcomp(Repoppable)
	.addcomp({
		draw0: function () {
			let color = this.ready() ? "#fff" : "#666"
			return ["b o 0 0", this.r, "lw 4 ss", color, "s"]
		},
	})

let Balloon = {
	draw0: function () {
		return ["b o 0 0", this.r, "lw 4 ss", this.color, "s"]
	},
	ready: function () {
		return true
	},
	pop: function () {
		this.alive = false
	},
}

function UpBalloon(x, y) {
	this.x = x
	this.y = y
	this.vy = 0
	this.r = 30
	this.launchvx = 200
	this.launchvy = 800
	this.landed = false
	this.alive = true
	this.color = "blue"
}
UpBalloon.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Circular)
	.addcomp(FloatsToCeiling)
	.addcomp(Balloon)


function ForwardBalloon(x, y) {
	this.x = x
	this.y = y
	this.vy = 0
	this.r = 30
	this.launchvx = 800
	this.launchvy = 400
	this.landed = false
	this.alive = true
	this.color = "green"
}
ForwardBalloon.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Circular)
	.addcomp(FloatsToCeiling)
	.addcomp(Balloon)


function BackBalloon(x, y) {
	this.x = x
	this.y = y
	this.vy = 0
	this.r = 30
	this.launchvx = -500
	this.launchvy = 400
	this.landed = false
	this.alive = true
	this.color = "red"
}
BackBalloon.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Circular)
	.addcomp(FloatsToCeiling)
	.addcomp(Balloon)

function Platform(ps) {
	this.ps = ps
	;[this.x0, this.y0] = ps[0]
	;[this.x1, this.y1] = ps[ps.length - 1]
	this.x = (this.x0 + this.x1) / 2
	this.y = (this.y0 + this.y1) / 2
	this.r = (this.x1 - this.x0) / 2
	
	this.drawline = []
	this.drawline.push("( m", this.x0 - this.x, -450 - this.y)
	for (let [x, y] of ps) this.drawline.push("l", x - this.x, y - this.y)
	this.drawline.push("l", this.x1 - this.x, -450 - this.y, ") fs #ccc f")
	
	this.drawline.push("b m", this.x0 - this.x, this.y0 - this.y)
	for (let [x, y] of ps) this.drawline.push("l", x - this.x, y - this.y)
	this.drawline.push("ss white lw 10 s")
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



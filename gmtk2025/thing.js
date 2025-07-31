
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

let Poppable = {
	ready: function () {
		return this.tpop == 0
	},
	within: function (obj) {
		let dx0 = zmod(this.x - obj.x, world.D), dy0 = this.y - obj.y
		let dx1 = zmod(this.x - obj.x + world.R, world.D), dy1 = this.y + obj.y
		return Math.hypot(dx0, dy0) <= this.r || Math.hypot(dx1, dy1) <= this.r
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
	this.r = 20
}
You.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp({
		jump: function () {
			if (!this.grounded) return
			this.grounded = false
			this.vy = 600
		},
		interact: function (bubbles) {
			if (this.grounded) return
			if (this.vy > 0) return
			// Can potentially hit two bubbles in one frame.
			bubbles.forEach(bubble => {
				if (bubble.ready() && bubble.within(this)) {
					bubble.pop()
					this.vy = 600
				}
			})
		},
		think: function (dt) {
			this.vx = this.vx0
			if (this.grounded) this.vx -= 200 * world.slopeat(this.x)
			this.vx += 0.2 * (view.x - this.x)
			this.x += this.vx * dt
			if (!this.grounded) {
				let a = -2000
				this.y += this.vy * dt + 0.5 * a * dt ** 2
				this.vy += a * dt
				if (this.vy < 0 && this.y <= world.floorat(this.x)) {
					this.grounded = true
				}
			}
			if (this.grounded) {
				this.y = world.floorat(this.x)
				this.vy = 0
			}
		},
		draw0: function () {
			let f = 1 + 0.0007 * clamp(this.vy, -200, 200)
			return ["z", f, 1/f, "b o 0", this.r, this.r, "fs orange f"]
		},
	})

function Bubble(x, y) {
	this.x = x
	this.y = y
	this.Tpop = 2
	this.tpop = 0
	this.r = 30
}
Bubble.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp(Poppable)
	.addcomp({
		draw0: function () {
			let color = this.ready() ? "#fff" : "#666"
			return ["b o 0 0", this.r, "lw 4 ss", color, "s"]
		},
	})


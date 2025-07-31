
let dist = (obj0, obj1) => Math.hypot(obj0.x - obj1.x, obj0.y - obj1.y)


function You() {
	this.grounded = true
	this.x = 2000
	this.y = world.floorat(this.x)
	this.vx0 = 200
	this.vx = this.vx0
	this.vy = 0
}
You.prototype = {
	jump: function () {
		if (!this.grounded) return
		this.grounded = false
		this.vy = 600
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
	draw: function () {
		let f = 1 + 0.0007 * clamp(this.vy, -200, 200)
		UFX.draw("[ t", this.x, this.y, "z", f, 1/f, "b o 0 20 20 fs orange f ]")
	},
}

function Bubble(x, y) {
	this.x = x
	this.y = y
	this.Tpop = 2
	this.tpop = 0
	this.R = 30
}
Bubble.prototype = {
	ready: function () {
		return this.tpop > 0
	},
	within: function (obj) {
		return dist(this, obj) <= this.R
	},
	pop: function () {
		this.tpop = this.Tpop
	},
	think: function (dt) {
		if (!this.ready()) this.tpop = Math.max(this.tpop - dt, 0)
	},
	draw: function () {
		let color = this.ready() ? "#77f" : "#006"
		UFX.draw("[ t", this.x, this.y, "b o 0 0", this.R, "lw 4 ss", color, "s ]")
	},
}


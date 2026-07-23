// Angles (A) convention:
//   0 = North (x = 0, y = 1)
//   tau/4 = East (x = 1, y = 0)


let WorldRound = {
	setpos: function (pos) {
		this.pos = pos
	},
	setsize: function (r) {
		this.r = r
	},
	setpossize: function (pos, r) {
		this.setpos(pos)
		this.setsize(r)
	},
	Ato: function (pos) {
		let [x0, y0] = this.pos, [x1, y1] = pos
		let dx = x1 - x0, dy = y1 - y0
		return dx == 0 && dy == 0 ? 0 : Math.atan2(dx, dy)
	},
	draw: function () {
		graphics.drawcircleG(this.pos, this.r, "rgba(0,0,0,0.3)")
//		console.log("[ t", this.pos, "z", 2 * rA, rA, "b o 0 0 1 fs", this.color, "f ]")
		
	},
}

function Monk(pos) {
	this.setpossize(pos, 1)
	this.target = null
	this.bounce = 0
	this.t = 0
}
Monk.prototype = UFX.Thing()
	.addcomp(WorldRound)
	.addcomp({
		settarget: function (target) {
			this.target = target
		},
		think: function (dt) {
			this.t += dt
			if (this.target !== null) {
				this.setpos(approach2(this.pos, this.target, 7 * dt))
				if ("" + this.pos == this.target) this.target = null
				this.bounce = Math.sin(this.t * 25)
			} else {
				this.bounce = 0
			}
		},
		draw: function () {
			let scale = 1 / 360
			UFX.draw("[", view.lookG(this.pos),
				"[",
				"t", 0, -this.bounce * 0.1,
				"z", scale, scale, "t", -362, -720,
				"drawimage0", UFX.resource.images.guy,
				"]",
//				"b o 0 0 0.1 fs orange f",
				"]")
		},
	})

let GearLogic = {
	setsize: function (r) {
		this.Ntooth = Math.round((r + 0.5) * 2.3)
	},
	// 0.5: tooth is pointing in direction A
	ftooth: function (A) {
		return mod((A - this.A) * this.Ntooth / tau, 1)
	},
	alignto: function (gear) {
		let A = this.Ato(gear.pos)
		let ftooth = 0.5 + gear.ftooth(A + tau/2)
		this.A = A + ftooth / this.Ntooth * tau
	},
	think: function (dt) {
	},
}

let DrawGear = {
	draw: function () {
		graphics.drawgearG(this.pos, this.r, this.Ntooth, this.A, this.color)
	},
}
function Gear(pos, r) {
	this.setpossize(pos, r)
	this.A = 0
	this.color = "gray"
}
Gear.prototype = UFX.Thing()
	.addcomp(WorldRound)
	.addcomp(GearLogic)
	.addcomp(DrawGear)

function GoGear(pos, r, omega) {
	this.setpossize(pos, r)
	this.A = 0
	this.color = "gray"
	this.omega = omega
}
GoGear.prototype = UFX.Thing()
	.addcomp(WorldRound)
	.addcomp(GearLogic)
	.addcomp(DrawGear)
	.addcomp({
		think: function (dt) {
			this.A += this.omega * dt
		},
	})

function FollowGear(pos, r, parent) {
	this.setpossize(pos, r)
	this.A = 0
	this.color = "gray"
	this.parent = parent
}
FollowGear.prototype = UFX.Thing()
	.addcomp(WorldRound)
	.addcomp(GearLogic)
	.addcomp(DrawGear)
	.addcomp({
		think: function (dt) {
			this.alignto(this.parent)
		},
	})


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
	infootprint: function (pos) {
		return distance(pos, this.pos) <= this.r
	},
	Ato: function ([x1, y1]) {
		let [x0, y0] = this.pos
		let dx = x1 - x0, dy = y1 - y0
		return dx == 0 && dy == 0 ? 0 : Math.atan2(dx, dy)
	},
	draw: function () {
		graphics.fillcircleG(this.pos, this.r, "rgba(0,0,0,0.3)")
	},
}
let backtofront = (obj0, obj1) => obj1.pos[1] - obj0.pos[1]
let fronttoback = (obj0, obj1) => backtofront(obj1, obj0)

let Selectable = {
	collidepoint: function ([x, y]) {
		let [x0, y0] = this.pos
		return Math.hypot(x0 - x, 0.5 * (y0 + 2 - y)) < 1
	},
	onclick: function () {
		control.select(this)
	},
	draw: function () {
		if (control.selected !== this) return
		UFX.draw("[", view.lookG(this.pos), "( m 0 -2 l -0.2 -2.5 l 0.2 -2.5 ) fs orange ss black lw 0.1 f s ]")
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
	.addcomp(Selectable)


function Counter(pos, N) {
	this.setpossize(pos, 0.2)
	this.N = N
}
Counter.prototype = UFX.Thing()
	.addcomp(WorldRound)
	.addcomp({
		think: function (dt) {
		},
		tick: function () {
			this.N -= 1
		},
		draw: function () {
			UFX.draw("[", view.lookG(this.pos),
				"lw 0.4 b m 0 0 l 0 -1 ss black s",
				"fs gray ss black lw 0.1 sfr -2 -2 4 1",
				"t 0 -1.5 font 0.6px~'Viga' tab center middle",
				"fs white ss black lw 0.1 sft0 " + this.N,
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
	attachsignal: function (obj) {
		this.signals ||= []
		this.signals.push(obj)
	},
	normA: function (N) {
		this.A -= tau * N
	},
	think: function (dt) {
		let N = Math.floor(this.A / tau)
		if (N) {
			this.normA(N)
			if (this.signals) this.signals.forEach(obj => obj.tick(N))
		}
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

function PushGear(pos, r) {
	this.setpossize(pos, r)
	this.A = 0
	this.color = "gray"
	this.Atarget = 0
}
PushGear.prototype = UFX.Thing()
	.addcomp(WorldRound)
	.addcomp(GearLogic)
	.addcomp(DrawGear)
	.addcomp({
		collidepoint: function (pos) {
			return this.infootprint(pos)
		},
		think: function (dt) {
			this.A = softapproach(this.A, this.Atarget, 10 * dt)
		},
		onclick: function () {
			this.Atarget += 2
		},
		normA: function (N) {
			this.Atarget -= N * tau
		},
		draw: function () {
			UFX.draw("[", view.lookG(this.pos), "z", this.r, this.r / 2, "z 0.01 0.01",
				"r", this.A, "( m 0 -90 l 10 -70 l -10 -70 ) fs red ss black lw 5 s f ]")
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


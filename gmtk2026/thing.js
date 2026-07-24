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
let WalkCycle = {
	init: function () {
		this.twalk = 0
		this.walkfps = 14
		this.walkjframe = 0
	},
	think: function (dt) {
		this.twalk = this.target === null ? 0 : this.twalk + dt
		let jframe = mod(Math.floor(this.twalk * this.walkfps), 4)
		this.walkjframe = [0, 1, 0, 2][jframe]
	},
}
let FaceOrdinal = {
	init: function () {
		this.Afacing = tau / 2
		this.jface = 4
	},
	think: function () {
		if (this.target === null) return
		if ("" + this.pos == this.target) return
		this.Afacing = this.Ato(this.target)
		this.jface = mod(Math.round(this.Afacing / (tau / 8)), 8)
	},
}
function facespec(jface) {
	let facing = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][jface]
	return [facing.replace(/W/, "E"), facing.includes("W")]
}


let StationWorker = {
	start: function () {
		this.station = null
		this.speed = 1
	},
	settarget: function () {
		if (this.station !== null) this.station.monk = null
		this.station = null
	},
	setstation: function (station) {
		if (station.monk !== null) return false
		this.settarget(station.pos)
		this.station = station
		station.monk = this
	},
	think: function (dt) {
		this.atstation = this.station !== null && this.target === null
		if (this.atstation) this.station.work(this.speed * dt)
	},
}


function Monk(pos) {
	this.start()
	this.setpossize(pos, 1)
	this.bounce = 0
	this.t = 0
}
Monk.prototype = UFX.Thing()
	.addcomp(WorldRound)
	.addcomp(StationWorker)
	.addcomp(WalkCycle)
	.addcomp(FaceOrdinal)
	.addcomp({
		start: function () {
			this.target = null
		},
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
		getframe: function () {
			if (this.atstation) {
				let [dir, flip] = facespec(mod(Math.round(-1.6 * this.station.gear.getmultiplier() * this.t * this.speed + 2), 8))
				return [`monk${dir}work`, flip]
			} else {
				let [dir, flip] = facespec(this.jface)
				return [`monk${dir}${this.walkjframe}`, flip]
			}
		},
		draw: function () {
			let scale = 1 / 360
			let [fname, flip] = this.getframe()
			let [xoff, yoff] = monkimgoffsets[fname], h = 720
			if (fname.includes("1") || fname.includes("2")) yoff += 30
			UFX.draw("[", view.lookG(this.pos),	"z", scale, scale)
			if (flip) UFX.draw("hflip")
			UFX.draw("t", -xoff, -yoff - h, "drawimage0", UFX.resource.images[fname], "]")
		},
	})
	.addcomp(Selectable)


let Countdown = {
	start: function () {
		this.N = 1
		this.counting = true
	},
	tick: function (dN) {
		while (this.counting && dN >= this.N) {
			dN -= this.N
			this.N = 0
			this.complete()
		}
		if (this.counting) this.N -= dN
	},
}

let ExponentialIntervals = {
	start: function () {
		this.jinterval = 0
	},
	complete: function () {
		this.jinterval += 1
		let n = Math.floor(this.jinterval / 3), d = this.jinterval - n * 3
		this.N = [1, 2, 5][d] * 10 ** n
	},
}



function RecruitCounter(pos) {
	this.start()
	this.setpossize(pos, 0.2)
}
RecruitCounter.prototype = UFX.Thing()
	.addcomp(WorldRound)
	.addcomp(Countdown)
	.addcomp(ExponentialIntervals)
	.addcomp({
		complete: function () {
			let [x, y] = this.pos
			x += UFX.random(-5, 5)
			y += UFX.random(-5, 5)
			state.monks.push(new Monk([x, y]))
		},
		draw: function () {
			UFX.draw("[", view.lookG(this.pos),
				"rr -1 -2.3 2 1.2 0.3 fs #886 ss #330 lw 0.1 s f",
				"tab center middle ss black",
				"t 0 -2",
				"font 0.4px~'Viga' fs #ffc lw 0.04 sft0 Recruit",
				"t 0 0.5",
				"font 0.6px~'Viga' fs #ccf lw 0.04 sft0", `${this.N}`,
				"]")
		},
	})


let MultipliesGear = {
	start: function () {
		this.gear = null
		this.multiplier = 1
	},
	setgear: function (gear) {
		this.gear = gear
		gear.addmultiplier(this)
	},
	complete: function () {
		this.multiplier += 1
	},
}
let HasMultipliers = {
	start: function () {
		this.multipliers = []
	},
	addmultiplier: function (multiplier) {
		this.multipliers.push(multiplier)
	},
	getmultiplier: function () {
		let m = 1
		this.multipliers.forEach(multiplier => m *= multiplier.multiplier)
		return m
	},
}



function MultiplierCounter(pos, gear) {
	this.start()
	this.setpossize(pos, 0.2)
	this.setgear(gear)
}
MultiplierCounter.prototype = UFX.Thing()
	.addcomp(WorldRound)
	.addcomp(Countdown)
	.addcomp(ExponentialIntervals)
	.addcomp(MultipliesGear)
	.addcomp({
		draw: function () {
			UFX.draw("[", view.lookG(this.pos),
				"rr -1 -2.3 2 1.2 0.3 fs #886 ss #330 lw 0.1 s f",
				"tab center middle ss black",
				"t 0 -2",
				"font 0.4px~'Viga' fs #ffc lw 0.04 sft0", `${this.multiplier}x`,
				"t 0 0.5",
				"font 0.6px~'Viga' fs #ccf lw 0.04 sft0", `${this.N}`,
				"]")
		},
	})


/*
function Counter(pos, N) {
	this.setpossize(pos, 0.2)
	this.N = N
}
Counter.prototype = UFX.Thing()
	.addcomp(WorldRound)
	.addcomp({
		think: function (dt) {
		},
		tick: function (dN) {
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
*/

let GearLogic = {
	start: function () {
		this.A = 0
	},
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
	advance: function (dA) {
		this.A += dA * this.getmultiplier()
	},
	radvance: function (dr) {
		this.advance(dr / this.r)
	},
	tick: function (N) {
		this.A -= tau * N
	},
	think: function (dt) {
		let N = Math.floor(this.A / tau)
		if (N) this.tick(N)
	},
}

let HasStations = {
	start: function () {
		this.stations = []
	},
	addstation: function (station) {
		this.stations.push(station)
	},
	placestations: function (Nstation) {
		let r = this.r + 2
		range(0, Nstation, 1).forEach(jdir => {
			let Astation = (jdir + 0.5) / Nstation * tau
			let pos = polaroff(this.pos, r, Astation)
			let station = new Station(pos, this)
			state.stations.push(station)
		})
	},
}

let HasSignals = {
	start: function () {
		this.signals = []
	},
	addsignal: function (obj) {
		this.signals.push(obj)
	},
	tick: function (N) {
		this.signals.forEach(obj => obj.tick(N))
	},
}

/*
let HasChildren = {
	start: function () {
		this.children = []
	},
	addchild: function (child) {
		this.children.push(child)
		child.parent = this
	},
}
*/

let DrawGear = {
	start: function () {
		this.color = "gray"
	},
	draw: function () {
		graphics.drawgearG(this.pos, this.r, this.Ntooth, this.A, this.color)
		UFX.draw("[", view.lookG(this.pos), "z", this.r, this.r / 2, "z 0.01 0.01",
			"r", this.A, "( m 0 -90 l 10 -70 l -10 -70 ) fs red ss black lw 5 s f ]")
	},
}

/*
function Gear(pos, r) {
	this.start()
	this.setpossize(pos, r)
}
Gear.prototype = UFX.Thing()
	.addcomp(WorldRound)
	.addcomp(GearLogic)
	.addcomp(DrawGear)
*/

function CounterGear(pos, r, counter) {
	this.start()
	this.setpossize(pos, r)
	this.addsignal(counter)
}
CounterGear.prototype = UFX.Thing()
	.addcomp(WorldRound)
	.addcomp(GearLogic)
	.addcomp(HasMultipliers)
	.addcomp(HasStations)
	.addcomp(HasSignals)
	.addcomp(DrawGear)


function GoGear(pos, r, omega) {
	this.setpossize(pos, r)
	this.A = 0
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

/*
function PushGear(pos, r) {
	this.start()
	this.setpossize(pos, r)
	this.A = 0
	this.color = "gray"
	this.Atarget = 0
}
PushGear.prototype = UFX.Thing()
	.addcomp(WorldRound)
	.addcomp(GearLogic)
	.addcomp(HasChildren)
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
*/

function Station(pos, gear) {
	this.setpossize(pos, 1)
	this.gear = gear
	gear.addstation(this)
	this.monk = null
}
Station.prototype = UFX.Thing()
	.addcomp(WorldRound)
	.addcomp({
		collidepoint: function (pos) {
			return this.infootprint(pos)
		},
		onclick: function () {
//			console.log(this.monk, control.selected)
			if (this.monk) {
				if (this.monk.atstation) this.monk.onclick()
			} else if (control.selected && control.selected.setstation) {
				control.selected.setstation(this)
			}
		},
		work: function (dwork) {
			this.gear.radvance(dwork)
		},
		draw: function () {
			graphics.fillcircleG(this.pos, this.r, "rgba(255,0,0,0.5)")
		},
	})



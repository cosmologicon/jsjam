let WorldRound = {
	setpos: function (pos) {
		this.pos = pos
	},
	setpossize: function (pos, r) {
		this.setpos(pos)
		this.r = r
	},
	draw: function () {
		graphics.drawcircleG(this.pos, this.r, "rgba(0,0,0,0.3)")
//		console.log("[ t", this.pos, "z", 2 * rA, rA, "b o 0 0 1 fs", this.color, "f ]")
		
	},
}

function Monk(pos) {
	this.setpossize(pos, 1)
	this.color = "#642"
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


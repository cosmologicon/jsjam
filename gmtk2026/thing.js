let WorldRound = {
	setpos: function (pos) {
		this.pos = pos
	},
	setpossize: function (pos, r) {
		this.setpos(pos)
		this.r = r
	},
	draw: function () {
		graphics.drawcircleG(this.pos, this.r, this.color)
//		console.log("[ t", this.pos, "z", 2 * rA, rA, "b o 0 0 1 fs", this.color, "f ]")
		
	},
}

function Monk(pos) {
	this.setpossize(pos, 1)
	this.color = "#642"
}
Monk.prototype = UFX.Thing()
	.addcomp(WorldRound)



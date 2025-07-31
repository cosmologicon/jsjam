let view = {
	init: function () {
		this.x = world.you.x
	},
	think: function (dt) {
		this.x += world.you.vx0 * dt
	},
	xrange: function () {
		return [this.x - 420, this.x + 1220]
	},
	// Return the value equal to x (mod world.D) that's closest to on screen.
	mod: function (x) {
		let x0 = this.x + 400
		return x0 + (((x + world.R - x0) % world.D) + world.D) % world.D - world.R
	},
	vmod: function (x) {
		let x0 = this.x + 400 + world.R
		return x0 + (((x + world.R - x0) % world.D) + world.D) % world.D - world.R
	},
	look: function () {
		return ["t 400 700 vflip t", -this.x, 0]
	},
	vlook: function () {
		return ["t 400 200 t", -(this.x + world.R), 0]
	},
}



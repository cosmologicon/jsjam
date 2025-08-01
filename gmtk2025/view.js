

let view = {
	init: function () {
		this.x = world.you.x
		this.px0 = 400  // Left edge of screen to camera center, in pixels.
	},
	think: function (dt) {
		this.x += world.you.vx0 * dt
	},
	xcenter: function (flip) {
		return this.x + 800 - this.px0 + (flip ? world.R : 0)
	},
	// Returns integers.
	xrange: function (flip) {
		let x0 = Math.round(this.xcenter(flip))
		return [x0 - 820, x0 + 820]
	},
	onscreen: function (x, r, flip) {
		return Math.abs(zmod(x - this.xcenter(flip)), world.D) <= 800 + r
	},
	// Return the value equal to x (mod world.D) that's closest to on screen.
	mod: function (x, flip) {
		return cmod(x, world.D, this.xcenter(flip))
	},
	look: function (flip) {
		let xoff = this.x
		if (flip) xoff += world.R
		return ["t", this.px0, 450, (flip ? "t" : "vflip t"), -xoff, 0]
	},
}



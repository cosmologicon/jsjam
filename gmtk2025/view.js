

let view = {
	init: function () {
		this.z = world.z  // Pixels per game unit
		this.x = world.you.x + 300 / this.z
	},
	// Half-width and half-height of the screen, in game units
	screenw: function () {
		return 800 / this.z
	},
	screenh: function () {
		return 450 / this.z
	},
	think: function (dt) {
		this.x = world.you.x + 300 / this.z
	},
	xcenter: function (flip) {
		return this.x + (flip ? world.R : 0)
	},
	// Game units. Returns integers.
	xrange: function (flip) {
		let x0 = Math.round(this.xcenter(flip)), w = Math.ceil(this.screenw() * 1.04)
		return [x0 - w, x0 + w]
	},
	onscreen: function (x, r, flip) {
		return Math.abs(zmod(x - this.xcenter(flip)), world.D) - r <= this.screenw()
	},
	// Return the value equal to x (mod world.D) that's closest to on screen.
	mod: function (x, flip) {
		return cmod(x, world.D, this.xcenter(flip))
	},
	// Return all values of x (mod world.D) that are within r units of being on screen.
	mods: function (x, r, flip) {
		let xoff = this.xcenter(flip) - x, w = this.screenw() + r + 10
		let n0 = Math.ceil((xoff - w) / world.D), n1 = Math.floor((xoff + w) / world.D)
		let xs = []
		for (let n = n0 ; n <= n1 ; ++n) xs.push(x + world.D * n)
		return xs
	},
	look: function (flip) {
		let xoff = this.x
		if (flip) xoff += world.R
		return ["t", 800, 450, "z", this.z, this.z, (flip ? "t" : "vflip t"), -xoff, 0]
	},
}



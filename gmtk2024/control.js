

let control = {
	pos: [-10000, 10000],
	// If you click, will it cause the robot to roll along the ground?
	// If so then this is the new x-coordinate.
	xroll: null,
	pointed: null,
	grabbed: null,
	update: function (pointer) {
		if (pointer.pos) {
			let [x, y] = pointer.pos
			this.pos = [x * 1600 / canvas.width, y * 900 / canvas.height]
		}
		this.posG = view.GconvertV(this.pos)
		this.tile = view.GtileV(this.pos)
		this.pointed = robot.blockat(this.tile)
		let [xtile, ytile] = this.tile
		this.xroll = this.pointed === null && ytile == 0 && xtile != robot.x ? xtile : null
		if (pointer.down) {
			if (this.pointed !== null) {
				this.grabbed = this.pointed
			}
			if (this.xroll !== null) {
				robot.rollto(this.xroll)
				this.xroll = null
			}
		}
		if (this.grabbed) {
			if (pointer.up) {
				let spots = this.grabbed.spots()
				let [dist, spot] = nearesttile(spots, this.posG)
				this.grabbed.moveto(spot)
				this.grabbed = null
			}
		}
	},
}


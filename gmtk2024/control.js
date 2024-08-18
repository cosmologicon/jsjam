

let control = {
	pos: [-10000, 10000],
	// If you click, will it cause the robot to roll along the ground?
	// If so then this is the new x-coordinate.
	xroll: null,
	pointed: null,
	mode: null,
	hudpointed: null,
	grabbed: null,
	update: function (pointer, kstate) {
		if (kstate.down.space) robot.activate()
		if (kstate.down.tab) {
			this.mode = this.mode === "extend" ? null : "extend"
		}
		if (kstate.down.M) {
			let volume = UFX.audio.getgain("main")
			UFX.audio.setgain("main", 1 - volume)
		}
		if (kstate.down.left && posincludes(root.spots(), [robot.x - 1, 0])) {
			robot.rollto(robot.x - 1)
		}
		if (kstate.down.right && posincludes(root.spots(), [robot.x + 1, 0])) {
			robot.rollto(robot.x + 1)
		}
		if (kstate.down.F1) {
			quest.advance()
			quest.money = 10000
		}
		if (pointer.pos) {
			let [x, y] = pointer.pos
			this.pos = [x * 1600 / canvas.width, y * 900 / canvas.height]
		}
		this.hudpointed = hud.buttonat(this.pos)
		this.posG = view.GconvertV(this.pos)
		this.tile = view.GtileV(this.pos)
		if (this.hudpointed === null) {
			this.pointed = robot.blockat(this.tile)
			if (this.mode === null && this.pointed !== null && this.pointed !== head &&
				this.pointed !== root && this.pointed.rmax == 1) {
				this.pointed = null
			}
			if (this.pointed === null) {
				let [xtile, ytile] = this.tile
				this.xroll = ytile == 0 && xtile != robot.x ? xtile : null
				if (Math.abs(this.xroll) > view.n) this.xroll = null
			} else {
				this.xroll = null
			}
		} else {
			this.pointed = null
			this.xroll = null
		}
		if (this.mode == "extend") this.xroll = null

		if (pointer.rclick) {
			this.mode = this.mode === "extend" ? null : "extend"
		}
		
		if (pointer.down && this.mode === null) {
			if (this.pointed === head) {
			} else if (this.pointed !== null) {
				this.grabbed = this.pointed
			}
		}
		if (pointer.click) {
			if (this.hudpointed === hud.buttons.extend) {
				this.mode = this.mode === "extend" ? null : "extend"
			} else if (this.mode === "extend") {
				if (this.pointed && this.pointed.canextend()) {
					if (this.pointed.extendcost() <= quest.money) {
						playsound("select")
						quest.money -= this.pointed.extendcost()
						this.pointed.extend()
						view.resize()
					} else {
						playsound("no")
					}
				} else {
					this.mode = null
				}
			} else if (this.pointed === head) {
				robot.activate()
			} else if (this.xroll !== null) {
				robot.rollto(this.xroll)
				playsound("select")
				this.xroll = null
			}
		}
		if (this.grabbed) {
			if (pointer.up) {
				let spots = this.grabbed.spots()
				let [dist, spot] = nearesttile(spots, this.posG)
				this.grabbed.moveto(spot)
				this.grabbed = null
				playsound("select")
			}
		}
	},
	cursor: function () {
		if (this.hudpointed !== null) return "pointer"
		if (this.mode === "extend") {
			if (this.pointed && this.pointed.canextend()) {
				return this.pointed.extendcost() <= quest.money ? "pointer" : "not-allowed"
			} else {
				return "default"
			}
		} else if (this.grabbed === root || this.xroll !== null) {
			return "col-resize"
		} else if (this.grabbed !== null) {
			return { u: "row", l: "col", d: "row", r: "col" }[this.grabbed.dir] + "-resize"
		} else if (this.pointed !== null) {
			if (this.pointed === root) return "grab"
			if (this.pointed.canextend() && this.pointed.rmax > 1) return "grab"
			if (this.pointed === head) return robot.toactivate().length ? "pointer" : "not-allowed"
		}
		return "default"
	},
}


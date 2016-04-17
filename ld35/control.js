"use strict"

var control = {
	pointed: null,
	dragged: null,
	gmpos: null,
	think: function (dt, kstate, mstate, tstate) {
		var mpos = mstate && mstate.pos, gmpos = null, mcell = null
		if (mpos) {
			gmpos = grid.togame(mpos)
			mcell = gmpos.map(Math.floor)
			this.pointed = grid.cells[mcell] || null
		} else {
			this.pointed = null
		}
		if (mstate && mstate.left.down) {
			this.tdown = 0
			this.pdown = gmpos
			if (!this.dragged && this.pointed && this.pointed.shiftable) {
				this.dragged = this.pointed
				this.draganchor = [gmpos[0] - this.dragged.x, gmpos[1] - this.dragged.y]
			}
		}
		if (mstate && mstate.left.up) {
			this.dragged = null
			if (this.tdown < 0.3 && Math.abs(gmpos[0] - this.pdown[0]) < 0.2 && Math.abs(gmpos[1] - this.pdown[1]) < 0.2) {
				if (this.pointed instanceof Shape && !this.pointed.awake) {
					if (UFX.scenes.play.C) {
						UFX.scenes.play.C -= 1
						this.pointed.awaken()
					}
				}
			}
		}
		if (this.dragged) {
			var x = gmpos[0] - this.draganchor[0]
			var y = gmpos[1] - this.draganchor[1]
			while (true) {
				var dx = x - this.dragged.x
				var dy = y - this.dragged.y
				if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
					dx = 0
					dy = 0
				} else if (Math.abs(dx) > Math.abs(dy)) {
					dy = 0
				} else {
					dx = 0
				}
				if (this.dragged.canslide([Math.sign(dx), Math.sign(dy)])) {
					if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
						this.dragged.reposition(this.dragged.x + Math.sign(dx), this.dragged.y + Math.sign(dy))
						continue
					}
				} else {
					dx = 0
					dy = 0
				}
				x = this.dragged.x + dx
				y = this.dragged.y + dy
				break
			}
			this.dragged.setshift(x, y)
		}
		this.gmpos = gmpos
	},
	getcursor: function () {
		if (this.pointed && this.pointed.shiftable) return "pointer"
		return "default"
	},
}


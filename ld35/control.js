"use strict"

var control = {
	pointed: null,
	dragged: null,
	think: function (dt, kstate, mstate, tstate) {
		var mpos = mstate && mstate.pos, gmpos = null, mcell = null
		if (mpos) {
			gmpos = grid.togame(mpos)
			mcell = gmpos.map(Math.floor)
			this.pointed = grid.cells[mcell] || null
			if (this.pointed && !this.pointed.shiftable) this.pointed = null
		} else {
			this.pointed = null
		}
		if (mstate && mstate.left.down) {
			if (!this.dragged && this.pointed) {
				this.dragged = this.pointed
				this.draganchor = [gmpos[0] - this.dragged.x, gmpos[1] - this.dragged.y]
			}
		}
		if (mstate && mstate.left.up) {
			this.dragged = null
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
						this.dragged.x += Math.sign(dx)
						this.dragged.y += Math.sign(dy)
						grid.updatecells()
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
	},
	getcursor: function () {
		if (this.pointed) return "pointer"
		return "default"
	},
}


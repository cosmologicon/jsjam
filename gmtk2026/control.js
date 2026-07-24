let control = {
	init: function () {
		this.selected = null
	},
	select: function (obj) {
		if (this.selected === obj) {
			this.selected = null
		} else {
			this.selected = obj
		}
	},
	think: function (dt) {
	},
	clickfloor: function (posG) {
		if (this.selected && this.selected.settarget) {
			this.selected.settarget(posG)
		}
	},
	onclick: function (posL) {
		let posG = view.GconvertL(posL)
		let objs = [].concat(this.monks, this.gears)
		objs.sort(fronttoback)
		let target = state.clickables().find(obj => obj.collidepoint(posG))
		if (target == undefined) {
			this.clickfloor(posG)
			return
		}
		target.onclick()
	},
	onmove: function (dposL) {
		view.scootL(dposL)
	},
	onwheel: function (dy, posL) {
		view.zoom(-0.001 * dy, posL)
	},
}
control.init()


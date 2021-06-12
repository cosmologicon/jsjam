UFX.scenes.play = {
	start: function () {
		this.groups = [
			groupof(new Piece({pos: [0, 0], nspecs: [{e:2, d:5, t:"r"},]})),
			groupof(new Piece({pos: [20, 0], nspecs: [{e:1, d:5, t:"R"}, {e:3, d:5, t:"R"}]})),
		]
		this.t = 0
	},
	think: function (dt) {
		this.t += dt
		let kstate = UFX.key.state()
		if (kstate.down.tab) {
			this.groups[0].standtarget = 0
			this.groups.unshift(this.groups.pop())
		}
		
		let you = this.groups[0]
		if (kstate.pressed.down) {
			you.standtarget = 0
			if (kstate.down.left) {
				you.dotilt(-1)
			}
			if (kstate.down.right) {
				you.dotilt(1)
			}
			if (kstate.down.space) {
				this.groups = this.groups.filter(group => {
					if (group === you) return true
					if (!groupmatch(you, group)) return true
					groupjoin(you, group)
					return false
				})
			}
		} else {
			you.standtarget = 1
			let dx = (kstate.pressed.right ? 1 : 0) - (kstate.pressed.left ? 1 : 0)
			if (you.standable()) {
				you.x += dt * dx * 50
			}
		}
		this.groups.forEach(group => group.think(dt))
	},
	draw: function () {
		let ratio = canvas.width / 1600
		UFX.draw("[ z", ratio, ratio)
		drawbackground()
		UFX.draw("[ t 500 700 z 10 -10")
		for (let j = this.groups.length - 1 ; j >= 0 ; --j) draw(this.groups[j])
		UFX.draw("]")
		if (this.t < 2) drawshutter(this.t / 2)

		if (DEBUG) {
			UFX.draw("[ font 40px~'Viga' tab left bottom fs #aaaaaa t 20 880")
			context.fillText(UFX.ticker.getrates(), 0, 0)
			UFX.draw("]")
		}
		UFX.draw("]")
	},
}

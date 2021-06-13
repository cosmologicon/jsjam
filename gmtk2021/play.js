UFX.scenes.play = {
	start: function (levelname) {
		this.levelname = levelname
		let ldata = leveldata[levelname]
		this.w = ldata.w
		this.groups = ldata.pieces.map(piece => groupof(new Piece(piece)))
		this.devices = ldata.devices.map(device => new Device(device))
		ceiling = Math.max.apply(Math, this.devices.map(device => device.pos[1])) + 30
		this.scale = Math.min(800 / ceiling, 1400 / (10 * this.w))

		this.t = 0
		this.winning = false
		this.twin = 0
		this.freeplay = true
		
		let nspecs = []
		for (let j = 0 ; j < 2 * this.w ; ++j) {
			nspecs.push({e:0, d:5+10*j, t:UFX.random.choice("rR")})
		}
		this.poutline = getoutline(20 * this.w, 5, nspecs, "green")
	},
	think: function (dt) {
		this.t += dt
		let kstate = UFX.key.state()
		if (kstate.down.tab) {
			this.groups[0].standtarget = 0
			this.groups.unshift(this.groups.pop())
		}
		if (this.freeplay && kstate.down[1]) {
			let w = UFX.random.choice([1,1,1,1,1,1,1,2,2,3])
			let h = UFX.random.choice([1,1,1,1,1,1,1,2,2,3])
			let pspec = "F"
			for (let j = 1 ; j < 2 * (w + h) ; ++j) pspec += UFX.random.choice("--rR")
			let piece = new Piece({pos: [UFX.random(0, 50), 0], w: w, h: h, pspec: pspec})
			this.groups.push(groupof(piece))
		}
		this.controlyou(dt, kstate)
		this.groups.forEach(group => group.think(dt))
		if (this.winning) {
			this.twin += dt
			this.devices.forEach(device => device.lit = true)
			if (this.twin >= 2) UFX.scene.push("exit")
		} else {
			let freeconns = this.groups.map(group => group.conns()).flat()
			this.devices.forEach(device => device.checkconn(freeconns))
			this.winning = this.devices.every(device => device.lit)
		}
	},
	controlyou: function (dt, kstate) {
		this.groups.slice(1).forEach(group => group.setstep(0))
		if (!this.groups.length) return
		let you = this.groups[0]
		if (kstate.pressed.down) {
			you.setstep(0)
			if (!you.walking) {
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
			}
		} else {
			you.standtarget = 1
			let dx = (kstate.pressed.right ? 1 : 0) - (kstate.pressed.left ? 1 : 0)
			if (you.standable()) {
//				you.x += dt * dx * 50
			}
			you.setstep(dx)
		}

	},
	draw: function () {
		let ratio = canvas.width / 1600
		UFX.draw("[ z", ratio, ratio)
		drawbackground()
		UFX.draw("[ t 800 740 z", this.scale, -this.scale, "t", -5 * this.w, 0)
		UFX.draw("[ z 0.5 0.5 t 0 -5", this.poutline, "]")
		this.devices.forEach(device => draw(device))
		for (let j = this.groups.length - 1 ; j >= 0 ; --j) draw(this.groups[j])
		UFX.draw("]")

		if (DEBUG) {
			UFX.draw("[ font 40px~'Viga' tab left bottom fs #aaaaaa t 20 880")
			context.fillText(UFX.ticker.getrates(), 0, 0)
			UFX.draw("]")
		}
		UFX.draw("]")
	},
}

UFX.scenes.enter = {
	start: function () {
		this.t = 0
	},
	think: function (dt) {
		this.t += dt
		if (this.t >= 2) UFX.scene.pop()
	},
	draw: function () {
		UFX.scene.top(this.t > 1 ? 1 : 2).draw()
		let ratio = canvas.width / 1600
		UFX.draw("[ z", ratio, ratio)
		drawshutter(this.t / 2)
		UFX.draw("]")
	},
}

UFX.scenes.exit = {
	start: function () {
		this.t = 0
	},
	think: function (dt) {
		this.t += dt
		if (this.t >= 2) {
			UFX.scene.pop()
			UFX.scene.pop()
		}
	},
	draw: function () {
		UFX.scene.top(this.t > 1 ? 2 : 1).draw()
		let ratio = canvas.width / 1600
		UFX.draw("[ z", ratio, ratio)
		drawshutter(this.t / 2)
		UFX.draw("]")
	},
}



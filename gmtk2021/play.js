let pcolors = [
	"#ff7777",
	"#ffaa44",
	"#ffff22",
	"#88ff88",
	"#aaaaff",
]

UFX.scenes.play = {
	start: function (levelname) {
		this.levelname = levelname
		let ldata = JSON.parse(JSON.stringify(leveldata[levelname]))
		this.info = ldata.info
		this.w = ldata.w
		this.groups = ldata.pieces.map((piece, j) => {
			piece.color = pcolors[j] || UFX.random.color("9abcdef")
			return groupof(new Piece(piece))
		})
		this.devices = ldata.devices.map(device => new Device(device))
		ceiling = Math.max.apply(Math, this.devices.map(device => device.pos[1])) + 30
		this.scale = Math.min(800 / ceiling, 1400 / (10 * this.w))

		this.t = 0
		this.winning = false
		this.twin = 0
		this.freeplay = levelname == "free"
		
		this.poutline = ["[ t", 10 * this.w/2, 0]
		let ospec = [
			[0.75, 200, "#666644"],
			[0.8, 11, "#557744"],
			[0.9, 7, "#448844"],
			[1, 3, "green"],
		]
		ospec.forEach(([s, h, color]) => {
			let n = Math.ceil(4 * s * this.w)
			let nspecs = []
			for (let j = 0 ; j < n ; ++j) {
				nspecs.push({e:0, d:5+10*j, t:UFX.random.choice("rR")})
			}
			let scale = s * this.w / n
			h /= scale
			this.poutline.push(
				"[ z", scale, scale, "t", -10 * n / 2, -h,
				getoutline(10 * n, h, nspecs, color), "]")
		})
		this.poutline.push("]")
		this.undostack = []
		this.fundo = 0
		this.save()
		playmusic(this.freeplay ? 1 : 0)
	},
	save: function () {
		this.undostack.push(JSON.parse(JSON.stringify(this.groups.map(g => g.getspec()))))
	},
	load: function () {
		this.groups = []
		for (let gspec of this.undostack.pop()) {
			let pieces = gspec.pieces.map(pspec => new Piece(pspec))
			let group = new Group(gspec.pos, pieces)
			this.groups.push(group)
		}
		this.fundo = 1
		if (!this.undostack.length) this.save()
	},
	think: function (dt) {
		if (this.levelname == "free") dt *= 1.5
		this.t += dt
		this.fundo = approach(this.fundo, 0, 3 * dt)
		let kstate = UFX.key.state()
		if (kstate.down.F1) STILL = !STILL
		if (kstate.down.esc) {
			playsound("lose")
			UFX.scene.push("exit")
		}
		if (kstate.down.up && this.groups.length) {
			this.groups[0].standtarget = 0
			this.groups.unshift(this.groups.pop())
			playsound("key")
		}
		if (this.freeplay && kstate.down[1]) {
			let w = UFX.random.choice([1,1,1,1,1,1,1,2,2,3])
			let h = UFX.random.choice([1,1,1,1,1,1,1,2,2,3])
			let pspec = "-".repeat(UFX.random.rand(0, w)) + "F"
			pspec += "-".repeat(w - pspec.length)
			for (let j = w ; j < 2 * (w + h) ; ++j) pspec += UFX.random.choice("--rR")
			let color = UFX.random.color("9abcdef")
			let piece = new Piece({pos: [-20, 0], w: w, h: h, pspec: pspec, color: color})
			if (this.groups.length) this.groups[0].standtarget = 0
			this.groups.unshift(groupof(piece))
			playsound("select")
		}
		if (this.freeplay && kstate.down[2]) {
			if (this.groups.length) {
				this.groups.shift()
				playsound("undo")
			}
		}
		this.controlyou(dt, kstate)
		this.groups.forEach(group => group.think(dt))
		this.devices.forEach(device => device.think(dt))
		if (this.winning) {
			this.twin += dt
			this.devices.forEach(device => device.lit = true)
			if (this.twin >= 2) {
				UFX.scene.push("exit")
			}
		} else {
			let freeconns = this.groups.filter(group => group.stand == 0).map(group => group.conns()).flat()
			this.devices.forEach(device => device.checkconn(freeconns))
			this.winning = this.devices.every(device => device.lit)
			if (this.winning) playsound("win")
		}
		if (!this.winning && kstate.down.backspace) {
			playsound("undo")
			this.load()
		}
	},
	controlyou: function (dt, kstate) {
		this.groups.slice(1).forEach(group => group.setstep(0))
		if (!this.groups.length) return
		let you = this.groups[0]
		if (this.winning) {
			you.setstep(0)
			you.standtarget = 0
			return
		}
		if (kstate.pressed.down || !you.standable()) {
			you.setstep(0)
			if (!you.walking) {
				you.standtarget = 0
				if (kstate.down.left) {
					if (you.cantilt(-1)) {
						you.dotilt(-1)
						playsound("jump")
					} else {
						you.atilt = 0.5
						playsound("no")
					}
				}
				if (kstate.down.right) {
					if (you.cantilt(1)) {
						you.dotilt(1)
						playsound("jump")
					} else {
						you.atilt = -0.5
						playsound("no")
					}
				}
				if (kstate.down.space) {
					if (this.groups.some(g => g !== you && groupmatch(you, g))) {
						playsound("join")
						this.save()
						this.groups = this.groups.filter(group => {
							if (group === you) return true
							if (!groupmatch(you, group)) return true
							groupjoin(you, group)
							return false
						})
					} else {
						playsound("no")
					}
				}
			}
		} else {
			you.standtarget = 1
			let dx = (kstate.pressed.right ? 1 : 0) - (kstate.pressed.left ? 1 : 0)
			if (you.atilt) dx = 0
			you.setstep(dx)
		}

	},
	draw: function () {
		let ratio = canvas.width / 1600
		UFX.draw("[ z", ratio, ratio)
		if (STILL) {
			drawbackground0()
		} else {
			drawbackground()
		}
		UFX.draw("[ t 800 740 z", this.scale, -this.scale, "t", -5 * this.w, 0)
		UFX.draw(this.poutline)
		this.devices.forEach(device => draw(device))
		for (let j = this.groups.length - 1 ; j >= 0 ; --j) draw(this.groups[j], j == 0)
		UFX.draw("]")
		if (this.fundo > 0) UFX.draw("[ alpha", this.fundo, "fs #44444 fr 0 0 1600 900 ]")


		if (this.info) {
			UFX.draw("[ font 50px~'Gorditas' tab center middle t 800 850",
				"fs #cccc55 lw 6 ss black sh rgba(0,0,0,0.4) 2 2 2",
				"sft0", this.info.replace(/ /g, "~"),
				"]")
		}

		if (DEBUG) {
			UFX.draw("[ font 40px~'Viga' tab left bottom fs #aaaaaa t 20 880")
			context.fillText(UFX.ticker.getrates(), 0, 0)
			UFX.draw("]")
		}
		UFX.draw("]")
	},
}

let tfactor = 1

UFX.scenes.enter = {
	start: function () {
		this.t = 0
		tfactor *= 1.1
	},
	think: function (dt) {
		this.t += dt * tfactor
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
		this.t += dt * tfactor
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



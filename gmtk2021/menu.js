
UFX.scenes.menu = {
	fload: 0,
	start: function () {
		let color0 = "#ffaa99", color1 = "#aabbff"
		this.pieces = [
			{ name: "t0", x: -3, y: 1, pspec: "-r--", color: color0 },
			{ name: "t1", x: -2, y: 1, pspec: "-R-R", color: color1 },
			{ name: "t2", x: -1, y: 1, pspec: "Rr-r", color: color0 },
			{ name: "t3", x: 0, y: 1, pspec: "r--R", color: color1 },
			{ name: "two0", x: -1, y: 0, pspec: "rRr-", color: color1 },
			{ name: "two1", x: 0, y: 0, pspec: "RrRr", color: color0 },
			{ name: "three0", x: 1, y: 0, pspec: "r--R", color: color1 },
			{ name: "three1", x: -1, y: -1, pspec: "-rR-", color: color0 },
			{ name: "h0", x: 0, y: -1, pspec: "-RrR", color: color1 },
			{ name: "c0", x: 1, y: -1, pspec: "-rRr", color: color0 },
			{ name: "s0", x: 2, y: -1, pspec: "-R-R", color: color1 },
			{ name: "free", x: 3, y: -1, pspec: "---r", color: color0 },
		]
		this.current = "t0"
		this.poutlines = this.pieces.map(piece => {
			let w = 1, h = 1, j = 0
			let nspecs = []
			;[w, h, w, h].forEach((l, e) => {
				for (let a = 0 ; a < l ; ++a) {
					let t = piece.pspec[j++]
					switch (t) {
						case "r": case "R":
							nspecs.push({e: e, d: 5 + 10 * a, t: t})
							break
					}
				}
			})
			return getoutline(10 * w, 10 * h, nspecs, piece.color)
		})
	},
	move: function (dx, dy) {
		let piece = this.pieces.filter(p => p.name == this.current)[0]
		let x = piece.x + dx
		let y = piece.y + dy
		for (let piece of this.pieces) {
			if (piece.x == x && piece.y == y) {
				this.current = piece.name
				playsound("key")
				return
			}
		}
		playsound("no")
	},
	think: function (dt) {
		if (this.fload == 1) {
			let kstate = UFX.key.state()
			if (kstate.down.up) this.move(0, 1)
			if (kstate.down.right) this.move(1, 0)
			if (kstate.down.left) this.move(-1, 0)
			if (kstate.down.down) this.move(0, -1)
			if (kstate.down.space) {
				playsound("select")
				UFX.scene.push("play", this.current)
				UFX.scene.push("enter")
			}
		}
		killtime()
	},
	draw: function () {
		UFX.draw("fs #446666 f0")
		let ratio = canvas.width / 1600
		UFX.draw("[ z", ratio, ratio)
		UFX.draw("[ font 180px~'Gorditas' tab center middle t 700 120",
			"fs #cccc55 lw 10 ss black sh rgba(0,0,0,0.4) 10 10 10 sft0 Jigsaw~Tussle ]")
		UFX.draw("[ font 50px~'Gorditas' tab center middle t 1200 230",
			"fs #cccc55 lw 6 ss black sh rgba(0,0,0,0.4) 6 6 6 sft0 by~Christopher~Night ]")
		UFX.draw("[ font 50px~'Gorditas' tab center middle t 1250 300",
			"fs #cccc55 lw 6 ss black sh rgba(0,0,0,0.4) 6 6 6 sft0 music~by~Kevin~MacLeod ]")
		UFX.draw("[ font 50px~'Gorditas' tab center middle t 1300 370",
			"fs #cccc55 lw 6 ss black sh rgba(0,0,0,0.4) 6 6 6 sft0 GMTK~Game~Jam~2021 ]")
		UFX.draw("[ font 50px~'Gorditas' tab center middle t 280 550",
			"fs #cccc55 lw 6 ss black sh rgba(0,0,0,0.4) 6 6 6 sft0 Arrows/WASD: ]")
		UFX.draw("[ font 50px~'Gorditas' tab center middle t 280 620",
			"fs #cccc55 lw 6 ss black sh rgba(0,0,0,0.4) 6 6 6 sft0 move ]")
		UFX.draw("[ font 50px~'Gorditas' tab center middle t 330 690",
			"fs #cccc55 lw 6 ss black sh rgba(0,0,0,0.4) 6 6 6 sft0 Space/Enter: ]")
		UFX.draw("[ font 50px~'Gorditas' tab center middle t 330 760",
			"fs #cccc55 lw 6 ss black sh rgba(0,0,0,0.4) 6 6 6 sft0 select ]")
		if (this.fload < 1) {
			let text = "Loading....~" + Math.round(this.fload * 100) + "%"
			UFX.draw("[ font 120px~'Gorditas' tab center middle t 1000 600",
				"fs #aaaadd lw 6 ss black sh rgba(0,0,0,0.4) 10 10 10 sft0", text, "]")
		} else {
			UFX.draw("[ t 800 550 z 18 -18 t -5 -5")
			this.pieces.forEach((piece, j) => {
				let name = piece.name == "free" ? "free" : "#" + (j+1)
				let color = piece.name === this.current ? "white" : "gray"
				let fsize = piece.name === this.current ? "3px" : "2px"
				UFX.draw("[ t", 10 * piece.x, 10 * piece.y, this.poutlines[j])
				UFX.draw("font " + fsize + "~'Gorditas' fs", color, "ss black lw 0.2")
				UFX.draw("tab center middle z 1 -1 sft", name, 5, -5)
				UFX.draw("]")
			})
			UFX.draw("]")
		}
		if (DEBUG) {
			UFX.draw("[ font 40px~'Viga' tab left bottom fs #aaaaaa t 20 880")
			context.fillText(UFX.ticker.getrates(), 0, 0)
			UFX.draw("]")
		}
		UFX.draw("]")
	},
}


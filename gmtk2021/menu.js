
UFX.scenes.menu = {
	start: function () {
		this.pieces = [
			{ name: "three0", x: 0, y: 0, pspec: "rRrR", color: "blue" },
			{ name: "three1", x: 1, y: 0, pspec: "RrRr", color: "red" },
		]
		this.current = "three0"
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
			if (piece.x == x && piece.y == y) this.current = piece.name
		}
	},
	think: function (dt) {
		let kstate = UFX.key.state()
		if (kstate.down.up) this.move(0, 1)
		if (kstate.down.right) this.move(1, 0)
		if (kstate.down.left) this.move(-1, 0)
		if (kstate.down.down) this.move(0, -1)
		if (kstate.down.space) {
			UFX.scene.push("play", this.current)
			UFX.scene.push("enter")
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
		UFX.draw("[ t 800 450 z 20 -20 t -5 -5")
		this.pieces.forEach((piece, j) => {
			let color = piece.name === this.current ? "white" : "gray"
			UFX.draw("[ t", 10 * piece.x, 10 * piece.y, this.poutlines[j])
			UFX.draw("font 2px~'Gorditas' fs", color, "ss black lw 0.2")
			UFX.draw("tab center middle z 1 -1 sft", piece.name, 5, -5)
			UFX.draw("]")
		})
		UFX.draw("]")
		if (DEBUG) {
			UFX.draw("[ font 40px~'Viga' tab left bottom fs #aaaaaa t 20 880")
			context.fillText(UFX.ticker.getrates(), 0, 0)
			UFX.draw("]")
		}
		UFX.draw("]")
	},
}


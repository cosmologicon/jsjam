"using strict"

UFX.scenes.play = {
	start: function () {
		this.monks = [new Monk([0, 0])]
		this.stones = UFX.random.spread(100, 0.15, 32, 36, -16, -18).map(pos => {
			let r = UFX.random(4, 6)
			let R = UFX.random.rand(30, 40)
			let G = UFX.random.rand(40, 50)
			let B = UFX.random.rand(50, 60)
			return [pos, r, `rgb(${R},${G},${B})`]
		})
	},
	think: function (dt) {
	},
	draw: function () {
		UFX.draw("fs #444 f0")
		UFX.draw("[ alpha 0.2")
		this.stones.forEach(([pos, r, color]) => graphics.drawcircleG(pos, r, color))
		UFX.draw("]")
		this.monks.forEach(monk => monk.draw())
	},
}


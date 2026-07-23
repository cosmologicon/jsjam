"using strict"

UFX.scenes.play = {
	start: function () {
		this.monks = [new Monk([5, 5]), new Monk([8, -8])]
		this.gears = [new GoGear([0, 0], 6, 0.1)]
		;[1, 2, 3].forEach(j => {
			let r = 1 + j, R = r + this.gears[0].r + 1, [C, S] = CS(1.5 * j)
			let gear = new FollowGear([R * S, R * C], r, this.gears[0])
			this.gears.push(gear)
		})
		this.stones = UFX.random.spread(100, 0.15, 32, 36, -16, -18).map(pos => {
			let r = UFX.random(4, 6)
			let R = UFX.random.rand(100, 140)
			let G = UFX.random.rand(100, 140)
			let B = UFX.random.rand(50, 70)
			return [pos, r, `rgb(${R},${G},${B})`]
		})
	},
	think: function (dt) {
		UFX.pointer.scale = UFX.maximize.scale.LD
		let pointer = UFX.pointer(canvas)
		if (pointer.down) {
			this.monks[0].settarget(view.GconvertL(pointer.pos))
//			console.log(view.GconvertD(pointer.pos))
		}
		this.monks.forEach(monk => monk.think(dt))
		this.gears.forEach(gear => gear.think(dt))
	},
	draw: function () {
		UFX.draw("fs rgb(120,120,60) f0")
		UFX.draw("[ alpha 0.2")
		this.stones.forEach(([pos, r, color]) => graphics.drawcircleG(pos, r, color))
		UFX.draw("]")
		this.monks.forEach(monk => monk.draw())
		this.gears.forEach(gear => gear.draw())
	},
}


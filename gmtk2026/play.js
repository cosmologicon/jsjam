"using strict"

let state = {
	init: function () {
		this.monks = []
		this.gears = []
	},
	thinkers: function () {
		return [].concat(this.monks, this.gears)
	},
	drawers: function () {
		let objs = [].concat(this.monks, this.gears)
		objs.sort(backtofront)
		return objs
	},
	clickables: function () {
		let objs = [].concat(this.monks, this.gears).filter(obj => obj.onclick)
		objs.sort(fronttoback)
		return objs
	},
}


UFX.scenes.play = {
	start: function () {
		state.init()
		state.monks.push(new Monk([5, 5]), new Monk([8, -8]))
		state.gears.push(new GoGear([0, 0], 6, 0.1))
		;[1, 2, 3].forEach(j => {
			let r = 1 + j, R = r + state.gears[0].r + 1, [C, S] = CS(1.5 * j)
			let gear = new FollowGear([R * S, R * C], r, state.gears[0])
			state.gears.push(gear)
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
		control.think(dt)
		UFX.pointer.scale = UFX.maximize.scale.LD
		let pointer = UFX.pointer(canvas)
		if (pointer.click) control.onclick(pointer.pos)
		state.thinkers().forEach(obj => obj.think(dt))
	},
	draw: function () {
		UFX.draw("fs rgb(120,120,60) f0")
		UFX.draw("[ alpha 0.2")
		this.stones.forEach(([pos, r, color]) => graphics.fillcircleG(pos, r, color))
		UFX.draw("]")
		state.drawers().forEach(obj => obj.draw())
	},
}


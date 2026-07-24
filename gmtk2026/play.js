"using strict"

let state = {
	init: function () {
		this.monks = []
		this.gears = []
		this.counters = []
		this.stations = []
	},
	thinkers: function () {
		return [].concat(this.monks, this.gears, this.counters).filter(obj => obj.think)
	},
	drawers: function () {
		let objs = [].concat(this.monks, this.gears, this.counters)
		objs.sort(backtofront)
		return this.stations.concat(objs)
	},
	clickables: function () {
		let objs = [].concat(this.monks, this.gears, this.stations).filter(obj => obj.onclick)
		objs.sort(fronttoback)
		return objs
	},
}


UFX.scenes.play = {
	start: function () {
		state.init()
		state.monks.push(new Monk([5, 5]), new Monk([8, -8]))
		let recruitcounter = new RecruitCounter([-10, 4])
		state.counters.push(recruitcounter)
		let recruitgear = new CounterGear([-10, 0], 4, recruitcounter)
		recruitgear.placestations(4)
		state.gears.push(recruitgear)
		let m = new MultiplierCounter([-3, -5], recruitgear)
		state.counters.push(m)
		let mgear = new CounterGear([-3, -9], 2, m)
		mgear.placestations(3)
		state.gears.push(mgear)
		let m2 = new MultiplierCounter([5, -6], mgear)
		state.counters.push(m2)
		let m2gear = new CounterGear([5, -2], 2, m2)
		m2gear.placestations(3)
		state.gears.push(m2gear)
/*
		state.counters.push(new Counter([0, 10], 1000))
		state.gears.push(new PushGear([0, 0], 6))
		state.gears[0].attachsignal(state.counters[0])
		state.stations.push(new Station([-2, 7], state.gears[0]))
		state.stations.push(new Station([2, 7], state.gears[0]))
		;[1, 2, 3].forEach(j => {
			let r = 1 + j, R = r + state.gears[0].r + 1, [C, S] = CS(1.5 * j)
			let gear = new FollowGear([R * S, R * C], r, state.gears[0])
			state.gears.push(gear)
		})
*/
		this.stones = UFX.random.spread(100, 0.15, 32, 36, -16, -18).map(pos => {
			let r = UFX.random(4, 6)
			let R = UFX.random.rand(100, 140)
			let G = UFX.random.rand(100, 140)
			let B = UFX.random.rand(50, 70)
			return [pos, r, `rgb(${R},${G},${B})`]
		})
	},
	think: function (dt) {
		dt /= SLOW
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


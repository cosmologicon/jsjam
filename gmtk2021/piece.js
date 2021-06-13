let WorldBound = {
	draw: function () {
		UFX.draw("t", this.pos)
	},
}

function rot(pos, tilt) {
	let [x, y] = pos
	return [
		[x, y],
		[-y, x],
		[-x, -y],
		[y, -x],
	][mod4(tilt)]
}

function connmatch(conn0, conn1) {
	let [x0, y0, tilt0, t0, p0, j0] = conn0
	let [x1, y1, tilt1, t1, p1, j1] = conn1
	if (Math.hypot(x1 - x0, y1 - y0) > 0.1) return null
	if (mod4(tilt1 - tilt0) != 2) return null
	if (t0 === t1 || t0.toLowerCase() !== t1.toLowerCase()) return null
	return [x0 - x1, y0 - y1]
}
function groupmatch(group0, group1) {
	let c0s = group0.conns(), c1s = group1.conns()
	for (let c0 of c0s) {
		for (let c1 of c1s) {
			let cm = connmatch(c0, c1)
			if (cm !== null) return cm
		}
	}
	return null
}

function interp(ys, x) {
	x = mod(x, ys.length)
	let y0 = ys[Math.floor(x)], y1 = ys[Math.floor(x+1) % ys.length]
	return mix(y0, y1, x % 1)
}

function drawfeet(pfoot, stand, atilt) {
	let dy = mix(3 * (1 - stand), 0, clamp(4 * Math.abs(zmod4(atilt)), 0, 1))
	UFX.draw("[ t", pfoot, "t", 0, dy)
	let ds = interp([0, 0.6, 0.6, -0.3], atilt)
	let x = -2 - 2 * Math.sin(ds), y = -1 - 2 * Math.cos(ds)
	UFX.draw("lw 0.7 ss black b m 0 1 q -2 -1", x, y, "s")
	UFX.draw("[ t", x, y, "r", -2 * ds, "lw 0.2 fs white ( arc", 0, 0, 1, 0, tau/2, ") f s ]")
	ds = interp([0, 0.3, -0.6, -0.6], atilt)
	x = 2 - 2 * Math.sin(ds)
	y = -1 - 2 * Math.cos(ds)
	UFX.draw("lw 0.7 ss black b m 0 1 q 2 -1", x, y, "s")
	UFX.draw("[ t", x, y, "r", -2 * ds, "lw 0.2 fs white ( arc", 0, 0, 1, 0, tau/2, ") f s ]")
	UFX.draw("]")
}

function drawface(pface) {
	UFX.draw("[ t", pface)
	UFX.draw("[ z 1 3 fs black b o -0.7 0 0.5 f b o 0.7 0 0.5 f ]")
	UFX.draw("ss black lw 0.5 b m -2 -2 q 0 -4 2 -2 s")
	UFX.draw("]")
}


function Piece(spec) {
	this.pos = spec.pos || [0, 0]
	this.tilt = spec.tilt || 0
	this.color = UFX.random.color()
	let w = spec.w || 1, h = spec.h || 1
	this.w = 10 * w
	this.h = 10 * h
	this.nspecs = spec.nspecs || []
	if (spec.pspec) {
		let j = 0
		this.nspecs = []
		;[w, h, w, h].forEach((l, e) => {
			for (let a = 0 ; a < l ; ++a) {
				let t = spec.pspec[j++]
				switch (t) {
					case "F":
						this.pfoot = [5 + 10 * a, 0]
						break
					case "r": case "R":
						this.nspecs.push({e: e, d: 5 + 10 * a, t: t})
						break
				}
			}
		})
	}
	this.outline = getoutline(this.w, this.h, this.nspecs, this.color)
	this.pfoot = [5, 0]
	this.pface = [4, 5]
}
Piece.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp({
		dotilt: function (d, dh) {
			this.tilt = mod4(this.tilt - d)
			let [x, y] = this.pos
			if (d == -1) {
				this.pos = [dh - y, x]
			} else if (d == 1) {
				this.pos = [y, dh - x]
			}
		},
		conns: function () {
			return this.nspecs.map((nspec, j) => {
				if (nspec.taken) return null
				let [dx, dy] = rot([
					[nspec.d, 0],
					[this.w, nspec.d],
					[this.w - nspec.d, this.h],
					[0, this.h - nspec.d],
				][nspec.e], this.tilt)
				let tilt = mod4(nspec.e + this.tilt)
				return [this.pos[0] + dx, this.pos[1] + dy, tilt, nspec.t, this, j]
			}).filter(c => c !== null)
		},
		frange: function () {
			let j = mod4(this.tilt)
			let [x, y] = this.pos, w = this.w, h = this.h
			return [
				x - [0, h, w, 0][j],
				y - [0, 0, h, w][j],
				x + [w, 0, 0, h][j],
				y + [h, w, 0, 0][j],
			]
		},
		think: function (dt) {
		},
		draw: function (stand, atilt) {
			UFX.draw("r", this.tilt * tau / 4)
			drawfeet(this.pfoot, stand, this.tilt + atilt)
			UFX.draw(this.outline)
			if (DEBUG) {
				UFX.draw("[")
				this.nspecs.forEach(nspec => {
					let [dx, dy] = [
						[nspec.d, 0],
						[this.w, nspec.d],
						[this.w - nspec.d, this.h],
						[0, this.h - nspec.d],
					][nspec.e]
					dx = 0.8 * dx + 0.2 * this.w / 2
					dy = 0.8 * dy + 0.2 * this.h / 2
					UFX.draw("tab center middle fs red font 3px~'Viga'",
						"[ t", dx, dy, "z 1 -1 ft0", nspec.t, "]")
				})
				UFX.draw("]")
			}
			drawface(this.pface)
		},
	})

function Group(pos, pieces) {
	this.pieces = pieces
	;[this.x, this.y] = pos
	this.anchor = this.x
	this.setup()
	this.atilt = 0
	this.stand = 0
	this.standtarget = 0
	this.step = 0
	this.dwalk = 0
	this.nod = 0
}
Group.prototype = {
	setup: function () {
		let [x0, y0, x1, y1] = this.pieces.reduce((f, piece) => {
			if (f == null) return piece.frange()
			let [px0, py0, px1, py1] = piece.frange()
			let [x0, y0, x1, y1] = f
			return [Math.min(x0, px0), Math.min(y0, py0), Math.max(x1, px1), Math.max(y1, py1)]
		}, null)
		this.w = x1 - x0
		this.h = y1 - y0
		this.x += x0
		this.pieces.forEach(piece => {
			piece.pos[0] -= x0
			piece.group = this
		})
		this.anchor = this.x
	},
	conns: function () {
		let c = []
		this.pieces.forEach(piece => {
			piece.conns().forEach(conn => {
				let [x, y, tilt, t, piece, j] = conn
				c.push([this.x + x, this.y + y, tilt, t, piece, j])
			})
		})
		return c
	},
	standable: function () {
		return this.pieces.some(piece => piece.pos[1] == 0 && piece.tilt == 0)
	},
	xstand: function () {
		let ps = this.pieces.filter(piece => piece.pos[1] == 0 && piece.tilt == 0)
		return [ps.length ? average(ps.map(piece => piece.pos[0] + piece.pfoot[0])) : 0, ps.length]
	},
	// d = -1 for left tilt, +1 for right tilt
	dotilt: function (d) {
		this.atilt = d
		this.pieces.forEach(piece => piece.dotilt(d, (d == -1 ? this.w : this.w)))
		this.x += d * this.w
		this.setup()
	},
	setstep: function (dx) {
		if (dx > 0) {
			if (this.x > this.anchor + 2) this.anchor += 10
			if (!this.step && this.x >= this.anchor) this.anchor += 10
		} else if (dx < 0) {
			if (this.x < this.anchor - 2) this.anchor -= 10
			if (!this.step && this.x <= this.anchor) this.anchor -= 10
		}
		this.step = dx
	},
	think: function (dt) {
		let x0 = this.x
		if (this.step != 0) {
			this.dwalk = this.step
			this.x += this.step * 30 * dt
		} else if (this.anchor != this.x) {
			this.x = approach(this.x, this.anchor, 30 * dt)
			this.dwalk = Math.sign(this.anchor - this.x)
		}
		this.atilt = approach(this.atilt, 0, 6 * dt)
		if (this.atilt == 0) {
			let target = this.standable() ? this.standtarget : 0
			this.stand = approach(this.stand, target, 12 * dt)
		}
		this.pieces.forEach(piece => piece.think(dt))
		let dx = this.x - x0
		let t = Math.sin(this.x / 20 * tau) ** 2
		this.nod = approach(this.nod, Math.sign(dx) * t, 4 * dt)
	},
	draw: function () {
		UFX.draw("[ t", this.x, this.y)
		if (this.nod && this.standable()) {
			let [xs, nstand] = this.xstand()
			UFX.draw("t", xs, 0, "r", (nstand > 1 ? 0.04 : 0.2) * this.nod, "t", -xs, 0)
		}
		if (this.atilt > 0) {
			UFX.draw("r", this.atilt * tau / 4)
		} else if (this.atilt < 0) {
			UFX.draw("t", this.w, 0, "r", this.atilt * tau / 4, "t", -this.w, 0)
		}
		UFX.draw("t 0", 3 * this.stand)
		this.pieces.forEach(piece => draw(piece, this.stand, this.atilt))
		if (DEBUG) UFX.draw("ss red lw 0.2 sr 0 0", this.w, this.h)
		UFX.draw("]")
	},
}
function groupof(piece) {
	return new Group([0, 0], [piece])
}
function closeconn(conn) {
	let [x, y, tilt, t, piece, j] = conn
	piece.nspecs[j].taken = true
}
function groupjoin(group0, group1) {
	let c0s = group0.conns(), c1s = group1.conns()
	let dx = null, dy = null
	c0s.forEach(c0 => {
		c1s.forEach(c1 => {
			let d = connmatch(c0, c1)
			if (d !== null) {
				[dx, dy] = d
				closeconn(c0)
				closeconn(c1)
			}
		})
	})
	console.assert(dx !== null)
	dx = Math.round(group1.x - group0.x + dx)
	dy = Math.round(group1.y - group0.y + dy)
	group1.pieces.forEach(piece => {
		piece.pos[0] += dx
		piece.pos[1] += dy
		group0.pieces.push(piece)
	})
	group0.setup()
}

function Device(spec) {
	this.pos = spec.pos || [0, 0]
	this.tilt = spec.tilt || 0
	this.atilt = 0
	this.lit = false
	this.color = "gray"
	this.w = 10
	this.h = 5
	this.nspec = spec.nspec
	this.outline0 = getoutline(this.w, this.h, [this.nspec], "gray")
	this.outline1 = getoutline(this.w, this.h, [this.nspec], "white")
}
Device.prototype = UFX.Thing()
	.addcomp(WorldBound)
	.addcomp({
		conn: function () {
			let nspec = this.nspec
			let [dx, dy] = rot([
				[nspec.d, 0],
				[this.w, nspec.d],
				[this.w - nspec.d, this.h],
				[0, this.h - nspec.d],
			][nspec.e], this.tilt)
			let tilt = mod4(nspec.e + this.tilt)
			return [this.pos[0] + dx, this.pos[1] + dy, tilt, nspec.t, this, 0]
		},
		checkconn: function (conns) {
			let conn0 = this.conn()
			this.lit = conns.some(conn => connmatch(conn, conn0))
		},
		think: function (dt) {
		},
		draw: function () {
			UFX.draw("r", this.tilt * tau / 4)
			UFX.draw(this.lit ? this.outline1 : this.outline0)
		},
	})




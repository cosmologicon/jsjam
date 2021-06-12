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
	if (Math.hypot(x1 - x0, y1 - y0) > 3) return null
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


function drawfeet(pfoot) {
	UFX.draw("[ t", pfoot)
	UFX.draw("lw 0.5 ss black b m -1 4 q -2 2 -2 0 s b m 1 4 q 2 2 2 0 s")
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
	this.w = 10
	this.h = 10
	this.nspecs = spec.nspecs
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
		draw: function () {
			UFX.draw("r", this.tilt * tau / 4)
			drawfeet(this.pfoot)
			UFX.draw(this.outline)
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
			drawface(this.pface)
		},
	})

function Group(pos, pieces) {
	this.pieces = pieces
	;[this.x, this.y] = pos
	this.setup()
	this.stand = 0
	this.standtarget = 0
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
		return this.pieces.some(piece => piece.pos[0] == 0 && piece.tilt == 0)
	},
	// d = -1 for left tilt, +1 for right tilt
	dotilt: function (d) {
		this.pieces.forEach(piece => piece.dotilt(d, (d == -1 ? this.w : this.w)))
		this.x += d * this.w
		this.setup()
	},
	think: function (dt) {
		let target = this.standable() ? this.standtarget : 0
		this.stand = clamp(this.stand + 12 * dt * Math.sign(target - this.stand), 0, 1)
		this.pieces.forEach(piece => piece.think(dt))
	},
	draw: function () {
		UFX.draw("[ t", this.x, this.y)
		UFX.draw("t 0", 3 * this.stand)
		this.pieces.forEach(piece => draw(piece))
		if (DEBUG) UFX.draw("ss red lw 0.2 sr 0 0", this.w, this.h)
		UFX.draw("]")
	},
}
function groupof(piece) {
	return new Group(piece.pos, [piece])
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
	group1.pieces.forEach(piece => {
		piece.pos[0] += group1.x - group0.x + dx
		piece.pos[1] += group1.y - group0.y + dy
		group0.pieces.push(piece)
	})
	group0.setup()
}





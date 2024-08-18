
// G: game coordinates
// V: view coordinates. canvas is 1600x900

function poseq(pos0, pos1) {
	let [x0, y0] = pos0, [x1, y1] = pos1
	return x0 == x1 && y0 == y1
}

function possub(pos0, pos1) {
	let [x0, y0] = pos0, [x1, y1] = pos1
	return [x1 - x0, y1 - y0]
}

function dpos(pos0, pos1) {
	let [x0, y0] = pos0, [x1, y1] = pos1
	return Math.hypot(x1 - x0, y1 - y0)
}

function postimes(pos, a) {
	let [x, y] = pos
	return [x * a, y * a]
}

function posindex(arr, pos) {
	for (let j = 0 ; j < arr.length ; ++j) if (poseq(arr[j], pos)) return j
	return -1
}

function posincludes(arr, pos) {
	return posindex(arr, pos) > -1
}

let clamp = (x, a, b) => x < a ? a : x > b ? b : x
let mix = (x, y, f) => x + (y - x) * clamp(f, 0, 1)

function posapproach(pos0, pos1, dp) {
	if (dpos(pos0, pos1) < 0.001) return pos1
	let f = 1 - Math.exp(-dp)
	let [x0, y0] = pos0, [x1, y1] = pos1
	return [mix(x0, x1, f), mix(y0, y1, f)]
}

function angleto(pos0, pos1) {
	let [dx, dy] = possub(pos1, pos0)
	if (dx == 0 && dy == 0) return 0
	return Math.atan2(dx, -dy)
}



function nearesttile(tiles, pos) {
	let [x, y] = pos
	let dtiles = tiles.map(tile => [dpos(tile, pos), tile])
	dtiles.sort((tile0, tile1) => tile0[0] - tile1[0])
	return dtiles[0]
}

let view = {
	xV0: 800,
	yV0: 760,
	VscaleG: 120,
	n: 0,
	N: 0,

	resize: function () {
		let n = quest.getn()
		if (n <= this.N) return
		this.N = n
		if (this.n == 0) {
			this.n = this.N
			this.setscale()
		}
	},

	think: function (dt) {
		if (this.n < this.N) {
			let f = 1 - Math.exp(-4 * dt)
			this.n = mix(this.n, this.N, f)
			if (this.N - this.n < 0.001) this.n = this.N
			this.setscale()
		}
	},
	
	setscale: function () {
		let width = 2 * this.n + 1.3
		this.VscaleG = 1600 / width
		this.xV0 = 800
		this.yV0 = 800 - this.VscaleG / 2
	},
	
	scale: function () {
		UFX.draw("[ t", this.xV0, this.yV0, "z", this.VscaleG, -this.VscaleG)
	},
	
	GconvertV: function (pV) {
		if (pV === null) return [-1000, -1000]
		let [xV, yV] = pV
		let xG = (xV - this.xV0) / this.VscaleG
		let yG = -(yV - this.yV0) / this.VscaleG
		return [xG, yG]
	},
	GtileV: function (pV) {
		let [xG, yG] = this.GconvertV(pV)
		return [Math.floor(xG + 0.5), Math.floor(yG + 0.5)]
	},
}



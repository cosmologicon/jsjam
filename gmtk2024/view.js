
// G: game coordinates
// V: view coordinates. canvas is 1600x900


function dpos(pos0, pos1) {
	let [x0, y0] = pos0, [x1, y1] = pos1
	return Math.hypot(x1 - x0, y1 - y0)
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



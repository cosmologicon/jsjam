
// G: game coordinates
// V: view coordinates. canvas is 1600x900


let view = {
	xV0: 800,
	yV0: 800,
	VscaleG: 140,
	
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
		return [Math.floor(xG + 0.5), Math.floor(yG)]
	},
}




// G: game coordinates
// A: unscaled pixel coordinates. The canvas is fixed at 1600x900
// D: display coordinates. Actual pixels.


let view = {
	init: function () {
		this.cameraG0 = [0, 0]
		this.cameraA0 = [800, 450]
		this.AscaleG = 50
	},
	DconvertA: function (posA) {
		let [DscalexA, DscaleyA] = UFX.maximize.scale.DA
		let [xA, yA] = posA
		return [DscalexA * xA, DscaleyA * yA]
	},
	AconvertG: function (posG) {
		let [xG, yG] = posG
		let [xG0, yG0] = this.cameraG0
		let [xA0, yA0] = this.cameraA0
		return [xA0 + this.AscaleG * (xG - xG0), yA0 - this.AscaleG * (yG - yG0)]
	},
	DconvertG: function (posG) {
		return this.DconvertA(this.AconvertG(posG))
	},
}
view.init()

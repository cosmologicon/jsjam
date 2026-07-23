
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
	LconvertA: function (posA) {
		let [LscalexA, LscaleyA] = UFX.maximize.scale.LA
		let [xA, yA] = posA
		return [LscalexA * xA, LscaleyA * yA]
	},
	AconvertD: function (posD) {
		let [DscalexA, DscaleyA] = UFX.maximize.scale.DA
		let [xD, yD] = posD
		return [xD / DscalexA, yD / DscaleyA]
	},
	AconvertL: function (posL) {
		let [LscalexA, LscaleyA] = UFX.maximize.scale.LA
		let [xL, yL] = posL
		return [xL / LscalexA, yL / LscaleyA]
	},
	AconvertG: function (posG) {
		let [xG, yG] = posG
		let [xG0, yG0] = this.cameraG0
		let [xA0, yA0] = this.cameraA0
		return [xA0 + this.AscaleG * (xG - xG0), yA0 - 0.5 * this.AscaleG * (yG - yG0)]
	},
	GconvertA: function (posA) {
		let [xA, yA] = posA
		let [xG0, yG0] = this.cameraG0
		let [xA0, yA0] = this.cameraA0
		return [xG0 + (xA - xA0) / this.AscaleG, yG0 - (yA - yA0) / this.AscaleG / 0.5]
	},
	DconvertG: function (posG) {
		return this.DconvertA(this.AconvertG(posG))
	},
	LconvertG: function (posG) {
		return this.LconvertA(this.AconvertG(posG))
	},
	GconvertD: function (posD) {
		return this.GconvertA(this.AconvertD(posD))
	},
	GconvertL: function (posL) {
		return this.GconvertA(this.AconvertL(posL))
	},
	lookG: function (posG) {
		let [LscalexA, LscaleyA] = UFX.maximize.scale.LA
		return ["t", this.LconvertG(posG), "z", LscalexA * this.AscaleG, LscaleyA * this.AscaleG]
	},
}
view.init()

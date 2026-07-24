"use strict"

let tau = 2 * Math.PI
let clamp = (x, a, b) => x < a ? a : x > b ? b : x
let mix = (x, y, a) => { a = clamp(a, 0, 1) ; return x * (1 - a) + y * a }
// Fixed mod function to behave like in Python.
let mod = (x, z) => (x % z + z) % z
// The value equal to x (mod z) that's closest to 0
let zmod = (x, z) => mod(x + z / 2, z) - z / 2
// The value equal to x (mod z) that's closest to x0
let cmod = (x, z, x0) => x0 + zmod(x - x0, z)
let distance = ([x0, y0], [x1, y1]) => Math.hypot(x1 - x0, y1 - y0)
let approach = (x, target, dx) => x < target ? Math.min(x + dx, target) : Math.max(x - dx, target)
let approach2 = function ([x, y], [targetx, targety], dx) {
	let d = Math.hypot(x - targetx, y - targety)
	if (d <= dx) return [targetx, targety]
	return [mix(x, targetx, dx / d), mix(y, targety, dx / d)]
}
let softapproach = function (x, target, dlogx) {
	let d = Math.abs(x - target)
	let a = -Math.expm1(-dlogx)
//	if (a * d > dxmax) a = dxmax / d
	if ((1 - a) * d < 0.01) return target
	return mix(x, target, a)
}

let CS = A => [Math.cos(A), Math.sin(A)]
let polaroff = ([x0, y0], r, A) => {
	let [C, S] = CS(A)
	return [x0 + S * r, y0 - C * r]
}
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from#sequence_generator_range
let range = (start, stop, step) => Array.from({ length: Math.ceil((stop - start) / step) }, (_, i) => start + i * step)


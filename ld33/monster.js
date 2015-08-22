var monster = {
	draw: function (spec) {
		spec = spec || {}
		// Shadow
		var sgrad = UFX.draw.radgrad(0, 0, 0, 0, 0, 1, 0, "rgba(0,0,0,0.5)", 1, "rgba(0,0,0,0)")
		UFX.draw("[ z 60 30 fs", sgrad, "b o 0 0 1 f ]")
		UFX.draw("[ vflip")
		
		// Body
		var y0 = 30, y1 = 140
		var dx0 = 80, dx1 = 80
		var rx = dx1, ry = y1 - y0, r = Math.sqrt(rx * rx + ry * ry)
		var bgrad = UFX.draw.radgrad(-dx1, y1, 0, -dx1, y1, r, 0, "rgba(0,0,0,0)", 1, "rgba(0,0,0,0.9)")
		UFX.draw(
			"( m", 0, y0, "c", dx0, y0, dx1, y1, 0, y1, "c", -dx1, y1, -dx0, y0, 0, y0, ")",
			"fs yellow f",
			"fs", bgrad, "f",
			"ss black lw 2 s"
		)
		
		// Mouth
		var y0 = 80, w = 40, h = 40, b = -40, a = 0.3
		UFX.draw(
			"[ t", 0, y0, "r", a,
			"( m", -w, b, "q", 0, -h, w, b, "q", 0, h, -w, b, ") fs #111111 f ss black lw 2 s",
		"]")

		// Eyes
		
		var x0 = 0, y0 = 120, d = 15, r = 14, dr = 1, a = -0.2
		
		UFX.draw("[ t", x0, y0, "r", a, "ss black lw 2",
			"b o", -d, 0, r-dr, "fs white f s",
			"b o", d, 0, r+dr, "fs white f s",
		"]")
		
		


		UFX.draw("]")  // vflip
	},
}



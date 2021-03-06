function isuniq(list) {
	var s = {}
	for (var j = 0 ; j < list.length ; ++j) {
		if (s[list[j]]) return false
		s[list[j]] = true
	}
	return true
}

var monster = {
	fprops: [
		"footsize", "stance", "rleg",
		"handsize", "larm", "warm", "armtilt",
		"yfeature",
		"wmouth", "amouth", "bmouth", "tiltmouth",
		"reye", "eyespread", "droop", "tilteye",
		"stand", "height", "width", "pear",
	],
	cprops: [
		"body", "lid", "hand", "foot",
	],
	colors: [
		"#FFAAAA", "#77FF77", "#AAAAFF",
		"#FFAA44", "#FFFF00", "#00FFFF",
		"#FF44FF",
	],
	randomspec: function () {
		var spec = {}
		this.fprops.forEach(function (fprop) {
			spec["f" + fprop] = UFX.random()
		})
		this.cprops.forEach(function (cprop) {
			spec[cprop + "color"] = UFX.random.choice(monster.colors)
		})
		return spec
	},
	species: {
		3: "yep org ilf baw nax urx lom elp yat pag".split(" "),
		4: "voam artg egol snov zemn frog sped perf bolg".split(" "),
		5: "rygow losiq splun xerti tiger melon gnome syrup".split(" "),
		6: "nescod mrawbl spacer answer feldon captyr gorbun".split(" "),
	},
	names: [
		"crenshaw", "mildred", "yancy", "lister", "yzma", "glinda", "guster", "egon", "jadzia",
		"alvin", "zorba", "velma", "egbert", "morbo", "baskin", "fargo", "kendry", "besnik",
		"twondy", "morbel", "baxter", "moblin", "oswald",
	],
	randomspecies: function (ns) {
		var species = []
		for (var j = 0 ; j < ns.length ; ++j) {
			var n = ns[j]
			while (species.length == j) {
				var name = UFX.random.choice(this.species[n])
				if (!isuniq(species.join("") + name)) continue
				name = name.split("")
				UFX.random.shuffle(name)
				species.push(name.join(""))
			}
		}
		return species
	},
	randomnames: function (n) {
		var names = []
		while (names.length < n) {
			var name = UFX.random.choice(this.names)
			if (names.indexOf(name) == -1) names.push(name)
		}
		return names
	},
	scache: {},
	specfor: function (name, species) {
		var key = name + "," + species
		if (this.scache[key]) return this.scache[key]
		var spec = {}
		UFX.random.pushseed(name)
		var parts = ["eye", "mouth", "height", "width", "color", "arm", "leg"]
		var ds = {}
		for (var j = 0 ; j < parts.length ; ++j) ds[parts[j]] = 50 * j + UFX.random.rand(20)
		UFX.random.shuffle(parts)
		for (var j = 0 ; j < species.length ; ++j) {
			var c = species[j].charCodeAt(0) - "a".charCodeAt(0)
			ds[parts[j]] += c
		}
		function f(d, n) {
			var phi = 0.618033
			return (0.5 + d * Math.pow(phi, n + 1)) % 1
		}
		var colors = this.colors
		function fc(d, n) {
			return colors[Math.floor(f(d, n) * colors.length)]
		}

		function set(vnames, d) {
			for (var j = 0 ; j < vnames.length ; ++j) {
				if (monster.fprops.indexOf(vnames[j]) > -1) {
					spec["f" + vnames[j]] = f(d, j)
				} else {
					spec[vnames[j] + "color"] = fc(d, j)
				}
			}
		}

		set(["reye", "droop", "tilteye", "lid"], ds.eye)
		set(["wmouth", "amouth", "bmouth", "tiltmouth"], ds.mouth)
		set(["stand", "height", "yfeature"], ds.height)
		set(["footsize", "stance", "rleg"], ds.leg)
		set(["handsize", "larm", "warm"], ds.arm)
		set(["width", "pear", "eyespread", "armtilt"], ds.width)
		set(["body", "hand", "foot"], ds.color)
		
		UFX.random.popseed()
		this.scache[key] = spec
		return spec
	},
	draw: function (spec) {
		for (var s in spec) {
			eval("var " + s + " = spec." + s)
		}

		var t = 0.001 * Date.now()
		fstand += 0.05 * Math.sin(1.2 * t)
		fyfeature += 0.05 * Math.cos(1.2 * t)
		farmtilt += 0.1 * Math.cos(1.2 * t)


		var y0 = 30 + 30 * fstand
		var height = 80 + 100 * fheight

		var yhip = y0 + 0.25 * height
		var ymouth = y0 + (0.1 + 0.4 * fyfeature) * height
		var yeye = y0 + (0.5 + 0.6 * fyfeature) * height

		var dx0 = (30 + 80 * fwidth) * (1 + 0.9 * fpear)
		var dx1 = (30 + 80 * fwidth) * (1 - 0.9 * fpear)


		// Shadow
		var sgrad = UFX.draw.radgrad(0, 0, 0, 0, 0, 1, 0, "rgba(0,0,0,0.5)", 1, "rgba(0,0,0,0)")
		UFX.draw("[ z 60 15 fs", sgrad, "b o 0 0 1 f ]")
		UFX.draw("[ vflip")

		// Legs
		var rfoot = 10 + 30 * ffootsize
		var xstance = rfoot + 2 + 35 * fstance
		var rleg = (0.3 + 0.9 * frleg) * rfoot
		var legcolor = "#555"

		for (var a = 0 ; a < 2 ; ++a) {
			UFX.draw("[")
			if (a) UFX.draw("hflip")
			UFX.draw("b m", xstance, 0, "q", xstance, yhip, 0, yhip,
				"ss black lw", rleg + 4, "s ss", legcolor, "lw", rleg, "s")
			UFX.draw("[ t", xstance, 0,
				"b [ z 1 0.8 a 0 0", rfoot, 0, tau/2, "]",
				"[ z 1 0.1 a 0 0", rfoot, tau/2, tau, "]",
				"fs", footcolor, "f ss black lw 2 s",
			"]")
			UFX.draw("]")
		}
		
		// Arms
		var xshoulder = 3 / 8 * (dx0 + dx1) * 0.9
		var yshoulder = y0 + 0.5 * height
		var atilt = 0.4 - 1 * farmtilt
		var rhand = 6 + 25 * fhandsize
		var warm = rhand * (0.3 + 0.9 * fwarm)
		var beta = 0.5 + 1.7 * flarm
		var rarm = 50
		var armcolor = "#555"
		
		var hgrad = UFX.draw.radgrad(0, 0, 0, 0, 0, rhand, 0, "rgba(0,0,0,0)", 1, "rgba(0,0,0,0.3)")
		for (var a = 0 ; a < 2 ; ++a) {
			UFX.draw(a ? "[ hflip" : "[")
			UFX.draw("t", xshoulder, yshoulder, "r", atilt,
				"b aa", 0, -rarm, rarm, tau/4, tau/4-beta,
				"ss black lw", warm + 4, "s ss", armcolor, "lw", warm, "s",
				"t", rarm * Math.sin(beta), rarm * (-1 + Math.cos(beta)),
				"b o 0 0", rhand, "fs", handcolor, "f",
				"fs", hgrad, "f",
				"ss black lw 2 f s",
			"]")
		}
		// Body
		var y1 = y0 + height
		var rx = dx1, ry = y1 - y0, r = Math.sqrt(rx * rx + ry * ry)
		var bgrad = UFX.draw.radgrad(-dx1, y1, 0, -dx1, y1, r, 0, "rgba(0,0,0,0)", 1, "rgba(0,0,0,0.9)")
		UFX.draw(
			"( m", 0, y0, "c", dx0, y0, dx1, y1, 0, y1, "c", -dx1, y1, -dx0, y0, 0, y0, ")",
			"fs", bodycolor, "f",
			"fs", bgrad, "f",
			"ss black lw 2 s"
		)
		
		// Mouth
		var y0 = 80, w = 40, h = 40, b = -40, a = 0.3
		var tiltmouth = 0.5 * (ftiltmouth - 0.5)
		var amouth = 6 + 36 * famouth
		var bmouth = amouth * 4.2 * (fbmouth - 0.5)
		var wmouth = 10 + 28 * fwmouth
		var mouthcolor = "#222222"
		UFX.draw(
			"[ t", 0, ymouth, "r", tiltmouth, "t", 0, -bmouth / 2,
			"( m", -wmouth, bmouth, "q", 0, -amouth, wmouth, bmouth,
			"q", 0, amouth, -wmouth, bmouth, ") fs", mouthcolor, "f ss black lw 2 s",
		"]")

		// Eyes
		var reye = 6 + 14 * freye
		var rpupil = 0.5 * reye
		var deye = reye * (1.1 + 0.8 * feyespread)
		var aeye = 0.4 * (ftilteye - 0.5)
		var rlid = 1.1 * reye
		var alid = -0.2 + 0.8 * fdroop
		var pupilcolor = "black"
		
		UFX.draw("[ t", 0, yeye, "ss black lw 2",
			"[ t", deye * Math.cos(aeye), deye * Math.sin(aeye),
			"b o 0 0", reye, "fs white f s",
			"b o 0 0", rpupil, "fs", pupilcolor, "f",
			"( a 0 0", rlid, alid, tau/2 - alid, ") fs", lidcolor, "f s ]",
			"[ t", -deye * Math.cos(aeye), -deye * Math.sin(aeye),
			"b o 0 0", reye, "fs white f s",
			"b o 0 0", rpupil, "fs", pupilcolor, "f",
			"( a 0 0", rlid, alid, tau/2 - alid, ") fs", lidcolor, "f s ]",
		"]")
		
		


		UFX.draw("]")  // vflip
	},
}


function drawshirt(name, species) {
	UFX.draw("[ fs orange ss yellow font 32px~'Bree~Serif' lw 2")
	UFX.draw("t 0 -30 tab center middle sft0 THE t 0 15 tb bottom")
	;[].forEach.call(name, function (letter, jletter, word) {
		var angle = (jletter - word.length / 2 + 1/2) * 0.4
		UFX.draw("[ r", angle, "sft", letter.toUpperCase(), 0, -50, "]")
	})
	UFX.draw("]")
	if (species) {
		UFX.draw("fs white font bold~54px~'Catamaran' tab center top ft0", species.toUpperCase())
	}
}




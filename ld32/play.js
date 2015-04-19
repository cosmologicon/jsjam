// The main gameplay scene

var acosts = {
	bribe: 20,
	coup: 10,
	blackmail: 5,
	shutdown: 15,
	scandal: 20,
	propaganda: 5,
	collapse: 60,
}
var adescriptions = {
	bribe: "Immediately decrease a country's\nvote leaning.",
	scandal: "Increase a country's vote leaning,\nbut neighboring countries receive\na negative boost.",
	coup: "Lower a country's vote leaning all\nthe way. Neighboring countries receive\na positive boost.",
	blackmail: "Gain funds from the country over\ntime. The blackmail will end when you\ntake any action against this country.",
	shutdown: "Temporarily sever contact between\nthis country and all neighboring\ncountries.",
	propaganda: "Temporarily cause all incoming\ninfluence to this country to have\nan opposite effect. (Outgoing\ninfluence is unaffected.)",
	collapse: "Reduce the vote leaning of a\ncountry and all neighboring\ncountries.",
	help: "Countries' vote leanings increase\nover time. Maxed out countries\ninfluence neighboring countries\n(land borders only). You lose if\nthe total positive votes is greater\nthan the total negative votes\nat any time.",
}
var acolors = {
	bribe: ["red", null],
	scandal: ["blue", "red"],
	coup: ["red", "blue"],
	blackmail: [null, null],
	shutdown: [null, "black"],
	propaganda: [null, "green"],
	collapse: ["red", "red"],
}

function drawcapital(color, theta) {
	var dx = 14, dy = -5
	var x0 = -12, y0 = -8
	var x1 = 12 + 2 * Math.sin(theta), y1 = -9 + 4 * Math.cos(theta)
	var ax = 5, ay = 15
	UFX.draw("fs", color, "ss black lw 2",
		"( m", x0, y0, "c", x0+dx, y0+dy, x1-dx, y1-dy, x1, y1,
		"l", x1+ax, y1+ay, "c", x1-dx+ax, y1-dy+ay, x0+dx+ax, y0+dy+ay, x0+ax, y0+ay,
		") f s"
	)
	UFX.draw("lw 4 ss black b m", x0, y0, "l", x0+2*ax, y0+2*ay, "s")
}

UFX.scenes.play = {
	start: function () {
		this.level = 1
		var ldata = leveldata[this.level]
		this.buttons = ldata.actions.map(function (action, j) {
			return { index: j, name: action }
		})
		this.buttons.push({ index: -1, name: "help" })
		this.capitals = ldata.capitals.map(function (pos, j) {
			return {
				pos: pos,
				index: j,
				vote: -30,
			}
		})
		var adjs = this.adjs = {}
		for (var j in this.capitals) adjs[j] = []
		ldata.links.forEach(function (link) {
			adjs[link[0]].push(link[1])
			adjs[link[1]].push(link[0])
		})
		this.selected = null
		this.bank = ldata.bank
		this.timer = ldata.time
		this.waves = []
	},
	think: function (dt) {
		var mstate = UFX.mouse.state()
		var sx = canvas.width, sy = canvas.height
		this.buttonboxes = this.buttons.map(function (button) {
			if (button.name == "help") {
				var x = 0, y = 4.5
			} else {
				var x = button.index % 2, y = Math.floor(button.index / 2)
			}
			return [40 + 130 * x, 120 + y * 70, 120, 60]
		})
		if (mstate.left.down) this.handleclick(mstate.pos)
		var index = this.buttonat(UFX.mouse.pos)
		if (index > -1) {
			this.pointed = this.buttons[index].name
		} else {
			this.pointed = null
		}
		var dday = dt * 0.5
		for (var j = 0 ; j < this.capitals.length ; ++j) {
			var capital = this.capitals[j]
			capital.influence = capital.vote >= 30 ? 2 : 0
			capital.vote += 2 * dday
			if (this.capitals[j].shut) {
				this.capitals[j].shut = Math.max(this.capitals[j].shut - dday, 0)
			}
			if (this.capitals[j].prop) {
				this.capitals[j].prop = Math.max(this.capitals[j].prop - dday, 0)
			}
		}
		this.upvote = this.downvote = 0
		for (var j = 0 ; j < this.capitals.length ; ++j) {
			// Neighbor influence
			for (var k = 0 ; k < this.adjs[j].length ; ++k) {
				var i = this.adjs[j][k]
				if (this.capitals[i].shut || this.capitals[j].shut) continue
				if (this.capitals[i].influence) {
					var f = this.capitals[i].influence
					if (this.capitals[j].prop) f *= -1
					this.capitals[j].vote += dday * f
				}
			}
			this.capitals[j].vote = clamp(this.capitals[j].vote, -30, 30)
			this.capitals[j].ivote = this.capitals[j].vote > 10 ? 1 :
				this.capitals[j].vote < -10 ? -1 : 0
			this.upvote += this.capitals[j].vote > 10
			this.downvote += this.capitals[j].vote < -10
		}
		this.vote = this.upvote - this.downvote
		if (Math.floor(this.timer) > Math.floor(this.timer - dday)) {
			for (var j = 0 ; j < this.capitals.length ; ++j) {
				if (this.capitals[j].black) this.bank += 1
				if (this.capitals[j].influence > 0) {
					this.waves.push({
						t: 0,
						pos: this.capitals[j].pos,
						color: "#AAF"
					})
				}
			}
		}
		this.waves.forEach(function (wave) {
			wave.t += dt
		})
		this.waves = this.waves.filter(function (wave) {
			return wave.t < 1
		})

		this.timer -= dday
		if (this.vote > 0) {
			UFX.scene.swap("lose")
			playsound("lose")
		}
	},
	handleclick: function (mpos) {
		var index = this.buttonat(mpos)
		if (index > -1) {
			var clicked = this.buttons[index].name
			if (clicked == "help") return
			this.selected = clicked == this.selected ? null : clicked
			return
		}
		if (this.selected) {
			var mx = mpos[0] - 344, my = mpos[1] - 44
			for (var j = 0 ; j < this.capitals.length ; ++j) {
				var dx = mx - this.capitals[j].pos[0]
				var dy = my - this.capitals[j].pos[1]
				if (dx * dx + dy * dy < 50 * 50) {
					this.attack(j, this.selected)
//					this.selected = null
					return
				}
			}
		}
		this.selected = null
	},
	buttonat: function (pos) {
		return this.buttonboxes.map(function (box) {
			var dx = pos[0] - box[0], dy = pos[1] - box[1]
			return 0 <= dx && dx < box[2] && 0 <= dy && dy < box[3]
		}).indexOf(true)
	},
	attack: function (index, attacktype) {
		if (this.bank < acosts[attacktype]) {
			playsound("wrong")
			return
		}
		this.bank -= acosts[attacktype]
		if (attacktype == "bribe") {
			this.capitals[index].vote -= 20
			this.capitals[index].black = false
		}
		if (attacktype == "blackmail") {
			this.capitals[index].black = true
		}
		if (attacktype == "shutdown") {
			this.capitals[index].shut = 20
			this.capitals[index].black = false
		}
		if (attacktype == "propaganda") {
			this.capitals[index].prop = 20
			this.capitals[index].black = false
		}
		if (attacktype == "coup") {
			this.capitals[index].vote = -30
			this.waves.push({
				t: 0,
				pos: this.capitals[index].pos,
				color: "#AAF"
			})
			for (var j = 0 ; j < this.adjs[index].length ; ++j) {
				var jndex = this.adjs[index][j]
				if (!this.capitals[index].shut && !this.capitals[jndex].shut) {
					if (this.capitals[jndex].prop) {
						this.capitals[jndex].vote -= 15
					} else {
						this.capitals[jndex].vote += 15
					}
				}
			}
			this.capitals[index].black = false
		}
		if (attacktype == "scandal") {
			this.capitals[index].vote = 30
			this.waves.push({
				t: 0,
				pos: this.capitals[index].pos,
				color: "#FAA"
			})
			for (var j = 0 ; j < this.adjs[index].length ; ++j) {
				var jndex = this.adjs[index][j]
				if (!this.capitals[index].shut && !this.capitals[jndex].shut) {
					if (this.capitals[jndex].prop) {
						this.capitals[jndex].vote += 15
					} else {
						this.capitals[jndex].vote -= 15
					}
				}
			}
			this.capitals[index].black = false
		}
		if (attacktype == "collapse") {
			this.capitals[index].vote -= 30
			this.waves.push({
				t: 0,
				pos: this.capitals[index].pos,
				color: "#FAA"
			})
			for (var j = 0 ; j < this.adjs[index].length ; ++j) {
				var jndex = this.adjs[index][j]
				if (!this.capitals[index].shut && !this.capitals[jndex].shut) {
					if (this.capitals[jndex].prop) {
						this.capitals[jndex].vote += 30
					} else {
						this.capitals[jndex].vote -= 30
					}
				}
			}
			this.capitals[index].black = false
		}
	},
	draw: function () {
		UFX.draw("fs #003 f0")
		var sx = canvas.width, sy = canvas.height
		// Map
		UFX.draw("fs #AAF fr", 344-12, 44-12, 512+24, 512+24)
		UFX.draw("drawimage", UFX.resource.images.mapcallisto, 344, 44)
		UFX.draw("[ ss #AAF lw 1 alpha 0.4 b")
		for (var x = 53 ; x < 512 ; x += 103) {
			UFX.draw("m", 344 + x, 44, "l", 344 + x, 44+512)
			UFX.draw("m", 344, 44 + x, "l", 344+512, 44+x)
		}
		UFX.draw("s ]")
		//UFX.draw("fs rgba(50,50,50,0.7) fr", 344, 44, 512, 512)
		this.waves.forEach(function (wave) {
			UFX.draw("[ t 344 44", "ss", wave.color, "lw 4 alpha", 1 - wave.t,
				"b o", wave.pos, 20 + 60 * wave.t, "s ]")
		})
		// Cities
		for (var j = 0 ; j < this.capitals.length ; ++j) {
			var pos = this.capitals[j].pos
			var vote = this.capitals[j].vote
			var ivote = this.capitals[j].ivote
			var color = { "-1": "#F44", 0: "#666", 1: "#44F" }[ivote]
			UFX.draw("[ t", 344, 44, "t", pos)
			//	"font 26px~'IM~Fell~English~SC' fs", color, "ss black lw 2",
			//	"textalign center textbaseline middle",
			//	"st", cname, 0, 0, "ft", cname, "0 0")
			UFX.draw("[")
			if (this.capitals[j].prop > 0) UFX.draw("z", -1, -1)
			drawcapital(color, j - 2 * 0.001 * Date.now())
			UFX.draw("]")
			if (this.capitals[j].black) {
				var dx = 30
				var s = 0.3 * Math.sin(Date.now() * 0.001 * 6)
				UFX.draw("fs white ss black lw 2 tab center middle")
				UFX.draw("[ t", dx, 0, "r", s, "st0 $ ft0 $ ]")
				UFX.draw("[ t", -dx, 0, "r", -s, "st0 $ ft0 $ ]")
			}
			UFX.draw("[ t 0 -26 fs black fr -31 0 62 10",
				"fs #400 fr -30 1 20 8",
				"fs #222 fr -10 1 20 8",
				"fs #004 fr 10 1 20 8",
				"fs", color, "fr -30 1", 30 + vote, 8, "]")
			if (this.capitals[j].shut) {
				var t = this.capitals[j].shut
				if (t > 2 || t * 16 % 2 > 1) {
					var r = 45 + 5 * Math.sin(4 * t)
					UFX.draw("[ ss black lw 8 alpha 0.6", "b o 0 0", r, "s ]")
				}
			}
			if (this.capitals[j].prop) {
				var t = this.capitals[j].prop
				if (t > 2 || t * 16 % 2 > 1) {
					var s = 1 + 0.2 * Math.sin(5 * t)
					UFX.draw("[ ss green lw 8 alpha 0.8 z", s, 1/s, "b o 0 0 40 s ]")
				}
			}
			UFX.draw("]")
		}
		// Info
		if (this.pointed) {
			UFX.draw("fs rgba(0,0,0,0.8) f0")
			var texts = [this.pointed].concat(adescriptions[this.pointed].split("\n"))
			UFX.draw("fs white ss black font 42px~'Oregano' tab middle top")
			texts.forEach(function (text, j) {
				var x = 334 + 256, y = 140 + 42 * j + 10 * (j > 0)
				context.strokeText(text, x, y)
				context.fillText(text, x, y)
			})
		}
		// Buttons
		var boxes = this.buttonboxes, selected = this.selected
		this.buttons.forEach(function (button, j) {
			var box = boxes[j], x = box[0], y = box[1], w = box[2], h = box[3]
			UFX.draw("ss", (selected == button.name ? "white" : "gray"))
			UFX.draw("fs", (selected == button.name ? "gray" : "#444"))
			UFX.draw("b rr", box, 5, "f lw 2 s")
			UFX.draw("tab center bottom font 20px~Piedra")
			if (!acosts[button.name]) UFX.draw("tb middle")
			UFX.draw("fs white ft", button.name, x + w/2, y + h/2)
			if (acosts[button.name]) {
				UFX.draw("textbaseline top ft $" + acosts[button.name], x + w/2, y + h/2)
			}
			if (acolors[button.name]) {
				var color0 = acolors[button.name][0], color1 = acolors[button.name][1]
				if (color0) UFX.draw("fs", color0, "b o", x+w-18, y+h-18, 6, "f")
				if (color1) UFX.draw("ss", color1, "b o", x+w-18, y+h-18, 10, "lw 2 s")
			}
		})
		// Title
		UFX.draw("[ font 60px~'IM~Fell~English~SC' fs white shadow black 3 3 0",
			"textalign left textbaseline top")
		context.fillText("Region: " + leveldata[this.level].name, 20, 20)
		UFX.draw("]")
		// Bank
		UFX.draw("[ fs white shadow black 2 2 0 font 40px~'Special~Elite'",
			"tab left bottom")
		context.fillText("Funds: $" + this.bank, 20, sy-20)
		UFX.draw("]")
		// Clock
		UFX.draw("[ fs white ss black tab center top",
			"lw 4 font 50px~'Bubblegum~Sans' sft " + Math.ceil(this.timer), sx-50, 10,
			"lw 2 font 18px~'Bubblegum~Sans' sft days~until", sx-50, 60,
			"lw 2 font 18px~'Bubblegum~Sans' sft regional~vote", sx-50, 80,
			"]")
		// Votes
		UFX.draw("[ font 54px~'Joti~One' tab right bottom ss black lw 9",
			"fs white sft Total~votes:", sx-180, sy-10,
			"fs #F77 sft -" + this.downvote, sx-100, sy-10,
			"fs #77F sft +" + this.upvote, sx-20, sy-10
		)
		UFX.draw("]")
	},
}


UFX.scenes.lose = {
	draw: function () {
		UFX.scenes.play.draw()
		UFX.draw("fs rgba(0,0,0,0.8) f0")
	},
}





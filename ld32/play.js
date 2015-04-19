// The main gameplay scene

var acosts = {
	bribe: 10,
	blackmail: 5,
}
var adescriptions = {
	bribe: "Immediately decrease a country's\nvote leaning.",
	blackmail: "Gain funds from the country over\ntime. The blackmail will end when you\ntake any action against this country\nor attack any neighboring country.",
	shutdown: "Temporarily sever contact between\nthis country and all neighboring\ncountries."
}

function gametoscreen(pos) {
	return [canvas.width/2 + 50 * pos[0], canvas.height/2 + 50 * pos[1]]
}
function screentogame(pos) {
	return [(pos[0] - canvas.width/2) / 50, (pos[1] - canvas.height/2) / 50]
}

UFX.scenes.play = {
	start: function () {
		this.level = 1
		var ldata = leveldata[this.level]
		this.buttons = ldata.actions.map(function (action, j) {
			return { index: j, name: action }
		})
		this.capitals = {}
		for (var c in ldata.capitals) {
			this.capitals[c] = {
				pos: ldata.capitals[c].pos,
				vote: 30,
			}
		}
		this.selected = null
		this.bank = ldata.bank
		this.timer = ldata.time
	},
	think: function (dt) {
		var mstate = UFX.mouse.state()
		var sx = canvas.width, sy = canvas.height
		this.buttonboxes = this.buttons.map(function (button) {
			return [40, 120 + button.index * 70, 90, 60]
		})
		if (mstate.left.down) this.handleclick(mstate.pos)
		var index = this.buttonat(UFX.mouse.pos)
		if (index > -1) {
			this.pointed = this.buttons[index].name
		} else {
			this.pointed = null
		}
		for (var cname in this.capitals) {
			var capital = this.capitals[cname]
			capital.vote = clamp(capital.vote + dt, -30, 30)
		}
		this.upvote = this.downvote = 0
		for (var s in this.capitals) {
			this.capitals[s].ivote = this.capitals[s].vote > 10 ? 1 :
				this.capitals[s].vote < -10 ? -1 : 0
			this.upvote += this.capitals[s].vote > 10
			this.downvote += this.capitals[s].vote < -10
		}
		this.vote = this.upvote - this.downvote
		var dday = dt * 0.5
		if (Math.floor(this.timer) > Math.floor(this.timer - dday)) {
			for (var c in this.capitals) {
				if (this.capitals[c].black) this.bank += 1
			}
		}
		this.timer -= dday
	},
	handleclick: function (mpos) {
		var index = this.buttonat(mpos)
		if (index > -1) {
			var clicked = this.buttons[index].name
			this.selected = clicked == this.selected ? null : clicked
			return
		}
		if (this.selected) {
			var gpos = screentogame(mpos)
			for (var cname in this.capitals) {
				var dx = gpos[0] - this.capitals[cname].pos[0]
				var dy = gpos[1] - this.capitals[cname].pos[1]
				if (dx * dx + dy * dy < 0.5 * 0.5) {
					this.attack(cname, this.selected)
					this.selected = null
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
	attack: function (cityname, attacktype) {
		if (this.bank < acosts[attacktype]) {
			playsound("wrong")
			return
		}
		this.bank -= acosts[attacktype]
		if (attacktype == "bribe") {
			this.capitals[cityname].vote -= 20
		}
		if (attacktype == "blackmail") {
			this.capitals[cityname].black = true
		}
	},
	draw: function () {
		UFX.draw("fs #003 f0")
		var sx = canvas.width, sy = canvas.height
		// Map
		UFX.draw("fs #AAF fr", 344-12, 44-12, 512+24, 512+24)
		UFX.draw("drawimage", UFX.resource.images.map0, 344, 44)
		UFX.draw("[ ss #AAF lw 1 alpha 0.4 b")
		for (var x = 53 ; x < 512 ; x += 103) {
			UFX.draw("m", 344 + x, 44, "l", 344 + x, 44+512)
			UFX.draw("m", 344, 44 + x, "l", 344+512, 44+x)
		}
		UFX.draw("s ]")
		//UFX.draw("fs rgba(50,50,50,0.7) fr", 344, 44, 512, 512)
		// Cities
		for (var cname in this.capitals) {
			var pos = this.capitals[cname].pos
			var vote = this.capitals[cname].vote
			var ivote = this.capitals[cname].ivote
			var color = { "-1": "#F44", 0: "#666", 1: "#44F" }[ivote]
			UFX.draw("[ t", gametoscreen(pos),
				"font 26px~'IM~Fell~English~SC' fs", color, "ss black lw 2",
				"textalign center textbaseline middle",
				"st", cname, 0, 0, "ft", cname, "0 0")
			if (this.capitals[cname].black) {
				var dx = cname.length * 9
				var s = 0.3 * Math.sin(Date.now() * 0.001 * 6)
				UFX.draw("fs white ss black lw 2")
				UFX.draw("[ t", dx, 0, "r", s, "st0 $ ft0 $ ]")
				UFX.draw("[ t", -dx, 0, "r", -s, "st0 $ ft0 $ ]")
			}
			UFX.draw("[ t 0 -26 fs black fr -31 0 62 10 fs", color,
				"fr -30 1", 30 + vote, 8, "]")
			UFX.draw("]")
		}
		// Info
		if (this.pointed) {
			UFX.draw("fs rgba(0,0,0,0.8) f0")
			var texts = [this.pointed].concat(adescriptions[this.pointed].split("\n"))
			UFX.draw("fs white ss black font 50px~'Oregano' tab middle top")
			texts.forEach(function (text, j) {
				context.strokeText(text, 550, 140 + 50 * j)
				context.fillText(text, 550, 140 + 50 * j)
			})
		}
		// Buttons
		var boxes = this.buttonboxes, selected = this.selected
		this.buttons.forEach(function (button, j) {
			var box = boxes[j], x = box[0], y = box[1], w = box[2], h = box[3]
			UFX.draw("ss", (selected == button.name ? "white" : "gray"))
			UFX.draw("fs", (selected == button.name ? "gray" : "#444"))
			UFX.draw("b rr", box, 5, "f lw 2 s")
			UFX.draw("textalign center textbaseline bottom font 20px~Piedra fs white ft", button.name,
				x + w/2, y + h/2)
			UFX.draw("textbaseline top ft $" + acosts[button.name], x + w/2, y + h/2)
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
			"fs white sft Votes:", sx-180, sy-10,
			"fs #F77 sft -" + this.downvote, sx-100, sy-10,
			"fs #77F sft +" + this.upvote, sx-20, sy-10
		)
		UFX.draw("]")
	},
}



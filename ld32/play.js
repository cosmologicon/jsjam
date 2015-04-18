// The main gameplay scene

var acosts = {
	bribe: 10,
	blackmail: 5,
}
var adescriptions = {
	bribe: "influence a country's vote downward.",
	blackmail: "gain money over time.",
}

function gametoscreen(pos) {
	return [canvas.width/2 + 50 * pos[0], canvas.height/2 + 50 * pos[1]]
}
function screentogame(pos) {
	return [(pos[0] - canvas.width/2) / 50, (pos[1] - canvas.height/2) / 50]
}

UFX.scenes.play = {
	start: function () {
		this.buttons = [
			{ index: 0, name: "bribe" },
			{ index: 1, name: "blackmail" },
		]
		this.capitals = {
			aburg: { pos: [0, 0], vote: 10, },
			bburg: { pos: [1, 2], vote: -20, },
		}
		this.selected = null
		this.bank = 25
	},
	think: function (dt) {
		var mstate = UFX.mouse.state()
		var sx = canvas.width, sy = canvas.height
		this.buttonboxes = this.buttons.map(function (button) {
			return [20, 20 + button.index * 60, 90, 50]
		})
		if (mstate.left.down) this.handleclick(mstate.pos)
		for (var cname in this.capitals) {
			var capital = this.capitals[cname]
			capital.vote = clamp(capital.vote + dt, -30, 30)
		}
		this.upvote = this.downvote = 0
		for (var s in this.capitals) {
			this.upvote += this.capitals[s].vote > 10
			this.downvote += this.capitals[s].vote < -10
		}
		this.vote = this.upvote - this.downvote
	},
	handleclick: function (mpos) {
		var index = this.buttonboxes.map(function (box) {
			var dx = mpos[0] - box[0], dy = mpos[1] - box[1]
			return 0 <= dx && dx < box[2] && 0 <= dy && dy < box[3]
		}).indexOf(true)
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
	attack: function (cityname, attacktype) {
		if (this.bank < acosts[attacktype]) {
			playsound("wrong")
			return
		}
		this.bank -= acosts[attacktype]
		if (attacktype == "bribe") {
			this.capitals[cityname].vote -= 20
		}
	},
	draw: function () {
		UFX.draw("fs #003 f0")
		var sx = canvas.width, sy = canvas.height
		var boxes = this.buttonboxes, selected = this.selected
		this.buttons.forEach(function (button, j) {
			var box = boxes[j], x = box[0], y = box[1], w = box[2], h = box[3]
			UFX.draw("ss", (selected == button.name ? "white" : "gray"))
			UFX.draw("fs", (selected == button.name ? "gray" : "#444"))
			UFX.draw("b rr", box, 5, "f lw 2 s")
			UFX.draw("textalign center textbaseline middle font 20px~Viga fs white ft", button.name,
				x + w/2, y + h/2)
		})
		for (var cname in this.capitals) {
			var pos = this.capitals[cname].pos
			var vote = this.capitals[cname].vote
			var color = vote > 10 ? "blue" : vote > -10 ? "gray" : "red"
			UFX.draw("[ t", gametoscreen(pos), "b o 0 0 4 fs white f",
				"textalign center textbaseline bottom ft", cname, "0 20")
			UFX.draw("fs", color, "b fr -30 -20", 30 + vote, 10,
				"ss white lw 2 b sr -30 -20 60 10")
			UFX.draw("]")
		}
		if (this.selected) {
			var text = this.selected + " ($" + acosts[this.selected] + "):\n" +
				adescriptions[this.selected]
			UFX.draw("[ fs white shadow black 3 3 0 font 32px~Viga",
				"textalign center textbaseline bottom")
			context.fillText(text, sx/2, sy-20)
			UFX.draw("]")
		}
		UFX.draw("[ fs white shadow black 3 3 0 font 32px~Viga",
			"textalign right textbaseline top")
		context.fillText("bank: $" + this.bank, sx-20, 20)
		UFX.draw("]")
	},
}



// The main gameplay scene


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
			{ index: 1, name: "recruit" },
		]
		this.capitals = {
			aburg: { pos: [0, 0], vote: 10, },
			bburg: { pos: [1, 2], vote: -20, },
		}
		this.selected = null
	},
	think: function (dt) {
		var mstate = UFX.mouse.state()
		var sx = canvas.width, sy = canvas.height
		this.buttonboxes = this.buttons.map(function (button) {
			return [20, 20 + button.index * 60, 90, 50]
		})
		if (mstate.left.down) this.handleclick(mstate.pos)
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
		console.log(cityname, attacktype)
	},
	draw: function () {
		UFX.draw("fs #003 f0")
		var sx = canvas.width, sy = canvas.height
		var boxes = this.buttonboxes, selected = this.selected
		this.buttons.forEach(function (button, j) {
			var box = boxes[j], x = box[0], y = box[1], w = box[2], h = box[3]
			UFX.draw("ss", (selected == button.name ? "white" : "gray"))
			UFX.draw("b rr", box, 20, "lw 2 s")
			UFX.draw("textalign center textbaseline middle fs white ft", button.name,
				x + w/2, y + h/2)
		})
		for (var cname in this.capitals) {
			var pos = this.capitals[cname].pos
			var vote = this.capitals[cname].vote
			UFX.draw("[ t", gametoscreen(pos), "b o 0 0 4 fs white f",
				"textalign center textbaseline bottom ft", cname, "0 20")
			UFX.draw("lw 2 b sr -30 -20 60 10 b fr -30 -20", 30 + vote, 10)
			UFX.draw("]")
		}
	},
}



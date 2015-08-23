UFX.scenes.tweak = {
	start: function () {
		this.spec = monster.randomspec()
		this.jfprop = 0
		this.fprop = monster.fprops[this.jfprop]
		this.cprop = monster.cprops[0]
	},
	think: function (dt) {
		var mstate = UFX.mouse.state()
		var kstate = UFX.key.state()
		this.t += dt
		this.scale = canvas.width / 800
		
		if (mstate.dpos[0]) {
			this.fvalue = clamp(mstate.pos[0] / canvas.width, 0, 1)
			this.spec["f" + this.fprop] = this.fvalue
		}
		if (kstate.down["1"]) {
			this.jfprop = (this.jfprop + 1) % monster.fprops.length
			this.fprop = monster.fprops[this.jfprop]
		}
		
	},
	draw: function () {
		var grad = UFX.draw.lingrad(0, 0, canvas.width, canvas.height, 0, "#00A", 1, "#006")
		UFX.draw("fs", grad, "f0")
		UFX.draw("[",
			"z", this.scale, this.scale,
			"[ t", 400, 320)
		monster.draw(this.spec)
		UFX.draw("]")
		var ftext = this.fprop + "~=~" + this.spec["f" + this.fprop].toFixed(2)
		UFX.draw("tab left top font 40px~'Viga' fs white ss black lw 2",
			"sft", ftext, 20, 20,
			"sft", this.cprop, 20, 60)

		UFX.draw("]")
	},
}

UFX.scenes.play = {
	xtile: 40,
	ytile: 50,
	start: function () {
		this.customers = [
			{
				name: "kermit",
				species: "frog",
				pos: [100, 300],
				served: false,
			},
		]
		this.tshirts = [
			{
				name: "kermit",
				species: "gorf".split(""),
				pos: [400, 200],
				sold: false,
			},
			{
				name: "mildred",
				species: "pnulk".split(""),
				pos: [600, 200],
				sold: false,
			},
		]
		this.jpullshirt = -1
		this.jpullletter = 0
	},
	think: function (dt) {
		var mstate = UFX.mouse.state()
		var kstate = UFX.key.state()
		
		this.scale = canvas.width / 800
		mstate.pos[0] /= this.scale
		mstate.pos[1] /= this.scale
		
		this.tiles = []
		for (var j = 0 ; j < this.tshirts.length ; ++j) {
			var species = this.tshirts[j].species
			for (var k = 0 ; k < species.length ; ++k) {
				var letter = species[k]
				if (j == this.jpullshirt && k == this.jpullletter) {
					letter = null
				}
				var x = this.tshirts[j].pos[0], y = this.tshirts[j].pos[1]
				x += (k - species.length / 2) * this.xtile
				this.tiles.push([[x, y], letter, [j, k]])
			}
		}
		var target = null
		var xtile = this.xtile, ytile = this.ytile
		this.tiles.forEach(function (tile) {
			var dx = mstate.pos[0] - tile[0][0], dy = mstate.pos[1] - tile[0][1]
			if (dx > 1 && dx < xtile - 1 && dy > 1 && dy < ytile - 1) {
				target = tile[2]
			}
		})

		if (this.jpullshirt > -1) {
			var pos = [mstate.pos[0] - this.xtile / 2, mstate.pos[1] - this.ytile / 2]
			var letter = this.tshirts[this.jpullshirt].species[this.jpullletter]
			this.tiles.push([pos, letter, [this.jpullshirt, this.jpullletter]])
			if (mstate.left.up) {
				if (target) {
					var j0 = this.jpullshirt, k0 = this.jpullletter, l0 = this.tshirts[j0].species[k0]
					var j1 = target[0], k1 = target[1], l1 = this.tshirts[j1].species[k1]
					if (j0 != j1 || k0 != k1) {
						this.tshirts[j0].species[k0] = l1
						this.tshirts[j1].species[k1] = l0
						playsound("swap")
					}
				}
				this.jpullshirt = -1
			}
		} else {
			canvas.style.cursor = target ? "pointer" : "default"
			if (mstate.left.down && target) {
				this.jpullshirt = target[0]
				this.jpullletter = target[1]
			}
		}
	},
	draw: function () {
		UFX.draw("fs blue f0 [ z", this.scale, this.scale)
		for (var j = 0 ; j < this.tshirts.length ; ++j) {
			var tshirt = this.tshirts[j]
			if (tshirt.sold) continue
			UFX.draw("[ t", tshirt.pos)
			drawshirt(tshirt.name, null)
			UFX.draw("]")
		}
		
		UFX.draw("tab center middle")
		this.tiles.forEach(function (tile) {
			var pos = tile[0], letter = tile[1]
			UFX.draw("[ t", pos, "fs #444 fr 2 2 36 46 fs black fr 5 5 30 40")
			if (letter) {
				UFX.draw("font 25px~'Viga' fs white ft", letter.toUpperCase(), 20, 25)
			}
			UFX.draw("]")
		})
		UFX.draw("]")
	},

}



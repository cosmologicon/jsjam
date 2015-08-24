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

var state = {
	bank: 10,
	level: 0,
}

UFX.scenes.play = {
	xtile: 40,
	ytile: 50,
	start: function () {
		var ns = [state.level < 2 ? 3 : state.level < 4 ? 4 : state.level < 6 ? 5 : 6]
		this.price = state.level < 2 ? 5 : state.level < 4 ? 10 : state.level < 6 ? 17 : 25
		var species = monster.randomspecies(ns)
		var names = monster.randomnames(ns.length)
		this.customers = []
		this.tshirts = []
		for (var j = 0 ; j < names.length ; ++j) {
			this.customers.push({
				name: names[j],
				species: species[j],
				served: false,
			})
			this.tshirts.push({
				name: names[j],
				species: species[j].split(""),
				pos: [550 + 150 * j, 360],
				sold: false,
			})
		}
		var ps = 
			ns.length == 1 ? [[180, 360]] :
			ns.length == 2 ? [[200, 200], [200, 400]] :
			[[300, 200], [100, 400], [300, 400]]
		UFX.random.shuffle(ps)
		this.customers.forEach(function (customer, j) {
			customer.pos = ps[j]
		})
		
		var letters = this.tshirts.map(function (tshirt) { return tshirt.species.join("") }).join("").split("")
		UFX.random.shuffle(letters)
		this.tshirts.forEach(function (tshirt) {
			tshirt.species = letters.splice(0, tshirt.species.length)
		})

		this.jpullshirt = -1
		this.jpullletter = 0
		this.printed = {}
		playsound("ring")
		this.t = 0
		this.wint = 0
	},
	think: function (dt) {
		this.t += dt
		var mstate = UFX.mouse.state()
		var kstate = UFX.key.state()
		if (kstate.down.escape) {
			UFX.scene.pop()
		}
		
		this.scale = canvas.width / 800
		var mpos = [mstate.pos[0] / this.scale, mstate.pos[1] / this.scale]

		if (this.customers.every(function (c) { return c.served })) {
			if (mstate.left.down) {
				UFX.scene.swap("play")
				state.level += 1
			}
		}
		
		this.tiles = []
		this.ptiles = []
		for (var j = 0 ; j < this.tshirts.length ; ++j) {
			var tshirt = this.tshirts[j]
			if (tshirt.sold) continue
			var species = tshirt.species
			var x0 = tshirt.pos[0], y = tshirt.pos[1]
			for (var k = 0 ; k < species.length ; ++k) {
				var letter = species[k]
				if (j == this.jpullshirt && k == this.jpullletter) {
					letter = null
				}
				var x = x0 + (k - species.length / 2) * this.xtile
				this.tiles.push([[x, y], letter, [j, k]])
			}
			if (this.printed[tshirt.name + tshirt.species.join("")]) {
				if (tshirt.species.join("") == this.customers[j].species) {
					this.ptiles.push([
						["sell", j],
						[x0 - 80, y - 200, 160, 50],
					])
				}
			} else {
				this.ptiles.push([
					["print", j],
					[x0 - 80, y - 200, 160, 50],
				])
			}
		}
		var target = null
		var xtile = this.xtile, ytile = this.ytile
		this.tiles.forEach(function (tile) {
			var dx = mpos[0] - tile[0][0], dy = mpos[1] - tile[0][1]
			if (dx > 1 && dx < xtile - 1 && dy > 1 && dy < ytile - 1) {
				target = tile[2]
			}
		})

		var ptarget = null
		this.ptiles.forEach(function (ptile) {
			var p = ptile[1]
			var dx = mpos[0] - p[0], dy = mpos[1] - p[1]
			if (dx > 0 && dx < p[2] && dy > 0 && dy < p[3]) {
				ptarget = ptile[0]
			}
		})

		if (this.jpullshirt > -1) {
			var pos = [mpos[0] - this.xtile / 2, mpos[1] - this.ytile / 2]
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
			canvas.style.cursor = target || ptarget ? "pointer" : "default"
			if (mstate.left.down && target) {
				this.jpullshirt = target[0]
				this.jpullletter = target[1]
				playsound("click")
			} else if (mstate.left.down && ptarget) {
				var action = ptarget[0]
				if (action == "sell") {
					this.tshirts[ptarget[1]].sold = true
					this.customers[ptarget[1]].served = true
					state.bank += this.price
				} else if (action == "print") {
					var tshirt = this.tshirts[ptarget[1]]
					this.printed[tshirt.name + tshirt.species.join("")] = true
					state.bank -= 1
				}
			}
		}
	},
	draw: function () {
		var r = Math.round(80 + 70 * Math.sin(0.001 * 0.1 * Date.now() + 0 * tau / 3))
		var g = Math.round(80 + 70 * Math.sin(0.001 * 0.1 * Date.now() + 1 * tau / 3))
		var b = Math.round(80 + 70 * Math.sin(0.001 * 0.1 * Date.now() + 2 * tau / 3))
		UFX.draw("fs rgb(" + r + "," + g + "," + b + ") f0 [ z", this.scale, this.scale)
		for (var j = 0 ; j < this.customers.length ; ++j) {
			var customer = this.customers[j]
			if (customer.served) continue
			UFX.draw("[ t", customer.pos)
			monster.draw(monster.specfor(customer.name, customer.species))
			UFX.draw("]")
		}

		for (var j = 0 ; j < this.tshirts.length ; ++j) {
			var tshirt = this.tshirts[j]
			if (tshirt.sold) continue
			UFX.draw("[ t", tshirt.pos)
			drawshirt(tshirt.name, null)
			if (this.printed[tshirt.name + tshirt.species.join("")]) {
				UFX.draw("t", 0, -160, "z", 0.7, 0.7)
				monster.draw(monster.specfor(tshirt.name, tshirt.species))
			}
			UFX.draw("]")
		}
		
		UFX.draw("tab center middle")
		this.tiles.forEach(function (tile) {
			var pos = tile[0], letter = tile[1]
			UFX.draw("[ t", pos, "fs #444 fr 2 2 36 46 fs black fr 5 5 30 40")
			if (letter) {
				UFX.draw("font bold~25px~'Catamaran' fs white ft", letter.toUpperCase(), 20, 25)
			}
			UFX.draw("]")
		})
		var price = this.price
		this.ptiles.forEach(function (ptile) {
			var info = ptile[0], action = info[0]
			var pos = ptile[1], x0 = pos[0], y0 = pos[1], dx = pos[2], dy = pos[3]
			UFX.draw("[ fs #444 ss black fsr", pos)
			action = action == "print" ? "print~(-$1)" : "sell~(+$" + price + ")"
			UFX.draw("tab center middle fs white sh black 2 2 0 font 30px~'Bree~Serif'",
				"ft", action, x0 + dx/2, y0 + dy/2)
			UFX.draw("]")
		})
		if (this.customers.every(function (c) { return c.served })) {
			UFX.draw("[ fs white sh black 3 3 0 font 32px~'Fontdiner~Swanky' tab left top",
				"ft Success! 10 10 ]")
		} else {
			UFX.draw("[ fs white sh black 3 3 0 font 32px~'Fontdiner~Swanky' tab left top",
				"ft Find~this~customer's~t-shirt! 10 10 ]")
		}
		UFX.draw("[ fs white sh black 3 3 0 font bold~32px~'Catamaran' tab right top",
			"ft Funds:~$" + state.bank + " 790 10 ]")
		UFX.draw("]")
	},

}



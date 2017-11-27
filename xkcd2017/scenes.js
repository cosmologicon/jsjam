let Lives = {
	start: function () {
		this.t = 0
	},
	think: function (dt) {
		this.t += dt
	},
}

let MenuControls = {
	start: function () {
		this.controls = []
		this.grabbing = false
	},
	drop: function () {
		this.grabbing = false
	},
	think: function (dt) {
		let pstate = UFX.pointer()
		let pos = this.pos = pstate.pos ? pstate.pos.slice() : [0, 0]
		pos[0] *= sx0 / sx
		pos[1] *= sy0 / sy
		if (!this.grabbing) {
			this.jpoint = null
			this.point = null
			for (let j = 0 ; j < this.controls.length ; ++j) {
				let control = this.controls[j]
				let k = control.focusat(pos)
				if (k !== null && k !== undefined) {
					this.point = control
					this.jpoint = j
					this.kpoint = k
					control.focused = k
					break
				}
			}
		}
		this.controls.forEach((control) => {
			if (control != this.point) control.focused = null
		})
		if (this.t > 0.5 && pstate.down && this.point !== null) {
			if (this.point.autodrop) {
				this.point.release()
			} else {
				this.grabbing = true
			}
		}
		if (this.grabbing) {
			if (this.point !== null) {
				this.point.grabify(pos, this.kpoint, dt)
				if (pstate.up) {
					this.point.release()
					this.grabbing = false
				}
			}
		}
		canvas.style.cursor = this.grabbing ? "move" : this.jpoint == null ? "default" : "pointer"
	},
	drawcontrols: function () {
		this.controls.forEach(draw)
	},
	drawhover: function () {
		if (this.point && this.point.hovertext) {
			if (this.point.hovertext != this.hovertext) {
				this.hovertext = this.point.hovertext
				this.balloon = new WordBalloon(this.hovertext, [800, 200], { width: 1000, })
			}
			draw(this.balloon)
		}
	},
}

let SettingsControls = {
	start: function () {
		this.controls = this.controls.concat([
			new Panel({ x: 20, y: 660, w: 370, h: 220 }),
			new Switch({
				x: 50, y: 670, w: 80, h: 200, on: !savestate.easy, labels: ["EASY", "NORMAL"], labelsize: 0.1,
				autodrop: true, onrelease: () => savestate.easy = !savestate.easy,
				hovertext: "If you set it to EASY, you will hear a tone if you are on the right track.",
			}),
			new Switch({
				x: 130, y: 670, w: 80, h: 200, on: savestate.fullscreen, labels: ["WINDOW", "FULL\nSCREEN"], labelsize: 0.1,
				autodrop: true, hovertext: "Whether the game takes up the whole screen.",
				onrelease: function () {
					// this.on is not yet updated when this callback is called.
					savestate.fullscreen = !this.on
					UFX.scene.push("gofull", savestate.fullscreen)
				}
			}),
			new VSlider({
				x: 200, y: 670, w: 100, h: 180, min: 0, max: 5, setting: savestate.sound, label: "SOUND",
				ongrabify: function () { 
					savestate.sound = this.setting
					UFX.audio.setgain("sound", Math.pow(this.setting / this.max, 1.7))
				},
				hovertext: "Slide up and down to control how loud the sounds are."
			}),
			new VSlider({
				x: 270, y: 670, w: 100, h: 180, min: 0, max: 5, setting: savestate.sound, label: "MUSIC",
				ongrabify: function () { 
					savestate.music = this.setting
					UFX.audio.setgain("music", Math.pow(this.setting / this.max, 1.7))
				},
				hovertext: "Slide up and down to control how loud the music is."
			}),
			new Button({
				x: 1400, y: 700, w: 200, h: 200,
				shape: "square", color: "white", label: "About", autodrop: true,
				onrelease: () => {
					UFX.scene.push("about")
					playsound("begin")
				},
			})
		])
	},
}



UFX.scenes.load = UFX.Thing()
	.addcomp(Lives)
	.addcomp(MenuControls)
	.addcomp(SettingsControls)
	.addcomp({
		start: function () {
			this.f = 0
			this.loaded = false
			this.readout = new Readout({
				x: 800, y: 820, w: 400, h: 140, centered: true,
				text: "Getting the game....",
			})
			this.playbutton = new ButtonArray({
				x: 800, y: 820, w: 400, h: 140, centered: true, on: [true],
				shape: "square", color: "white", label: "Start~the~game", labelfontsize: 40, autodrop: true,
				onrelease: () => {
					UFX.scene.swap("play")
					playsound("begin")
					playmusic("lift")
				},
			})
			this.controls.push(this.readout)
		},
		think: function (dt) {
			if (this.loaded && this.playbutton) {
				this.controls[this.controls.indexOf(this.readout)] = this.playbutton
				this.playbutton = null
			}
			this.readout.text = "Getting the\ngame... " + (this.f * 100).toFixed(0) + "%"
		},
		draw: function () {
			UFX.draw("fs", UFX.draw.lingrad(0, 0, sx, sy, 0, "#228", 1, "#006"), "fr", 0, 0, sx, sy)
			UFX.draw("[ z", sx / sx0, sy / sy0, "tab center middle")
			context.lineJoin = "round"
			context.lineCap = "round"
			UFX.draw.text("Simple Machines", [800, 150], 150, "Mouse Memoirs", {
				fill: "#77f", shade: 2, shadow: ["black", Z(1), Z(1), 0], })
			UFX.draw.text("by team\nUniverse Factory", [400, 350], 80, "Passion One", {
				lineheight: 1.2, fill: "#cca", shade: 4, shadow: ["black", Z(1), Z(1), 0], })
/*
			UFX.draw("[ t 400 350 font 80px~'Passion~One'",
				"fs", UFX.draw.lingrad(0, -30, 0, 30, 0, "#cca", 1, "#a77"),
				"sh black", Z(7), Z(7), 0,
				"ft0 by~team",
				"t 0 100 ft0 Universe~Factory",
				"]")
*/
			UFX.draw("[ t 1200 350 font 80px~'Passion~One'",
				"fs", UFX.draw.lingrad(0, -30, 0, 30, 0, "#cca", 1, "#a77"),
				"sh black", Z(7), Z(7), 0,
				"ft0 for~the",
				"t 0 100 ft0 xkcd~game~jam",
				"]")
			UFX.draw("[ t 400 450 ss blue lw 10",
				"b m -220 70 l -100 -50 l -120 40 l 80 -45 l 30 40 l 200 -60 l 140 30",
				"sh black", Z(2), Z(2), 0, "s",
				"]")
			UFX.draw("[ t 1200 450 ss blue lw 10 hflip vflip",
				"b m -220 70 l -100 -50 l -120 40 l 80 -45 l 30 40 l 200 -60 l 140 30",
				"sh black", Z(2), Z(2), 0, "s",
				"]")
			UFX.draw("[ t 400 550 font bold~60px~'Architects~Daughter' r -0.2",
				"fs", UFX.draw.lingrad(0, -20, 0, 20, 0, "#55f", 1, "#33c"),
				"sh black", Z(5), Z(5), 0,
				"ft0 Everything",
				"t 0 70 ft0 Making~Place",
				"]")
			UFX.draw("[ t 1200 550 font bold~60px~'Architects~Daughter' r 0.1",
				"fs", UFX.draw.lingrad(0, -20, 0, 20, 0, "#55f", 1, "#33c"),
				"sh black", Z(5), Z(5), 0,
				"ft0 game~making~event",
				"t 0 70 ft0 that~gets~ideas~from",
				"t 0 70 ft0 well-known~stick~person",
				"t 0 70 ft0 word~&~art~page",
				"]")

			this.drawcontrols()
			this.drawhover()
			UFX.draw("]")
		},
	})


UFX.scenes.menu = UFX.Thing()
	.addcomp(Lives)
	.addcomp(MenuControls)
	.addcomp(SettingsControls)
	.addcomp({
		start: function () {
			this.f = 1
			this.title = new Statement("Simple Machines", [800, 120], { size: 70, width: 900, center: true })
			savestate.unlocked.map((levelname, j) => {
				let w = 250, h = 250
				let jx = j % 5, jy = Math.floor(j / 5)
				this.controls.push(new Button({
					w: w, h: h, label: "" + levelname, color: UFX.random.color(), shape: "star",
					x: -w/2 + 700 + (jx - 2) * 150 + jy * 125,
					y: -h/2 + 250 + jy * 150,
					autodrop: true,
					onrelease: function () {
						savestate.current = levelname
						UFX.scene.swap("play")
						playsound("begin")
					},
				}))
			})
			lesson.reset()
		},
		think: function (dt) {
			this.f = clamp(this.f - 2 * dt, 0, 1)
		},
		draw: function () {
			UFX.draw("fs", UFX.draw.lingrad(0, 0, sx, sy, 0, "#aaa", 1, "#777"), "fr", 0, 0, sx, sy)
			UFX.draw("[ z", sx / sx0, sy / sy0)
			this.drawcontrols()
			draw(this.title)
			this.drawhover()
			UFX.draw("]")

			let alpha = this.f
			if (alpha) UFX.draw("fs", "rgba(255,255,255," + alpha + ")", "f0")
		},
	})

// UFX.scene.push("gofull") will pause and give the player 3 seconds to confirm going fullscreen.
UFX.scenes.gofull = {
	start: function (full) {
		let isfull = UFX.maximize.getfullscreenelement() === canvas
		if (!full && isfull) {
			UFX.maximize.setoptions({ fullscreen: false })
			document.exitFullscreen()
			UFX.scene.pop()
			return
		} else if (full && !isfull) {
		} else {
			UFX.scene.pop()
			return
		}
		this.readyfullscreen()
		this.t = 0
		this.paused = false
	},
	pause: function () {
	},
	stop: function () {
	},
	readyfullscreen: function () {
		canvas.addEventListener("mouseup", this.request, { passive: false })
		canvas.addEventListener("touchend", this.request, { passive: false })
	},
	unreadyfullscreen: function () {
		canvas.removeEventListener("mouseup", this.request)
		canvas.removeEventListener("touchend", this.request)
		if (UFX.scene.top() === this) UFX.scene.pop()
	},
	request: function (event) {
		UFX.scenes.gofull.unreadyfullscreen()
		UFX.maximize.setoptions({ fullscreen: true })
	},
	think: function (dt) {
		this.t += dt
		if (!this.paused && this.t > 0.4) {
			this.pause()
			this.paused = true
		}
		if (this.t > 3) this.unreadyfullscreen()
	},
	draw: function () {
		if (!this.paused) return
		UFX.draw("fs #aff f0 [ z", sx / sx0, sy / sy0,
			"t", 800, 450, "r", 0.2, "fs white ss black",
			"tab center middle",
			"font 100px~'Mouse~Memoirs'",
			"fst0 Touch~to~enter~full~screen",
			"]"
		)
	},
}

UFX.scenes.about = {
	start: function (full) {
		this.t = 0
		lesson.reset()
		this.statement = new Statement(
			"This game was made for the xkcd game jam by team Universe Factory Games (Christopher Night and Charles McPillan). The mechanic is inspired by Up Goer Five and Thing Explainer by Randall Munroe.",
			[800, 500],
			{
				size: 60,
				width: 800,
				center: true,
			}
		)
		lesson.learnall(this.statement)
	},
	think: function (dt) {
		let pstate = UFX.pointer()
		this.t += dt
		if (this.t > 0.4 && pstate.down) UFX.scene.pop()
	},
	draw: function () {
		UFX.draw("fs #aaf f0 [ z", sx / sx0, sy / sy0)
		draw(this.statement)
		UFX.draw("[ t 20 810 font 40px~'Mouse~Memoirs'",
			"fs white",
			"sh black", Z(2), Z(2), 0,
			"ft0", "Music:~The~Lift,~Kevin~MacLeod~(CC-BY)",
			"t 0 40",
			"ft0", "Fonts:~Google~Web~Fonts",
			"]")
		UFX.draw("]")
	},
}


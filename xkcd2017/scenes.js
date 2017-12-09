let Lives = {
	start: function () {
		this.t = 0
	},
	think: function (dt) {
		this.t += dt
	},
}

let SceneControl = {
	start: function () {
		this.pos = [0, 0]
	},
	think: function (dt, jthink) {
		if (jthink != 0) return
		let pstate = UFX.pointer()
		let pos = this.pos = pstate.pos = pstate.pos ? pstate.pos.slice() : [0, 0]
		pos[0] *= sx0 / sx
		pos[1] *= sy0 / sy
		this.control(pstate)
	},
	control: function (pstate) {
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
				x: 1420, y: 770, w: 160, h: 160, centered: true,
				shape: "circle", color: "orange", label: "About", autodrop: true,
				drawpanel: true,
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
				x: 800, y: 770, w: 400, h: 140, centered: true,
				text: "Getting the game....",
			})
			this.playbutton = new ButtonArray({
				x: 800, y: 770, w: 400, h: 140, centered: true, on: [true],
				shape: "square", color: "white", label: "Start the game", labelfontsize: 40, autodrop: true,
				onrelease: () => {
					UFX.scene.push("startgame", "play")
					playsound("begin")
					playmusic("lift")
				},
			})
			this.controls.push(this.playbutton.panel(), this.readout)

			this.controls.push(new Sign({ x: 500, y: 120, w: 800, h: 170,
				text: "Simple Machines", fontsize: 150, fontname: "Mouse Memoirs",
				drawopts: { fill: "#77f", owidth: 1, shade: 3, }
			}))

			this.controls.push(new Sign({ x: 400, y: 340, w: 440, h: 180,
				text: "by team\nUniverse Factory", fontsize: 60, fontname: "Passion One",
				drawopts: { fill: "#cca", lineheight: 1.2, owidth: 1, shade: 3, }
			}))
			this.controls.push(new Sign({ x: 1200, y: 360, w: 440, h: 180,
				text: "for the\nxkcd game jam", fontsize: 60, fontname: "Passion One",
				drawopts: { fill: "#cca", lineheight: 1.2, owidth: 1, shade: 3, }
			}))
			this.controls.unshift(
				new Cable({ x: 360, y: 770, x1: 1400, y1: 770, width: 40, }),
				new Cable({ x: 460, y: 200, x1: 460, y1: 260 }),
				new Cable({ x: 300, y: 420, x1: 300, y1: 700 }),
				new Cable({ x: 600, y: 360, x1: 1050, y1: 360, width: 40, }))

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
			this.drawcontrols()

			UFX.draw("[ t 400 385 ss blue lw 6",
				"b m -220 70 l -100 -50 l -120 40 l 80 -45 l 30 40 l 200 -60 l 140 30",
				"sh black", Z(2), Z(2), 0, "s",
				"]")
			UFX.draw("[ t 1200 400 ss blue lw 6 hflip vflip",
				"b m -220 70 l -100 -50 l -120 40 l 80 -45 l 30 40 l 200 -60 l 140 30",
				"sh black", Z(2), Z(2), 0, "s",
				"]")
			UFX.draw.text("Everything Making Place", [400, 410], 55, "Architects Daughter", {
				tab: "center top",
				bold: true, angle: -0.1, fill: "#55f", shade: 2, shadow: ["black", Z(1), Z(1), 0],
				width: 400, owidth: 1,
			})
			UFX.draw.text("well-known stick person word and art page", [1000, 420], 55, "Architects Daughter", {
				tab: "center top",
				bold: true, angle: 0.1, fill: "#55f", shade: 2, shadow: ["black", Z(1), Z(1), 0],
				width: 400, owidth: 1,
			})
			UFX.draw.text("game making event", [1300, 420], 55, "Architects Daughter", {
				tab: "center top",
				bold: true, angle: -0.2, fill: "#55f", shade: 2, shadow: ["black", Z(1), Z(1), 0],
				width: 200, owidth: 1,
			})
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
			this.controls.push(new Sign({ x: 500, y: 120, w: 800, h: 170,
				text: "Simple Machines", fontsize: 150, fontname: "Mouse Memoirs",
				drawopts: { fill: "#77f", owidth: 1, shade: 3, }
			}))


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
						UFX.scene.push("startlevel", "play")
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
			this.drawhover()
			UFX.draw("]")
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


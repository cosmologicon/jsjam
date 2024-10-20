var canvas = document.getElementById("canvas")
var context = canvas.getContext("2d")
UFX.draw.setcontext(context)

UFX.maximize.fill(canvas, "total")
UFX.resource.loadwebfonts("Viga", "Contrail One")

UFX.resource.onload = function () {
	UFX.key.init()
	UFX.scene.init()
	UFX.scene.push("game")
}


stars = UFX.random.spread(100)

UFX.scenes.game = {
	start: function () {
		h = 0
		x = 0
		vx = 0
		v = 0
		A = 0
		vA = 0
		amt = 0
		R = 0
		wind = 0
		stx = 0
	},
	thinkargs: function (dt) {
		return [dt, UFX.key.state(), canvas.width, canvas.height]
	},
	think: function (dt, kstate, sx, sy) {
		if (kstate.down.left) R = Math.max(R - 1, -1)
		if (kstate.down.right) R = Math.min(R + 1, 1)
		if (kstate.down.up) amt = Math.min(amt + 1, 2)
		if (kstate.down.down) amt = Math.max(amt - 1, 0)
		if (UFX.random() * 2 < dt) wind = UFX.random.choice([-2, -1, 0, 1, 2])
		v = Math.min(v + 10 * dt, 20)
		h += v * dt
		A = R * [1, 3, 6][amt] * 0.3 * dt
		vx += v * A * dt
		x += vx * dt
		x += 0.002 * v * (1 + 0.005 * h) * wind * dt
		stx -= 0.1 * v * wind * dt

		UFX.draw("fs black f0")
		
		UFX.draw("[ fs white")
		stars.forEach(function (s) {
			UFX.draw("[ t", ((s[0]*sx+30*stx)%sx+sx)%sx, ((s[1]*sy+30*h)%sy+sy)%sy, "b o 0 0 2 f ]")
		})
		UFX.draw("[ t", sx/2, sy/2, "z 50 50 t 0", h)
		
		UFX.draw("fs blue b o 0 30 31 f")
		UFX.draw("[ t 0", -h)
		UFX.draw("t", x*sx/50, 0)
		UFX.draw("r", 3*A)
		UFX.draw("fs silver ( m -1 1 c -1 -1 1 -1 1 1 c 3 -3 -3 -3 -1 1 ) f")
		UFX.draw("fs gray ( m 0 0 l 1 -3 l 0 -4.5 l -1 -3 ) f")
		UFX.draw("fs #aaf b o 0 -3 0.5 f")
		UFX.draw("]")

		UFX.draw("]")
		UFX.draw("fs white font 28px~'Contrail~One' textbaseline top ft0 Blasting~Off~Again [ t 0 30 ft0 by~Christopher~Night ]")
		UFX.draw("[ t 0", sy-120, "ft0 " + h.toFixed(0) + "km")
		tdir = ["left", "none", "right"][R+1]
		tamt = ["low", "medium", "high"][amt]
		UFX.draw("[ t 0 30 ft0 Tilt~direction~(press~left/right):~" + tdir, "]")
		UFX.draw("[ t 0 60 ft0 Tilt~amount~(press~up/down):~" + tamt, "]")
		UFX.draw("[ t 0 90 ft0 Cosmic~wind:~" + ["hard~left", "left", "none", "right", "hard~right"][wind+2], "] ]")
		
		if (Math.abs(x) > 0.5) UFX.scene.swap("dead")
	},
}

UFX.scenes.dead = {
	start: function () {
		this.t = 0
	},
	think: function (dt) {
		this.t += dt
		if (this.t > 1) UFX.scene.swap("game")
	},
}


// draw module - some convenience functions for invoking context methods
// The basic UFX.draw() function takes a string based on the SVG path string specification,
//   but with some important differences

// Three ways to invoke the function here.
// UFX.draw(context, drawstring)
// UFX.draw.setcontext(context) ; UFX.draw(drawstring)
// UFX.draw.extend(context) ; context.draw(drawstring)

// The drawstring can also be a series of strings or values.
// UFX.draw(context, "( m 0 0 l", x, y, ") s")

if (typeof UFX == "undefined") UFX = {}

UFX._draw = function () {
    var t = []  // Draw tokens
    function addt() {
        for (var argj = 0 ; argj < arguments.length ; ++argj) {
            var arg = arguments[argj]
            if (arg.split)
                t.push.apply(t, arg.split(" "))
            else if (arg instanceof Array)
                addt.apply(this, arg)
            else
                t.push(arg)
        }
    }
    addt.apply(this, arguments)
    var ctx = this
    function getcolor(s) {
        if (typeof s !== "string") return s
        switch (s.substr(0,3)) {
            case "lg~": return UFX._draw.lingrad.apply(ctx, s.substr(3).split("~"))
            case "rg~": return UFX._draw.radgrad.apply(ctx, s.substr(3).split("~"))
            default: return s
        }
    }
    for (var j = 0 ; j < t.length ; ++j) {
        switch (t[j].toLowerCase()) {
            case "b": case "(": case "beginpath":
                this.beginPath()
                break
            case ")": case "closepath":
                this.closePath()
                break
            case "m": case "moveto":
                this.moveTo(+t[++j], +t[++j])
                break
            case "l": case "lineto":
                this.lineTo(+t[++j], +t[++j])
                break
            case "q": case "quadraticcurveto":
                this.quadraticCurveTo(+t[++j], +t[++j], +t[++j], +t[++j])
                break
            case "c": case "beziercurveto":
                this.bezierCurveTo(+t[++j], +t[++j], +t[++j], +t[++j], +t[++j], +t[++j])
                break
            case "a": case "arc":
                this.arc(+t[++j], +t[++j], +t[++j], +t[++j], +t[++j])
                break
            case "aa": case "antiarc":
                this.arc(+t[++j], +t[++j], +t[++j], +t[++j], +t[++j], true)
                break
            case "arcto":
                this.arcTo(+t[++j], +t[++j], +t[++j], +t[++j], +t[++j])
                break
            case "o": case "circle":
                this.arc(+t[++j], +t[++j], +t[++j], 0, 2*Math.PI)
                break
            case "rr": case "roundedrect":
                var x = +t[++j], y = +t[++j], w = +t[++j], h = +t[++j], r = +t[++j]
                this.beginPath()
                this.moveTo(x+r, y)
                this.arcTo(x+w, y, x+w, y+h, r)
                this.arcTo(x+w, y+h, x, y+h, r)
                this.arcTo(x, y+h, x, y, r)
                this.arcTo(x, y, x+w, y, r)
                this.closePath()
                break
            case "t": case "translate":
                this.translate(+t[++j], +t[++j])
                break
            case "r": case "rotate":
                this.rotate(+t[++j])
                break
            case "z": case "scale":
                this.scale(+t[++j], +t[++j])
                break
            case "zx": case "xscale":
                this.scale(+t[++j], 1)
                break
            case "zy": case "yscale":
                this.scale(1, +t[++j])
                break
            case "hflip":
                this.scale(-1, 1)
                break
            case "vflip":
                this.scale(1, -1)
                break
            case "x": case "transform":
                this.transform(+t[++j], +t[++j], +t[++j], +t[++j], +t[++j], +t[++j])
                break
            case "xshear":
                this.transform(1, 0, +t[++j], 1, 0, 0)
                break
            case "yshear":
                this.transform(1, +t[++j], 0, 1, 0, 0)
                break
            case "f": case "fill":
                this.fill()
                break
            case "s": case "stroke":
                this.stroke()
                break
            case "fr": case "fillrect":
                this.fillRect(+t[++j], +t[++j], +t[++j], +t[++j])
                break
            case "sr": case "strokerect":
                this.strokeRect(+t[++j], +t[++j], +t[++j], +t[++j])
                break
            case "fsr": case "fillstrokerect":
                var x = +t[++j], y = +t[++j], w = +t[++j], h = +t[++j]
                this.fillRect(x, y, w, h)
                this.strokeRect(x, y, w, h)
                break
            case "cr": case "clearrect":
                this.clearRect(+t[++j], +t[++j], +t[++j], +t[++j])
                break
            case "f0": case "fillall":
            	this.fillRect(0, 0, this.canvas.width, this.canvas.height)
            	break
            case "c0": case "clearall":
            	this.clearRect(0, 0, this.canvas.width, this.canvas.height)
            	break
            case "tr": case "tracerect":
                var x = +t[++j], y = +t[++j], w = +t[++j], h = +t[++j]
                this.beginPath()
                this.moveTo(x, y)
                this.lineTo(x+w, y)
                this.lineTo(x+w, y+h)
                this.lineTo(x, y+h)
                this.closePath()
                break
            case "fs": case "fillstyle":
                this.fillStyle = getcolor(t[++j])
                break
            case "ss": case "strokestyle":
                this.strokeStyle = getcolor(t[++j])
                break
            case "shadowblur": case "shb":
                this.shadowBlur = +t[++j]
                break
            case "shadowcolor": case "shc":
                this.shadowColor = getcolor(t[++j])
                break
            case "shadowoffsetx": case "shadowx": case "shx":
                this.shadowOffsetX = +t[++j]
                break
            case "shadowoffsety": case "shadowy": case "shy":
                this.shadowOffsetY = +t[++j]
                break
            case "shadowoffsetxy": case "shadowxy": case "shxy":
                this.shadowOffsetX = +t[++j]
                this.shadowOffsetY = +t[++j]
                break
            case "shadow": case "sh":
                this.shadowColor = getcolor(t[++j])
                this.shadowOffsetX = +t[++j]
                this.shadowOffsetY = +t[++j]
                this.shadowBlur = +t[++j]
                break
            case "drawimage":
                this.drawImage(t[++j], +t[++j], +t[++j])
                break
            case "drawimage0":
                this.drawImage(t[++j], 0, 0)
                break
            case "clip":
                this.clip()
                break
            case "al": case "alpha": case "globalalpha":
                this.globalAlpha = +t[++j]
                break
            case "lw": case "linewidth":
                this.lineWidth = +t[++j]
                break
            case "lc": case "linecap":
                this.lineCap = t[++j]
                break
            case "textalign":
                this.textAlign = t[++j]
                break
            case "textbaseline":
                this.textBaseline = t[++j]
                break
            case "[": case "save":
                this.save()
                break
            case "]": case "restore":
                this.restore()
                break
            case "font":
                this.font = t[++j].replace(/~/g, " ")
                break
            case "filltext": case "ft":
                this.fillText(t[++j].replace(/~/g, " "), +t[++j], +t[++j])
                break
            case "filltext0": case "ft0":
                this.fillText(t[++j].replace(/~/g, " "), 0, 0)
                break
            case "stroketext": case "st":
                this.strokeText(t[++j].replace(/~/g, " "), +t[++j], +t[++j])
                break
            case "stroketext0": case "st0":
                this.strokeText(t[++j].replace(/~/g, " "), 0, 0)
                break
            case "fillstroketext": case "fst":
                var s = t[++j].replace(/~/g, " "), x = +t[++j], y = +t[++j]
                this.fillText(s, x, y)
                this.strokeText(s, x, y)
                break
            case "fillstroketext0": case "fst0":
                var s = t[++j].replace(/~/g, " ")
                this.fillText(s, 0, 0)
                this.strokeText(s, 0, 0)
                break
            default:
                throw "Unrecognized draw token " + t[j]
        
        }
    }
}
UFX._draw.circle = function (x, y, r, fs, ss, lw) {
    this.save()
    this.beginPath()
    this.arc(x, y, r, 0, 2*Math.PI)
    if (fs) {
        this.fillStyle = fs
        this.fill()
    }
    if (ss || lw) {
        if (ss) this.strokeStyle = ss
        if (lw) this.lineWidth = lw
        this.stroke()
    }
    this.restore()
}
UFX._draw.lingrad = function (x0, y0, x1, y1) {
    var grad = this.createLinearGradient(+x0, +y0, +x1, +y1)
    for (var j = 4 ; j < arguments.length ; j += 2) {
        grad.addColorStop(+arguments[j], arguments[j+1])
    }
    return grad
}
UFX._draw.radgrad = function (x0, y0, r0, x1, y1, r1) {
    var grad = this.createRadialGradient(+x0, +y0, +r0, +x1, +y1, +r1)
    for (var j = 6 ; j < arguments.length ; j += 2) {
        grad.addColorStop(+arguments[j], arguments[j+1])
    }
    return grad
}


UFX.draw = function (context) {
    if (context.beginPath) {
        return UFX._draw.apply(context, Array.prototype.slice.call(arguments, 1))
    } else if (UFX.draw._context) {
        return UFX._draw.apply(UFX.draw._context, arguments)
    } else {
        throw "UFX.draw must be called with context as first argument"
    }
}
for (var mname in UFX._draw) {
    UFX.draw[mname] = (function (method, mname) {
        return function (context) {
            if (context.beginPath) {
                return method.apply(context, Array.prototype.slice.call(arguments, 1))
            } else {
                if (!UFX.draw._context) UFX.draw._context = document.createElement("canvas").getContext("2d")
                return method.apply(UFX.draw._context, arguments)
            }
        }
    })(UFX._draw[mname], mname)
}
UFX.draw.setcontext = function (context) {
    UFX.draw._context = context
}

// Wow this is really inelegant. Is there any better way to do this? I should ask on SO sometime.
UFX.draw.extend = function(context) {
    context.draw = function () { UFX._draw.apply(context, arguments) }
    for (var mname in UFX._draw) {
        context.draw[mname] = (function (method) {
            return function () { return method.apply(context, arguments) }
        })(UFX._draw[mname])
    }
}





// UFX.key module: functions and constants related to key presses

// Generally for games you want to know:
//   - when a key is pressed
//   - when a key is released
//   - how long the key was held down for
//   - what keys are currently being pressed
// And you want to prevent key events (eg arrow keys) from being interpreted by the browser

// For games with frame-based updates, I don't generally like callback-based key handling, so this
//   module will enqueue all the key events so they can be handled at the appropriate place in the
//   main game loop.


if (typeof UFX == "undefined") UFX = {}
UFX.key = {}

// PUBLIC API

// Feel free to set these manually
UFX.key.active = true   // set to false to (temporarily) disable all handling of keyboard events
UFX.key.capture = true  // should we prevent key events from bubbling?
UFX.key.qdown = true    // should we remember and enqueue key down events?
UFX.key.qup = true      // should we remember and enqueue key up events?
// Combos (multiple keys pressed at once, registering as unified events)
UFX.key.qcombo = false  // should we remember and enqueue combos?
UFX.key.combodt = 100   // Time between keydown/up events to be considered in the same combo (ms)
// Set the watchlist to the keys you want to capture - everything else will be let through
// Set it to null to catch everything
UFX.key.watchlist = null

// Currently pressed keys (values are truthy Objects if key is pressed, undefined if not)
UFX.key.ispressed = {}   // by name, eg UFX.key.ispressed.space
UFX.key.codepressed = {} // by key code, eg UFX.key.codepressed[32]

// Functions for reading/resetting the event queue
UFX.key.events = function () {
    var r = UFX.key._downevents.concat(UFX.key._upevents)
    UFX.key.clearevents()
    return r
}
UFX.key.combos = function () {
    UFX.key._checkcombo()
    var r = UFX.key._combos
    UFX.key.clearcombos()
    return r
}

UFX.key.clearevents = function () {
    UFX.key._downevents = []
    UFX.key._upevents = []
}
UFX.key.clearcombos = function (clearpending) {
    UFX.key._combos = []
    if (clearpending) UFX.key._currentcombo = null
}

// Return a lightweight summary of the current keys being pressed and the
//   pending events on the event queue. Also clears the event queue.
UFX.key.state = function () {
    var state = { pressed: {}, }
    for (var key in UFX.key.ispressed) {
        if (UFX.key.ispressed[key])
            state.pressed[key] = 1
    }
    if (UFX.key.qdown) state.down = {}
    if (UFX.key.qup) state.up = {}
    UFX.key.events().forEach(function (event) {
        state[event.type][event.name] = 1
    })
    if (UFX.key.qcombo) {
        state.combo = {}
        UFX.key.combos().forEach(function (combo) {
            state.combo[combo.kstring] = 1
        })
    }
    return state
}


// Call this to start capturing key presses
// key presses will be captured when the element in question has focus (defaults to document)
UFX.key.init = function(element) {
    UFX.key._captureevents(element)
}

// TODO: add alternate key names
UFX.key.map = {
    8: "backspace", 9: "tab", 13: "enter", 16: "shift", 17: "ctrl", 18: "alt", 20: "caps",
    27: "esc", 32: "space", 33: "pgup", 34: "pgdn", 35: "end", 36: "home",
    37: "left", 38: "up", 39: "right", 40: "down", 45: "ins", 46: "del",
    48: "0", 49: "1", 50: "2", 51: "3", 52: "4", 53: "5", 54: "6", 55: "7", 56: "8", 57: "9",
    59: "semicolon", 61: "equals",
    65: "A", 66: "B", 67: "C", 68: "D", 69: "E", 70: "F", 71: "G", 72: "H", 73: "I", 74: "J",
    75: "K", 76: "L", 77: "M", 78: "N", 79: "O", 80: "P", 81: "Q", 82: "R", 83: "S", 84: "T",
    85: "U", 86: "V", 87: "W", 88: "X", 89: "Y", 90: "Z",
    96: "np0", 97: "np1", 98: "np2", 99: "np3", 100: "np4",
    101: "np5", 102: "np6", 103: "np7", 104: "np8", 105: "np9",
    106: "star", 107: "plus", 109: "hyphen", 110: "period", 111: "slash",
    112: "F1", 113: "F2", 114: "F3", 115: "F4", 116: "F5", 117: "F6",
    118: "F7", 119: "F8", 120: "F9", 121: "F10", 122: "F11", 123: "F12",
    144: "num", 188: "comma", 190: "period", 
    191: "slash", 192: "backtick",
    219: "openbracket", 220: "backslash", 221: "closebracket", 222: "apostrophe",
}

// TODO: properly handle overlapping events for different keys mapped to the same name
UFX.key.remap = function () {
    for (var j = 0 ; j < arguments.length ; ++j) {
        var kmap = arguments[j]
        for (var k in kmap) {
            var v = kmap[k]
            for (var code in UFX.key.map) {
                if (UFX.key.map[code] === k) {
                    UFX.key.map[code] = v
                }
            }
        }
    }
}

UFX.key.remaparrows = function (dvorakToo) {
    UFX.key.remap({ A: "left", S: "down", D: "right", W: "up", })
    if (dvorakToo) {
        UFX.key.remap({ O: "down", comma: "up", ",": "up", E: "right", })
    }
}

UFX.key.remappunct = function () {
    UFX.key.remap({ semicolon: ";", equals: "=", star: "*", plus: "+", hyphen: "-", period: ".",
        slash: "/", comma: ",", backtick: "`", openbracket: "[", backslash: "\\",
        closebracket: "]", apostrophe: "'",
    })
}




// PRIVATE MEMBERS AND METHODS

// Pending key events to be read
UFX.key._downevents = []
UFX.key._upevents = []
UFX.key._combos = []
UFX.key._currentcombo = null

UFX.key._captureevents = function (element) {
    element = element || document
    if (typeof element == "String") element = document.getElementById(element)
    // TODO: use addEventListener for all event types
    element.addEventListener("blur", UFX.key._onblur, true)
    element.onkeypress = UFX.key._onkeypress
    element.onkeyup = UFX.key._onkeyup
    element.onkeydown = UFX.key._onkeydown
    UFX.key._element = element
}

UFX.key._onblur = function (event) {
    for (var code in UFX.key.codepressed) {
        UFX.key._storeup(event, code)
    }
    return true
}
UFX.key._watching = function (event) {
    if (!UFX.key.watchlist) return true
    return UFX.key.watchlist.indexOf(UFX.key.map[event.which]) > -1
}
UFX.key._onkeypress = function (event) {
    if (!UFX.key.active || !UFX.key._watching(event)) return true
    return !UFX.key.capture
}
UFX.key._onkeydown = function (event) {
    if (!UFX.key.active || !UFX.key._watching(event)) return true
    var code = event.which
    if (UFX.key.codepressed[code]) {
        return !UFX.key.capture
    }
    UFX.key._storedown(event, code)
    return !UFX.key.capture
}
UFX.key._onkeyup = function (event) {
    if (!UFX.key.active || !UFX.key._watching(event)) return true
    UFX.key._storeup(event, event.which)
    return !UFX.key.capture
}
UFX.key._storedown = function (event, code) {
    code = code || event.which
    var now = (new Date()).getTime()
    var kname = UFX.key.map[code] || "key#" + code
    var kevent = {
        baseevent: event,
        type: "down",
        code: code,
        name: kname,
        time: now,
    }
    // Remember that this key is currently pressed
    UFX.key.codepressed[code] = kevent
    if (kevent.name) {
        UFX.key.ispressed[kevent.name] = kevent
    }
    // Store the key down event on the event queue
    if (UFX.key.qdown) {
        UFX.key._downevents.push(kevent)
    }
    // Store it on the current combo
    if (UFX.key.qcombo) {
        UFX.key._checkcombo()
        if (UFX.key._currentcombo) {
            UFX.key._currentcombo.keys.push(kname)
        } else {
            UFX.key._currentcombo = {
                start: now,
                keys: [kname],
            }
        }
    }
}
UFX.key._storeup = function (event, code) {
    var time = (new Date()).getTime()
    var dt = UFX.key.codepressed[code] ? time - UFX.key.codepressed[code].time : 0
    var kevent = {
        type: "up",
        baseevent: event,
        code: code,
        name: UFX.key.map[code] || "key#" + code,
        time: time,
        dt: dt,
    }
    delete UFX.key.codepressed[code]
    if (kevent.name) {
        delete UFX.key.ispressed[kevent.name]
    }
    if (UFX.key.qup) {
        UFX.key._upevents.push(kevent)
    }
}
// Check to see if the current combo has timed out and if so add it to the combo list.
UFX.key._checkcombo = function () {
    if (!UFX.key._currentcombo) return
    var now = (new Date()).getTime()
    if (UFX.key._currentcombo.start + UFX.key.combodt < now) {  // combo has timed out
        var keys = UFX.key._currentcombo.keys
        keys.sort()
        UFX.key._combos.push({
            keys: keys,
            kstring: keys.join(" "),
            time: UFX.key._currentcombo.start,
        })
        UFX.key._currentcombo = null
    }
}


// The scene module - keeps track of the scene stack

if (typeof UFX == "undefined") UFX = {}

UFX.SceneStack = function () {
	if (!(this instanceof UFX.SceneStack)) return new UFX.SceneStack()
	this._actionq = []
	this._stack = []
	this.resolveargs = true
	this.recorder = null
	this.frozen = false
}
UFX.SceneStack.prototype = {
	init: function (opts, keepopts) {
		opts = Object.create(opts || null)
		opts.cthis = this
		UFX.ticker.init(this.think, this.draw, opts, keepopts)
	},
	top: function () {
		var n = this._stack.length
		return n ? this._stack[n-1] : null
	},
	getscene: function (c) {
		if (typeof c === "string") {
			if (c.substr(0,4) == "new_") {
				c = c.substr(4)
				if (!(c in UFX.scenes)) throw "Unrecognized scene: " + c
				return new UFX.scenes[c]()
			} else if (c.substr(0,7) == "create_") {
				c = c.substr(7)
				if (!(c in UFX.scenes)) throw "Unrecognized scene: " + c
				return Object.create(UFX.scenes[c])
			}
			if (!(c in UFX.scenes)) throw "Unrecognized scene: " + c
			return UFX.scenes[c]
		}
		return c
	},
	ipush: function (cname) {
		if (this.frozen) return
		var old = this.top()
		if (old && old.suspend) old.suspend()
		var c = this.getscene(cname)
		this._stack.push(c)
		var args = Array.prototype.slice.call(arguments, 1)
		if (this.resolveargs && c.startargs) args = c.startargs.apply(c, args)
		if (this.recorder) this.recorder.addpush(cname, args)
		if (c.checkpoint && this.recorder) {
			this.recorder.checkpoint(c.getchaptername ? c.getchaptername.apply(c, args) : cname)
		}
		if (c.start) c.start.apply(c, args)
	},
	ipop: function (n) {
		if (this.frozen) return
		n = n || 1
		for (var j = 0 ; j < n ; ++j) {
			var c = this._stack.pop()
			if (c.stop) c.stop()
			var d = this.top()
			if (d && d.resume) d.resume()
			if (this.recorder) this.recorder.addpop()
		}
		return c
	},
	iswap: function (cname) {
		if (this.frozen) return
		var c0 = this._stack.pop()
		if (c0 && c0.stop) c0.stop()
		var c = this.getscene(cname)
		this._stack.push(c)
		var args = Array.prototype.slice.call(arguments, 1)
		if (this.resolveargs && c.startargs) args = c.startargs.apply(c, args)
		if (this.recorder) this.recorder.addswap(cname, args)
		if (c.checkpoint && this.recorder) {
			this.recorder.checkpoint(c.getchaptername ? c.getchaptername.apply(c, args) : cname)
		}
		if (c.start) c.start.apply(c, args)
		return c0
	},
	push: function () {
		this._actionq.push(["push", Array.prototype.slice.call(arguments, 0)])
	},
	pop: function () {
		this._actionq.push(["pop", Array.prototype.slice.call(arguments, 0)])
	},
	swap: function () {
		this._actionq.push(["swap", Array.prototype.slice.call(arguments, 0)])
	},
	_resolveq: function () {
		for (var j = 0 ; j < this._actionq.length ; ++j) {
			switch (this._actionq[j][0]) {
				case "push": this.ipush.apply(this, this._actionq[j][1]) ; break
				case "pop": this.ipop.apply(this, this._actionq[j][1]) ; break
				case "swap": this.iswap.apply(this, this._actionq[j][1]) ; break
			}
		}
		this._actionq = []
	},
	think: function () {
		this._resolveq()
		var c = this.top()
		this._lastthinker = c
		if (c) {
			var args = arguments
			if (this.resolveargs && c.thinkargs) args = c.thinkargs.apply(c, args)
			if (this.recorder) this.recorder.addthink(args)
			if (c.think) c.think.apply(c, args)
		}
	},
	draw: function () {
		var c = this._lastthinker
		if (c && c.draw) {
			c.draw.apply(c, arguments)
		}
	},
}
// The default for your basic scene stack needs
UFX.scene = new UFX.SceneStack()
UFX.scenes = {}

// UFX.ticker module
// Handle game loop

if (typeof UFX == "undefined") UFX = {}

UFX.ticker = {
	// Default options
	defaultopts: {
		sync: "auto",  // Whether to use window.requestAnimationFrame
		cthis: null,   // The "this" object for the callbacks
		delay: 0,      // Minimum time between ticks (milliseconds)
		minupf: 1,     // If set, minimum number of updates per frame
		maxupf: 1,     // If set, maximum number of updates per frame
		ups: null,     // Number of updates per second (defaults to upf * fps)
		minups: null,  // If set, minimum number of updates per second
		maxups: null,  // If set, maximum number of updates per second
		fps: 30,       // Minimum frame (render, draw) rate
	},

	// Main entry point. Pass a think callback, (optionally) a draw callback,
 	//   and (optionally) a options initialization object		
	init: function (tcallback, dcallback, opts) {
		this.setcallbacks(tcallback, dcallback)
		this.setoptions(opts)
		this.resume()
	},
	setcallbacks: function (tcallback, dcallback) {
		this._tcallback = tcallback
		this._dcallback = dcallback
	},
	setoptions: function (opts, keepopts) {
		if (!keepopts) {
			for (var oname in this.defaultopts) {
				this[oname] = this.defaultopts[oname]
			}
		}
		if (!opts) return
		for (var oname in this.defaultopts) {
			if (oname in opts) {
				this[oname] = opts[oname]
			}
		}
		
		// TODO: put in some assert statements
		
		// if ups is not specified, minupf must equal maxupf
		
	},
	resume: function () {
		this.stop()
		this._running = true
		this._tick()
	},
	stop: function () {
		if (this._shandle) window.cancelAnimationFrame(this._shandle)
		if (this._thandle) clearTimeout(this._thandle)
		this._shandle = this._thandle = null
		this._running = false
		this.resetcounters()
	},
	// Reset the FPS counters etc.
	resetcounters: function () {
		this._accumulator = 0  // accumulated wall time for update
		this._dtu = 0  // average wall dt between updates (ms)
		this._dtg = 0  // average game dt between updates (ms)
		this._dtf = 0  // average wall dt between frames (ms)
		this._lastthink = Date.now()
		this._lastdraw = Date.now()
		this.wfactor = 1
	},
	// A handy-formatted string of the current info from this module
	getrates: function () {
		return [
			this.wfps.toPrecision(3) + "fps",
			this.wups.toPrecision(3) + "ups",
			this.wfactor.toPrecision(3) + "x",
		].join(" ")
	},

	// Where the magic happens.
	// Calls the thick callback 0 or more times, and the draw callback 0 or 1 time.
	_tick: function () {
		if (!this._running) return
		var now = Date.now()
		var dt0 = this._lasttick ? (now - this._lasttick) * 0.001 : 0
		this._lasttick = now
		this._accumulator += dt0
		
		var fps = this.fps
		var minupf = this.minupf
		var maxupf = this.maxupf
		var minups = this.minups || this.ups || fps
		var maxups = this.maxups || this.ups || minups
		
		var dodraw, nthink, dt, dtmin

		if (minupf == 0) {
			dodraw = true
		} else {
			dodraw = this._accumulator >= minupf / maxups
		}

		if (!dodraw) {
			nthink = 0
			dtmin = minupf / maxups
		} else if (minupf >= maxupf) {
			nthink = minupf
			// Need to redo this formula. It always maxes out semi-fixed timesteps
			dtmin = dt = Math.min(this._accumulator, minupf / minups)
//			console.log(dt, dt0)
		} else {
			// Choose the number of updates and length of each update so as to
			//   maximize the amount of accumulated time consumed, and then to
			//   minimize the number of updates, subject to the constraints
			var n = Math.floor(this._accumulator * minups)
			if ((n + 1) / maxups <= this._accumulator) n += 1
			nthink = Math.max(Math.min(n, maxupf), minupf)
			dt = Math.min(nthink / minups, this._accumulator)
			dtmin = Math.max(minupf, 1) / maxups
//			console.log(minups, maxups, this._accumulator, n, nthink, dt, dt0)
		}
		

		// Invoke the think callback
		if (nthink) {
			this._accumulator -= dt
			dt /= nthink
			for (var jthink = 0 ; jthink < nthink ; ++jthink) {
				this._tcallback.call(this.cthis, dt, jthink, nthink)
				now = Date.now()
				this._dtu = 0.95 * this._dtu + 0.05 * (now - this._lastthink)
				this._dtg = 0.95 * this._dtg + 0.05 * (dt * 1000)
				this._lastthink = now
			}
		}

		// Invoke the draw callback
		if (dodraw && this._dcallback) {
			var f = this._accumulator * minups
			this._dcallback.call(this.cthis, f)
			now = Date.now()
			this._dtf = 0.95 * this._dtf + 0.05 * (now - this._lastdraw)
			this._lastdraw = now
		}

		// Accumulators should never be allowed to stay over 1 update
		this._accumulator = Math.max(Math.min(this._accumulator, dtmin), 0)
		// TODO: reconsider the margin for accumulator amounts close to 0

		// Update frame rate counters
		this.wups = 1000 / this._dtu
		this.wfps = this._dcallback ? 1000 / this._dtf : this.wups
		this.wfactor = this._dtg / this._dtu

		// In case someone called UFX.ticker.stop during the loop
		if (!this._running) return

		// Queue up the next tick
		var tosync = this.sync == "auto" ? window.requestAnimationFrame : this.sync
		this._shandle = this._thandle = null
		var callback = (function (obj) { return function () { obj._tick() } })(this)
		if (tosync) {
		    this._shandle = window.requestAnimationFrame(callback)
		} else {
			// The next time at which a frame would actually execute
			var nexttick = this._lasttick + (dtmin - this._accumulator)
			var delay = Math.max(Date.now() - nexttick, this.delay)
			delay = 0
		    this._thandle = window.setTimeout(callback, delay)
		}
	},
}


// UFX.maximize - expand a canvas to take up the whole window or screen
// Requires polyfill for fullscreening
// UFX.maximize.full(canvas): fullscreen
// UFX.maximize.fill(canvas): fill window
// UFX.maximize.maximize(canvas): fullscreen if possible, fill window otherwise


if (typeof UFX == "undefined") UFX = {}

UFX.maximize = {
	resizemode: "fixed",
	preventscroll: true,
	fillcolor: "black",
	onadjust: null,
	init: function (element) {
		this.element = element
		this.mode = null
		function c(obj, method) { return function () { obj[method]() } }
		this.calladjust = c(this, "adjust")
		this.getsettings()
	},
	setmode: function (mode) {
		if (this.mode == mode) return
		if (this.mode == "fill") window.removeEventListener("resize", this.calladjust)
		if (this.mode == "full") {
			document.cancelFullscreen()
			window.removeEventListener("resize", this.calladjust)
		}
			
		this.mode = mode
		if (this.mode == "fill") window.addEventListener("resize", this.calladjust)
		if (this.mode == "full") {
			this.element.requestFullscreen()
			window.addEventListener("resize", this.calladjust)
		}
	},
	adjust: function () {
		var wx = window.innerWidth, wy = window.innerHeight
		var ex = this.element.width, ey = this.element.height
		var dx, dy, gx, gy

		if (this.resizemode == "none") {
			
		} else if (this.resizemode == "fixed") {
			if (ex * wy > ey * wx) {
				dx = wx
				dy = Math.round(wx * ey / ex)
			} else {
				dx = Math.round(wy * ex / ey)
				dy = wy
			}
		} else if (this.resizemode == "aspect") {
			if (ex * wy > ey * wx) {
				gx = dx = wx
				gy = dy = Math.round(wx * ey / ex)
			} else {
				gx = dx = Math.round(wy * ex / ey)
				gy = dy = wy
			}
		} else if (this.resizemode == "total") {
			gx = dx = wx
			gy = dy = wy
		}
		
		var es = this.element.style
		if (dx) {
			es.width = dx + "px"
			es.height = dy + "px"
		}
		if (gx) {
			this.element.width = gx
			this.element.height = gy
		}
		if (this.mode == "fill") {
			var bx = wx - (dx || gx || this.element.width)
			var by = wy - (dy || gy || this.element.height)
			es.borderLeft = es.borderRight = bx > 0 ? (0.5 * bx + 1) + "px " + this.fillcolor + " solid" : "none"
			es.borderTop = es.borderBottom = by > 0 ? (0.5 * by + 1) + "px " + this.fillcolor + " solid" : "none"
			setTimeout(function () { window.scrollTo(0, 1) }, 1)
		} else if (this.mode == "full") {
			es.borderLeft = es.borderRight = "none"
			es.borderTop = es.borderBottom = "none"
		}
		if (this.onadjust) {
			this.onadjust(this.element, this.element.width, this.element.height)
		}
	},
	fill: function (element, resizemode) {
		if (resizemode) this.resizemode = resizemode
		if (element) this.init(element)
		this.setmode("fill")
		if (this.preventscroll) {
			document.body.addEventListener('touchstart', this.preventdefault)
			this.scrollprevented = true
		}
		this.adjust()
		var es = this.element.style
		es.position = "absolute"
		es.left = "0px"
		es.top = "1px"
		document.body.style.overflow = "hidden"
	},
	full: function (element, resizemode) {
		if (resizemode) this.resizemode = resizemode
		if (element) this.init(element)
		this.setmode("full")
		var fs = this
		setTimeout(function () {
			if (fs.getfullscreenelement() === fs.element) {
				fs.adjust()
			} else {
				fs.restore()
			}
		}, 100)
	},
	maximize: function (element, resizemode) {
		if (resizemode) this.resizemode = resizemode
		if (element) this.init(element)
		if (!this.element.requestFullscreen) {
			this.fill()
			return
		}
		this.setmode("full")
		var fs = this
		setTimeout(function () {
			if (fs.getfullscreenelement() === fs.element) {
			} else {
				fs.fill()
			}
		}, 100)
	},
	getfullscreenelement: function () {
		return document.getFullscreenElement
	},
	restore: function () {
		this.setmode()
		if (this.scrollprevented) {
			document.body.removeEventListener('touchstart', this.preventdefault)
			this.scrollprevented = false
		}
		this.restoresettings()
		if (this.onadjust) {
			this.onadjust(this.element, this.element.width, this.element.height)
		}
	},
	getsettings: function () {
		var es = this.element.style, ds = this.settings = {
			width: this.element.width,
			height: this.element.height,
			overflow: document.body.style.overflow,
			style: {},
		}
		var vars = "width height position left top borderLeft borderRight borderTop borderBottom border".split(" ")
		vars.forEach(function (v) {
			ds.style[v] = es[v]
		})
	},
	restoresettings: function () {
		var es = this.element.style, ds = this.settings
		width: this.element.width = this.settings.width
		height: this.element.height = this.settings.height
		overflow: document.body.style.overflow = this.settings.overflow
		var vars = "width height position left top borderLeft borderRight borderTop borderBottom border".split(" ")
		vars.forEach(function (v) {
			es[v] = ds.style[v]
		})
	},
	fillnoresize: function () {
		es.position = "absolute"
		es.left = "0px"
		es.top = "1px"
		this.setbordersizes(wx - px, wy - py)
		document.body.style.overflow = "hidden"
	},
	preventdefault: function (event) {
		event.preventDefault()
	},
}

// Resource loading

if (typeof UFX == "undefined") UFX = {}
UFX.resource = {}

// These will become populated as you call load
UFX.resource.images = {}
UFX.resource.sounds = {}
UFX.resource.data = {}

// Recognized extensions
UFX.resource.jsontypes = "js json".split(" ")
UFX.resource.imagetypes = "png gif jpg jpeg bmp tiff".split(" ")
UFX.resource.soundtypes = "wav mp3 ogg au".split(" ")
UFX.resource.rawtypes = "csv txt frag vert".split(" ")

// Base path for loading resources
UFX.resource.base = null

// Set this to a function that should be called when all resources are loaded
UFX.resource.onload = function () {}

// Set this to a function that should be called while resources are loading.
// It takes one argument, which is the fraction of resources that have loaded successfully.
UFX.resource.onloading = function (f) {}

// Give it a bunch of resource URLs to preload.
// Resource type (image or audio) is determined by extension
// Can call as:
//   load(url) or
//   load(url1, url2, url3, ...) or
//   load(array-of-urls) or
//   load({name1: url1, name2: url2, ... })
// If you use the last syntax, then you can key off UFX.resource.images and UFX.resource.sounds
//   as UFX.resource.images[name1], etc.
// Otherwise key as UFX.resource.images[url1], etc.
UFX.resource.load = function () {
    var resnames = UFX.resource._extractlist(arguments)
    for (var j = 0 ; j < resnames.length ; ++j) {
        var res = resnames[j]
        UFX.resource._load(res[0], res[1])
    }
    if (UFX.resource._toload === 0) {
        setTimeout(UFX.resource.onload, 0)
    }
}

// Calling loadimage or loadsound is recommended when the resource type cannot be auto-detected
//   from the URL. Or if you just want to be explicit about it.
// Same calling conventions as load.
UFX.resource.loadimage = function () {
    var resnames = UFX.resource._extractlist(arguments)
    for (var j = 0 ; j < resnames.length ; ++j) {
        var res = resnames[j]
        UFX.resource._loadimage(res[0], res[1])
    }
}
UFX.resource.loadsound = function () {
    var resnames = UFX.resource._extractlist(arguments)
    for (var j = 0 ; j < resnames.length ; ++j) {
        var res = resnames[j]
        UFX.resource._loadsound(res[0], res[1])
    }
}
UFX.resource.loadjson = function () {
    var resnames = UFX.resource._extractlist(arguments)
    for (var j = 0 ; j < resnames.length ; ++j) {
        var res = resnames[j]
        UFX.resource._loadjson(res[0], res[1])
    }
}

// Load Google web fonts
UFX.resource.loadwebfonts = function () {
    WebFontConfig = {
        google: { families: Array.prototype.slice.call(arguments) },
        fontactive: UFX.resource._onload,
    }
    var wf = document.createElement("script")
    wf.src = "https://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js"
    wf.type = "text/javascript"
    wf.async = "true"
    document.getElementsByTagName("head")[0].appendChild(wf)
    UFX.resource._toload += arguments.length
}


// Firefox won't let me play a sound more than once every 10 seconds or so.
// Use this class to create a set of identical sounds if you want to play in rapid succession
// url can be a sound or a sound.src attribute. Multisound doesn't participate in the loading
//   cycle, so you should have the url already preloaded when you call this factory.
// n is the number of identical copies. Defaults to 10.
UFX.resource.Multisound = function (url, n) {
    var ms = Object.create(UFX.resource.Multisound.prototype)
    ms._init(url, n)
    return ms
}

UFX.resource.Multisound.prototype = {
    _init: function (url, n) {
        this.src = typeof url == "string" ? url : url.src
        this._sounds = []
        this._n = n || 10
        this._k = 0
        this.volume = 1.0
        for (var j = 0 ; j < this._n ; ++j) {
            var s = new Audio()
            s.src = this.src
            this._sounds.push(s)
        }
    },
    play: function () {
        var s = this._sounds[this._k++]
        this._k %= this._n
        s.volume = this.volume
        s.play()
    },
    pause: function () {
        for (var j = 0 ; j < this._n ; ++j) {
            this._sounds[j].pause()
        }
    },
}

// Sometimes when you've got a sound that plays over and over again (like gunshots) you want to
// add a small amount of variation. Pass a list of closely-related sounds to this class to get an
// object that lets you play one at random. Requires UFX.random.
UFX.resource.SoundRandomizer = function (slist, nskip) {
    if (!(this instanceof UFX.resource.SoundRandomizer))
        return new UFX.resource.SoundRandomizer(slist, nskip)
    this._sounds = []
    for (var j = 0 ; j < slist.length ; ++j) {
        this._sounds.push(typeof slist[j] == "string" ? UFX.resource.sounds[slist[j]] : slist[j])
    }
    this._nskip = Math.min(this._sounds.length - 1, (nskip || 3))
    this._played = []
    this.volume = 1.0
}
UFX.resource.SoundRandomizer.prototype = {
    play: function () {
        do {
            var k = UFX.random.rand(this._sounds.length)
        } while (this._played.indexOf(k) > -1)
        var s = this._sounds[k]
        s.volume = this.volume
        s.play()
        if (this._nskip) {
            this._played.push(k)
            while (this._played.length >= this._nskip)
                this._played = this._played.slice(1)
        }
    },
    pause: function () {
        for (var j = 0 ; j < this._sounds.length ; ++j) {
            this._sounds[j].pause()
        }
    },
}
UFX.resource.mergesounds = function () {
	for (var j = 0 ; j < arguments.length ; ++j) {
		var slist = [], sname = arguments[j]
		for (var s in UFX.resource.sounds) {
			if (s.indexOf(sname) == 0) {
				slist.push(s)
			}
		}
		UFX.resource.sounds[sname] = UFX.resource.SoundRandomizer(slist)
	}
}


UFX.resource._seturl = function (url) {
    if (!UFX.resource.base) return url
    var n = UFX.resource.base.length
    if (!n) return url
    return UFX.resource.base + (UFX.resource.base.charAt(n-1) == "/" ? "" : "/") + url
}

// Try to deduce what type the resource is based on the url
UFX.resource._load = function (name, url) {
    var ext = url.split(".").pop()
    if (UFX.resource.imagetypes.indexOf(ext) > -1) {
        return UFX.resource._loadimage(name, url)
    } else if (UFX.resource.soundtypes.indexOf(ext) > -1) {
        return UFX.resource._loadsound(name, url)
    } else if (UFX.resource.jsontypes.indexOf(ext) > -1) {
        return UFX.resource._loadjson(name, url)
    } else if (UFX.resource.rawtypes.indexOf(ext) > -1) {
        return UFX.resource._loaddata(name, url)
    }
    console.log("Treating unknown extension " + ext + " as raw data")
    return UFX.resource._loaddata(name, url)
}

// Load a single image with the given name
UFX.resource._loadimage = function (iname, imageurl) {
    var img = new Image()
    img.onload = UFX.resource._onload
    img.src = UFX.resource._seturl(imageurl)
    img.iname = iname
    UFX.resource.images[iname] = img
    ++UFX.resource._toload
}
// Load a single audio file with the given name
UFX.resource._loadsound = function (aname, audiourl) {
    var audio = new Audio()
    audio.addEventListener("canplaythrough", UFX.resource._onload, false)
    audio.src = UFX.resource._seturl(audiourl)
    audio.aname = aname
    UFX.resource.sounds[aname] = audio
    ++UFX.resource._toload
}
// Load a single json resource
UFX.resource._loadjson = function (jname, jsonurl) {
    var req = new XMLHttpRequest()
    req.overrideMimeType("application/json")
    req.open('GET', jsonurl, true);  
    var target = this;
    req.onload  = function() {
        UFX.resource.data[jname] = JSON.parse(req.responseText)
        UFX.resource._onload()
    }
    req.send(null);
    ++UFX.resource._toload
}
// Load a single raw data resource
UFX.resource._loaddata = function (dname, dataurl) {
    var req = new XMLHttpRequest()
    req.open('GET', dataurl, true);  
    var target = this;
    req.onload  = function() {
        UFX.resource.data[dname] = req.responseText
        UFX.resource._onload()
    }
    req.send(null);
    ++UFX.resource._toload
}

UFX.resource._extractlist = function (args) {
    var ret = []
    for (var j = 0 ; j < args.length ; ++j) {
        var arg = args[j]
        if (typeof arg == "string") {
            ret.push([arg, arg])
        } else if (arg instanceof Array) {
            for (var k = 0 ; k < arg.length ; ++k) {
                ret.push([arg[k], arg[k]])
            }
        } else {
            for (var k in arg) {
                ret.push([k, arg[k]])
            }
        }
    }
    return ret
}

UFX.resource._toload = 0
UFX.resource._loaded = 0
UFX.resource._onload = function () {
    ++UFX.resource._loaded
    var f = 1. * UFX.resource._loaded / UFX.resource._toload
    UFX.resource.onloading(f)
    if (UFX.resource._loaded === UFX.resource._toload) {
        UFX.resource.onload()
    }
}

// UFX.rand module: random number generation

// Using a quick-and-easy LCG. Good enough for games, not for simulations.
// The only reason for using this instead of Math.random is so I can seed the RNG and make it
//   deterministic.
// If you don't seed it, it's automatically seeded with Math.random

// Also includes a number of handy functions I always wanted.

if (typeof UFX == "undefined") UFX = {}

// UFX.random and UFX.random.rand - the two basic RNG functions

// UFX.random() : float in [0, 1)
// UFX.random(a) : float in [0, a)
// UFX.random(a, b) : float in [a, b)
// UFX.random.rand() : integer in [0, 2^32)
// UFX.random.rand(n) : integer in [0, n)
// UFX.random.rand(m, n) : integer in [m, n)

UFX.random = function (a, b) {
    if (typeof b == "undefined") {
        b = a
        a = 0
        if (typeof b == "undefined") {
            b = 1
        }
    }
    return UFX.random.rand() * (b - a) / 4294967296 + a
}
UFX.random.rand = function (m, n) {
    if (typeof n != "undefined") return m + UFX.random.rand(n-m)
    if (typeof UFX.random.seed == "undefined") {
        UFX.random.setseed()
    }
    // Values from Numerical Recipes, according to Wikipedia
    UFX.random.seed = (1664525 * UFX.random.seed + 1013904223) % 4294967296
    return m ? Math.floor(UFX.random.seed * m / 4294967296) : UFX.random.seed
}

// Jenkins hash function - used to get a number for seeding the RNG from an arbitrary object
//   http://en.wikipedia.org/wiki/Jenkins_hash_function
// For the purposes of bitwise operations, JavaScript's Number type is a 32-bit signed
//   integer. So we can operate as normal on the lower 32 bits, and only at the very end
//   do we have to worry about whether it's negative.
UFX.random.hash = function (obj) {
    var s = typeof obj == "string" ? obj : JSON.stringify(obj), n = s.length, h = 0
    for (var j = 0 ; j < n ; ++j) {
        h += s.charCodeAt(j)
        h += h << 10
        h ^= h >>> 6
    }
    h += h << 3
    h ^= h >>> 11
    h += h << 15
    if (h < 0) h += 4294967296 
    return h
}

// Call with no argument to set a seed from Math.random
// Call with an integer in the range [0, 4294967296) to set that seed
//   (can also just assign to UFX.random.seed)
// Call with an arbitrary object to set a seed based on that object's hash
// Returns the new seed
UFX.random.setseed = function (n) {
    if (typeof n == "undefined") {
        n = Math.floor(Math.random() * 4294967296)
    } else if (typeof n == "number") {
        n = Math.floor(n) % 4294967296
    } else {
        n = UFX.random.hash(n)
    }
    UFX.random.seed = n
    delete UFX.random.normal._y
    return n
}

// Save the state of the RNG for later use
// Useful if you want to generate some random numbers without messing with the RNG
UFX.random._seedstack = []
UFX.random.pushseed = function (n) {
    if (typeof UFX.random.seed == "undefined") UFX.random.setseed()
    UFX.random._seedstack.push(UFX.random.seed)
    UFX.random.setseed(n)
    return UFX.random.seed
}
// Restore the old state of the RNG
UFX.random.popseed = function () {
    UFX.random.seed = UFX.random._seedstack.pop()
    return UFX.random.seed
}

UFX.random.choice = function (arr) {
    return arr[UFX.random.rand(arr.length)]
}

// string of n random letters
UFX.random.word = function (n, letters) {
	var a = []
	n = n || 8
	letters = letters || "abcdefghijklmnopqrstuvwxyz"
	for (var j = 0 ; j < n ; ++j)
		a.push(UFX.random.choice(letters))
	return a.join("")
}

UFX.random.color = function () {
	return "#" + UFX.random.word(6, "0123456789ABCDEF")
}

// Fisher-Yates shuffle (in-place)
UFX.random.shuffle = function (arr) {
    for (var i = arr.length - 1 ; i > 0 ; --i) {
        var j = UFX.random.rand(i+1)
        var temp = arr[i]
        arr[i] = arr[j]
        arr[j] = temp
    }
    return arr
}

// TODO: extend the following two functions into more than 3 dimensions
// A random point in the unit circle
UFX.random.rdisk = function () {
    var x, y
    do {
        x = UFX.random(-1, 1)
        y = UFX.random(-1, 1)
    } while (x * x + y * y > 1)
    return [x, y]
}

// A random point on the unit sphere
UFX.random.rsphere = function () {
    var x, y, z
    do {
        x = UFX.random(-1, 1)
        y = UFX.random(-1, 1)
        z = UFX.random(-1, 1)
    } while (x * x + y * y + z * z > 1)
    var d = Math.sqrt(x*x + y*y + z*z)
    if (d === 0) return [0, 0, 1]
    return [x/d, y/d, z/d]
}


// N points in the unit square that avoid clustering
// setting dfac will affect how non-random it appears
// dfac = 1 : very non-random, regular spacing
// dfac = 0.01 : pretty much like a random distribution
// defaults to 0.15
UFX.random.spread = function (n, dfac, scalex, scaley, x0, y0) {
    n = n || 100
    dfac = dfac || 0.15
    scalex = scalex || 1.0
    scaley = scaley || scalex
    x0 = x0 || 0
    y0 = y0 || x0
    var r = [], d2min = 1.
    while (r.length < n) {
        var x = UFX.random(), y = UFX.random(), valid = true
        for (var j = 0 ; j < r.length ; ++j) {
            var dx = Math.abs(x - r[j][0]), dy = Math.abs(y - r[j][1])
            if (dx > 0.5) dx = 1 - dx
            if (dy > 0.5) dy = 1 - dy
            if (dx * dx + dy * dy < d2min) {
                valid = false
                break
            }
        }
        if (valid) {
            r.push([x, y])
            d2min = dfac / r.length
        } else {
            d2min *= 0.9
        }
    }
    for (var j = 0 ; j < n ; ++j) {
        r[j][0] = x0 + r[j][0] * scalex
        r[j][1] = y0 + r[j][1] * scaley
    }
    return r
}

UFX.random.spread1d = function (n, dfac) {
    n = n || 100
    dfac = dfac || 0.15
    var r = [], dmin = 1
    while (r.length < n) {
        var x = UFX.random(), valid = true
        for (var j = 0 ; j < r.length ; ++j) {
            var dx = Math.abs(x - r[j])
            if (dx > 0.5) dx = 1 - dx
            if (dx < dmin) {
                valid = false
                break
            }
        }
        if (valid) {
            r.push(x)
            dmin = 0.5 * dfac / r.length
        } else {
            dmin *= 0.95
        }
    }
//    var scalex = 1, x0 = 0
    return r
}

// Gaussian normal variable
// http://www.taygeta.com/random/gaussian.html
UFX.random.normal = function (mu, sigma) {
    mu = mu || 0
    sigma = sigma || 1
    if (typeof UFX.random.normal._y == "number") {
        var x = UFX.random.normal._y
        delete UFX.random.normal._y
    } else {
        var x, y, w
        do {
            x = UFX.random(-1, 1)
            y = UFX.random(-1, 1)
            w = x * x + y * y
        } while (w > 1)
        try {
            w = Math.sqrt(-2. * Math.log(w) / w)
            x *= w
            y *= w
        } catch (err) {
            x = y = 0
        }
        UFX.random.normal._y = y
    }
    return x * sigma + mu
}





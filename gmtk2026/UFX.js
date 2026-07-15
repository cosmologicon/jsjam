// Web AudioContext convenience functions.
// This is not a wrapper library. It just aims to simplify some of the syntax for playing sounds.

"use strict"

var UFX = UFX || {}
UFX.audio = {
	context: null,
	// No need to call this directly. Override this if you want UFX.audio to use polyfill.
	newcontext: function () {
		return new AudioContext()
	},
	// Call to begin. Can optionally set the context to an AudioContext object. If none is specified
	// then one will be generated.
	init: function (acontext) {
		this.nodes = {}
		this._nextjnode = 0
		this.buffers = {}
		this.context = acontext || this.newcontext()
	},
	// Get the desired name of a node. If the opts don't specify one, then return a number that is
	// not currently in use.
	_getnodename: function (opts) {
		opts = opts || {}
		if (opts.name) return opts.name
		while (this.nodes["node_" + this._nextjnode]) ++this._nextjnode
		return "node_" + this._nextjnode++
	},
	// Add the given node to this.nodes and return it. If nodename is unspecified then a free name
	// will be chsen.
	addnode: function (node, nodename) {
		if (!this.context) this.init()
		if (nodename === undefined) nodename = this._getnodename()
		this.nodes[nodename] = node
		node.name = nodename
		return node
	},
	// Disconnect the node and remove it from the node graph, if present.
	_cleannode: function (node) {
		node.disconnect()
		if (this.nodes[node.name] === node) {
			delete this.nodes[node.name]
		}
	},
	_cleannodes: function (nodes) {
		nodes.forEach(node => this._cleannode(node))
	},
	// Create a buffer source with the given buffer or buffer name and play it immediately.
	playbuffer: function (buffer, opts) {
		if (!this.context) this.init()
		opts = opts || {}
		var node = this.makebuffernode(buffer, opts)
		node.start(this.context.currentTime + (opts.dt || 0))
		return node
	},
	// Retrieve the node corresponding to the given node or node name.
	_getnode: function (nodename) {
		if (nodename instanceof AudioNode) return nodename
		var node = this.nodes[nodename]
		if (!node) throw "Unrecognized node " + nodename
		return node
	},
	// Retrieve the AudioBuffer object corresponding to the given buffer or buffer name.
	_getbuffer: function (buffername) {
		if (buffername instanceof AudioBuffer) return buffername
		var buffer = this.buffers[buffername]
		if (!buffer) throw "Unrecognized buffer " + buffername
		return buffer
	},
	// Return the specified output, if any, or the context destination if not specified.
	_getoutput: function (output) {
		if (output === null) return null
		if (output) return this._getnode(output)
		return this.context.destination
	},
	// Set the gain of the specified gain node to the specified value.
	setgain: function (nodename, value, opts) {
		if (!this.context) this.init()
		opts = opts || {}
		var node = this._getnode(nodename), gain = node.gain
		var dt = opts.dt || 0, fade = opts.fade || 0, t0 = this.context.currentTime
		if (fade) {
			gain.setValueAtTime(gain.value, t0 + dt)  // Sets linearRamp start time to now.
			gain.linearRampToValueAtTime(value, t0 + dt + fade)
		} else {
			gain.setValueAtTime(value, t0 + dt)
		}
	},
	// Get the current gain of the specified gain node.
	getgain: function (nodename) {
		var node = this._getnode(nodename)
		return node.gain.value
	},
	// Create a gain node with the given options.
	makegainnode: function (opts) {
		if (!this.context) this.init()
		var node = this.addnode(this.context.createGain(), this._getnodename(opts))
		if (opts.gain !== undefined) this.setgain(node, opts.gain)
		var output = this._getoutput(opts.output)
		if (output) node.connect(output)
		return node
	},
	// Create a buffer node with the given options.
	makebuffernode: function (buffer, opts) {
		if (!this.context) this.init()
		opts = opts || {}
		var sourcename = this._getnodename(opts)
		var output = this._getoutput(opts.output)
		var nodes = []
		if ("gain" in opts || opts.addgain) {
			var gain = this.makegainnode({
				name: opts.gainname || sourcename + "_gain",
				output: output,
				gain: opts.gain,
			})
			output = gain
			nodes.push(gain)
		}
		var source = this.addnode(this.context.createBufferSource(), sourcename)
		nodes.push(source)
		source.buffer = this._getbuffer(buffer)
		if (opts.loop) {
			source.loop = opts.loop
		}
		var cleanup = "cleanup" in opts ? opts.cleanup : !opts.loop
		if (cleanup) {
			source.cleanup = () => this._cleannodes(nodes)
			source.addEventListener("ended", source.cleanup)
		}
		if (output) source.connect(output)
		return source
	},
	// Requires UFX.resource
	loadbuffers: function (objs) {
		var o = {}
		for (var s in objs) o[s + "_buffer"] = objs[s]
		UFX.resource.loadaudiobuffer(this.context, o, {
			onload: function (obj, objtype, objname) {
				UFX.audio.buffers[objname.slice(0, -7)] = obj
			},
		})
	},
}
// UFX.draw module: some convenience functions for invoking context methods

// The basic UFX.draw() function takes a string inspired by the SVG path string specification,
//   but with some important differences

// For a complete listing of UFX.draw tokens, please see the UFX documentation here:
// https://code.google.com/p/unifac/wiki/UFXDocumentation#UFX.draw_token_list

// Three ways to invoke the function here.
// UFX.draw(context, drawstring)
// UFX.draw.setcontext(context) ; UFX.draw(drawstring)
// UFX.draw.extend(context) ; context.draw(drawstring)

// The drawstring can also be a series of strings or values.
// UFX.draw(context, "( m 0 0 l", x, y, ") s")

"use strict"
var UFX = UFX || {}

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
            case "sfr": case "strokefillrect":
                var x = +t[++j], y = +t[++j], w = +t[++j], h = +t[++j]
                this.strokeRect(x, y, w, h)
                this.fillRect(x, y, w, h)
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
            case "textalign": case "ta":
                this.textAlign = t[++j]
                break
            case "textbaseline": case "tb":
                this.textBaseline = t[++j]
                break
            case "textalignbaseline": case "tab":
                this.textAlign = t[++j]
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
            case "strokefilltext": case "sft":
                var s = t[++j].replace(/~/g, " "), x = +t[++j], y = +t[++j]
                this.strokeText(s, x, y)
                this.fillText(s, x, y)
                break
            case "strokefilltext0": case "sft0":
                var s = t[++j].replace(/~/g, " ")
                this.strokeText(s, 0, 0)
                this.fillText(s, 0, 0)
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
UFX._draw.text = function (text, pos, fontsize, fontname, opts) {
	opts = opts || {}
	this.save()
	this.miterLimit = 0.1
	this.translate(pos[0], pos[1])
	var italic = opts.italic == true ? "italic" : (opts.italic || "")
	if (italic) italic += " "
	var bold = opts.bold === true ? "bold" : (opts.bold || "")
	if (bold) bold += " "
	this.font = italic + bold + fontsize + "px " + "'" + fontname + "'"
	if (opts.tab) {
		var tab = opts.tab.split(" ")
		this.textAlign = tab[0]
		this.textBaseline = tab[1]
	}
	if (opts.align) this.textAlign = opts.align
	if (opts.baseline) this.textBaseline = opts.baseline
	var dy = {
		top: 0,
		hanging: 0,
		middle: 0.5,
		bottom: 1,
		ideographic: 1,
		alphabetic: 1,
	}[this.textBaseline] || 0
	var texts = UFX.gltext._split(this, text, opts.width)
	var lineheight = fontsize * ("lineheight" in opts ? opts.lineheight : 1)
	if (opts.angle) this.rotate(opts.angle)
	if (dy) this.translate(0, -dy * lineheight * (texts.length - 1))
	var stroke = opts.stroke || "owidth" in opts, fill = opts.fill !== null
	if (fill) this.fillStyle = opts.fill === true ? "white" : opts.fill
	if (stroke) {
		if (opts.stroke) this.strokeStyle = opts.stroke
		this.lineWidth = ("owidth" in opts ? opts.owidth : 1) * fontsize / 12
	}
	var shadow = opts.shadow || ["black", 0, 0, 0]
	if (shadow == ["black", 0, 0, 0]) shadow = null
	if (shadow) {
		shadow[1] *= fontsize / 18
		shadow[2] *= fontsize / 18
		shadow[3] *= fontsize / 18
	}
	if (opts.shade) {
		var a = Math.min((opts.shade === true ? 1 : opts.shade) * 0.1, 1)
		var color0, color1
		if (a > 0) {
			color1 = "rgba(0,0,0," + a + ")"
			color0 = "rgba(255,255,255," + a + ")"
		} else {
			a = -a
			color0 = "rgba(0,0,0," + a + ")"
			color1 = "rgba(255,255,255," + a + ")"
		}
		var h1 = {
			top: 0.9,
			middle: 0.35,
			bottom: -0.25,
			alphabetic: 0,
			hanging: 0.7,
			ideographic: -0.25,
		}[this.textBaseline] || 0
		var h0 = h1 - 0.5
		var shadegradient = UFX.draw.lingrad(this, 0, h0 * fontsize, 0, h1 * fontsize, 0, color0, 1, color1)
	}
	for (var j = 0 ; j < texts.length ; ++j) {
		var t = texts[j]
		if (stroke) this.strokeText(t, 0, 0)
		if (fill) {
			this.save()
			if (shadow) {
				this.shadowColor = shadow[0]
				this.shadowOffsetX = shadow[1]
				this.shadowOffsetY = shadow[2]
				this.shadowBlur = shadow[3]
			}
			this.fillText(t, 0, 0)
			this.restore()
		}
		if (opts.shade) {
			this.save()
			this.fillStyle = shadegradient
			this.fillText(t, 0, 0)
			this.restore()
		}
		this.translate(0, lineheight)
	}
	this.restore()
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





"use strict"

var UFX = UFX || {}

UFX._gl = {
	getName: function (value) {
		for (var name in this) {
			if (name.toUpperCase() == name && this[name] == value) return name
		}
		return "UNKNOWN_ENUM:" + value
	},
	resize: function (w, h) {
		this.canvas.width = w
		this.canvas.height = h
		this.viewport(0, 0, w, h)
	},
	addProgram: function (progname, vsource, fsource, opts) {
		if (!this.progs) this.progs = {}
		var prog = this.progs[progname] = this.buildProgram(vsource, fsource, opts)
		return prog
	},
	// Build a program, using the given source for the vertex and fragment shaders.
	buildProgram: function (vsource, fsource, opts) {
		opts = opts || {}
		var prog = this.createProgram()
		var vshader = this.createShader(this.VERTEX_SHADER)
		this.shaderSource(vshader, this.findSource(vsource))
		this.compileShader(vshader)
		if (!this.getShaderParameter(vshader, this.COMPILE_STATUS)) {
			throw "Error compiling vertex shader:\n" + this.getShaderInfoLog(vshader)
		}
		this.attachShader(prog, vshader)
		var fshader = this.createShader(this.FRAGMENT_SHADER)
		this.shaderSource(fshader, this.findSource(fsource))
		this.compileShader(fshader)
		if (!this.getShaderParameter(fshader, this.COMPILE_STATUS)) {
			throw "Error compiling fragment shader:\n" + this.getShaderInfoLog(fshader)
		}
		this.attachShader(prog, fshader)
		if (opts.attribs) {
			for (var name in opts.attribs) {
				this.bindAttribLocation(prog, opts.attribs[name], name)
			}
		}
		this.linkProgram(prog)
		if (!this.getProgramParameter(prog, this.LINK_STATUS)) {
			throw "Error linking program:\n" + this.getProgramInfoLog(prog)
		}
		this.validateProgram(prog)
		this.deleteShader(vshader)
		this.deleteShader(fshader)
		this.extendProgram(prog)
		return prog
	},
	findSource: function (scriptId) {
		if (scriptId.split) {
			var shaderScript = document.getElementById(scriptId)
			return shaderScript ? shaderScript.text : scriptId
		} else if (scriptId.text) {
			return scriptId.text
		}
		throw "Unable to find source from scriptId: " + scriptId
	},

	// Attaches member to obj such that obj[name] = member, but also breaks up name into
	// components to allow various ways of accessing member through name. For instance, when
	// name = "a.b[0][1].c", then all of the following will be references to member:
	// obj["a.b[0][1].c"]
	// obj.a["b[0][1].c"]
	// obj.a["b[0]"][1].c
	// obj.a.b[0][1].c
	// Doesn't work for every possible value of name, but it should work for anything that's a valid
	// WebGL uniform name.
	_attach: function (obj, member, name) {
		var pieces = name.split(/(?=[\.\[])/), n = pieces.length, joiners = {}
		for (var i = 0 ; i < n ; ++i) {
			for (var j = i + 1 ; j <= n ; ++j) {
				var joiner = pieces.slice(i, j).join("").replace(/^\./, "")
				if (joiner[0] == "[") joiner = j == i + 1 ? joiner.replace(/[\[\]]/g, "") : null
				joiners[[i, j]] = joiner
			}
		}
		var objchain = [obj]
		for (var j = 1 ; j < n ; ++j) {
			var joiner = joiners[[0, j]]
			if (!obj[joiner]) obj[joiner] = {}
			objchain.push(obj[joiner])
		}
		objchain.push(member)
		for (var i = 0 ; i < n ; ++i) {
			for (var j = i + 1 ; j <= n ; ++j) {
				if (joiners[[i, j]]) objchain[i][joiners[[i, j]]] = objchain[j]
			}
		}
	},

	// Add convenience functions to the given program.
	extendProgram: function (prog, opts) {
		opts = opts || {}
		var checkargs = "checkargs" in opts ? opts.checkargs : true
		var gl = this
		prog.gl = gl
		prog.use = function () {
			gl.useProgram(prog)
			gl.prog = prog
		}
		prog.use()
		prog.set = function (vars) {
			for (var name in vars) {
				this.set[name](vars[name])
			}
		}
		prog.uniforms = {}
		prog.uniforminfo = {}
		prog.setUniform = {}
		prog.setUniformv = {}
		prog.setUniformMatrix = {}
		var n = this.getProgramParameter(prog, this.ACTIVE_UNIFORMS)
		for (var i = 0 ; i < n ; ++i) {
			var info = this.getActiveUniform(prog, i)
			// Arrays will appear as "aname[0]", but there actually n+1 uniforms that can be added.
			var names = [info.name]
			if (/\]$/.test(names[0])) {
				names[0] = names[0].replace(/\[[^\[]*$/, "")
				for (var j = 0 ; j < info.size ; ++j) {
					names.push(names[0] + "[" + j + "]")
				}
			}
			this._attach(prog.uniforminfo, info, names[0])
			var locations = []
			for (var j = 0 ; j < names.length ; ++j) {
				var name = names[j]
				var location = this.getUniformLocation(prog, name)
				this._attach(prog.uniforms, location, name)
				// The number of arguments expected by the v-setter
				var argc = this.getTypeSize(info.type), typename = this.getName(info.type)
				if (this.isMatrixType(info.type)) argc *= argc
				if (j == 0 && names.length > 1) {
					argc *= info.size
					typename += "[" + info.size + "]"
				}
				if (this.isMatrixType(info.type)) {
					var func = this.getUniformMatrixSetter(prog, location, info.type)
					if (checkargs) func = this._checkvarg(func, argc, name, typename, "Uniform matrix")
					this._attach(prog.setUniformMatrix, func, name)
					this._attach(prog.set, func, name)
				} else {
					var func = this.getUniformSetter(prog, location, info.type)
					var funcv = this.getUniformVectorSetter(prog, location, info.type)
					if (checkargs) {
						func = this._checkarg(func, argc, name, typename, "Uniform")
						funcv = this._checkvarg(funcv, argc, name, typename, "Uniform vector")
					}
					this._attach(prog.setUniform, func, name)
					this._attach(prog.setUniformv, funcv, name)
					this._attach(prog.set, argc == 1 ? func : funcv, name)
				}
			}
		}
		prog.attribs = {}
		prog.attribinfo = {}
		prog.setAttrib = {}
		prog.setAttribv = {}
		n = this.getProgramParameter(prog, this.ACTIVE_ATTRIBUTES)
		for (var i = 0 ; i < n ; ++i) {
			var info = this.getActiveAttrib(prog, i)
			if (info.size != 1) throw "Can't handle attribute arrays! (for attrib " + info.name + ")"
			var index0 = gl.getAttribLocation(prog, info.name)
			this._attach(prog.attribinfo, info, info.name)
			var names = [info.name]
			var argc = this.getTypeSize(info.type), typename = this.getName(info.type)
			if (this.isMatrixType(info.type)) {
				names = []
				for (var j = 0 ; j < argc ; ++j) {
					names.push(info.name + "[" + j + "]")
				}
			}
			for (var j = 0 ; j < names.length ; ++j) {
				var name = names[j], index = index0 + j
				this._attach(prog.attribs, index, name)
				var func = this.getAttribSetter(prog, index, info.type)
				var funcv = this.getAttribVectorSetter(prog, index, info.type)
				if (checkargs) {
					func = this._checkarg(func, argc, name, typename, "Vertex attribute")
					funcv = this._checkvarg(funcv, argc, name, typename, "Vertex attribute vector")
				}
				this._attach(prog.setAttrib, func, name)
				this._attach(prog.setAttribv, funcv, name)
				this._attach(prog.set, argc == 1 ? func : funcv, name)
			}
		}
		prog.assignAttribOffsets = this.assignAttribOffsets.bind(this, prog)
	},

	// returns true if the array-like object a has length n and contains only Numbers or Booleans
	_checkn: function (a, n) {
		return a.length == n &&
			[].every.call(a, function (x) { return typeof x == "number" || typeof x == "boolean" })
	},

	// Wrap a function to require it takes exactly argc arguments
	_checkarg: function (func, argc, name, type, settertype) {
		return function () {
			if (UFX._gl._checkn(arguments, argc)) {
				return func.apply(this, arguments)
			}
			throw (settertype + " setter for " + name + " (type " + type + ") expects exactly " +
				argc + " numerical arguments.")
		}
	},

	// Wrap a function to require it takes a single array argument of length argc
	_checkvarg: function (func, argc, name, type, settertype) {
		return function (arg) {
			if (arguments.length == 1 && arg.length && UFX._gl._checkn(arg, argc)) {
				return func.apply(this, arguments)
			}
			throw (settertype + " setter for " + name + " (type " + type +
				") expects a single argument of exactly " + argc + " numerical elements.")
		}
	},

	buildTexture: function (opts) {
		opts = opts || {}
		var target = opts.target || this.TEXTURE_2D
		if (target != this.TEXTURE_2D) throw "can only handle target TEXTURE_2D"

		var texture = this.createTexture()
		this.bindTexture(target, texture)

		if ("flip" in opts) {
			var flip0 = this.getParameter(this.UNPACK_FLIP_Y_WEBGL)
			this.pixelStorei(this.UNPACK_FLIP_Y_WEBGL, opts.flip)
		}

		var level = 0
		var format = opts.format || this.RGBA
		var border = 0
		var type = opts.type || this.UNSIGNED_BYTE
		if (opts.source) {
			this.texImage2D(target, level, format, format, type, opts.source)
			texture.width = opts.source.width
			texture.height = opts.source.height
		} else {
			var pixels = opts.pixels || null
			var size0 = 256
			var width = opts.width || opts.size || size0
			var height = opts.height || opts.size || size0
			this.texImage2D(target, level, format, width, height, border, format, type, pixels)
			texture.width = width
			texture.height = height
		}

		if ("flip" in opts) {
			this.pixelStorei(this.UNPACK_FLIP_Y_WEBGL, flip0)
		}

		var min_filter = opts.min_filter || opts.filter
		var mag_filter = opts.mag_filter || opts.filter
		var wrap_s = opts.wrap_s || opts.wrap
		var wrap_t = opts.wrap_t || opts.wrap

		if (opts.npot) {
			if (!min_filter) min_filter = this.NEAREST
			if (!mag_filter) mag_filter = this.NEAREST
			wrap_s = this.CLAMP_TO_EDGE
			wrap_t = this.CLAMP_TO_EDGE
		}

		if (min_filter) this.texParameteri(target, this.TEXTURE_MIN_FILTER, min_filter)
		if (mag_filter) this.texParameteri(target, this.TEXTURE_MAG_FILTER, mag_filter)
		if (wrap_s) this.texParameteri(target, this.TEXTURE_WRAP_S, wrap_s)
		if (wrap_t) this.texParameteri(target, this.TEXTURE_WRAP_T, wrap_t)

		var mipmap = opts.source || opts.pixels
		if (opts.npot) mipmap = false
		if ("mipmap" in opts) mipmap = opts.mipmap

		if (mipmap) gl.generateMipmap(target)
		return texture
	},

	// For debugging purposes only. Dumps the given texture to the canvas.
	dumpTexture: function (texture, w, h) {
		var vsource = [
			"uniform mediump vec2 v;",
			"void main() { gl_Position = vec4(0.0, 0.0, 0.0, 1.0); gl_PointSize = max(v.x, v.y); }",
		].join("\n")
		var fsource = [
			"uniform mediump vec2 v; uniform sampler2D s;",
			"void main() { gl_FragColor = texture2D(s, gl_FragCoord.xy / v); }",
		].join("\n")
		if (w === undefined) {
			w = texture.width || 256
			h = texture.height || 256
		}
		var prog = this.buildProgram(vsource, fsource)
		prog.use()
		this.resize(w, h)
		this.clearColor(0, 0, 0, 1)
		this.clear(this.COLOR_BUFFER_BIT)
		this.disable(this.DEPTH_TEST)
		this.disable(this.SCISSOR_TEST)
		this.activeTexture(this.TEXTURE0)
		this.bindTexture(this.TEXTURE_2D, texture)
		prog.set({
			s: 0,
			v: [w, h],
		})
		this.drawArrays(this.POINTS, 0, 1)
		this.deleteProgram(prog)
	},

	// Returns "f" or "i" for float or integer type.
	getTypeLetter: function (type) {
		switch (type) {
			case this.FLOAT: case this.FLOAT_VEC2: case this.FLOAT_VEC3: case this.FLOAT_VEC4:
			case this.FLOAT_MAT2: case this.FLOAT_MAT3: case this.FLOAT_MAT4:
				return "f"
			case this.INT: case this.INT_VEC2: case this.INT_VEC3: case this.INT_VEC4:
			case this.BOOL: case this.BOOL_VEC2: case this.BOOL_VEC3: case this.BOOL_VEC4:
			case this.SAMPLER_2D: case this.SAMPLER_CUBE:
				return "i"
		}
		throw "Unrecognized type " + type
	},
	// Returns 1, 2, 3, or 4.
	getTypeSize: function (type) {
		switch (type) {
			case this.FLOAT: case this.INT: case this.BOOL:
			case this.SAMPLER_2D: case this.SAMPLER_CUBE:
				return 1
			case this.FLOAT_VEC2: case this.INT_VEC2: case this.BOOL_VEC2: case this.FLOAT_MAT2:
				return 2
			case this.FLOAT_VEC3: case this.INT_VEC3: case this.BOOL_VEC3: case this.FLOAT_MAT3:
				return 3
			case this.FLOAT_VEC4: case this.INT_VEC4: case this.BOOL_VEC4: case this.FLOAT_MAT4:
				return 4
		}
		throw "Unable to get size for type " + type
	},
	isMatrixType: function (type) {
		switch (type) {
			case this.FLOAT_MAT2: case this.FLOAT_MAT3: case this.FLOAT_MAT4:
				return true
			default:
				return false
		}
	},

	getUniformSetter: function (prog, location, type) {
		if (this.isMatrixType(type)) {
			throw "Cannot call getUniformSetter on matrix type " + this.getName(type)
		}
		var methodname = "uniform" + this.getTypeSize(type) + this.getTypeLetter(type)
		return this[methodname].bind(this, location)
	},
	getUniformVectorSetter: function (prog, location, type) {
		if (this.isMatrixType(type)) {
			throw "Cannot call getUniformVectorSetter on matrix type " + this.getName(type)
		}
		var methodname = "uniform" + this.getTypeSize(type) + this.getTypeLetter(type) + "v"
		return this[methodname].bind(this, location)
	},
	getUniformMatrixSetter: function (prog, location, type) {
		if (!this.isMatrixType(type)) {
			throw "Cannot call getUniformMatrixSetter on non-matrix type " + this.getName(type)
		}
		var methodname = "uniformMatrix" + this.getTypeSize(type) + this.getTypeLetter(type) + "v"
		return this[methodname].bind(this, location, false)
	},
	getAttribSetter: function (prog, index, type) {
		var methodname = "vertexAttrib" + this.getTypeSize(type) + this.getTypeLetter(type)
		return this[methodname].bind(this, index)
	},
	getAttribVectorSetter: function (prog, index, type) {
		var methodname = "vertexAttrib" + this.getTypeSize(type) + this.getTypeLetter(type) + "v"
		return this[methodname].bind(this, index)
	},
	makeArrayBuffer: function (data, opts) {
		opts = opts || {}
		var buffer = this.createBuffer()
		this.bindBuffer(this.ARRAY_BUFFER, buffer)
		this.bufferData(this.ARRAY_BUFFER, new (opts.type || Float32Array)(data), (opts.mode || this.STATIC_DRAW))
		buffer.bind = this.bindBuffer.bind(this, this.ARRAY_BUFFER, buffer)
		return buffer
	},
	makeElementBuffer: function (data, opts) {
		opts = opts || {}
		var buffer = this.createBuffer()
		this.bindBuffer(this.ELEMENT_ARRAY_BUFFER, buffer)
		this.bufferData(this.ELEMENT_ARRAY_BUFFER, new (opts.type || Uint16Array)(data), (opts.mode || this.STATIC_DRAW))
		buffer.bind = this.bindBuffer.bind(this, this.ELEMENT_ARRAY_BUFFER, buffer)
		return buffer
	},
	// Assigns pointers for the attributes corresponding to the given names.
	// Also enables the attributes as arrays.
	assignAttribOffsets: function (prog, offsets, opts) {
		opts = opts || {}
		var datatype = opts.type || this.FLOAT
		var normalize = "normalize" in opts ? opts.normalize : false
		var bytes = opts.bytes || Float32Array.BYTES_PER_ELEMENT, stride
		if ("stride" in opts) {
			stride = opts.stride
		} else {
			stride = 0
			for (var name in offsets) {
				var size = this.getTypeSize(prog.attribinfo[name].type)
				stride = Math.max(stride, offsets[name] + size)
			}
		}
		for (var name in offsets) {
			var size = this.getTypeSize(prog.attribinfo[name].type)
			this.enableVertexAttribArray(prog.attribs[name])
			this.vertexAttribPointer(prog.attribs[name], size, datatype, normalize, stride * bytes, offsets[name] * bytes)
		}
	},
}

UFX.gl = function (canvas, opts) {
	var gl = canvas.getContext("webgl", opts)
	if (!gl) return gl
	for (var method in UFX._gl) gl[method] = UFX._gl[method]
	return gl
}

// Create a GL program with some convenience functions.

// var prog = UFX.glprog(vsource, fsource)
// vsource is the source code for the vertex shader (or the id of a DOM element with the source)

// Constructor assumes your GL context is a global variable called "gl". If not, pass in the context
// object as a third argument.

// Utility functions:
//   UFX.glutil.enumname(gl.SOME_ENUM)  -> returns string "SOME_ENUM"
//   UFX.glutil.enumasstring(gl.SOME_ENUM)  -> returns string "gl.SOME_ENUM"
//   UFX.glutil.typeletter(gl.INT_VEC2)  -> returns "i"
//   UFX.glutil.typesize(gl.INT_VEC2)  -> returns 2
//   UFX.glutil.ismatrixtype(gl.FLOAT_MAT2)  -> returns true

// Convenience functions:
//   prog.use()
// For uniforms:
//   prog.uniforms.uname  -> the uniform locator for the uniform uname
//   prog.set.uname(value)  -> set the uniform to the given value
//     value should be a scalar or Array as appropriate to the type of the uniform:
//     prog.set.myfloat(1)  -> calls gl.uniform1f
//     prog.set.myvec2([2, 3])  -> calls gl.uniform2fv
//     prog.set.mymat2([4, 5, 6, 7])  -> calls gl.uniformMatrix2fv
// For attributes:
//   prog.attribs.aname  -> the attribute location for the given attribute name
//   prog.setgeneric.aname(value)  -> set the attribute to the generic value and disable as array
//   prog.set.aname(buffer)  -> set the attribute to the given buffer and enable it

"use strict"
var UFX = UFX || {}

UFX.glutil = {
	enumname: function (value, _gl) {
		_gl = _gl || gl
		for (var name in _gl) {
			if (name.toUpperCase() == name && _gl[name] === value) return name
		}
		return null
	},
	enumasstring: function (value, _gl) {
		_gl = _gl || gl
		var name = this.enumname(value, _gl)
		return name ? "gl." + name : "unknown GLENUM (" + value + ")"
	},
	typeletter: function (type, _gl) {
		_gl = _gl || gl
		switch (type) {
			case _gl.FLOAT: case _gl.FLOAT_VEC2: case _gl.FLOAT_VEC3: case _gl.FLOAT_VEC4:
			case _gl.FLOAT_MAT2: case _gl.FLOAT_MAT3: case _gl.FLOAT_MAT4:
				return "f"
			case _gl.INT: case _gl.INT_VEC2: case _gl.INT_VEC3: case _gl.INT_VEC4:
			case _gl.BOOL: case _gl.BOOL_VEC2: case _gl.BOOL_VEC3: case _gl.BOOL_VEC4:
			case _gl.SAMPLER_2D: case _gl.SAMPLER_CUBE:
				return "i"
		}
		throw "Unrecognized type: " + this.enumasstring(type, _gl)
	},
	typesize: function (type, _gl) {
		_gl = _gl || gl
		switch (type) {
			case _gl.FLOAT: case _gl.INT: case _gl.BOOL:
			case _gl.SAMPLER_2D: case _gl.SAMPLER_CUBE:
				return 1
			case _gl.FLOAT_VEC2: case _gl.INT_VEC2: case _gl.BOOL_VEC2: case _gl.FLOAT_MAT2:
				return 2
			case _gl.FLOAT_VEC3: case _gl.INT_VEC3: case _gl.BOOL_VEC3: case _gl.FLOAT_MAT3:
				return 3
			case _gl.FLOAT_VEC4: case _gl.INT_VEC4: case _gl.BOOL_VEC4: case _gl.FLOAT_MAT4:
				return 4
		}
		throw "Unable to get size for type: " + this.enumasstring(type, _gl)
	},
	ismatrixtype: function (type, _gl) {
		_gl = _gl || gl
		switch (type) {
			case _gl.FLOAT_MAT2: case _gl.FLOAT_MAT3: case _gl.FLOAT_MAT4:
				return true
			default:
				return false
		}
	},
	// Returns the scalar form for lenth-1 types and the vector form for other types.
	uniformsettername: function (type, _gl) {
		var typesize = this.typesize(type, _gl)
		var typeletter = this.typeletter(type, _gl)
		if (this.ismatrixtype(type, _gl)) {
			return "uniformMatrix" + typesize + typeletter + "v"
		} else if (typesize == 1) {
			return "uniform" + typesize + typeletter
		} else {
			return "uniform" + typesize + typeletter + "v"
		}
	},

	// A argument-checking wrapper for functions that expect a single scalar.
	_wrapargcheckscalar: function (func, message) {
		return function (arg) {
			// isNaN(arg.length) distinguishes between numbers and Arrays.
			if (arguments.length != 1 || !isNaN(arg.length)) throw message
			func(arg)
		}
	},
	// A argument-checking wrapper for functions that expect a single Array argument of the given size.
	_wrapargcheckarray: function (func, size, message) {
		return function (arg) {
			if (arguments.length != 1 || arg.length != size) {
				throw message
			}
			func(arg)
		}
	},
	_getuniformsetter: function (uname, location, type, count, _gl) {
		var typesize = this.typesize(type, _gl)
		var letter = this.typeletter(type, _gl)
		var ismatrix = this.ismatrixtype(type, _gl)
		var ntypevalues = ismatrix ? typesize * typesize : typesize
		var nvalues = count * ntypevalues
		var settername = [
			"uniform",
			ismatrix ? "Matrix" : "",
			typesize,
			letter,
			nvalues == 1 ? "" : "v"
		].join("")
		var setter
		if (ismatrix) {
			setter = _gl[settername].bind(_gl, location, false)
		} else {
			setter = _gl[settername].bind(_gl, location)
		}
		if (true) {  // Add argument checking
			var typename = UFX.glutil.enumasstring(type, _gl)
			if (count > 1) typename += "[" + count + "]"
			if (nvalues == 1) {
				var message = "Setter gl." + settername + " for uniform " + uname +
					" requires a single scalar argument of type " + typename + "."
				setter = this._wrapargcheckscalar(setter, message)
			} else {
				var message = "Setter gl." + settername + " for uniform " + uname + +
					" requires a single length-" + nvalues + " Array argument of type " + typename + "."
				setter = this._wrapargcheckarray(setter, nvalues, message)
			}
		}
		return setter
	},
	_getattribsetter: function (aname, location, type, count, _gl) {
		// TODO: make sure this actually works with mat3 attribs!
		console.assert(count == 1)
		var typesize = this.typesize(type, _gl)
		var letter = this.typeletter(type, _gl)
		var ismatrix = this.ismatrixtype(type, _gl)
		var ntypevalues = ismatrix ? typesize * typesize : typesize
		var nvalues = count * ntypevalues
		var settername = [
			"vertexAttrib",
			typesize,
			letter,
			nvalues == 1 ? "" : "v"
		].join("")
		var setter = function (arg) {
			_gl[settername](location, arg)
			_gl.disableVertexAttribArray(location)
		}
		if (true) {  // Add argument checking
			var typename = UFX.glutil.enumasstring(type, _gl)
			if (count > 1) typename += "[" + count + "]"
			if (nvalues == 1) {
				var message = "Constant setter gl." + settername + " for vertex attribute " + aname + 
					" requires a single scalar argument of type " + typename + "."
				setter = this._wrapargcheckscalar(setter, message)
			} else {
				var message = "Constant setter gl." + settername + " for vertex attribute " + aname +
					" requires a single length-" + nvalues + " Array argument of type " + typename + "."
				setter = this._wrapargcheckarray(setter, nvalues, message)
			}
		}
		return setter
	},
	_getattribpointersetter: function (aname, location, type, count, _gl) {
		console.assert(count == 1)
		var typesize = this.typesize(type, _gl)
		var letter = this.typeletter(type, _gl)
		var ismatrix = this.ismatrixtype(type, _gl)
		var ntypevalues = ismatrix ? typesize * typesize : typesize
		var nvalues = count * ntypevalues
		var setter = function (data) {
			if (Array.isArray(data)) data = Float32Array.from(data)
			var buffer = _gl.createBuffer()
			_gl.bindBuffer(_gl.ARRAY_BUFFER, buffer)
			_gl.bufferData(_gl.ARRAY_BUFFER, data, _gl.STATIC_DRAW)
			_gl.enableVertexAttribArray(location)
			// TODO: correctly handle other types than Float32Array
			_gl.vertexAttribPointer(location, typesize, _gl.FLOAT, _gl.FALSE, 0, 0)
		}
		if (true) {  // Add argument checking
			setter = (function (func) {
				return function (arg) {
					var isarray = Array.isArray(arg) || arg instanceof Float32Array
					if (arguments.length != 1 || !isarray) {
						throw "Setter for vertex attribute " + aname +
							" requires a single argument Array or Float32Array."
					}
					func(arg)
				}
			})(setter)
		}
		return setter
	},
}


UFX.glprog = function (vsource, fsource, _gl) {
	if (!(this instanceof UFX.glprog)) return new UFX.glprog(vshader, fshader, _gl)
	this.gl = _gl || gl
	if (!this.gl) throw "GL context not specified."
	this.vshader = this.createshader(vsource, this.gl.VERTEX_SHADER)
	this.fshader = this.createshader(fsource, this.gl.FRAGMENT_SHADER)
	this.buildprogram()
	this.use()
	this.set = {}
	this.setconstant = {}
	this.setupuniforms()
	this.setupattribs()
}
UFX.glprog.prototype = {
	createshader: function (shadersource, shadertype) {
		var shader = this.gl.createShader(shadertype)
		if (shadersource.split) {
			var element = document.getElementById(shadersource)
			if (element) shadersource = element.text
		} else if (shadersource.text) {
			shadersource = shadersource.text
		} else {
			throw "Unable to parse as shader source: " + shadersource
		}
		this.gl.shaderSource(shader, shadersource)
		this.gl.compileShader(shader)
		if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
			throw "shader compile error: " + this.gl.getShaderInfoLog(shader)
		}
		return shader
	},
	buildprogram: function () {
		this.prog = this.gl.createProgram()
		this.gl.attachShader(this.prog, this.vshader)
		this.gl.attachShader(this.prog, this.fshader)
		this.gl.linkProgram(this.prog)
		if (!this.gl.getProgramParameter(this.prog, this.gl.LINK_STATUS)) {
			throw "Error linking program:\n" + this.gl.getProgramInfoLog(this.prog)
		}
		this.gl.validateProgram(this.prog)
		// TODO: check validation status
	},
	setupuniforms: function () {
		this.uniforms = {}
		var nuniforms = this.gl.getProgramParameter(this.prog, this.gl.ACTIVE_UNIFORMS)
		for (var i = 0 ; i < nuniforms ; ++i) {
			var info = this.gl.getActiveUniform(this.prog, i)
			this.uniforms[info.name] = this.gl.getUniformLocation(this.prog, info.name)
			this.set[info.name] = UFX.glutil._getuniformsetter(info.name, this.uniforms[info.name], info.type, info.size, this.gl)
		}
	},
	setupattribs: function () {
		this.attribs = {}
		var nattribs = this.gl.getProgramParameter(this.prog, this.gl.ACTIVE_ATTRIBUTES)
		for (var i = 0 ; i < nattribs ; ++i) {
			var info = this.gl.getActiveAttrib(this.prog, i)
			this.attribs[info.name] = this.gl.getAttribLocation(this.prog, info.name)
			this.set[info.name] = UFX.glutil._getattribpointersetter(info.name, this.attribs[info.name], info.type, info.size, this.gl)
			this.setconstant[info.name] = UFX.glutil._getattribsetter(info.name, this.attribs[info.name], info.type, info.size, this.gl)
		}
	},
	use: function () {
		this.gl.useProgram(this.prog)
	},

}
// UFX.gltext module
// Requires the UFX.gl module.

"use strict"
var UFX = UFX || {}

UFX.gltext = function (text, pos, opts) {
	if (!UFX.gltext.inited) throw "UFX.gltext.init(gl) has not been called"
	UFX.gltext.prog.draw(text, pos, opts)
}
UFX.gltext.init = function (gl) {
	UFX.gltext.inited = true
	UFX.gltext._gl = gl
	var prog = UFX.gltext.prog = gl.addProgram("text", UFX.gltext._vsource, UFX.gltext._fsource)
	prog.draw = UFX.gltext._draw
	prog.drawbox = UFX.gltext._drawbox
	prog.clean = UFX.gltext._clean
	prog.clear = UFX.gltext._clear
	prog.gettexture = UFX.gltext._gettexture
	prog.texturedata = {
		textures: {},
		tick: 0,
		sizetotal: 0,
		fitcache: {},
		spares: [],
	}
	prog.posbuffer = gl.makeArrayBuffer([0, 0, 1, 0, 0, 1, 1, 1])
	prog.assignAttribOffsets({ p: 0 })
	var use0 = prog.use
	prog.use = function () {
		use0.call(this)
		this.gl.enable(this.gl.BLEND)
		this.gl.disable(this.gl.DEPTH_TEST)
		this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA, 0, 1)
		this.posbuffer.bind()
		this.assignAttribOffsets({ p: 0 })
	}
	return prog
}
UFX.gltext._vsource = [
	"attribute vec2 p;",
	"varying highp vec2 a;",
	"uniform vec2 w, s, p0, c;",
	"uniform float A;",
	"void main() {",
	"	mat2 R = mat2(cos(A), sin(A), -sin(A), cos(A));",
	"	gl_Position = vec4((p0 + R * (p * s - c)) / w * 2.0 - 1.0, 0.0, 1.0);",
	"	a = p;",
	"}"
].join("\n")
UFX.gltext._fsource = [
	"varying highp vec2 a;",
	"uniform sampler2D t;",
	"uniform highp float alpha;",
	"void main() {",
	"	gl_FragColor = texture2D(t, a);",
	"	gl_FragColor.a *= alpha;",
	"}",
].join("\n")
UFX.gltext._draw = function (text, pos, opts) {
	if (!opts && !Array.isArray(pos)) {
		opts = pos
		pos = null
	}
	opts = opts || {}
	var gl = this.gl

	var DEFAULT = UFX.gltext.DEFAULT
	var CONSTANTS = UFX.gltext.CONSTANTS
	var fontsize = opts.fontsize || DEFAULT.fontsize
	var fontname = opts.fontname || DEFAULT.fontname
	var color = opts.color || DEFAULT.color
	var gcolor = opts.gcolor || DEFAULT.gcolor
	var owidth = (opts.owidth || DEFAULT.owidth) * DEFAULT.OUTLINE_UNITS
	var ocolor = opts.ocolor || DEFAULT.ocolor
	var shadow = (opts.shadow || DEFAULT.shadow).map(function (a) { return a * DEFAULT.SHADOW_UNITS })
	var scolor = opts.scolor || DEFAULT.scolor
	var linejoin = opts.linejoin || DEFAULT.linejoin
	var linecap = opts.linecap || DEFAULT.linecap
	var miterlimit = "miterlimit" in opts ? opts.miterlimit : DEFAULT.miterlimit
	var hanchor = "hanchor" in opts ? opts.hanchor : DEFAULT.hanchor
	var vanchor = "vanchor" in opts ? opts.vanchor : DEFAULT.vanchor
	var margin = "margin" in opts ? opts.margin : (UFX.gltext.fontmargins[fontname] || DEFAULT.margin)
	var lineheight = "lineheight" in opts ? opts.lineheight : DEFAULT.lineheight
	var width = opts.width
	var widthem = opts.widthem
	if (width && widthem) throw "Width overspecified"
	var cache = "cache" in opts ? opts.cache : true
	if (!CONSTANTS.MEMORY_LIMIT_MB) cache = false

	var x = null, y = null
	if (pos) {
		x = pos[0]
		y = pos[1]
	}
	if ("topleft" in opts) {     opts.left    = opts.topleft[0]     ; opts.top     = opts.topleft[1]     }
	if ("midleft" in opts) {     opts.left    = opts.midleft[0]     ; opts.centery = opts.midleft[1]     }
	if ("bottomleft" in opts) {  opts.left    = opts.bottomleft[0]  ; opts.bottom  = opts.bottomleft[1]  }
	if ("midtop" in opts) {      opts.centerx = opts.midtop[0]      ; opts.top     = opts.midtop[1]      }
	if ("center" in opts) {      opts.centerx = opts.center[0]      ; opts.centery = opts.center[1]      }
	if ("midbottom" in opts) {   opts.centerx = opts.midbottom[0]   ; opts.bottom  = opts.midbottom[1]   }
	if ("topright" in opts) {    opts.right   = opts.topright[0]    ; opts.top     = opts.topright[1]    }
	if ("midright" in opts) {    opts.right   = opts.midright[0]    ; opts.centery = opts.midright[1]    }
	if ("bottomright" in opts) { opts.right   = opts.bottomright[0] ; opts.bottom  = opts.bottomright[1] }

	if ("left" in opts) { x = opts.left ; hanchor = 0 }
	if ("centerx" in opts) { x = opts.centerx ; hanchor = 0.5 }
	if ("right" in opts) { x = opts.right ; hanchor = 1 }
	if ("top" in opts) { y = opts.top ; vanchor = 1 }
	if ("centery" in opts) { y = opts.centery ; vanchor = 0.5 }
	if ("bottom" in opts) { y = opts.bottom ; vanchor = 0 }
	if (x == null || y == null) throw "Position insufficiently specified"

	var align = hanchor
	if ("align" in opts) {
		switch (opts.align) {
			case "left": align = 0 ; break
			case "center": align = 0.5 ; break
			case "right": align = 1 ; break
			default: align = opts.align
		}
	}

	var tbbox = this.gettexture(
		gl, text, fontsize, fontname, align, margin, width, widthem, lineheight,
		color, gcolor, owidth, ocolor, shadow, scolor, linejoin, linecap, miterlimit,
		cache
	)
	tbbox[3] = ++this.texturedata.tick
	var texture = tbbox[0], bbox = tbbox[1]
	var rotation = "rotation" in opts ? opts.rotation : DEFAULT.rotation
	var alpha = Math.min(Math.max("alpha" in opts ? opts.alpha : DEFAULT.alpha, 0), 1)

	gl.activeTexture(gl.TEXTURE0)
	gl.bindTexture(gl.TEXTURE_2D, texture)
	
	this.set({
		w: [gl.canvas.width, gl.canvas.height],
		p0: [x, y],
		c: [bbox[2] + hanchor * bbox[4], bbox[3] + vanchor * bbox[5]],
		t: 0,
		s: [texture.width, texture.height],
		alpha: alpha,
		A: rotation * CONSTANTS.RADIANS_PER_ROTATION_UNIT % (2 * Math.PI),
	})
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
	if (CONSTANTS.AUTO_CLEAN) this.clean()
}
UFX.gltext._drawbox = function (text, box, opts) {
	opts = opts ? Object.create(opts) : {}
	var DEFAULT = UFX.gltext.DEFAULT
	if (!opts.fontname) opts.fontname = DEFAULT.fontname
	if (!("lineheight" in opts)) opts.lineheight = DEFAULT.lineheight
	opts.width = box[2]
	opts.fontsize = UFX.gltext._fitsize(text, opts.fontname, box[2], box[3], opts.lineheight)
	var hanchor = "hanchor" in opts ? opts.hanchor : DEFAULT.hanchor
	var vanchor = "vanchor" in opts ? opts.vanchor : DEFAULT.vanchor
	var x = box[0] + hanchor * box[2], y = box[1] + vanchor * box[3]
	this.draw(text, [x, y], opts)
}
UFX.gltext._fitcache = {}
UFX.gltext._fitsize = function (text, fontname, width, height, lineheight) {
	var key = [text, fontname, width, height, lineheight].toString()
	if (this._fitcache[key]) return this._fitcache[key]
	var canvas = document.createElement("canvas")
	var context = canvas.getContext("2d")
	function fits(fontsize) {
		context.font = fontsize + "px " + fontname
		var texts = UFX.gltext._split(context, text, width)
		var wmax = Math.max.apply(Math, texts.map(function (line) { return context.measureText(line).width }))
		if (wmax > width) return false
		var n = texts.length
		var s = (lineheight - 1) * fontsize, h = fontsize
		return s * (n - 1) + h * n <= height
	}
	var a = 1, b = 2, fontsize
	if (fits(a)) {
		while (fits(b)) {
			a = b
			b <<= 1
		}
		while (b - a > 1) {
			var c = Math.floor((a + b) / 2)
			if (fits(c)) {
				a = c
			} else {
				b = c
			}
		}
	}
	this._fitcache[key] = a
	return a
}

UFX.gltext._split = function (context, text, width) {
	var texts = []
	function twidth(line) {
		return context.measureText(line).width
	}
	function addline(line) {
		if (!width || twidth(line) <= width || !line.includes(" ")) { texts.push(line) ; return }
		var i = line.indexOf(" "), j
		while ((j = line.indexOf(" ", i + 1)) != -1) {
			if (twidth(line.slice(0, j)) > width) break
			i = j
		}
		texts.push(line.slice(0, i))
		addline(line.slice(i + 1))
	}
	text.split("\n").forEach(addline)
	return texts
}
UFX.gltext._clean = function () {
	var CONSTANTS = UFX.gltext.CONSTANTS
	var tdata = this.texturedata, textures = tdata.textures
	if (tdata.sizetotal < CONSTANTS.MEMORY_LIMIT_MB * (1 << 20)) return
	var gl = this.gl
	gl.activeTexture(gl.TEXTURE0)
	if (CONSTANTS.MEMORY_LIMIT_MB <= 0) {
		this.clear()
	} else {
		var keys = Object.keys(textures)
		keys.sort(function (a, b) { return textures[b][3] - textures[a][3] })
		var limit = CONSTANTS.MEMORY_LIMIT_MB * (1 << 20)
		if (tdata.sizetotal < limit) return
		limit *= CONSTANTS.MEMORY_REDUCTION_FACTOR
		while (tdata.sizetotal > limit && keys.length) {
			var key = keys.pop()
			tdata.sizetotal -= textures[key][2]
			gl.bindTexture(gl.TEXTURE_2D, textures[key][0])
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
			tdata.spares.push(textures[key][0])
			delete tdata.textures[key]
		}
	}
}
UFX.gltext._clear = function () {
	var tdata = this.texturedata, textures = tdata.textures, gl = this.gl
	for (var key in textures) {
		gl.bindTexture(gl.TEXTURE_2D, textures[key][0])
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
		tdata.spares.push(textures[key][0])
	}
	tdata.textures = {}
	tdata.sizetotal = 0
}
UFX.gltext.DEFAULT = {
	fontsize: 18,
	fontname: "sans-serif",
	color: "#CCCCCC",
	margin: 0.2,
	lineheight: 1,
	owidth: 1,
	ocolor: null,
	shadow: [1, 1],
	scolor: null,
	linejoin: "round",
	linecap: "butt",
	miterlimit: 10,
	OUTLINE_UNITS: 1 / 24,
	SHADOW_UNITS: 1 / 24,
	hanchor: 0,
	vanchor: 0,
	alpha: 1,
	rotation: 0,
}
UFX.gltext.CONSTANTS = {
	RADIANS_PER_ROTATION_UNIT: Math.PI / 180,
	AUTO_CLEAN: true,
	MEMORY_LIMIT_MB: 64,
	MEMORY_REDUCTION_FACTOR: 0.5,
}
UFX.gltext.fontmargins = {
}

// Returns a 2-tuple of [texture, bounding box], where bounding box has 6 elements: texture width,
// texture height, x, y, w, h. The x, y, w, h are the effective subrectangle of where the text is
// drawn within the image, for the purpose of positioning.
UFX.gltext._gettexture = function (gl,
	text, fontsize, fontname, align, margin, width, widthem, lineheight,
	color, gcolor, owidth, ocolor, shadow, scolor, linejoin, linecap, miterlimit,
	cache) {
	var key = cache ? [
		text, fontsize, fontname, align, margin, width, widthem, lineheight,
		color, gcolor, owidth, ocolor, shadow, scolor, linejoin, linecap, miterlimit,
	].toString() : null
	if (key && this.texturedata.textures[key]) return this.texturedata.textures[key]
	var DEBUG = false

	var d = Math.ceil(margin * fontsize)
	var s = Math.ceil((lineheight - 1) * fontsize)  // line spacing
	var h = Math.ceil(fontsize)  // line height
	var lw = ocolor ? Math.ceil(fontsize * owidth) : 0
	var sx = scolor ? fontsize * shadow[0] : 0
	var sy = scolor ? fontsize * shadow[1] : 0
	var sb = scolor ? fontsize * (shadow[2] || 0) : 0

	var mtop = d, mbottom = d, mleft = 0, mright = 0
	mtop = Math.max(lw, mtop, -sy) + sb
	mbottom = Math.max(lw, mbottom, sy) + sb
	mleft = Math.max(lw, mleft, -sx) + sb
	mright = Math.max(lw, mright, sx) + sb

	var canvas = document.createElement("canvas")
	var context = canvas.getContext("2d")
	var font = fontsize + "px " + fontname, texts
	if (widthem) {
		var referencefontsize = 100
		context.font = referencefontsize + "px "+ fontname
		texts = UFX.gltext._split(context, text, widthem * referencefontsize)
		context.font = font
	} else {
		context.font = font
		texts = UFX.gltext._split(context, text, width)
	}
	var n = texts.length
	var twidths = texts.map(function (line) { return context.measureText(line).width })
	var w0 = Math.max.apply(Math, twidths)
	var x0s = twidths.map(function (w) { return mleft + Math.round(align * (w0 - w)) })
	var y0s = twidths.map(function (w, j) { return mbottom + s * j + h * (j + 1) })
	canvas.width = mleft + mright + w0
	canvas.height = mtop + mbottom + h * n + s * (n - 1)
	if (DEBUG) {
		context.fillStyle = "rgba(255,255,255,0.05)"
		context.fillRect(0, 0, canvas.width, canvas.height)
		for (var j = 0 ; j < n ; ++j) {
			context.fillStyle = "rgba(255,255,255,0.1)"
			context.fillRect(x0s[j], y0s[j] - h - d, twidths[j], h + 2 * d)
			context.fillStyle = "rgba(255,255,255,0.15)"
			context.fillRect(x0s[j], y0s[j] - h, twidths[j], h)
		}
	}

	// need to re-establish after changing canvas size
	context.font = font
	context.textBaseline = "alphabetic"
	context.textAlign = "left"
	context.lineJoin = linejoin
	context.lineCap = linecap
	context.miterLimit = miterlimit
	if (gcolor) {
		var grad = context.createLinearGradient(0, 0, 0, -fontsize)
		grad.addColorStop(0, gcolor)
		grad.addColorStop(0.6, color)
		context.fillStyle = grad
	} else if (color) {
		context.fillStyle = color
	}
	if (ocolor) {
		context.strokeStyle = ocolor
		context.lineWidth = lw
	}
	texts.forEach(function (tline, j) {
		context.save()
		context.translate(x0s[j], y0s[j])
		if (DEBUG) {
			context.save()
			context.fillStyle = "white"
			context.fillRect(0, 0, 1, 1)
			context.restore()
		}
		if (ocolor) context.strokeText(tline, 0, 0)
		if (scolor) {
			context.shadowOffsetX = sx
			context.shadowOffsetY = sy
			context.shadowColor = scolor
			context.shadowBlur = sb
		}
		if (gcolor || color) context.fillText(tline, 0, 0)
		context.restore()
	})
	var texture
	if (this.texturedata.spares.length) {
		texture = this.texturedata.spares.pop()
		texture.width = canvas.width
		texture.height = canvas.height
		gl.activeTexture(gl.TEXTURE0)
		gl.bindTexture(gl.TEXTURE_2D, texture)
		var flip0 = gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL)
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas)
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flip0)
	} else {
		texture = gl.buildTexture({ source: canvas, npot: true, flip: true, filter: gl.LINEAR })
	}
	var bbox = [canvas.width, canvas.height, mleft, mbottom, w0, h * n + s * (n - 1)]
	var size = 4 * canvas.width * canvas.height
	this.texturedata.sizetotal += size
	var ret = [texture, bbox, size, null]
	if (key) this.texturedata.textures[key] = ret
	return ret
}
// UFX.gltracer: return an object that allows for rendering 2d context drawing commands onto a
// WebGL context.

"use strict"

UFX.gltracer = function(gl, range, drawfunc, opts) {
	UFX.gltracer._init(gl)
	opts = opts || {}

	var obj = {
		_gl: gl,
		_textures: {},
		drawfunc: drawfunc,
		draw: UFX.gltracer._draw,
		clear: UFX.gltracer._clear,
		autosetup: true,
		toffset: 0,
		pot: opts.pot,
		debug: opts.debug,
	}

	if (typeof range == "number") {
		obj.x0 = obj.y0 = -range
		obj.x1 = obj.y1 = range
	} else if (range instanceof Array && range.length == 2) {
		obj.x0 = obj.y0 = range[0]
		obj.x1 = obj.y1 = range[1]
	} else if (range instanceof Array && range.length == 4) {
		obj.x0 = range[0]
		obj.y0 = range[1]
		obj.x1 = range[2]
		obj.y1 = range[3]
	} else {
		throw "Incorrectly formatted range: " + range
	}
	obj.w = obj.x1 - obj.x0
	obj.h = obj.y1 - obj.y0

	return obj
}

UFX.gltracer._init = function (gl) {
	if (this._inited) return
	this._inited = true
	this.pbuffer = gl.makeArrayBuffer([0, 0, 1, 0, 0, 1, 1, 1])
	this.prog = gl.addProgram("gltracer", [
		"attribute vec2 p;",
		"uniform vec2 w, s, p0, d, f;",
		"varying highp vec2 a;",
		"uniform float A;",
		"void main() {",
		"	mat2 R = mat2(cos(A), sin(A), -sin(A), cos(A));",
		"	gl_Position = vec4((p0 + R * ((p * f - d) * s)) / w * 2.0 - 1.0, 0.0, 1.0);",
		"	a = (p - 0.5) * f + 0.5;",
		"}",
	].join("\n"), [
		"varying highp vec2 a;",
		"uniform sampler2D t;",
		"uniform highp float alpha;",
		"void main() {",
		"	gl_FragColor = texture2D(t, a);",
		"	gl_FragColor.a *= alpha;",
		"}",
	].join("\n"))
}

UFX.gltracer._draw = function (pos, scale, opts) {
	scale = scale || 1
	opts = opts || {}
	var rotation = (opts.rotation || 0) * Math.PI / 180
	var alpha = "alpha" in opts ? opts.alpha : 1

	var gl = this._gl
	if (this.autosetup) {
		UFX.gltracer.prog.use()
		gl.enable(gl.BLEND)
		gl.disable(gl.DEPTH_TEST)
		gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, 0, 1)
		UFX.gltracer.pbuffer.bind()
		UFX.gltracer.prog.assignAttribOffsets({ p: 0 })
	}

	var twidth, theight
	if (this.pot) {
		twidth = 16
		while (twidth < this.w * scale || twidth < this.h * scale) twidth *= 2
		theight = twidth
	} else {
		twidth = this.w * scale
		theight = this.h * scale
	}

	var b = Math.min(twidth / this.w, theight / this.h)

	var key = [twidth, theight, b], texture
	if (this._textures[key]) {
		texture = this._textures[key]
	} else {
		var canvas = document.createElement("canvas")
		var context = canvas.getContext("2d")
		canvas.width = twidth
		canvas.height = theight
		context.save()
		context.translate(twidth / 2, theight / 2)
		context.scale(b, b)
		context.translate(-(this.x0 + this.x1) / 2, -(this.y0 + this.y1) / 2)
		this.drawfunc(context, b)
		if (this.debug) {
			UFX.draw(context,
				"lw 1 ss magenta",
				"b m", this.x0, 0, "l", this.x1, 0, "s",
				"b m", 0, this.y0, "l", 0, this.y1, "s",
				"lw 1 sr", this.x0, this.y0, this.x1 - this.x0, this.y1 - this.y0)
		}
		context.restore()
		if (this.debug) UFX.draw(context, "[ fs rgba(0,0,255,0.25) f0 ]")

		texture = gl.buildTexture({
			source: canvas,
			npot: !this.pot,
			flip: true,
			min_filter: this.pot ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR,
			mag_filter: gl.LINEAR,
		})
		this._textures[key] = texture
	}

	var fx = Math.ceil(this.w * b - 0.001) / twidth
	var fy = Math.ceil(this.h * b - 0.001) / theight
	var dx = (-this.x0 * b) / twidth, dy = (this.y1 * b) / theight

	gl.activeTexture(gl.TEXTURE0 + this.toffset)
	gl.bindTexture(gl.TEXTURE_2D, texture)
	UFX.gltracer.prog.set({
		w: [gl.canvas.width, gl.canvas.height],
		p0: pos,
		d: [dx, dy],
		t: this.toffset,
		s: [twidth / b * scale, theight / b * scale],
		alpha: alpha,
		A: rotation,
		f: [fx, fy],
	})
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
}

UFX.gltracer._clear = function () {
	var gl = this._gl
	for (var key in this._textures) {
		gl.deleteTexture(this._textures[key])
	}
	this._textures = {}
}

// UFX.key module: enqueue keyboard events

// Generally for games you want to know:
//   - when a key is pressed
//   - when a key is released
//   - how long the key was held down for
//   - what keys are currently being pressed
// And you want to prevent key events (eg arrow keys) from being interpreted by the browser

// For games with frame-based updates, I don't generally like callback-based key handling, so this
//   module will enqueue all the key events so they can be handled at the appropriate place in the
//   main game loop.

// The simplest way to use this module is to start it with:
//   UFX.key.init()
// which will capture all key events. Then each frame, call:
//   var kstate = UFX.key.state()

// For options and details, please see the documentation here:
// https://code.google.com/p/unifac/wiki/UFXDocumentation#UFX.key_:_handle_keyboard_input

"use strict"
var UFX = UFX || {}
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
    // TODO: this seems like a bit of a hack but I can't really figure this blur thing out....
    element.addEventListener("blur", UFX.key._onblur, true)
    window.onblur = UFX.key._onblur
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


// UFX.maximize: expand a canvas to take up the whole window or screen

// Dev note: for handlers and internal methods (with the leading underscore),
// assume that this === UFX.maximize, but don't assume this for public methods.
// Handlers are bound to UFX.maximize.

"use strict"
var UFX = UFX || {}

UFX.maximize = function (element, options) {
	UFX.maximize._addlisteners()
	if (element !== UFX.maximize.element) {
		UFX.maximize._takedown()
		UFX.maximize._setup(element)
	}
	UFX.maximize.setoptions(options || {})
}
UFX.maximize.stop = function () {
	if (UFX.maximize.isfullscreen()) document.exitFullscreen()
	UFX.maximize._unsetstyle()
	UFX.maximize._takedown()
	UFX.maximize._removelisteners()
}

UFX.maximize._options0 = {
	stretch: true,
	resize: true,
	aspects: [0],
	exact: false,
	free: false,
	preventscroll: true,
	fullscreen: false,
	mustfullscreen: false,
	fillcolor: "black",
	applypixelratio: true,
}

// Associate UFX.maximize.element with UFX.maximize. Save the element style values and other values
// we'll be overwriting so that they can be restored later if UFX.maximize.stop is called.
UFX.maximize._setup = function (element) {
	this.element = element
	var options = this.options, style = element.style
	this.size0 = [element.width, element.height]
	var style0 = this._style0 = {}
	;"position left top bottom right margin width height borderLeft borderRight borderTop borderBottom".
		split(" ").forEach(function (sname) {
		style0[sname] = style[sname]
	})
	this._overflow0 = document.body.style.overflow
}
// Remove the association between UFX.maximize.element and UFX.maximize.
UFX.maximize._takedown = function () {
	if (!this.element) return
	this.element.width = this.size0[0]
	this.element.height = this.size0[1]
	for (var sname in this._style0) {
		this.element.style[sname] = this._style0[sname]
	}
	document.body.style.overflow = this._overflow0
	delete this.element
}

UFX.maximize._addlisteners = function () {
	if (this._listeners) return
	window.addEventListener("resize", UFX.maximize.onresize)
	window.addEventListener("fullscreenchange", UFX.maximize.onfullscreenchange)
	window.addEventListener("fullscreenerror", UFX.maximize.onfullscreenerror)
	document.body.addEventListener("touchstart", UFX.maximize.ontouchstart, { passive: false })
	this._listeners = true
}
UFX.maximize._removelisteners = function () {
	if (!this._listeners) return
	window.removeEventListener("resize", UFX.maximize.onresize)
	window.removeEventListener("fullscreenchange", UFX.maximize.onfullscreenchange)
	window.removeEventListener("fullscreenerror", UFX.maximize.onfullscreenerror)
	document.body.removeEventListener("touchstart", UFX.maximize.ontouchstart)
	this._listeners = false
}

UFX.maximize.getfullscreenelement = function () {
	return document.fullscreenElement
}
UFX.maximize.isfullscreen = function () {
	return UFX.maximize.element === UFX.maximize.getfullscreenelement()
}

UFX.maximize.setoptions = function (options) {
	for (var oname in options) {
		switch (oname) {
			case "aspects":
				UFX.maximize._checkaspects(options.aspects)
			case "stretch": case "resize": case "exact": case "free":
			case "preventscroll": case "fullscreen": case "mustfullscreen": case "fillcolor":
			case "applypixelratio":
				UFX.maximize.options[oname] = options[oname]
				break
			case "aspect":
				UFX.maximize._checkaspects([options.aspect])
				UFX.maximize.options.aspects = [options.aspect]
				break
			default:
				throw "Unrecgonized option to UFX.maximize: " + oname
		}
	}
	if (UFX.maximize.element) UFX.maximize._maximize()
}
UFX.maximize.resetoptions = function (options) {
	UFX.maximize.options = JSON.parse(JSON.stringify(UFX.maximize._options0))
	UFX.maximize.setoptions(options || {})
}
UFX.maximize.resetoptions()


UFX.maximize._checkaspects = function (aspects) {
	if (!(aspects instanceof Array)) throw "UFX.maximize aspect list must be an Array"
	if (aspects.length < 1) throw "UFX.maximize aspect list must not be empty"
	aspects.forEach(function (aspect) {
		if (typeof aspect == "number") return
		if (aspect instanceof Array && aspect.length == 2 &&
			typeof(aspect[0]) == "number" && typeof(aspect[1]) == "number") return
		throw "Invalid aspect " + aspect + " must be Number or [Number, Number]"
	})
}


// Setup and setoptions should already be called.
UFX.maximize._maximize = function () {
	this._unsetstyle()
	if (this.options.fullscreen) {
		this._fullscreen()
	} else {
		if (this.isfullscreen()) document.exitFullscreen()
		this._fillscreen()
	}
}
UFX.maximize._fullscreen = function () {
	if (this.isfullscreen()) {
		this.onresize()
	} else if (this.element.requestFullscreen) {
		this.element.requestFullscreen()
	} else {
		this.onfullscreenerror()
	}
}
UFX.maximize.onfullscreenchange = function () {
	if (this.isfullscreen()) {
		this.onresize()
	} else {
		this.onfullscreenerror()
	}
}.bind(UFX.maximize)
UFX.maximize.onfullscreenerror = function () {
	if (this.options.mustfullscreen) {
		this.stop()
	} else {
		this._fillscreen()
	}
}.bind(UFX.maximize)
UFX.maximize._fillscreen = function () {
	this._setstyle()
	this.onresize()
}
// Set a few style values necessary for filling the window.
UFX.maximize._setstyle = function () {
	this.element.style.position = "absolute"
	this.element.style.left = "0px"
	this.element.style.top = "1px"
	document.body.style.overflow = "hidden"
}
UFX.maximize._unsetstyle = function () {
	this.element.style.position = this._style0.position
	this.element.style.left = this._style0.left
	this.element.style.top = this._style0.top
	document.body.style.overflow = this._overflow0
}


UFX.maximize.size = {}
UFX.maximize.scale = {}

// Resize handler - called whenever the window size changes.
// Chooses the dimensions of UFX.maximize.element and updates the border to fill the window.
UFX.maximize.onresize = function () {
	var options = this.options, element = this.element
	if (!element) return
	if (options.mustfullscreen && !this.isfullscreen()) return
	var wx = window.innerWidth, wy = window.innerHeight

	// Greatest common divisor.
	function gcd(a, b) {
		return b == 0 ? a : gcd(b, a % b)
	}
	// Given [a,b], return [x,y] such that x/y is a/b in simplest form.
	function reduced(aspect) {
		var a = aspect[0], b = aspect[1], g = gcd(a, b)
		return [a / g, b / g]
	}

	// Given an aspect ratio, determine the maximum element size that corresponds to it and fits
	// inside the window. (Returns null if the window is too small and exact is requested.)
	function getsize(wx, wy, aspect, exact) {
		var ispair = aspect instanceof Array
		if (ispair && !exact) {
			aspect = aspect[0] / aspect[1]
			ispair = false
		}
		if (ispair) {
			var a = reduced(aspect), x = a[0], y = a[1]
			var n = Math.floor(Math.min(wx / x, wy / y))
			return n ? [x * n, y * n] : null
		} else {
			if (aspect == -1) return [wx, wy]
			return wy * aspect > wx
				? [wx, Math.round(wx / aspect)]
				: [Math.round(wy * aspect), wy]
		}
	}
	// TODO: for options.free allow limits on the range of acceptable aspect ratios.
	var aspects = options.free ? [-1] : options.aspects
	if (!aspects.length) throw "No aspect ratio options specified. Must have at least 1."
	// Choose the aspect ratio that results in the largest element size (in terms of total area)
	var Dsize = null  // display size, ie, how big to style the element
	var area = 0, aspect = null
	for (var j = 0 ; j < aspects.length ; ++j) {
		// Treat the special value 0 as the original canvas size.
		var trialaspect = aspects[j] || this.size0
		var trialsize = getsize(wx, wy, trialaspect, options.exact)
		if (!trialsize) continue
		var trialarea = trialsize[0] * trialsize[1]
		if (trialarea > area) {
			Dsize = trialsize
			area = trialarea
			aspect = trialaspect
		}
	}
	// In the event that no aspect ratio is chosen (because the window was too small for all of
	// them), fall back to the first aspect ratio in the list, and let it be larger than the window.
	if (Dsize === null) {
		aspect = aspects[0] || this.size0
		Dsize = reduced(aspect)
	}

	var Lsize = Dsize.slice()  // element logical dimensions, i.e. height/width values
	if (options.applypixelratio) {
		Lsize[0] = Math.floor(Lsize[0] * window.devicePixelRatio)
		Lsize[1] = Math.floor(Lsize[1] * window.devicePixelRatio)
	}
	if (!options.resize) {
		Lsize = this.size0
		if (!options.stretch) Dsize = this.size0
	}
	element.width = Lsize[0]
	element.height = Lsize[1]
	element.style.width = Dsize[0] + "px"
	element.style.height = Dsize[1] + "px"
	
	UFX.maximize.size = {
		D: Dsize,
		L: Lsize,
		A: aspect,
	}
	UFX.maximize.scale = {
		DL: [Dsize[0] / Lsize[0], Dsize[1] / Lsize[1]],
		LD: [Lsize[0] / Dsize[0], Lsize[1] / Dsize[1]],
		AL: aspect instanceof Array ? [aspect[0] / Lsize[0], aspect[1] / Lsize[1]] : null,
		LA: aspect instanceof Array ? [Lsize[0] / aspect[0], Lsize[1] / aspect[1]] : null,
		AD: aspect instanceof Array ? [aspect[0] / Dsize[0], aspect[1] / Dsize[1]] : null,
		DA: aspect instanceof Array ? [Dsize[0] / aspect[0], Dsize[1] / aspect[1]] : null,
	}

	var bx = wx - Dsize[0], by = wy - Dsize[1]
	var left = Math.ceil(bx / 2), right = bx - left
	var top = Math.ceil(by / 2), bottom = by - top
	element.style.borderLeft = left + "px " + options.fillcolor + " solid"
	element.style.borderRight = right + "px " + options.fillcolor + " solid"
	element.style.borderTop = top + "px " + options.fillcolor + " solid"
	element.style.borderBottom = bottom + "px " + options.fillcolor + " solid"
	// TODO: document why this is here. Something on mobile I think?
	setTimeout(function () { window.scrollTo(0, 1) }, 1)
	if (this.onadjust) {
		this.onadjust(element, element.width, element.height, aspect)
	}
}.bind(UFX.maximize)

UFX.maximize.ontouchstart = function (event) {
	if (this.element && this.options.preventscroll) event.preventDefault()
}.bind(UFX.maximize)



// Deprecated usage
// TODO: find everyone who's calling these and update them.
UFX.maximize.fill = function (element, mode) {
	UFX.maximize(element, {
		none: { resize: false, stretch: false },
		fixed: { resize: false },
		aspect: {},
		total: { free: true },
	}[mode])
}
UFX.maximize.full = function (element, mode) {
	UFX.maximize(element, {
		none: { fullscreen: true, resize: false, stretch: false },
		fixed: { fullscreen: true, resize: false },
		aspect: { fullscreen: true },
		total: { fullscreen: true, free: true },
	}[mode])
}

// UFX.mouse module: enqueue mouse events

// This is an alternative system to handling mouse events in event handlers.

// The simplest way to use it is to begin by calling:
//   UFX.mouse.init(canvas)
// and then each frame call:
//   var mstate = UFX.mouse.state()

// By default, only the left mouse button is captured.

// Does not yet handle horizontal scrolling

// For more details and options, please see the documentation at:
// https://code.google.com/p/unifac/wiki/UFXDocumentation#UFX.mouse_:_handle_mouse_events

"use strict"
var UFX = UFX || {}
UFX.mouse = {}

UFX.mouse.active = true
UFX.mouse.qdown = true
UFX.mouse.qup = true
UFX.mouse.qclick = false
UFX.mouse.qblur = false
UFX.mouse.qwheel = false
// Should we watch for left, middle, right, and wheel events?
UFX.mouse.capture = { left: true, middle: false, right: false, wheel: false }

// While the mouse is down, this is updated with info on the current drag event
UFX.mouse.watchdrag = true
UFX.mouse.drag = {}

UFX.mouse.within = false

UFX.mouse.events = function () {
    var r = UFX.mouse._events
    UFX.mouse._clearevents()
    return r
}

UFX.mouse.state = function () {
    var r = {}
    r.pos = UFX.mouse.pos
    r.within = UFX.mouse.within
    if (r.pos && UFX.mouse._opos) {
        r.dpos = [r.pos[0] - UFX.mouse._opos[0], r.pos[1] - UFX.mouse._opos[1]]
    } else {
        r.dpos = [0, 0]
    }
    UFX.mouse._opos = r.pos
    if (UFX.mouse.capture.left) r.left = {}
    if (UFX.mouse.capture.middle) r.middle = {}
    if (UFX.mouse.capture.right) r.right = {}
    for (var b in UFX.mouse.buttonsdown) {
        if (UFX.mouse.buttonsdown[b] && r[b]) r[b].isdown = true
    }
    UFX.mouse._events.forEach(function (event) {
        r[UFX.mouse._buttonmap[event.button]][event.type] = event.pos
    })
    UFX.mouse._clearevents()
    if (UFX.mouse.capture.wheel) r.wheeldy = UFX.mouse.getwheeldy()
    if (UFX.mouse.watchdrag) {
    	for (var bname in UFX.mouse.drag) {
    	    if (!r[bname] || !r[bname].isdown) continue
    	    var drag = UFX.mouse.drag[bname]
        	r[bname].dx = r.pos[0] - drag.pos0[0]
        	r[bname].dy = r.pos[1] - drag.pos0[1]
        	r[bname].dt = Date.now() - drag.t0
//            drag.opos = drag.pos
        }
    }
    return r
}

UFX.mouse._clearevents = function () {
    UFX.mouse._events = []
}

UFX.mouse.getwheeldy = function () {
    var dy = UFX.mouse.wheeldy
    UFX.mouse.wheeldy = 0
    return dy
}

// This is updated every mouse event with the last known mouse position (as a length-2 array)
UFX.mouse.pos = null
UFX.mouse._opos = null
// This is updated every event with the latest known info on which mouse buttons are currently down
UFX.mouse.buttonsdown = {}
//UFX.mouse.wheeldx = 0
UFX.mouse.wheeldy = 0

UFX.mouse.init = function (element, backdrop) {
    UFX.mouse._captureevents(element, backdrop)
}


UFX.mouse._events = []

UFX.mouse._captureevents = function (element, backdrop) {
    element = element || document
    backdrop = backdrop || document
    if (typeof element == "string") element = document.getElementById(element)
    if (typeof backdrop == "string") backdrop = document.getElementById(backdrop)

    backdrop.addEventListener("blur", UFX.mouse._onblur, true)
    // TODO: add these instead of replacing the event handlers
    element.onmouseout = UFX.mouse._onmouseout
    element.onmousedown = UFX.mouse._onmousedown
    backdrop.onmouseup = UFX.mouse._onmouseup
    element.onclick = UFX.mouse._onclick
    element.oncontextmenu = UFX.mouse._oncontextmenu
    element.onmousewheel = UFX.mouse._onmousewheel  // non-Firefox
    element.addEventListener("DOMMouseScroll", UFX.mouse._onmousewheel)  // Firefox
    
    backdrop.onmousemove = UFX.mouse._onmousemove

    UFX.mouse._element = element
    UFX.mouse._backdrop = backdrop
    
}

// http://stackoverflow.com/questions/6773481/how-to-get-the-mouseevent-coordinates-for-an-element-that-has-css3-transform
UFX.mouse._elemoffset = function (elem) {
    var rect = elem.getBoundingClientRect()
    var x = rect.left + elem.clientLeft - elem.scrollLeft
    var y = rect.top + elem.clientTop - elem.scrollTop
    return [x, y]
}
UFX.mouse._geteventpos = function (event, elem) {
    elem = elem || event.target
    var off = UFX.mouse._elemoffset(elem)
    if (elem.style.width || elem.style.height) {
        var s = elem.style
        var xf = s.width ? elem.width / parseFloat(s.width) : elem.height / parseFloat(s.height)
        var yf = s.height ? elem.height / parseFloat(s.height) : elem.width / parseFloat(s.width)
        return [xf * (event.clientX - off[0]), yf * (event.clientY - off[1])]
    }
    return [event.clientX - off[0], event.clientY - off[1]]
}

// TODO: make sure the drag event is destroyed when this happens
UFX.mouse._onblur = function (event) {
    if (!UFX.mouse.active) return true
    
    return true
}
UFX.mouse._onmouseout = function (event) {
}
UFX.mouse._oncontextmenu = function (event) {
    if (!UFX.mouse.active || !UFX.mouse.capture.right) return true
    event.preventDefault()
    return false
}
UFX.mouse._buttonmap = ["left", "middle", "right"]
UFX.mouse._onclick = function (event) {
    if (!UFX.mouse.active || !UFX.mouse.capture[UFX.mouse._buttonmap[event.button]]) return true
    if (UFX.mouse.qclick) {
        var mevent = {
            type: "click",
            pos: UFX.mouse._geteventpos(event, UFX.mouse._element),
            button: event.button,
            time: Date.now(),
            baseevent: event,
        }
        UFX.mouse._events.push(mevent)
    }
    event.preventDefault()
    return false
}
UFX.mouse._onmousedown = function (event) {
    if (!UFX.mouse.active) return true
    var bname = UFX.mouse._buttonmap[event.button]
    UFX.mouse.buttonsdown[bname] = true
    if (!UFX.mouse.capture[bname]) return true
    var pos = UFX.mouse._geteventpos(event)
    if (UFX.mouse.watchdrag) {
        UFX.mouse.drag[bname] = {
            downevent: event,
            pos0: pos,
//            opos: pos,
            pos: pos,
            dx: 0,
            dy: 0,
            t0: Date.now(),
            dt: 0,
        }
    }
    if (UFX.mouse.qdown) {
        var mevent = {
            type: "down",
            pos: UFX.mouse._geteventpos(event, UFX.mouse._element),
            button: event.button,
            time: Date.now(),
            baseevent: event,
        }
        UFX.mouse._events.push(mevent)
    }
    event.preventDefault()
    return false
}
UFX.mouse._onmouseup = function (event) {
    if (!UFX.mouse.active) return true
    var bname = UFX.mouse._buttonmap[event.button]
    UFX.mouse.buttonsdown[bname] = false
    if (!UFX.mouse.capture[bname]) return true
//    if (!UFX.mouse.drag[bname]) return true
    // TODO: verify that this handler doesn't interfere with DOM elements in other parts of the document
    var ret = true
    if (UFX.mouse.qup) {
        var mevent = {
            type: "up",
            pos: UFX.mouse._geteventpos(event, UFX.mouse._element),
            button: event.button,
            time: Date.now(),
            baseevent: event,
        }
        if (UFX.mouse.drag[bname]) {
        	ret = false
            mevent.t0 = UFX.mouse.drag[bname].t0
            mevent.dt = Date.now() - mevent.t0
            mevent.pos0 = UFX.mouse.drag[bname].pos0
            mevent.dx = mevent.pos[0] - mevent.pos0[0]
            mevent.dy = mevent.pos[1] - mevent.pos0[1]
        }
        UFX.mouse._events.push(mevent)
    }
    delete UFX.mouse.drag[bname]
    if (!ret) event.preventDefault()
    return ret
}


UFX.mouse._onmousemove = function (event) {
    if (!UFX.mouse.active) return true
    var pos = UFX.mouse._geteventpos(event, UFX.mouse._element)
    UFX.mouse.pos = pos
    UFX.mouse.within = pos[0] >= 0 && pos[0] < UFX.mouse._element.width &&
    	pos[1] >= 0 && pos[1] < UFX.mouse._element.height
    var ret = true
    for (var bname in UFX.mouse.drag) {
        var d = UFX.mouse.drag[bname]
        d.pos = pos
        d.dx = pos[0] - d.pos0[0]
        d.dy = pos[1] - d.pos0[1]
        d.dt = Date.now() - d.t0
        ret = false
    }
    return ret
}

UFX.mouse._onmousewheel = function (event) {
    if (!UFX.mouse.active || !UFX.mouse.capture.wheel) return true
    var dy = "wheelDelta" in event ? event.wheelDelta / 40. : -event.detail
    UFX.mouse.wheeldy += dy
    if (UFX.mouse.qwheel) {
        var mevent = {
            type: "wheel",
            pos: UFX.mouse._geteventpos(event, UFX.mouse._element),
            dy: dy,
//            dx: event.wheelDeltaX,
            time: Date.now(),
            baseevent: event,
        }
        UFX.mouse._events.push(mevent)
    }
    event.preventDefault()
    return false
}


// UFX.noise module: Perlin noise generation

// Actually this uses a slight variation of Perlin noise that I prefer, where the gradient vectors
// follow an n-dimensional Gaussian distribution rather than being uniformly-distributed unit
// vectors.

// TODO: add documentation to the unifac wiki
// For now, please see examples in UFX/test/noise.html


"use strict"
var UFX = UFX || {}

// The basic function that returns noise at a given position in n-space.
// This a slow, general reference implementation. Most calls should use a faster function
//   that computes many values at once.
UFX.noise = function (p, wrapsize) {
    var n = p.length
    var q = new Array(n)  // coordinates of lattice points on all sides of the given point
    var a = new Array(n)  // distance to lower lattice point
    for (var j = 0 ; j < n ; ++j) {
        var w = wrapsize ? wrapsize[j] : 256
        var i = Math.floor(p[j]) % w
        if (i < 0) i += w
        q[j] = [i, (i+1) % w]
        a[j] = p[j] - Math.floor(p[j])
    }
    var r = 0  // return value
    // Loop through the 2^n lattice points bordering this point
    for (var k = 0, kmax = 1 << n ; k < kmax ; ++k) {
        var v = new Array(n)
        for (var j = 0 ; j < n ; ++j) {
            v[j] = q[j][(k >> j) & 1]
        }
        var dprod = 0, cprod = 1
        for (var j = 0 ; j < n ; ++j) {
            var g = UFX.noise._gvalue(v, j)  // the j-th component of the gradient
            var t = ((k >> j) & 1) ? 1 - a[j] : -a[j]  // distance along the j-axis to lattice point
            dprod += g * t  // dot product sum
            cprod *= 1 - t * t * (3 - 2 * Math.abs(t))  // cross-fade factor
        }
        r += dprod * cprod
    }
    return r / 1000. / Math.sqrt(n)
}

// A tileable 2d noise map
UFX.noise.wrap2d = function (s, ngrid, soff, noff) {
    var sx = s[0], sy = s[1], size = sx * sy
    var val = new Array(size)
    var gx0 = new Array(sx), gx1 = new Array(sx)
    var ax = new Array(sx), bx = new Array(sx), cax = new Array(sx), cbx = new Array(sx)
    ngrid = ngrid || [8, 8]
    var nx = ngrid[0], ny = ngrid[1], n = nx * ny
    noff = noff || [0, 0]
    var gradx = new Array(n), grady = new Array(n)
    for (var gy = 0, gj = 0 ; gy < ny ; ++gy) {
        for (var gx = 0 ; gx < nx ; ++gx, ++gj) {
            gradx[gj] = UFX.noise._gvalue([gx + noff[0], gy + noff[1]], 0)
            grady[gj] = UFX.noise._gvalue([gx + noff[0], gy + noff[1]], 1)
        }
    }
    soff = soff || [0, 0]
    for (var px = 0 ; px < sx ; ++px) {
        var x = (px + 0.5) * nx / sx + soff[0]
        gx0[px] = Math.floor(x) % nx
        if (gx0[px] < 0) gx0[px] += nx
        gx1[px] = (gx0[px] + 1) % nx
        var axj = x - Math.floor(x), bxj = 1 - axj
        ax[px] = axj
        bx[px] = bxj
        cax[px] = axj*axj*(3-2*axj)
        cbx[px] = 1 - cax[px]
    }
    for (var py = 0, pj = 0 ; py < sy ; ++py) {
        var y = (py + 0.5) * ny / sy + soff[1]
        var gy0j = Math.floor(y) % ny
        if (gy0j < 0) gy0j += ny
        var gy1j = (gy0j + 1) % ny
        var ayj = y - Math.floor(y), byj = 1 - ayj
        var cayj = ayj*ayj*(3-2*ayj), cbyj = 1 - cayj
        for (var px = 0 ; px < sx ; ++px, ++pj) {
            var gx0j = gx0[px], gx1j = gx1[px]
            var axj = ax[px], bxj = bx[px], caxj = cax[px], cbxj = cbx[px]
            var j00 = gx0j + gy0j * nx, j01 = gx0j + gy1j * nx
            var j10 = gx1j + gy0j * nx, j11 = gx1j + gy1j * nx
            val[pj] = ((-axj*gradx[j00] - ayj*grady[j00]) * cbyj +
                       (-axj*gradx[j01] + byj*grady[j01]) * cayj) * cbxj +
                      (( bxj*gradx[j10] - ayj*grady[j10]) * cbyj +
                       ( bxj*gradx[j11] + byj*grady[j11]) * cayj) * caxj
            val[pj] /= 1414.213
        }
    }
    return val
}

// A tileable 2d noise map that's a slice of a 3d map (so it can morph over time)
UFX.noise.wrapslice = function (s, zoff, ngrid, soff, noff) {
    var sx = s[0], sy = s[1], size = sx * sy
    var val = new Array(size)
    var gx0 = new Array(sx), gx1 = new Array(sx)
    var ax = new Array(sx), bx = new Array(sx), cax = new Array(sx), cbx = new Array(sx)
    ngrid = ngrid || [8, 8, 256]
    if (ngrid.length == 2) ngrid = [ngrid[0], ngrid[1], 256]
    var nx = ngrid[0], ny = ngrid[1], nz = ngrid[2], n = nx * ny
    noff = noff || [0, 0]
    var gz0 = Math.floor(zoff) % nz
    if (gz0 < 0) gz0 += nz
    var gz1 = (gz0 + 1) % nz
    var az = zoff - Math.floor(zoff), bz = 1 - az
    var caz = az*az*(3-2*az), cbz = 1 - caz
    var gradx0 = new Array(n), grady0 = new Array(n), gradz0 = new Array(n)
    var gradx1 = new Array(n), grady1 = new Array(n), gradz1 = new Array(n)
    for (var gy = 0, gj = 0 ; gy < ny ; ++gy) {
        for (var gx = 0 ; gx < nx ; ++gx, ++gj) {
            gradx0[gj] = UFX.noise._gvalue([gx + noff[0], gy + noff[1], gz0], 0)
            grady0[gj] = UFX.noise._gvalue([gx + noff[0], gy + noff[1], gz0], 1)
            gradz0[gj] = UFX.noise._gvalue([gx + noff[0], gy + noff[1], gz0], 2)
            gradx1[gj] = UFX.noise._gvalue([gx + noff[0], gy + noff[1], gz1], 0)
            grady1[gj] = UFX.noise._gvalue([gx + noff[0], gy + noff[1], gz1], 1)
            gradz1[gj] = UFX.noise._gvalue([gx + noff[0], gy + noff[1], gz1], 2)
        }
    }
    soff = soff || [0, 0]
    for (var px = 0 ; px < sx ; ++px) {
        var x = (px + 0.5) * nx / sx + soff[0]
        gx0[px] = Math.floor(x) % nx
        if (gx0[px] < 0) gx0[px] += nx
        gx1[px] = (gx0[px] + 1) % nx
        var axj = x - Math.floor(x), bxj = 1 - axj
        ax[px] = axj
        bx[px] = bxj
        cax[px] = axj*axj*(3-2*axj)
        cbx[px] = 1 - cax[px]
    }
    for (var py = 0, pj = 0 ; py < sy ; ++py) {
        var y = (py + 0.5) * ny / sy + soff[1]
        var gy0j = Math.floor(y) % ny
        if (gy0j < 0) gy0j += ny
        var gy1j = (gy0j + 1) % ny
        var ayj = y - Math.floor(y), byj = 1 - ayj
        var cayj = ayj*ayj*(3-2*ayj), cbyj = 1 - cayj
        for (var px = 0 ; px < sx ; ++px, ++pj) {
            var gx0j = gx0[px], gx1j = gx1[px]
            var axj = ax[px], bxj = bx[px], caxj = cax[px], cbxj = cbx[px]
            var j00 = gx0j + gy0j * nx, j01 = gx0j + gy1j * nx
            var j10 = gx1j + gy0j * nx, j11 = gx1j + gy1j * nx
            val[pj] = (((-axj*gradx0[j00] - ayj*grady0[j00] - az*gradz0[j00]) * cbyj +
                        (-axj*gradx0[j01] + byj*grady0[j01] - az*gradz0[j01]) * cayj) * cbxj +
                       (( bxj*gradx0[j10] - ayj*grady0[j10] - az*gradz0[j10]) * cbyj +
                        ( bxj*gradx0[j11] + byj*grady0[j11] - az*gradz0[j11]) * cayj) * caxj) * cbz +
                      (((-axj*gradx1[j00] - ayj*grady1[j00] + bz*gradz1[j00]) * cbyj +
                        (-axj*gradx1[j01] + byj*grady1[j01] + bz*gradz1[j01]) * cayj) * cbxj +
                       (( bxj*gradx1[j10] - ayj*grady1[j10] + bz*gradz1[j10]) * cbyj +
                        ( bxj*gradx1[j11] + byj*grady1[j11] + bz*gradz1[j11]) * cayj) * caxj) * caz
            val[pj] /= 1732.051
        }
    }
    return val
}

// Fractalize a noise map
// TODO: handle non-power-of-2 sizes
UFX.noise.fractalize = function (v, s, levels) {
    var sx = s[0], sy = s[1]  // TODO: assume sqrt sizes if s is not given
    var sx2 = sx/2, sy2 = sy/2, s2 = sx2 * sy2
    if (sx2 < 2 || sy2 < 2) return
    var v2 = new Array(sx2 * sy2)
    for (var y = 0, j = 0 ; y < sy ; y += 2) {
        var h = y * sx
        for (var x = 0 ; x < sx ; x += 2, ++j) {
            v2[j] = v[h + x]
        }
    }
    if (levels !== 1) {
        UFX.noise.fractalize(v2, [sx2, sy2], (typeof levels == "number" ? levels - 1 : levels))
    }
    for (var j = 0 ; j < s2 ; ++j) v2[j] *= 0.5
    for (var y2 = 0, j2 = 0 ; y2 < sy2 ; ++y2) {
        for (var x2 = 0 ; x2 < sx2 ; ++x2, ++j2) {
            var val = v2[j2]
            v[y2*sx+x2] += val
            v[y2*sx+x2+sx2] += val
            v[(y2+sy2)*sx+x2] += val
            v[(y2+sy2)*sx+x2+sx2] += val
        }
    }
}



// TODO: can we get by with 64 elements?

// 256 values in a Gaussian normal distribution (multiplied by 1000 for convenience)
// >>> a = [math.sqrt(2) * scipy.special.erfinv((0.5 + j) / 128. - 1.) for j in range(256)]
// >>> ",".join([str(int(x*1000)) for x in a])
UFX.noise._grad = [-2885,-2520,-2335,-2206,-2106,-2024,-1953,-1891,-1835,-1785,-1739,-1696,-1656,
  -1618,-1583,-1550,-1518,-1488,-1459,-1431,-1404,-1378,-1353,-1329,-1306,-1283,-1261,-1240,-1219,
  -1199,-1179,-1159,-1140,-1122,-1104,-1086,-1068,-1051,-1034,-1018,-1001,-985,-970,-954,-939,-924,
  -909,-894,-879,-865,-851,-837,-823,-809,-796,-783,-769,-756,-743,-730,-718,-705,-693,-680,-668,
  -656,-644,-632,-620,-608,-596,-584,-573,-561,-550,-539,-527,-516,-505,-494,-483,-472,-461,-450,
  -439,-428,-418,-407,-396,-386,-375,-365,-354,-344,-334,-323,-313,-303,-292,-282,-272,-262,-252,
  -242,-232,-222,-212,-202,-192,-182,-172,-162,-152,-142,-132,-122,-112,-102,-93,-83,-73,-63,-53,
  -44,-34,-24,-14,-4,4,14,24,34,44,53,63,73,83,93,102,112,122,132,142,152,162,172,182,192,202,212,
  222,232,242,252,262,272,282,292,303,313,323,334,344,354,365,375,386,396,407,418,428,439,450,461,
  472,483,494,505,516,527,539,550,561,573,584,596,608,620,632,644,656,668,680,693,705,718,730,743,
  756,769,783,796,809,823,837,851,865,879,894,909,924,939,954,970,985,1001,1018,1034,1051,1068,1086,
  1104,1122,1140,1159,1179,1199,1219,1240,1261,1283,1306,1329,1353,1378,1404,1431,1459,1488,1518,
  1550,1583,1618,1656,1696,1739,1785,1835,1891,1953,2024,2106,2206,2335,2520,2885]
// A random permutation of [0,256)
UFX.noise._perm = [127,13,214,153,195,181,253,32,17,180,95,9,159,81,209,129,31,157,21,76,118,79,91,
  0,38,234,8,147,148,227,206,78,22,223,198,109,240,46,115,71,133,175,232,14,168,37,196,49,213,106,
  62,119,85,61,104,220,139,203,44,73,189,237,39,210,28,57,6,172,164,40,51,186,233,52,204,199,50,243,
  161,126,249,7,36,244,131,231,24,1,252,142,27,53,188,254,137,184,92,201,136,165,43,145,205,216,33,
  19,101,75,156,60,228,215,197,185,248,30,26,200,107,96,11,247,173,111,108,235,166,241,105,120,47,
  110,130,167,112,208,160,154,42,16,48,34,202,221,74,122,236,64,143,246,103,88,222,238,162,155,163,
  80,230,72,25,176,68,158,121,124,63,177,113,41,3,45,86,55,114,67,134,212,58,242,179,192,35,170,211,
  15,149,224,140,66,128,219,193,2,229,117,93,54,132,135,218,169,187,207,191,144,138,245,190,65,23,
  146,123,56,152,194,171,18,4,100,150,255,99,98,183,83,70,97,141,178,182,250,84,10,239,217,94,116,
  174,29,151,82,12,225,59,125,20,5,69,251,77,102,90,89,226,87]
// Use the permutation to convert an vector of indices into a gradient value
UFX.noise._gvalue = function (v, n) {
    var i = UFX.noise._perm[n]
    for (var j = 0 ; j < v.length ; ++j) i = UFX.noise._perm[(i + v[j]) & 255]
    return UFX.noise._grad[i]
}




// UFX.pause: click to continue

// This is not a great, robust module, and I wrote it against an old UFX.scene API. I hope to
// rewrite this at some point, but for now I recommend implementing your own pause scene instead of
// using this one.

// Requires modules scene and mouse
// Draws to the global var context

"use strict"

UFX.pause = function () {
    if (!UFX.pause.ispaused()) {
        UFX.scene.push(UFX.pause.Pause)
    }
}
UFX.pause.unpause = function () {
    if (UFX.pause.ispaused()) {
        UFX.scene.pop()
    }
}
UFX.pause.ispaused = function () {
    return UFX.scene.top() === UFX.pause.Pause
}
UFX.pause.init = function () {
    document.addEventListener("blur", UFX.pause, false)
}


UFX.pause.Pause = {}
UFX.pause.Pause.start = function () {
    var c0 = context.canvas
    this.x = c0.width
    this.y = c0.height
    this.backdrop = document.createElement("canvas")
    this.backdrop.width = this.x
    this.backdrop.height = this.y
    this.bcontext = this.backdrop.getContext("2d")
    this.bcontext.drawImage(c0, 0, 0)
    this.bcontext.fillStyle = "rgba(64,64,64,0.7)"
    this.bcontext.fillRect(0, 0, this.x, this.y)
    this.t = 0
    this.r = Math.min(this.x, this.y) * 0.3
    UFX.mouse.clearevents()
}

UFX.pause.Pause.thinkargs = function (dt) {
    var clicked = false
    UFX.mouse.events().forEach(function (event) {
        if (event.type == "up") clicked = true
    })
    if (UFX.key) {
        UFX.key.clearevents()
        UFX.key.clearcombos()
    }
    return [dt, clicked]
}

UFX.pause.Pause.think = function (dt, clicked) {
    context.drawImage(this.backdrop, 0, 0)
    this.t += dt

    context.save()
    context.translate(0.5*this.x, 0.5*this.y)
    if (this.t < 0.25) {
        var theta = 30 * this.t
        var r = 1 - 4 * this.t
        context.scale(1. + r * Math.cos(theta), 1. - r * Math.sin(theta))
    }
    context.scale(this.r, this.r)
    context.fillStyle = "rgba(255,255,255,0.5)"
    context.beginPath()
    context.moveTo(0.8, 0)
    context.lineTo(-0.5, -0.7)
    context.lineTo(-0.5, 0.7)
    context.closePath()
    context.fill()
    context.restore()
    
    if (clicked) UFX.pause.unpause()
}


// UFX.Recorder and UFX.Playback: record a gameplay scene for later playback

// The idea is that you can record the keypresses etc that a player makes, serialize this record
// into an object, upload it to the universefactory.net server, and then download it and play it
// back so you can see exactly what the player did.

// This is pretty fragile and I still haven't worked out exactly how I want the API to look, but
// I did implement it in Mortimer the Lepidopterist and it seems to work.

// This is pretty advanced stuff. I recommend avoiding this module until I've had more practice
// with it.

// If you want to use it, and you don't replicate the server-side functionality yourself, you'll
// have to get an account on universefactory.net and register a game before you can use this.

// Requires UFX.scene

"use strict"
UFX.Recorder = function (obj) {
    if (!(this instanceof UFX.Recorder)) return new UFX.Recorder(obj)
    this.init(obj)
}

UFX.Recorder.prototype = {
    init: function (obj) {
        obj = obj || {}
        this.sessionstart = Date.now()
        this.setnames(obj.gamename, obj.version, obj.playername, obj.sessionname)
        this.setstatefuncs(obj.getprestate, obj.getstate, obj.getpoststate)
        this.sethandler(obj.handler)
        this.setscene(obj.scene || UFX.scene, obj.tethered, obj.tetherswap)
        this.postscript = obj.postscript
        this.keepchapters = obj.keepchapters
        this.copystate = true
        return this.session
    },
    // Register to record with a scene stack (pass in null in order to de-register)
    setnames: function (gamename, version, playername, sessionname) {
        this.gamename = gamename
        this.version = version === undefined ? "" : version
        this.playername = playername || ""
        this.sessionname = sessionname || this.playername + "-" + this.sessionstart
    },
    setstatefuncs: function (getprestate, getstate, getpoststate) {
        this.getprestate = getprestate
        this.getstate = getstate
        this.getpoststate = getpoststate
    },
    sethandler: function (handler) {
        this.handler = handler || {}
    },
    setscene: function (scene, tethered, tetherswap) {
        if (this.scene) this.scene.recorder = null
        this.scene = scene
        this.nchapters = 0
        if (this.scene) {
            if (this.scene.recorder) {
                throw "Specified recording scene already has associated playback"
            }
            this.scene.recorder = this
            this.prestate = this.getprestate && this.getprestate()
            if (this.prestate && this.copystate) this.prestate = JSON.parse(JSON.stringify(this.prestate))
            this.state = []
            this.chapters = []
            this.startchapter()
            this.tethered = tethered
            this.tetherswap = tetherswap
        }
        this.session = {
            gamename: this.gamename,
            version: this.version,
            playername: this.playername,
            name: this.sessionname,
            chapters: this.chapters,
            nchapters: this.nchapters,
            t: this.sessionstart,
        }
    },
    stop: function () {
        this.completechapter()
        var session = this.session
        this.setscene()
        return session
    },
    startchapter: function (chaptername) {
        var chapter = this.chapter
        this.poststate = this.getpoststate && this.getpoststate()
        if (this.poststate && this.copystate) this.poststate = JSON.parse(JSON.stringify(this.poststate))
        this.chapter = {
            n: this.nchapters++,
            name: chaptername,
            t: Date.now(),
            duration: 0,
            prestate: this.prestate,
            state: this.state.slice(0),
            poststate: this.poststate,
            data: []
        }
        this.chapters.push(this.chapter)
        this.data = this.chapter.data
        this.lastdatum = null
        return chapter
    },
    completechapter: function () {
        var jchapter = this.nchapters - 1
        this.chapters[jchapter].duration = Date.now() - this.chapters[jchapter].t
        if (this.postscript) {
            this.pushchapter(jchapter)
            if (!this.keepchapters) {
                this.chapters[jchapter] = null
            }
        } else {
            return this.chapters[jchapter]
        }
    },
    checkpoint: function (chaptername) {
        if (!this.chapter.data.length) return
        var chapter = this.completechapter()
        this.startchapter(chaptername)
        return chapter
    },
    addpush: function (scenename, args) {
        var state = this.getstate && this.getstate()
        if (state && this.copystate) state = JSON.parse(JSON.stringify(state))
        this.lastdatum = [Date.now(), "push", scenename, args, state]
        this.data.push(this.lastdatum)
        this.state.push([scenename, args, state])
    },
    addpop: function () {
        this.lastdatum = [Date.now(), "pop"]
        this.data.push(this.lastdatum)
        this.state.pop()
        if (!this.state.length && this.tethered) this.stop()
    },
    addswap: function (scenename, args) {
        var state = this.getstate && this.getstate()
        if (state && this.copystate) state = JSON.parse(JSON.stringify(state))
        this.lastdatum = [Date.now(), "swap", scenename, args, state]
        this.data.push(this.lastdatum)
        this.state.pop()
        if (!this.state.length && this.tethered && !this.tetherswap) this.stop()
        this.state.push([scenename, args, state])
    },
    addthink: function (args) {
        if (this.paused || this.scene.top().clipplayback) {
            return this.addclip()
        }
        if (!this.lastdatum || this.lastdatum[1] !== "think") {
            this.lastdatum = [Date.now(), "think"]
            this.data.push(this.lastdatum)
        }
        this.lastdatum.push(args)
    },
    addclip: function () {
        if (!this.lastdatum || this.lastdatum[1] !== "clip") {
            this.lastdatum = [Date.now(), "clip", 0, null]
            this.data.push(this.lastdatum)
        }
        this.lastdatum[2]++
        this.lastdatum[3] = Date.now()
    },
    log: function () {
        this.lastdatum = [Date.now(), "log"]
        this.lastdatum.push.apply(this.lastdatum, arguments)
        this.data.push(this.lastdatum)
    },
    handle: function (eventtype) {
        if (typeof eventtype !== "string") throw "Invalid event type: " + eventtype
        switch (eventtype) {
            case "push":  this.addpush(arguments[1], arguments[2]) ; break
            case "pop":   this.addpop() ; break
            case "swap":  this.addswap(arguments[1], arguments[2]) ; break
            case "think": this.addthink(arguments[1]) ; break
            case "clip":  this.addclip() ; break
            case "log": this.log.apply(this, Array.prototype.slice.call(arguments, 1)) ; break
            default:
                var args = Array.prototype.slice.call(arguments, 1)
                this.lastdatum = [Date.now(), eventtype, args]
                this.data.push(this.lastdatum)
                if (this.handler[eventtype]) {
                    this.handler[eventtype].apply(null, args)
                }
        }
    },
    pushchapter: function (jchapter) {
        var req = new XMLHttpRequest()
        req.open("POST", this.postscript, true)
        req.setRequestHeader("Content-type", "application/x-www-form-urlencoded")
        var qstring = [
            "act=postchapter",
            "gamename=" + encodeURIComponent(this.session.gamename),
            "gameversion=" + encodeURIComponent(this.session.version),
            "sessionname=" + encodeURIComponent(this.session.name),
            "sessiontime=" + encodeURIComponent(this.session.t),
            "playername=" + encodeURIComponent(this.playername),
            "chapternumber=" + encodeURIComponent(jchapter),
            "chaptertime=" + encodeURIComponent(this.chapters[jchapter].t),
            "chapterduration=" + encodeURIComponent(this.chapters[jchapter].duration),
            "chapterdata=" + encodeURIComponent(JSON.stringify(this.chapters[jchapter])),
        ]
        req.send(qstring.join("&"))
        this.req = req
        // TODO: add errback
    },
}

UFX.Playback = function (session, obj) {
    if (!(this instanceof UFX.Playback)) return new UFX.Playback(session, obj)
    this.session = session
    this.init(obj)
    this.playing = false
    this.stack = new UFX.SceneStack()
    this.stack.resolveargs = false
}

UFX.Playback.prototype = {
    init: function (obj) {
        obj = obj || {}
        this.setstatefuncs(obj.setprestate, obj.setstate, obj.setpoststate)
        this.sethandler(obj.handler)
        this.setscene(obj.scene || UFX.scene)
        this.raw = obj.raw   // Just replay the input rather than recreating the scene stack
        this.syncfactor = obj.syncfactor || 1
        this.sync = obj.sync
        this.persistonstop = obj.persistonstop
        this.ontakedown = obj.ontakedown
        this.cancelcallback = obj.cancelcallback  // why the heck did I make this?
    },
    setstatefuncs: function (setprestate, setstate, setpoststate) {
        this.setprestate = setprestate
        this.setstate = setstate
        this.setpoststate = setpoststate
    },
    sethandler: function (handler) {
        this.handler = handler || {}
    },
    setscene: function (scene) {
        this.scene = scene
    },
    playall: function () {
        this.jchapter = 0
        this.t = 0
        this.playing = true
        this.loadchapter()
        this.scene.ipush(Object.create(this.PlayScene), this)
        this.scene.frozen = true
    },
    playraw: function () {
    	this.raw = true
		this.playall()
	},
    stop: function () {
        this.playing = false
        if (!this.persistonstop) {
            this.takedown()
        }
    },
    takedown: function () {
        this.scene.frozen = false
        this.scene.ipop()
        if (this.raw) {
        	this.scene._stack = this.stack._stack.slice()
        }
        if (this.ontakedown) {
        	this.ontakedown()
    	}
    },
    loadchapter: function () {
        if (!this.session.chapters[this.jchapter]) return false
        this.chapter = JSON.parse(JSON.stringify(this.session.chapters[this.jchapter]))
        if (this.setprestate) this.setprestate.apply(null, this.chapter.prestate)
        this.stack._stack = []
        if (this.raw) this.stack._stack = this.scene._stack.slice()
        this.stack._lastthinker = null
        var state = this.chapter.state
        for (var j = 0 ; j < state.length ; ++j) {
//            if (this.setstate) this.setstate.apply(null, state[j][2])
            this.applypush(state[j][0], state[j][1], state[j][2])
        }
        if (this.setpoststate) this.setpoststate.apply(null, this.chapter.poststate)

        this.jdatum = 0
        this.jthink = 0
        this.chaptert = 0
        return true
    },
    // Returns undefined for end of chapter
    nextdatum: function () {
        if (this.jdatum >= this.chapter.data.length) return
        var datum = this.chapter.data[this.jdatum]
        if (datum[1] === "think") {
            if (this.jthink < 2) this.jthink = 2
            if (this.jthink < datum.length) {
                return [datum[0], datum[1], datum[this.jthink++]]
            } else {
                this.jdatum++
                this.jthink = 0
                return this.nextdatum()
            }
        }
        this.jdatum++
        return datum
    },
    applypush: function (scenename, args, state) {
        if (this.setstate) this.setstate.apply(null, state)
        return this.stack.ipush.apply(this.stack, [scenename].concat(args))
    },
    applypop: function () {
        this.stack.ipop()
    },
    // Have to manually implement swap because we want the state to be updated
    //   in between the pop and the push.
    applyswap: function (scenename, args, state) {
		var c0 = this.stack._stack.pop()
		if (c0 && c0.stop) c0.stop()
        if (this.setstate) this.setstate.apply(null, state)
		var c = this.stack.getscene(scenename)
		this.stack._stack.push(c)
		if (c.start) c.start.apply(c, args)
		return c0
    },
    applythink: function (args) {
        this.stack.think.apply(this.stack, args)
        if (this.sync) {
            this.t += args[0]
            this.chaptert += args[0]
        }
    },
    applyclip: function () {
    },
    // log messages from specified chapter, or current chapter if not specified
    getlogs: function (jchapter) {
        if (jchapter == undefined) jchapter = this.jchapter
        var r = [], chapter = this.session.chapters[jchapter]
        chapter.data.forEach(function (datum) {
            if (datum[1] == "log") r.push(datum.slice(2))
        })
        return r
    },
    // log messages from all chapters
    alllogs: function () {
        var r = []
        this.session.chapters.forEach(function (chapter) {
            var n = chapter.name || chapter.n
            chapter.data.forEach(function (datum) {
                if (datum[1] != "log") return
                var d = datum.slice(2)
                d.splice(0, 0, n)
                r.push(d)
            })
        })
        return r
    },
    handle: function (t, eventtype) {
        if (typeof eventtype !== "string") throw "Invalid event type: " + eventtype
        switch (eventtype) {
            case "push":  this.applypush(arguments[2], arguments[3], arguments[4]) ; break
            case "pop":   this.applypop() ; break
            case "swap":  this.applyswap(arguments[2], arguments[3], arguments[4]) ; break
            case "think": this.applythink(arguments[2]) ; break
            case "clip":  this.applyclip() ; break
            default:
                var args = Array.prototype.slice.call(arguments, 2)
                if (this.handler[eventtype]) {
                    this.handler[eventtype].apply(null, args)
                }
        }
    },
    step: function () {
        var datum = this.nextdatum()
        if (!datum) {
            this.jchapter++
            return this.loadchapter() && this.step()
        }
        this.handle.apply(this, datum)
        return true
    },
    PlayScene: {
        start: function (playback) {
            this.playback = playback
            this.t = 0
        },
        think: function (dt) {
            if (!this.playback.playing) return
            if (this.playback.sync) {
                this.t += dt * this.playback.syncfactor
                while (this.t > this.playback.t) {
                    if (!this.playback.step()) {
                        this.playback.stop()
                        return
                    }
                }
            } else {
                if (!this.playback.step()) this.playback.stop()
            }
        },
        draw: function () {
            if (!this.playback.playing) return
            this.playback.stack.draw()
        },
    },
}



// UFX.pointer module
// Abstracts away interface for games that can use either mouse or touch.

// For simplicity, only one action can be taken at a time. If multiple actions start occurring
// simultaneously (eg right mouse button is clicked while left mouse button is being held), then
// we'll just wait until everything is over before reporting events.

"use strict"
var UFX = UFX || {}

UFX.pointer = function (element) {
	UFX.pointer._state.updatenoevent()
	var state = UFX.pointer._state
	var pstate = {
		wheel: state.getwheel(),
		pinch: state.getpinch(),
	}
	if (UFX.pointer.roundpos) UFX.pointer._util.roundpinch(pstate.pinch)
	if (element && element !== UFX.pointer._element) {
		UFX.pointer._handlers.setelement(element)
		state.reset()
		return pstate
	}
	state.shiftevents().forEach(function (event) {
		var ptype = event.ptype == "p" ? "" : event.ptype
		if (UFX.pointer.roundpos) UFX.pointer._util.roundevent(event)
		pstate[ptype + event.etype] = event
		UFX.pointer.pos = event.pos
	})
	if (state.current) {
		pstate.current = state.current == "l" || state.current == "t" ? "p" : state.current
		var ptype = pstate.current == "p" ? "" : pstate.current
		pstate[ptype + "isdown"] = true
		if (UFX.pointer._state.currentisheld()) pstate[ptype + "isheld"] = true
	}
	if (UFX.pointer.pos) {
		pstate.pos = UFX.pointer.pos
		if (state.posL) {
			pstate.dpos = UFX.pointer._util.dpos(state.posL, UFX.pointer.pos)
		}
		if (UFX.pointer.within) pstate.within = true
	}
	state.posL = UFX.pointer.pos
	return pstate
}

// UFX.pointer options

// Whether to round reported positions to the nearest integer number of pixels.
UFX.pointer.roundpos = true

// Whether to keep the regular browser default behavior of opening a context menu on right click.
UFX.pointer.allowcontextmenu = false

// Hold thresholds
UFX.pointer.thold = 0.5
UFX.pointer.rhold = 5

// Pinch thresholds
UFX.pointer.spinch = 0  // Required change in separation
UFX.pointer.lpinch = 0.25  // Required change in log(separation)
// Tilt threshold
UFX.pointer.atilt = 10  // Required change in tilt

UFX.pointer.scale = [1, 1]

UFX.pointer._util = {
	dpos: function (pos0, pos1) {
		return [pos1[0] - pos0[0], pos1[1] - pos0[1]]
	},
	sep: function (pos0, pos1) {
		var p = UFX.pointer._util.dpos(pos0, pos1)
		return Math.sqrt(p[0] * p[0] + p[1] * p[1])
	},
	avgpos: function (pos0, pos1) {
		return [(pos1[0] + pos0[0]) / 2, (pos1[1] + pos0[1]) / 2]
	},
	tilt: function (pos0, pos1) {
		var dx = pos1[0] - pos0[0], dy = pos1[1] - pos0[1]
		return dx && dy ? Math.atan2(dx, -dy) * 180 / Math.PI : 0
	},
	// Map to range [0, 360)
	normtilt: function (tilt) {
		return (tilt % 360 + 360) % 360
	},
	// Round toward zero.
	dtilt: function (tilt0, tilt1) {
		return ((tilt1 - tilt0 + 180) % 360 + 360) % 360 - 180
	},
	jointouchlists: function (tlist1, tlist2) {
		var list = []
		list.push.apply(list, tlist1)
		list.push.apply(list, tlist2)
		return list
	},
	roundevent: function (event) {
		if (event.pos) event.pos = [Math.round(event.pos[0]), Math.round(event.pos[1])]
		if (event.dpos) event.dpos = [Math.round(event.dpos[0]), Math.round(event.dpos[1])]
	},
	roundpinch: function (pinch) {
		if (!pinch) return
		pinch.tilt = UFX.pointer._util.normtilt(Math.round(pinch.tilt * 100) / 100)
		pinch.dtilt = Math.round(pinch.dtilt * 100) / 100
		pinch.sep = Math.round(pinch.sep)
		pinch.dsep = Math.round(pinch.dsep)
		pinch.dlogsep = Math.round(pinch.dlogsep * 10000) / 10000
	},
}

UFX.pointer._handlers = {
	etypes: [
		"mousedown", "mouseup", "click", "dblcick", "wheel",
		"mousemove", "mouseover", "mouseout",
		"touchstart", "touchend", "touchmove", "touchcancel",
		"contextmenu",
	],

	setelement: function (element) {
		if (UFX.pointer._element) this.removelisteners(UFX.pointer._element)
		UFX.pointer._element = element
		this.addlisteners(element)
	},

	// Capture all event types for the given element.
	addlisteners: function (element) {
		this.etypes.forEach(function (etype) {
			element.addEventListener(etype, UFX.pointer._handlers[etype])
			document.addEventListener(etype, UFX.pointer._handlers["document" + etype])
		})
	},
	removelisteners: function (element) {
		this.etypes.forEach(function (etype) {
			element.removeEventListener(etype, UFX.pointer._handlers[etype])
			document.removeEventListener(etype, UFX.pointer._handlers["document" + etype])
		})
	},

	contextmenu: function (event) {
		if (!UFX.pointer.allowcontextmenu) {
			event.preventDefault()
			return false
		}
	},

	// Mouse handlers
	mousedown: function (event) {
		var spec = UFX.pointer._handlers.getbuttonspec(event)
		UFX.pointer._state.startbutton(spec)
		UFX.pointer._state.updatepos(spec.pos)
	},
	documentmousemove: function (event) {
		var spec = UFX.pointer._handlers.getbuttonsspec(event)
		if (event.buttons) UFX.pointer._state.updatebutton(spec)
		UFX.pointer._state.updatepos(spec.pos)
	},
	documentmouseup: function (event) {
		var spec = UFX.pointer._handlers.getbuttonspec(event)
		UFX.pointer._state.endbutton(spec)
		UFX.pointer._state.updatepos(spec.pos)
	},
	mouseout: function (event) {
		UFX.pointer._state.updatepos(UFX.pointer._handlers.getpos(event))
	},
	mouseover: function (event) {
		UFX.pointer._state.updatepos(UFX.pointer._handlers.getpos(event))
	},
	wheel: function (event) {
		UFX.pointer._state.updatepos(UFX.pointer._handlers.getpos(event))
		UFX.pointer._state.addwheel(event.deltaX, event.deltaY, event.deltaZ)
	},

	// Touch handlers
	touchstart: function (event) {
		var spec = UFX.pointer._handlers.gettouchspec(event.touches)
		if (spec == null) {
			UFX.pointer._state.bork()
			return
		}
		UFX.pointer._state.startbutton(spec)
		UFX.pointer._state.updatepos(spec.pos)
		event.preventDefault()
	},
	touchmove: function (event) {
		event.preventDefault()
	},
	touchend: function (event) {
		event.preventDefault()
	},
	documenttouchmove: function (event) {
		var spec = UFX.pointer._handlers.gettouchspec(event.touches)
		if (spec == null) {
			UFX.pointer._state.bork()
			return
		}
		UFX.pointer._state.updatebutton(spec)
		UFX.pointer._state.updatepos(spec.pos)
	},
	documenttouchend: function (event) {
		var touches = UFX.pointer._util.jointouchlists(event.targetTouches, event.changedTouches)
		var spec = UFX.pointer._handlers.gettouchspec(touches)
		if (spec == null) {
			UFX.pointer._state.bork()
			return
		}
		UFX.pointer._state.endbutton(spec)
		UFX.pointer._state.updatepos(spec.pos)
	},
	documenttouchcancel: function (event) {
		var spec = UFX.pointer._handlers.gettouchspec(event.touches)
		if (spec) {
			UFX.pointer._state.cancelbutton(spec)
			UFX.pointer._state.updatepos(spec.pos)
		}
	},

	// Retrieve button and position information for an event based on the event.button field.
	// Should only be called for "events caused by pressing or releasing one or multiple buttons"
	// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
	getbuttonspec: function (event) {
		return {
			ptype: "lmr"[event.button] || "b",
			pos: this.getpos(event),
		}
	},
	// Retrieve button and position information for an event based on the event.buttons field.
	// This allows more than one mouse button to be reported. We return "b" (for borked) on all
	// instances of multiple buttons.
	getbuttonsspec: function (event) {
		return {
			ptype: { 0: " ", 1: "l", 2: "r", 4: "m"}[event.buttons] || "b",
			pos: this.getpos(event),
		}
	},
	gettouchspec: function (touches) {
		if (touches.length == 1) {
			return {
				ptype: "t",
				pos: this.getpos(touches[0]),
			}
		} else if (touches.length == 2) {
			var t0 = this.getpos(touches[0]), t1 = this.getpos(touches[1])
			return {
				ptype: "d",
				pos: UFX.pointer._util.avgpos(t0, t1),
				sep: UFX.pointer._util.sep(t0, t1),
				tilt: UFX.pointer._util.tilt(t0, t1),
			}
		} else {
			return null
		}
	},

	// Position of the given object obj (which is either an event or a Touch object) with respect to
	// _element.
	getpos: function (obj) {
		var element = UFX.pointer._element
		var rect = element.getBoundingClientRect()
		var ex = rect.left + element.clientLeft - element.scrollLeft
		var ey = rect.top + element.clientTop - element.scrollTop
		var x = obj.clientX - ex, y = obj.clientY - ey
		x *= UFX.pointer.scale[0]
		y *= UFX.pointer.scale[1]
		return [x, y]
	},
}

// The _state object contains the state needed to interpet incoming events into
// UFX.pointer events, in particular which button is currently down.
UFX.pointer._state = {
	// Current pointer type being watched. Can be one of null, "l", "m", "r", "t", "d", "b"
	// Invariants:
	// When current == null, buttons and touchpoints are empty.
	// When current == "l", keys(buttons) == ["l"], and touchpoints is empty.
	//   similarly with "m" and "r".
	// When current == "t", buttons is empty and len(touchpoints) == 1
	// When current == "d", buttons is empty and len(touchpoints) == 2
	// For all other situations, current == "b" and borked == true
	current: null,
	borked: false,
	// Objects tracking the mouse buttons that are currently down. button objects have
	// the following fields:
	//   ptype: the single-letter code of the pointer type for this button
	//   pos0: position where this button's down event occurred
	//   t0: timestamp when the down event occurred
	//   pos: current mouse position
	//   held: whether this button has reached its "hold" event
	buttons: {},
	nbutton: 0,
	// Touch points currently active.
	touchpoints: {},
	ntouchpoint: 0,
	// event queue
	events: [],
	// wheel values
	wheel: {},
	pinch: null,

	reset: function () {
		UFX.pointer.pos = null
		UFX.pointer.within = false
		this.current = null
		this.borked = false
		this.buttons = {}
		this.nbutton = 0
		this.touchpoints = {}
		this.ntouchpoint = 0
		this.events = []
		this.wheel = {}
		this.pinch = null
	},

	// Add a UFX.pointer event to the event queue. Events have the following fields:
	// * t: timestamp of the event
	// * etype: event type, one of "down", "up", "click", "hold", "move", or "cancel"
	// * ptype: pointer type, one of "l", "m", "r", "t", or "d"
	// The spec0 argument contains additional fields to be added to the event.
	addevent: function (etype, ptype, spec0) {
		if (this.borked) return
		var spec = {}
		if (spec0) {
			for (var s in spec0) spec[s] = spec0[s]
		}
		spec.t = Date.now()
		spec.etype = etype
		spec.ptype = ptype == "l" || ptype == "t" ? "p" : ptype
		this.events.push(spec)
	},
	// Return as many events as possible from the front of the event queue without
	// reordering such that:
	// * all returned events have the same ptype
	// * any "down" event returned must be the first event returned
	// Any consecutive "move" events are coalesced into a single event.
	// Unreturned events remain on the queue.
	shiftevents: function () {
		var revents = [], last = null
		while (this.events.length) {
			var event = this.events[0]
			if (last) {
				if (event.etype == "down") break
				if (event.ptype != last.ptype) break
				if (last.etype == "move" && event.etype == "move") {
					event = this.coalescemove(last, event)
					revents.pop()
				}
			}
			revents.push(event)
			last = event
			this.events.shift()
		}
		return revents
	},
	// Coalesce two "move" events into a single event that covers the motion of both of them.
	// Events are assumed to have the same ptype.
	coalescemove: function (mevent1, mevent2) {
		return {
			etype: "move",
			ptype: mevent1.ptype,
			t: mevent2.t,
			pos: mevent2.pos,
			dpos: [mevent1.dpos[0] + mevent2.dpos[0], mevent1.dpos[1] + mevent2.dpos[1]],
		}
	},
	
	currentisheld: function () {
		if (!this.current) return false
		var button = this.buttons[this.current]
		return button && button.held
	},

	updatepos: function (pos) {
		UFX.pointer.pos = pos
		var x = pos[0], y = pos[1]
		UFX.pointer.within =
			0 <= x && x < UFX.pointer._element.width &&
			0 <= y && y < UFX.pointer._element.height
	},

	startbutton: function (buttonspec) {
		if (this.allclear()) {
			this.current = buttonspec.ptype
		} else if (this.current == buttonspec.ptype) {
			this.cancelcurrent()
		} else if (this.current == "t" && buttonspec.ptype == "d") {
			this.cancelcurrent()
			this.current = buttonspec.ptype
		} else {
			this.bork()
		}
		if (buttonspec.ptype == "l" || buttonspec.ptype == "m" || buttonspec.ptype == "r") {
			UFX.pointer.touch = false
		} else if (buttonspec.ptype == "t" || buttonspec.ptype == "d") {
			UFX.pointer.touch = true
		}
		var t = Date.now()
		var button = this.buttons[buttonspec.ptype] = {
			ptype: buttonspec.ptype,
			pos0: buttonspec.pos,
			pos: buttonspec.pos,
			t0: t,
			held: false,
		}
		if (button.ptype == "d") {
			this.pinch = {
				pinched: false,
				tilted: false,
			}
			var tilt = UFX.pointer._util.normtilt(buttonspec.tilt)
			this.pinch.tilt = this.pinch.tilt0 = this.pinch.tiltL = tilt
			this.pinch.sep = this.pinch.sep0 = this.pinch.sepL = buttonspec.sep
		}
		this.addevent("down", buttonspec.ptype, {
			pos: buttonspec.pos,
		})
		this.updatecounts()
	},
	updatebutton: function (buttonspec) {
		if (!this.current) return
		if (this.current != buttonspec.ptype) {
			this.bork()
		}
		if (!this.buttons[buttonspec.ptype]) return
		var t = Date.now()
		var button = this.buttons[buttonspec.ptype]
		if (button.held) {
			var pos = buttonspec.pos
			if (button.pos != pos) {
				this.addevent("move", buttonspec.ptype, {
					pos: pos,
					dpos: UFX.pointer._util.dpos(button.pos, pos),
				})
				button.pos = pos
			}
		} else {
			button.pos = buttonspec.pos
			if (this.checkhold(button)) {
				button.held = true
				this.addevent("hold", buttonspec.ptype, {
					pos: button.pos0,
				})
				if (button.pos != button.pos0) {
					this.addevent("move", buttonspec.ptype, {
						pos: button.pos,
						dpos: UFX.pointer._util.dpos(button.pos0, button.pos),
					})
				}
			}
		}
		if (button.ptype == "d" && this.pinch) {
			this.pinch.tilt = UFX.pointer._util.normtilt(buttonspec.tilt)
			this.pinch.sep = buttonspec.sep
			if (!this.pinch.pinched) {
				// Has it passed the sep threshold?
				var sep = Math.abs(this.pinch.sep - this.pinch.sep0) >= UFX.pointer.spinch
				// Has it passed the log(sep) threshold?
				var lsep = this.pinch.sep0 == 0 || this.pinch.sep == 0 ||
					Math.abs(Math.log(this.pinch.sep / this.pinch.sep0)) >= UFX.pointer.lpinch
				if (sep && lsep) this.pinch.pinched = true
			}
			if (!this.pinch.tilted) {
				this.pinch.tilted =
					Math.abs(UFX.pointer._util.dtilt(this.pinch.tilt0, this.pinch.tilt)) >=
					UFX.pointer.atilt
			}
		}
		this.updatecounts()
	},
	endbutton: function (buttonspec) {
		this.updatebutton(buttonspec)
		var button = this.buttons[buttonspec.ptype]
		if (!button) {
			// Button was initially clicked outside the element.
			return
		}
		var event = {
			pos: buttonspec.pos,
			dt: 0.001 * (Date.now() - button.t0),
			fly: [0, 0],  // TODO
		}
		this.addevent("up", buttonspec.ptype, event)
		if (!button.held) {
			this.addevent("click", buttonspec.ptype, event)
		}
		delete this.buttons[buttonspec.ptype]
		this.updatecounts()
		this.checkunbork()
		if (buttonspec.ptype === this.current) this.current = null
	},
	cancelbutton: function (buttonspec) {
		if (this.current == buttonspec.ptype) {
			this.cancelcurrent()
		}
	},
	updatenoevent: function () {
		if (this.checkholdnoevent()) {
			var button = this.buttons[this.current]
			button.held = true
			this.addevent("hold", this.current, {
				pos: button.pos0,
			})
		}
	},

	addwheel: function (dx, dy, dz) {
		if (dx) this.wheel.dx = (this.wheel.dx || 0) + dx
		if (dy) this.wheel.dy = (this.wheel.dy || 0) + dy
		if (dz) this.wheel.dz = (this.wheel.dz || 0) + dz
	},
	getwheel: function () {
		var wheel = this.wheel
		this.wheel = {}
		return wheel
	},
	getpinch: function () {
		if (!this.pinch) return null
		var sep = this.pinch.pinched ? this.pinch.sep : this.pinch.sepL
		var tilt = this.pinch.tilted ? this.pinch.tilt : this.pinch.tiltL
		var dlogsep = this.pinch.sepL && sep ? Math.log(sep / this.pinch.sepL) : 0
		var ret = {
			tilt: tilt,
			dtilt: UFX.pointer._util.dtilt(this.pinch.tiltL, tilt),
			sep: sep,
			dsep: sep - this.pinch.sepL,
			dlogsep: dlogsep,
		}
		if (this.current == "d") {
			this.pinch.tiltL = tilt
			this.pinch.sepL = sep
		} else {
			this.pinch = null
		}
		return ret
	},

	// Determine whether the given button info passes thresholds for a change to the held state.
	checkhold: function (button) {
		if (Date.now() - button.t0 >= 1000 * UFX.pointer.thold) return true
		var dpos = UFX.pointer._util.dpos(button.pos0, button.pos)
		return dpos[0] * dpos[0] + dpos[1] * dpos[1] >= UFX.pointer.rhold * UFX.pointer.rhold
	},
	// Determine whether the current button (with no new mouse events as updates) passes timing
	// threshold for a change to the held state.
	checkholdnoevent: function () {
		if (!this.current || this.current == "b") return false
		var button = this.buttons[this.current]
		if (!button || button.held) return false
		return Date.now() - button.t0 >= 1000 * UFX.pointer.thold
	},

	// Given a list of active touch points, update the positions and active status.
	settouches: function (touches) {
		for (var j = 0 ; j < touches.length ; ++j) {
			var touch = touches[j]
			this.touchpoints[touch.identifier] = this.getpos(touch)
		}
	},
	// Given a list of touch points that are no longer active, remove them from the active touch
	// point list.
	cleartouches: function (touches) {
		for (var j = 0 ; j < touches.length ; ++j) {
			var touch = touches[j]
			delete this.touchpoints[touch.identifier]
		}
	},

	cancelcurrent: function () {
		this.addevent("cancel", this.current, { pos: this.buttons[this.current].pos })
	},

	// Enter a borked state, and cancel out any pending watches.
	bork: function () {
		if (this.borked) return
		if (this.current) this.cancelcurrent()
		this.current = "b"
		this.borked = true
	},
	checkunbork: function () {
		if (this.borked && this.allclear()) {
			this.current = null
			this.borked = false
		}
	},


	// Whether we're in a "clean slate" state, i.e., no buttons are down and no touch points are
	// active. Used to determine when to leave a borked state.
	allclear: function () {
		return this.nbutton == 0 && this.ntouchpoint == 0
	},
	updatecounts: function () {
		this.nbutton = Object.keys(this.buttons).length
		this.ntouchpoint = Object.keys(this.touchpoints).length
	},
}
// UFX.random: random number generation

// The random numbers are generated by a quick and easy LCG, which is good enough for games, but
// definitely not for simulations or cryptography.

// There are two reasons to use this instead of Math.random. First, you can seed this RNG, so you
// can deterministically generate the same sequence over again if you want. Second, there are a
// number of handy functions I always wanted.

// You don't need to seed it before the first usage. It's automatically seeded with Math.random in
// that case.

// For more information and options, please see the documentation:
// https://code.google.com/p/unifac/wiki/UFXDocumentation#UFX.random_:_generate_pseudorandom_numbers


"use strict"
var UFX = UFX || {}

// UFX.random and UFX.random.rand - the two basic RNG functions

// UFX.random() : float in [0, 1)
// UFX.random(a) : float in [0, a)
// UFX.random(a, b) : float in [a, b)
// UFX.random.rand() : integer in [0, 2^32)
// UFX.random.rand(n) : integer in [0, n)
// UFX.random.rand(m, n) : integer in [m, n)

UFX.random = function (a, b) {
	return UFX.random.random(a, b)
}
UFX.random.random = function (a, b) {
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
// Apply a temporary seed for a single method invocation
UFX.random.seedmethod = function (seed, methodname) {
	UFX.random.pushseed(seed)
	var value = UFX.random[methodname || "random"].apply(UFX.random, [].slice.call(arguments, 2))
	UFX.random.popseed()
	return value
}


// Random angle in [0, tau)
UFX.random.angle = function () {
	return UFX.random(0, 2 * Math.PI)
}

// Random 2-d unit vector
UFX.random.direction = function (d) {
	if (typeof d != "number") d = 1
	var a = UFX.random.angle()
	return [d * Math.cos(a), d * Math.sin(a)]
}

// Select a random element from the array arr.
// If remove is set to true, the selected element is removed.
UFX.random.choice = function (arr, remove) {
    return remove ? arr.splice(UFX.random.rand(arr.length), 1)[0] : arr[UFX.random.rand(arr.length)]
}

UFX.random.flip = function (p) {
    return UFX.random() < (p === undefined ? 0.5 : p)
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




// UFX.resource: load external resources

// Basic usage:
// 1. define the callback UFX.resource.onloading(f), which will be called every time a resource is
//    loaded, with f the fraction of resources loaded
// 2. define the callback UFX.resource.onload(), which will be called when the last resource has
//    loaded
// 3. call UFX.resource.load(res), where res is an object mapping names to urls

// The resources will be loaded into the objects UFX.resource.images, UFX.resource.sounds, and
// UFX.resource.data, based on the url extension, and parsed into the appropriate type.

// opts.skipcount: set to true for this resource to not count toward the progress bar.
// opts.skiponloading: set to true to avoid calling UFX.resource.onloading when this resource loads.
// opts.onload: callback specific to this resource.


// TODO: add documentation to the unifac wiki

// TODO: look into the performance API to generate loading reports

"use strict"
var UFX = UFX || {}
UFX.resource = {
	// These will become populated as you call load
	images: {},
	sounds: {},
	data: {},

	// Recognized extensions
	jsontypes: "js json".split(" "),
	imagetypes: "png gif jpg jpeg bmp tiff".split(" "),
	soundtypes: "wav mp3 ogg au".split(" "),
	rawtypes: "csv txt frag vert".split(" "),

	// Base path for loading resources
	base: null,

	// If false, then it is an error to call load for the same resource name twice.
	allowduplicate: false,

	soundvolume: undefined,
	musicvolume: undefined,
	audiovolume: undefined,

	// A value between 0 and 1 indicating the fraction of resources that have been loaded.
	fload: 0,
	// Whether all resources have finished loading.
	loaded: false,

	// Set this to a function that should be called when all resources are loaded
	onload: function () {},

	// Set this to a function that should be called while resources are loading. Arguments are:
	// f: a number between 0 and 1, the fraction of resources that have loaded successfully.
	onloading: function (f, obj, objtype, objname, url) {},

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
	load: function () {
		var r = UFX.resource._extractlist(arguments), reslist = r[0], opts = r[1]
		for (var j = 0 ; j < reslist.length ; ++j) {
			var res = reslist[j]
			this._load(res[0], res[1], opts)
		}
		if (this._toload === 0) {
			this.fload = 1
			this.loaded = true
			setTimeout(this.onload, 0)
		}
	},

	// Calling loadimage or loadsound is recommended when the resource type cannot be auto-detected
	//   from the URL. Or if you just want to be explicit about it.
	// Same calling conventions as load.
	loadimage: function () {
		var r = UFX.resource._extractlist(arguments), reslist = r[0], opts = r[1]
		for (var j = 0 ; j < reslist.length ; ++j) {
			var res = reslist[j]
			this._loadimage(res[0], res[1], opts)
		}
	},
	loadsound: function () {
		var r = UFX.resource._extractlist(arguments), reslist = r[0], opts = r[1]
		for (var j = 0 ; j < reslist.length ; ++j) {
			var res = reslist[j]
			this._loadsound(res[0], res[1], opts)
		}
	},
	loadjson: function () {
		var r = UFX.resource._extractlist(arguments), reslist = r[0], opts = r[1]
		for (var j = 0 ; j < reslist.length ; ++j) {
			var res = reslist[j]
			this._loadjson(res[0], res[1], opts)
		}
	},
	loadbuffer: function () {
		var r = UFX.resource._extractlist(arguments), reslist = r[0], opts = r[1]
		for (var j = 0 ; j < reslist.length ; ++j) {
			var res = reslist[j]
			this._loadbuffer(res[0], res[1], opts)
		}
	},
	loadaudiobuffer: function (audiocontext) {
		var r = UFX.resource._extractlist([].slice.call(arguments, 1)), reslist = r[0], opts = r[1]
		for (var j = 0 ; j < reslist.length ; ++j) {
			var res = reslist[j]
			this._loadaudiobuffer(audiocontext, res[0], res[1], opts)
		}
	},
	// Called if the given audio context returns an error when decoding the audio buffer specified
	// by the given name. Override if you want a different error handler.
	onaudiobuffererror: function (audiocontext, buffer, name, error) {
		console.error('UFX.resource error decoding audio "' + name + '": ' + error)
	},

	// Load Google web fonts
	loadwebfonts: function () {
		var args = [].slice.call(arguments), opts = {}
		if (typeof args[args.length - 1] != "string") {
			var oopts = args.pop()
			for (var s in oopts) opts[s] = oopts[s]
		}
		WebFontConfig = {
			google: { families: args },
			fontactive: function (familyname, fvd) {
				UFX.resource._onload(null, "fonts", familyname + "-" + fvd, familyname, opts)
			},
		}
		var wf = document.createElement("script")
		wf.src = "https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js"
		wf.type = "text/javascript"
		wf.async = "true"
		document.getElementsByTagName("head")[0].appendChild(wf)
		if (!opts.skipcount) this._toload += args.length
	},

	setsoundvolume: function (v) {
		this.soundsvolume = v
	},
	setmusicvolume: function (v) {
		this.musicvolume = v
		if (this.musicplaying) this.musicplaying.volume = this._getmusicvolume()
	},
	setaudiovolume: function (v) {
		this.audiovolume = v
		if (this.musicplaying) this.musicplaying.volume = this._getmusicvolume()
	},
	playsound: function (sname) {
		var s = this.sounds[sname]
		if (!s) {
			console.log("Missing sound: " + sname)
			return
		}
		var v = this.soundvolume === undefined ? this.audiovolume : this.soundvolume
		if (v === undefined) v = 1
		s.volume = v
		s.play()
	},
	musicplaying: null,
	_getmusicvolume: function () {
		if (this.musicvolume !== undefined) return this.musicvolume
		if (this.audiovolume !== undefined) return this.audiovolume
		return 1
	},
	playmusic: function (mname, noloop) {
		this._completependingfades()
		if (!mname) return this.stopmusic()
		var m = this.sounds[mname]
		if (!m) {
			console.log("Missing music: " + mname)
			return
		}
		if (m === this.musicplaying) return
		this.stopmusic()
		m.volume = this._getmusicvolume()
		m.currentTime = 0
		m.play()
		m.loop = !noloop
		this.musicplaying = m
	},
	stopmusic: function () {
		this._completependingfades()
		if (this.musicplaying) this.musicplaying.pause()
		this.musicplaying = null
	},
	_fadeouttime0: 1400,
	_fadeintime0: 1400,
	_fadegap0: 0,
	setfadetime: function (fadeouttime, fadeintime, fadegap) {
		if (fadeouttime !== undefined) this._fadeouttime0 = fadeouttime
		if (fadeintime !== undefined) this._fadeintime0 = fadeintime
		if (fadegap !== undefined) this._fadegap0 = fadegap
	},
	setcrossfade: function (crossfadetime) {
		if (crossfadetime === undefined) crossfadetime = this._fadetime
		this.setfadetime(crossfadetime, crossfadetime, -crossfadetime)
	},
	_completependingfades: function () {
		if (this._fadetimeout) {
			window.clearTimeout(this._fadetimeout)
			this._fadeinstart = -1
			this._fadeoutstart = -1
			this._fadecallback()
		}
	},
	fadetomusic: function (mname, fadeouttime, fadeintime, fadegap, noloop) {
		this._completependingfades()
		if (this.musicplaying && mname && this.sounds[mname] === this.musicplaying) return
		this._fadeouttime = fadeouttime === undefined ? this._fadeouttime0 : fadeouttime
		this._fadeintime = fadeintime === undefined ? this._fadeintime0 : fadeintime
		this._fadegap = fadegap === undefined ? this._fadegap0 : fadegap
		this._fadeoutstart = Date.now()
		this._fadeinstart = this._fadeoutstart + (this.musicplaying ? this._fadeintime + this._fadegap : 0)
		this._pendingmname = mname
		this._pendingnoloop = noloop
		this._outgoingmusic = this.musicplaying
		this.musicplaying = null
		this._fadecallback()
	},
	crossfadetomusic: function (mname, crossfadetime, noloop) {
		if (crossfadetime === undefined) crossfadetime = this._fadeouttime
		this.fadetomusic(mname, crossfadetime, crossfadetime, -crossfadetime, noloop)
	},
	_fadecallback: function () {
		if (this._outgoingmusic) {
			var dtout = Date.now() - this._fadeoutstart
			var fout = this._fadeouttime > 0 ? 1 - dtout / this._fadeouttime : dtout > 0 ? 0 : 1
			if (fout > 0) {
				this._outgoingmusic.volume = fout * this._getmusicvolume()
			} else {
				this._outgoingmusic.pause()
				this._outgoingmusic = null
			}
		}
		if (this._pendingmname) {
			var dtin = Date.now() - this._fadeinstart
			var fin = this._fadeintime > 0 ? dtin / this._fadeintime : dtin > 0 ? 1 : 0
			if (fin > 0) {
				if (!this.musicplaying) {
					var m = this.sounds[this._pendingmname]
					if (!m) {
						console.log("Missing music: " + mname)
					} else {
						m.currentTime = 0
						m.volume = 0
						m.play()
						m.loop = !this._pendingnoloop
						this.musicplaying = m
					}
				}
				if (fin >= 1) {
					this.musicplaying.volume = this._getmusicvolume()
					this._pendingmname = null
				} else {
					this.musicplaying.volume = fin * this._getmusicvolume()
				}
			}
		}
		if (this._outgoingmusic || this._pendingmname) {
			this._fadetimeout = window.setTimeout(this._fadecallback.bind(this), 100)
		} else {
			this._fadetimeout = null
		}
	},

	// Firefox won't let me play a sound more than once every 10 seconds or so.
	// Use this class to create a set of identical sounds if you want to play in rapid succession
	// url can be a sound or a sound.src attribute. Multisound doesn't participate in the loading
	//   cycle, so you should have the url already preloaded when you call this factory.
	// n is the number of identical copies. Defaults to 10.
	Multisound: function (url, n) {
		if (!(this instanceof UFX.resource.Multisound))
			return new UFX.resource.SoundRandomizer(url, n)
		this._init(url, n)
	},

	// Sometimes when you've got a sound that plays over and over again (like gunshots) you want to
	// add a small amount of variation. Pass a list of closely-related sounds to this class to get an
	// object that lets you play one at random. Requires UFX.random.
	SoundRandomizer: function (slist, nskip) {
		if (!(this instanceof UFX.resource.SoundRandomizer))
			return new UFX.resource.SoundRandomizer(slist, nskip)
		this._sounds = []
		for (var j = 0 ; j < slist.length ; ++j) {
			this._sounds.push(typeof slist[j] == "string" ? UFX.resource.sounds[slist[j]] : slist[j])
		}
		this._nskip = Math.min(this._sounds.length - 1, (nskip || 3))
		this._played = []
		this.volume = 1.0
	},

	mergesounds: function () {
		for (var j = 0 ; j < arguments.length ; ++j) {
			var slist = [], sname = arguments[j]
			for (var s in UFX.resource.sounds) {
				if (s.indexOf(sname) == 0) {
					slist.push(s)
				}
			}
			this.sounds[sname] = this.SoundRandomizer(slist)
		}
	},

	_seturl: function (url) {
		if (!this.base) return url
		var n = UFX.resource.base.length
		if (!n) return url
		return this.base + (this.base.charAt(n-1) == "/" ? "" : "/") + url
	},

	// Try to deduce what type the resource is based on the url
	_load: function (name, url, opts) {
		if (url.indexOf(".") == -1) {
			console.log("Treating extensionless URL " + url + " as raw data")
			return this._loaddata(name, url, opts)
		}
		var ext = url.split(".").pop()
		if (this.imagetypes.indexOf(ext) > -1) {
			return this._loadimage(name, url, opts)
		} else if (this.soundtypes.indexOf(ext) > -1) {
			return this._loadsound(name, url, opts)
		} else if (this.jsontypes.indexOf(ext) > -1) {
			return this._loadjson(name, url, opts)
		} else if (this.rawtypes.indexOf(ext) > -1) {
			return this._loaddata(name, url, opts)
		}
		console.log("Treating unknown extension " + ext + " as raw data")
		return this._loaddata(name, url, opts)
	},

	// Load a single image with the given name
	_loadimage: function (iname, imageurl, opts) {
		this._checkdupe("images", iname)
		var img = new Image()
		img.onload = function () {
			UFX.resource._onload(img, "images", iname, imageurl, opts)
		}
		imageurl = this._seturl(imageurl)
		img.src = imageurl
		img.iname = iname
		this.images[iname] = img
		if (!opts.skipcount) ++this._toload
	},
	// Load a single audio file with the given name
	_loadsound: function (aname, audiourl, opts) {
		this._checkdupe("sounds", aname)
		var audio = new Audio()
		audio.addEventListener("canplaythrough", function () {
			UFX.resource._onload(audio, "sounds", aname, audiourl, opts)
		}, { capture: false, once: true, })
		audio.src = this._seturl(audiourl)
		audio.aname = aname
		this.sounds[aname] = audio
		if (!opts.skipcount) ++this._toload
	},
	// Load a single json resource
	_loadjson: function (jname, jsonurl, opts) {
		this._checkdupe("data", jname)
		var req = new XMLHttpRequest()
		req.overrideMimeType("application/json")
		req.open('GET', jsonurl, true); 
		req.onload = function() {
			UFX.resource.data[jname] = JSON.parse(req.responseText)
			UFX.resource._onload(UFX.resource.data[jname], "data", jname, jsonurl, opts)
		}
		req.send(null)
		if (!opts.skipcount) ++this._toload
	},
	// Load a raw data resource
	_loaddata: function (dname, dataurl, opts) {
		this._checkdupe("data", dname)
		var req = new XMLHttpRequest()
		req.open('GET', dataurl, true)
		req.onload = function() {
			UFX.resource.data[dname] = req.responseText
			UFX.resource._onload(UFX.resource.data[dname], "data", dname, dataurl, opts)
		}
		req.send(null)
		if (!opts.skipcount) ++this._toload
	},
	// Load a raw data resource as an arraybuffer
	_loadbuffer: function (dname, dataurl, opts) {
		this._checkdupe("data", dname)
		var req = new XMLHttpRequest()
		req.open("GET", dataurl, true)
		req.responseType = "arraybuffer"
		req.onload  = function () {
			UFX.resource.data[dname] = req.response
			UFX.resource._onload(UFX.resource.data[dname], "data", dname, dataurl, opts)
		}
		req.send(null)
		if (!opts.skipcount) ++this._toload
	},
	// Load a raw data resource as an audio buffer
	_loadaudiobuffer: function (audiocontext, dname, dataurl, opts) {
		this._checkdupe("data", dname)
		var req = new XMLHttpRequest()
		req.open("GET", dataurl, true)
		req.responseType = "arraybuffer"
		req.onload = function () {
			audiocontext.decodeAudioData(req.response, function (buffer) {
				UFX.resource.data[dname] = buffer
				UFX.resource._onload(UFX.resource.data[dname], "data", dname, dataurl, opts)
			}, function (err) {
				UFX.resource.onaudiobuffererror(audiocontext, req.response, dname, err)
				UFX.resource._onload(UFX.resource.data[dname], "data", dname, dataurl, opts)
			})
		}
		req.send(null)
		if (!opts.skipcount) ++this._toload
	},


	_seenvalues: {},
	_checkdupe: function (otype, oname) {
		var key = otype + "." + oname
		var isdupe = this._seenvalues[key]
		this._seenvalues[key] = true
		if (isdupe && !this.allowduplicate) {
			throw 'Duplicate resource loaded: "' + oname + '" of type: ' + otype
		}
	},

	// Extracts one of several forms of argument lists:
	//   s1 s2 s3 ... [opts]
	//   [s1 s2 s3 ...] [opts]
	//   [[k1, v1] [k2, v2], ...] [opts]
	//   {k1: v1, k2: v2, ...} [opts]
	// The s, k, and v values are strings. opts is an object. If no object is specified, the empty
	// object is returned.
	_extractlist: function (args) {
		if (args.length < 1) throw "Error extracting arguments: empty argument list"
		var ret = []
		var opts = {}
		var seenobj = false
		for (var j = 0 ; j < args.length ; ++j) {
			var arg = args[j]
			var isstring = typeof arg == "string"
			var isarray = arg instanceof Array
			var islast = j == args.length - 1
			if (isstring) {
				if (seenobj) throw "Error extracting arguments: string mixed with non-string."
				ret.push([arg, arg])
			} else if (isarray) {
				if (j != 0) throw "Error extracting arguments: Array must be first arg."
				for (var k = 0 ; k < arg.length ; ++k) {
					if (arg[k] instanceof Array) {
						ret.push([arg[k][0], arg[k][1]])
					} else  {
						ret.push([arg[k], arg[k]])
					}
				}
				seenobj = true
			} else {
				if (j == 0) {
					for (var k in arg) {
						ret.push([k, arg[k]])
					}
				} else if (islast) {
					opts = arg
				} else {
					throw "Error extracting arguments: object must be first or last arg."
				}
				seenobj = true
			}
		}
		for (var j = 0 ; j < ret.length ; ++j) {
			if (typeof ret[j][0] != "string" || typeof ret[j][1] != "string") {
				throw "Error extracting arguments: non-string (" + ret[j][0] + ", " + ret[j][1] + ")"
			}
		}
		// Prevent any changes from the given opts object from affecting callbacks.
		var ropts = {}
		for (var s in opts) ropts[s] = opts[s]
		return [ret, opts]
	},

	_toload: 0,
	_loaded: 0,
	// obj: the newly loaded object
	// objtype: one of "image", "sound", "data"
	// objname: string
	// url: string
	// opts: options object
	_onload: function (obj, objtype, objname, url, opts) {
		var newlycomplete = false
		if (!opts.skipcount) {
			++UFX.resource._loaded
			if (UFX.resource._loaded == UFX.resource._toload) newlycomplete = true
		}
		UFX.resource.fload = UFX.resource._loaded / UFX.resource._toload
		if (newlycomplete) UFX.resource.loaded = true
		UFX.resource.onloading(UFX.resource.fload, obj, objtype, objname, url)
		if (opts.onload) {
			opts.onload(obj, objtype, objname, url)
		}
		if (newlycomplete) UFX.resource.onload()
	},
}

var WebFontConfig

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

// UFX.scene: keep track of the scene stack

// Basic usage:
// 1. include UFX.tikcer
// 2. call UFX.scene.init()
// 3. call UFX.scene.push(sceneobj) to push a scene object onto the stack
// 4. call UFX.scene.pop() to pop the top scene object off the stack

// Scene objects should at least have a think method, which gets invoked every update
// They can also optionally have a start method, invoked when they're pushed on the stack, and
//   a draw method, if you want to separate your model from your view.

// For more options, please see the documentation:
// https://code.google.com/p/unifac/wiki/UFXDocumentation#UFX.scene_:_scene_management

"use strict"
var UFX = UFX || {}

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
	// top() returns the topmost scene object.
	// top(k) returns the scene object k layers down.	
	top: function (k) {
		var n = this._stack.length - (k || 0) - 1
		return n >= 0 ? this._stack[n] : null
	},
	getscene: function (c) {
		if (typeof c === "string") {
			if (!(c in UFX.scenes)) throw "Unrecognized scene: " + c
			return UFX.scenes[c]
		}
		return c
	},
	indexOf: function (scene) {
		scene = this.getscene(scene)
		var n = this._stack.length
		for (var j = n - 1 ; j >= 0 ; --j) {
			if (this._stack[j] === scene) return n - 1 - j
		}
		return -1
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
	iflip: function (i, j) {
		if (i === undefined) i = 1
		if (j === undefined) j = 0
		if (typeof i !== "number") {
			var index = this.indexOf(i)
			if (index == -1) throw "Unrecognized scene: " + i
			i = index
		}
		if (typeof j !== "number") {
			index = this.indexOf(j)
			if (index == -1) throw "Unrecognized scene: " + j
			j = index
		}
		if (i < 0 || i >= this._stack.length) throw "Invalid scene index: " + i
		if (j < 0 || j >= this._stack.length) throw "Invalid scene index: " + j
		if (i == j) return
		if (i == 0) {
			i = j
			j = 0
		}
		var n = this._stack.length - 1
		var iscene = this._stack[n - i]
		var jscene = this._stack[n - j]
		if (j == 0 && jscene.suspend) jscene.suspend()
		this._stack[n - i] = jscene
		this._stack[n - j] = iscene
		if (j == 0 && iscene.resume) iscene.resume()
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
	flip: function () {
		this._actionq.push(["flip", Array.prototype.slice.call(arguments, 0)])
	},
	_resolveq: function () {
		for (var j = 0 ; j < this._actionq.length ; ++j) {
			switch (this._actionq[j][0]) {
				case "push": this.ipush.apply(this, this._actionq[j][1]) ; break
				case "pop": this.ipop.apply(this, this._actionq[j][1]) ; break
				case "swap": this.iswap.apply(this, this._actionq[j][1]) ; break
				case "flip": this.iflip.apply(this, this._actionq[j][1]) ; break
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

// UFX.texture: procedural texture generation

// Generates canvas objects with a variety of procedural textures.
// Basic usage:
// var texture = UFX.texture.gravel()

// Functions take optional option arguments, so you can tweak it to make it look just right:
// var texture = UFX.texture.gravel({ size: 400, gmin: 0, gmax: 100 })

// Textures that use coherent noise require the UFX.noise module be included.

// TODO: add documentation to the unifac wiki

"use strict"
var UFX = UFX || {}

UFX.texture = {
    joinobj: function (obj0, obj1) {
        var obj = Object.create(obj1)
        if (!obj0) return obj
        for (var s in obj0) obj[s] = obj0[s]
        return obj
    },
    // Return an object whose properties are taken from the first object in the list
    //   that has that property defined
    // This may create some objects with pretty long prototype chains, but who cares?
    reduceargs: function (args) {
        if (args.length == 0) return {}
        var obj = args[0] || {}
        for (var j = 1 ; j < args.length ; ++j) {
            if (args[j]) obj = this.joinobj(obj, args[j])
        }
        return obj
    },
    // Create a canvas of the given dimensions and some corresponding pixel data in canvas.data.
    // When you're done, call canvas.applydata to copy the data back into the canvas.
    makecanvas: function (w, h) {
        var canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        canvas.context = canvas.getContext("2d")
        var idata = canvas.context.createImageData(w, h)
        canvas.data = idata.data
        canvas.applydata = function () {
            canvas.context.putImageData(idata, 0, 0)
            delete canvas.data
        }
        return canvas
    },
    // Static
    stat: function () {
        var obj = this.reduceargs(arguments)
        var w = obj.width || obj.size || 256
        var h = obj.height || obj.size || 256
        var rmin = obj.rmin || 0, rmax = "rmax" in obj ? obj.rmax : 256
        var gmin = obj.gmin || 0, gmax = "gmax" in obj ? obj.gmax : 256
        var bmin = obj.bmin || 0, bmax = "bmax" in obj ? obj.bmax : 256
        var wmin = obj.wmin || 0, wmax = obj.wmax || 0
        if (obj.seed) UFX.random.setseed(obj.seed)
        var canvas = this.makecanvas(w, h), data = canvas.data
        for (var j = 0 ; j < w*h*4 ; j += 4) {
            var white = wmax && UFX.random.rand(wmin, wmax)
            data[j] = white + (rmax && UFX.random.rand(rmin, rmax))
            data[j+1] = white + (gmax && UFX.random.rand(gmin, gmax))
            data[j+2] = white + (bmax && UFX.random.rand(bmin, bmax))
            data[j+3] = 255
        }
        canvas.applydata()
        return canvas
    },
    grass: function () {
        return this.stat(this.reduceargs(arguments), {
            rmin: 20, rmax: 60,
            gmin: 100, gmax: 140,
            bmin: 0, bmax: 20,
        })
    },
    deadgrass: function () {
        return this.stat(this.reduceargs(arguments), {
            wmin: 100, wmax: 120,
            rmin: 80, rmax: 100,
            gmin: 80, gmax: 100,
            bmin: 0, bmax: 0,
        })
    },
    dirt: function () {
        return this.stat(this.reduceargs(arguments), {
            rmin: 90, rmax: 120,
            gmin: 90, gmax: 120,
            bmin: 0, bmax: 10,
        })
    },
    gravel: function () {
        return this.stat(this.reduceargs(arguments), {
            wmin: 60, wmax: 200,
            rmin: 0, rmax: 10,
            gmin: 0, gmax: 10,
            bmin: 0, bmax: 10,
        })
    },
    // Spots
    spots: function () {
        var obj = this.reduceargs(arguments)
        var w = obj.width || obj.size || 256
        var h = obj.height || obj.size || 256
        var rmin = obj.rmin || 0, rmax = obj.rmax || 256
        var gmin = obj.gmin || 0, gmax = obj.gmax || 256
        var bmin = obj.bmin || 0, bmax = obj.bmax || 256
        var wmin = obj.wmin || 0, wmax = obj.wmax || 0
        var nspots = 10000
        if (obj.seed) UFX.random.setseed(obj.seed)
        var canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        var context = canvas.getContext("2d")
        context.globalAlpha = obj.alpha || 0.1
        for (var j = 0 ; j < nspots ; ++j) {
            var white = wmax && UFX.random.rand(wmin, wmax)
            var r = white + UFX.random.rand(rmin, rmax)
            var g = white + UFX.random.rand(gmin, gmax)
            var b = white + UFX.random.rand(bmin, bmax)
            var x = UFX.random(w), y = UFX.random(h)
            var R = 20
            context.fillStyle = "rgb(" + r + "," + g + "," + b + ")"
            context.beginPath()
            context.arc(x, y, R, 0, 2*Math.PI)
            context.fill()
        }
        return canvas
    },
    
    // Perlin noise
    noisedata: function () {
        var obj = this.reduceargs(arguments)
        var w = obj.width || obj.size || 256
        var h = obj.height || obj.size || 256
        var xscale = obj.xscale || obj.scale || 8
        var yscale = obj.yscale || obj.scale || 8
        var fraclevel = obj.fraclevel || 0
        if (obj.seed) UFX.random.setseed(obj.seed)
        var zscale = 256
        var xoffset = ("xoffset" in obj) ? obj.xoffset : UFX.random(xscale)
        var yoffset = ("yoffset" in obj) ? obj.yoffset : UFX.random(yscale)
        var zoffset = ("zoffset" in obj) ? obj.zoffset : UFX.random(zscale)
        var ndata = UFX.noise.wrapslice([w, h], zoffset, [xscale, yscale, zscale], [xoffset, yoffset])
        if (fraclevel) UFX.noise.fractalize(ndata, [w, h], fraclevel)
        return ndata
    },

    roughshade: function () {
        var obj = this.reduceargs(arguments)
        var w = obj.width || obj.size || 256
        var h = obj.height || obj.size || 256
        var color = obj.color || [0, 0, 0]
        var alpha0 = obj.alpha0 || 100
        var ascale = obj.ascale || 50
        var r = color[0], g = color[1], b = color[2]
        var canvas = this.makecanvas(w, h), data = canvas.data
        var ndata = this.noisedata(obj, {scale: 64})
        for (var y = 0, j = 0, k = 0 ; y < h ; ++y) {
            for (var x = 0 ; x < w; ++x, j += 4, ++k) {
                var dx = ndata[y*w+(x+1)%w] - ndata[y*w+(x+w-1)%w]
                var dy = ndata[(y+1)%h*w+x] - ndata[(y+h-1)%h*w+x]
                data[j] = r
                data[j+1] = g
                data[j+2] = b
                data[j+3] = alpha0 + ascale * (2 * dx + dy)
            }
        }
        canvas.applydata()
        return canvas
    },

    stone: function () {
        var obj = this.reduceargs(arguments)
        var w = obj.width || obj.size || 256
        var h = obj.height || obj.size || 256
        var color = obj.color || [120, 120, 120]
        var canvas = this.makecanvas(w, h), data = canvas.data
        var ndata = this.noisedata(obj)
        for (var j = 0, k = 0 ; k < w*h ; j += 4, ++k) {
            var v = 150
            v += Math.max(Math.min(1000 * (ndata[k]), 30), -30)
            v += Math.max(100 - 8000 * Math.abs(ndata[k]), 0)
            data[j] = v * color[0] / 255.
            data[j+1] = v * color[1] / 255.
            data[j+2] = v * color[2] / 255.
            data[j+3] = 255
        }
        canvas.applydata()
        return canvas
    },

	terrain: function () {
        var obj = this.reduceargs(arguments)
        var w = obj.width || obj.size || 256
        var h = obj.height || obj.size || 256
		// Terrain heightmap color gradient:
		// http://libnoise.sourceforge.net/tutorials/tutorial3.html
		var tgrad = obj.tgrad || [[-1.00, 0, 0, 192], // deeps
		                          [-0.35, 0, 0, 255], // shallow
		                          [-0.10, 0, 128, 255], // shore
		                          [-0.04, 240, 240, 64], // sand
		                          [0.08, 32, 160, 0], // grass
		                          [0.35, 160, 160, 0], // dirt
		                          [0.50, 128, 128, 128], // rock
		                          [0.70, 255, 255, 255], // snow
		], ngrad = tgrad.length
		var sealevel = "sealevel" in obj ? obj.sealevel : -0.10
		var shadecolor = obj.shadecolor || [0, 0, 0]
		var sr = shadecolor[0], sg = shadecolor[1], sb = shadecolor[2]
		var shadex = obj.shadex || 0, shadey = obj.shadey || 0
		var shadefactor = (shadex || shadey) && 2 * Math.exp(obj.shadefactor || 0) / Math.sqrt(shadex*shadex + shadey*shadey)
		var canvas = this.makecanvas(w, h), data = canvas.data
		var ndata = this.noisedata(obj, {fraclevel: 3, scale: 8})
		function terrainmap(v) {
			if (v <= tgrad[0][0]) return [tgrad[0][1], tgrad[0][2], tgrad[0][3]]
			for (var j = 0 ; j < ngrad - 1 ; ++j) {
				var tgrad0 = tgrad[j], tgrad1 = tgrad[j+1]
				if (v >= tgrad0[0] && v < tgrad1[0]) {
				var f = (v - tgrad0[0]) / (tgrad1[0] - tgrad0[0]), g = 1 - f
				return [tgrad1[1]*f + tgrad0[1]*g,
						tgrad1[2]*f + tgrad0[2]*g,
						tgrad1[3]*f + tgrad0[3]*g]
				}
			}
			return [tgrad[ngrad-1][1], tgrad[ngrad-1][2], tgrad[ngrad-1][3]]
		}
		for (var y = 0, j = 0, k = 0 ; y < h ; ++y) {
			for (var x = 0 ; x < w; ++x, j += 4, ++k) {
				var v = ndata[k]
				var color = terrainmap(v)
				if (shadefactor && v > sealevel) {
					var dx = ndata[y*w+(x+1)%w] - ndata[y*w+(x+w-1)%w]
					var dy = ndata[(y+1)%h*w+x] - ndata[(y+h-1)%h*w+x]
					var f = 1 + (shadex * dx + shadey * dy) * shadefactor, g = 1 - f
					color[0] = f * color[0] + g * shadefactor
					color[1] = f * color[1] + g * shadefactor
					color[2] = f * color[2] + g * shadefactor
				}
				data[j] = color[0]
				data[j+1] = color[1]
				data[j+2] = color[2]
				data[j+3] = 255
			}
		}
		canvas.applydata()
		return canvas
	},
    
    clouds: function () {
        var obj = this.reduceargs(arguments)
        var w = obj.width || obj.size || 256
        var h = obj.height || obj.size || 256
        var color = obj.color || [200, 200, 200]
        var r = color[0], g = color[1], b = color[2]
        var sharpness = obj.sharpness || 0
        var coverage = (obj.coverage || 0.4) - 0.5
        var shadecolor = obj.shadecolor || [0, 0, 0]
        var sr = shadecolor[0], sg = shadecolor[1], sb = shadecolor[2]
        var shadex = obj.shadex || 0, shadey = obj.shadey || 0
        var shadefactor = (shadex || shadey) && 0.002 * Math.exp(obj.shadefactor || 0) / Math.sqrt(shadex*shadex + shadey*shadey)
        var afactor = 4000 * Math.exp(sharpness)
        var canvas = this.makecanvas(w, h), data = canvas.data
        var ndata = this.noisedata(obj, {fraclevel: 2})
        for (var y = 0, j = 0, k = 0 ; y < h ; ++y) {
            for (var x = 0 ; x < w; ++x, j += 4, ++k) {
                var a = (ndata[k] + coverage) * afactor + 128
                data[j+3] = a
                if (shadefactor) {
                    var a2 = (ndata[((x+shadex)%w) + ((y+shadey)%h)*w] + coverage) * afactor + 128
                    var f = Math.min(Math.max(shadefactor * (a - a2), 0), 1)
                    var d = 1 - f
                    data[j] =   r*d + sr*f
                    data[j+1] = g*d + sg*f
                    data[j+2] = b*d + sb*f
                } else {
                    data[j] =   r
                    data[j+1] = g
                    data[j+2] = b
                }
            }
        }
        canvas.applydata()
        return canvas
    },
    
    overcast: function () {
        var obj = this.reduceargs(arguments)
        var w = obj.width || obj.size || 256
        var h = obj.height || obj.size || 256
        var r0 = "r0" in obj ? obj.r0 : 160, dr = "dr" in obj ? obj.dr : 80
        var g0 = "g0" in obj ? obj.g0 : 160, dg = "dg" in obj ? obj.dg : 80
        var b0 = "b0" in obj ? obj.b0 : 160, db = "db" in obj ? obj.db : 80
        var a0 = "a0" in obj ? obj.a0 : 255, da = "da" in obj ? obj.da : 0
        var canvas = this.makecanvas(w, h), data = canvas.data
        var ndata = this.noisedata(obj, {fraclevel: 2, scale: 8})
        for (var j = 0, k = 0 ; k < w*h ; j += 4, ++k) {
            var v = ndata[k]
            data[j] = r0 + v*dr
            data[j+1] = g0 + v*dg
            data[j+2] = b0 + v*db
            data[j+3] = a0 + v*da
        }
        canvas.applydata()
        return canvas
    },
    // needs work
    ocean: function () {
        return this.overcast(this.reduceargs(arguments), {
            r0: 40, dr: 30, g0: 40, dg: 30, b0: 160, db: 60,
        })
    },

    marble: function () {
        var obj = this.reduceargs(arguments)
        var w = obj.width || obj.size || 256
        var h = obj.height || obj.size || 256
        var xfactor = "xfactor" in obj ? obj.xfactor : 1
        var yfactor = "yfactor" in obj ? obj.yfactor : 2
        var coverage = (obj.coverage || 1.5) - 0.5
        var distortion = 3 * Math.exp(obj.distortion || 0)
        var cf = Math.min(30 * Math.exp(obj.cloudiness || 0), 250), df = 255 - cf
        var vfactor = 1000 * Math.exp(obj.sharpness || 0)
        var canvas = this.makecanvas(w, h), data = canvas.data
        var ndata = this.noisedata(obj, {fraclevel: 3, scale: 8})
        var xf = 2 * Math.PI * xfactor / w
        var yf = 2 * Math.PI * yfactor / h
        for (var y = 0, j = 0, k = 0 ; y < h ; ++y) {
            for (var x = 0 ; x < w; ++x, j += 4, ++k) {
                var v = ndata[k]
                v = Math.abs(Math.sin(distortion * v + xf * x + yf * y))
                v = Math.min(v * vfactor, df) + v * cf
                data[j] = v
                data[j+1] = v
                data[j+2] = v
                data[j+3] = 255
            }
        }
        canvas.applydata()
        return canvas
    },
    
    nightsky: function () {
        var obj = this.reduceargs(arguments)
        var canvas = this.overcast(obj, {
            r0: 0, dr: 0, g0: 0, dg: 10, b0: 20, db: 20,
        })
        var w = canvas.width, h = canvas.height
        var nstars = Math.floor(("density" in obj ? obj.density : 1) * w * h / 500)
        var spread = "spread" in obj ? obj.spread : 0.15
        var rstar0 = "rstar0" in obj ? obj.rstar0 : 0.0
        var rstar1 = "rstar1" in obj ? obj.rstar1 : 0.8
        var c = canvas.context
        c.beginPath()
        UFX.random.spread(nstars, spread).forEach(function (star) {
        	var x = star[0]*w, y = star[1]*h
        	c.moveTo(x, y)
            c.arc(x, y, UFX.random(rstar0, rstar1), 0, 2*Math.PI)
        })
        c.fillStyle = "white"
        c.fill()
        return canvas
    },    
    
    // Perlin noise + static
    noisestat: function () {
        var obj = this.reduceargs(arguments)
        var w = obj.width || obj.size || 256
        var h = obj.height || obj.size || 256
        var rmin = obj.rmin || 0, rmax = "rmax" in obj ? obj.rmax : 256
        var gmin = obj.gmin || 0, gmax = "gmax" in obj ? obj.gmax : 256
        var bmin = obj.bmin || 0, bmax = "bmax" in obj ? obj.bmax : 256
        var wmin = obj.wmin || 0, wmax = obj.wmax || 0
        var dr = "dr" in obj ? obj.dr : 0
        var dg = "dg" in obj ? obj.dg : 0
        var db = "db" in obj ? obj.db : 0
        var dw = "dw" in obj ? obj.dw : 0
        if (obj.seed) UFX.random.setseed(obj.seed)
        var ndata = this.noisedata(obj)
        var canvas = this.makecanvas(w, h), data = canvas.data
        for (var j = 0, k = 0 ; k < w*h ; j += 4, ++k) {
            var white = wmax && UFX.random.rand(wmin, wmax) + v*dw
            var v = ndata[k]
            data[j] = white + (rmax && UFX.random.rand(rmin, rmax)) + v*dr
            data[j+1] = white + (gmax && UFX.random.rand(gmin, gmax)) + v*dg
            data[j+2] = white + (bmax && UFX.random.rand(bmin, bmax)) + v*db
            data[j+3] = 255
        }
        canvas.applydata()
        return canvas
    },
    
    patchygrass: function () {
        return this.noisestat(this.reduceargs(arguments), {
            wmin: 40, wmax: 80, dw: -40,
            rmin: 0, rmax: 20, dr: -40,
            gmin: 60, gmax: 90, dg: 40,
            bmin: 0, bmax: 10,
        })
    },
    patchydirt: function () {
        return this.noisestat(this.reduceargs(arguments), {
            wmin: 40, wmax: 80, dw: -20,
            rmin: 60, rmax: 80, dr: 60,
            gmin: 20, gmax: 40, dg: 80,
            bmin: 0, bmax: 4,
        })
    },
    cement: function () {
        return this.noisestat(this.reduceargs(arguments), {
            wmin: 120, wmax: 160, dw: 40,
            rmin: 0, rmax: 10,
            gmin: 0, gmax: 10,
            bmin: 0, bmax: 10,
        })
    },

	// Add a buffer around a canvas to avoid edge effects when tiling scaled
	buffertile: function (canvas, buffersize) {
		var b = buffersize || 20, w = canvas.width, h = canvas.height
		var bcanvas = document.createElement("canvas")
		bcanvas.width = w + 2 * b
		bcanvas.height = h + 2 * b
		bcanvas.context = bcanvas.getContext("2d")
		for (var ix = -1 ; ix < 2 ; ++ix) {
			for (var iy = -1 ; iy < 2 ; ++iy) {
				bcanvas.context.drawImage(canvas, b + w * ix, b + h * iy)
			}
		}
		bcanvas.drawclip = function (context, x, y) {
			context.save()
			context.translate(x || 0, y || 0)
			context.beginPath()
			// Adding 0.01 to the control points seems to take care of some edge rounding issue in touchnav test
			// 0.001 is not enough
			context.moveTo(0, 0)
			context.lineTo(w + 0.01, 0)
			context.lineTo(w + 0.01, h + 0.01)
			context.lineTo(0, h + 0.01)
			context.closePath()
			context.clip()
			context.drawImage(bcanvas, -b, -b)
			context.restore()
		}
		return bcanvas
	},
}

// Something that lets you draw a tiled canvas zoomed in without seams or edge effects
UFX.texture.tiler = function (canvas, buffer, nx0, ny0) {
	if (!(this instanceof UFX.texture.tiler))
		return new UFX.texture.tiler(canvas, buffer, nx0, ny0)
	this.canvas = canvas
	this.buffer = buffer || 2
	this.nx = this.ny = 0
	this.makechart(nx0 || 1, ny0 || 1)
}
UFX.texture.tiler.prototype = {
	draw: function (context, x, y, w, h) {
		if (w === undefined) {
			w = x ; h = y ; x = 0 ; y = 0
		}
		var b = this.buffer, cx = this.canvas.width, cy = this.canvas.height
		var x0 = ((x-b)%cx+cx)%cx+b, x1 = x0 + w
		var y0 = ((y-b)%cy+cy)%cy+b, y1 = y0 + h
		this.makechart(Math.floor((x1+b)/cx)+1, Math.floor((y1+b)/cy)+1)
		context.save()
		context.translate(x || 0, y || 0)
		context.beginPath()
		context.moveTo(0, 0)
		context.lineTo(w, 0)
		context.lineTo(w, h)
		context.lineTo(0, h)
		context.closePath()
		context.clip()
		context.drawImage(this.chart, -x0, -y0)
		context.restore()
	},
	makechart: function (nx, ny) {
		if (nx <= this.nx && ny <= this.ny) return
		this.nx = Math.max(nx, this.nx)
		this.ny = Math.max(ny, this.ny)
		this.chart = document.createElement("canvas")
		this.chart.width = this.canvas.width * this.nx
		this.chart.height = this.canvas.height * this.ny
		var context = this.chart.getContext("2d")
		for (var j = 0 ; j < this.nx ; ++j) {
			for (var k = 0 ; k < this.ny ; ++k) {
				context.drawImage(this.canvas, j*this.canvas.width, k*this.canvas.height)
			}
		}
	},	
}




// UFX.Thing: component-based entity system
// https://github.com/cosmologicon/UFX/wiki/UFX.Thing

"use strict"
var UFX = UFX || {}

// Thing factory/constructor.
// Takes a Component or a list of Components
UFX.Thing = function () {
	var thing = Object.create(UFX.Thing.prototype)
	for (var j = 0 ; j < arguments.length ; ++j) {
		thing.addcomp(arguments[j])
	}
	return thing
}
UFX.Thing.prototype = {
	// Create a method with the given spec
	// mname: method name (string)
	// mtype: method type (string, or reduce function, or null for default)
	// mlist: list of component methods
	_createmethod: function (mname, mtype, mlist) {
		mlist = mlist || []
		var f
		if (mtype === "sum") mtype = function (x, y) { return x + y }
		if (mtype === "min") mtype = function (x, y) { return Math.min(x, y) }
		if (mtype === "max") mtype = function (x, y) { return Math.max(x, y) }
		if (!mtype) {
			f = function () {
				var r
				for (var j = 0 ; j < mlist.length ; ++j) {
					r = mlist[j].apply(this, arguments)
				}
				return r
			}
		} else if (mtype === "some") {
			f = function () {
				var r = null
				for (var j = 0 ; j < mlist.length ; ++j) {
					r = mlist[j].apply(this, arguments)
					if (r) return r
				}
				return r
			}
		} else if (mtype === "every") {
			f = function () {
				var r
				for (var j = 0 ; j < mlist.length ; ++j) {
					r = mlist[j].apply(this, arguments)
					if (!r) return r
				}
				return r
			}
		} else if (mtype === "getarray") {
			f = function () {
				var r = []
				for (var j = 0 ; j < mlist.length ; ++j) {
					r.push(mlist[j].apply(this, arguments))
				}
				return r
			}
		} else if (mtype === "putarray") {
			f = function (arg) {
				var r = []
				for (var j = 0 ; j < mlist.length ; ++j) {
					r.push(mlist[j].apply(this, arg[j]))
				}
				return r
			}
		} else if (mtype instanceof Function) {
			f = function () {
				var r = []
				for (var j = 0 ; j < mlist.length ; ++j) {
					r.push(mlist[j].apply(this, arguments))
				}
				return r.reduce(mtype)
			}
		} else {
			throw "Unrecognized method type: " + mtype
		}
		f.mlist = mlist
		f.mtype = mtype
		this[mname] = f
	},
	definemethod: function (mname, mtype) {
		if (this[mname]) return this
		this._createmethod(mname, mtype)
		return this
	},
	addcomp: function (comp) {
		if (comp instanceof Array) {
			var args = [].slice.apply(arguments)
			for (var j = 0 ; j < comp.length ; ++j) {
				args[0] = comp[j]
				this.addcomp.apply(this, args)
			}
			return this
		}
		for (var mname in comp) {
			if (typeof comp[mname] != "function") continue
			if (mname == "init" || mname == "remove") continue
			this.definemethod(mname)
			this[mname].mlist.push(comp[mname])
		}
		if (comp.init) {
			comp.init.apply(this, [].slice.call(arguments, 1))
		}
		return this
	},
	removecomp: function (comp) {
		if (comp instanceof Array) {
			var args = [].slice.apply(arguments)
			for (var j = 0 ; j < comp.length ; ++j) {
				args[0] = comp[j]
				this.removecomp.apply(this, args)
			}
			return this
		}
		if (comp.init) {
			comp.init.apply(this, [].slice.call(arguments, 1))
		}
		for (var mname in comp) {
			if (typeof comp[mname] != "function") continue
			if (mname == "init" || mname == "remove") continue
			if (!this[mname]) continue
			this.definemethod(mname)
			this[mname].mlist = this[mname].mlist.filter(function (m) { return m !== comp[mname] })
		}
		return this
	},
	reversemethods: function (mname) {
		this[mname].mlist.reverse()
		return this
	},
	setmethodmode: function (mname, mtype) {
		this._createmethod(mname, mtype, (this[mname] ? this[mname].mlist : []))
		return this
	},
	normalize: function () {
		for (var mname in this) {
			if (!this.hasOwnProperty(mname)) continue
			var func = this[mname]
			if (!func.mlist || func.mlist.length != 1) continue
			if (func.mtype === "getarray" || func.mtype === "putarray") continue
			this[mname] = func.mlist[0]
		}
	},
}

// UFX.ticker: handle game loop

// Suggested that you use the UFX.scene module along with this one, in which case you never need
// to call any UFX.ticker methods. If you wish to use UFX.ticker manually:
// 1. Call UFX.ticker.init(think) or UFX.ticker.init(think, draw) to kick off the game loop.
// 2. think is a callback that optionally takes one argument, dt, time elapsed this update.
// 3. draw (optional) is a callback

// UFX.ticker by default aims for 30fps. This can be set to a variety of possibilities with options.
// You can check on the actual framerate achieved with UFX.ticker.getrates()

// For more options, see the documentation:
// https://code.google.com/p/unifac/wiki/UFXDocumentation#UFX.ticker_:_game_loop_management

"use strict"
var UFX = UFX || {}

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
		cfac: null,    // Counter update factor (defaults to 1 / minups)
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
		this.resetcounters()
		this._running = true
		this._tick()
	},
	stop: function () {
		if (this._shandle) window.cancelAnimationFrame(this._shandle)
		if (this._thandle) clearTimeout(this._thandle)
		this._shandle = this._thandle = null
		this._running = false
	},
	// Reset the FPS counters etc.
	resetcounters: function () {
		this._accumulator = 0  // accumulated wall time for update
		this._dtu = 0  // average wall dt between updates (ms)
		this._dtg = 0  // average game dt between updates (ms)
		this._dtf = 0  // average wall dt between frames (ms)
		this._tu = 0  // average duration of update callbacks (ms)
		this._tu0 = 0  // average duration of 0-index update callbacks (ms)
		this._tf = 0  // average duration of render callbacks (ms)
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
			[
				this._tu.toFixed(1),
				this._tu0.toFixed(1),
				this._tf.toFixed(1),
			].join("/") + "ms",
		].join(" ")
	},

	// Where the magic happens.
	// Calls the think callback 0 or more times, and the draw callback 0 or 1 time.
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
		var cfac = this.cfac || 1 / minups
		
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
		} else {
			// Choose the number of updates and length of each update so as to
			//   maximize the amount of accumulated time consumed, and then to
			//   minimize the number of updates, subject to the constraints
			var n = Math.floor(this._accumulator * minups)
			if ((n + 1) / maxups <= this._accumulator) n += 1
			nthink = Math.max(Math.min(n, maxupf), minupf)
			dt = Math.min(nthink / minups, this._accumulator)
			dtmin = Math.max(minupf, 1) / maxups
		}

		// Invoke the think callback
		if (nthink) {
			this._accumulator -= dt
			now = Date.now()
			this._dtu = (1 - cfac * nthink) * this._dtu + cfac * 0.001 * (now - this._lastthink)
			this._dtg = (1 - cfac * nthink) * this._dtg + cfac * dt
			this._lastthink = now
			dt /= nthink
			for (var jthink = 0 ; jthink < nthink ; ++jthink) {
				var tstart = Date.now()
				this._tcallback.call(this.cthis, dt, jthink, nthink)
				var tu = Date.now() - tstart
				this._tu = (1 - cfac) * this._tu + cfac * tu
				if (jthink == 0) this._tu0 = (1 - cfac) * this._tu0 + cfac * tu
			}
		}

		// Invoke the draw callback
		if (dodraw && this._dcallback) {
			var f = this._accumulator * minups
			var tstart = Date.now()
			this._dcallback.call(this.cthis, f)
			now = Date.now()
			this._dtf = (1 - cfac) * this._dtf + cfac * 0.001 * (now - this._lastdraw)
			this._lastdraw = now
			this._tf = (1 - cfac) * this._tf + cfac * (now - tstart)
		}

		// Accumulators should never be allowed to stay over 1 update
		this._accumulator = Math.max(Math.min(this._accumulator, dtmin), 0)
		// TODO: reconsider the margin for accumulator amounts close to 0

		// Update frame rate counters
		this.wups = 1 / this._dtu
		this.wfps = this._dcallback ? 1 / this._dtf : this.wups
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
			var nexttick = this._lasttick + 1000 * (dtmin - this._accumulator)
			var delay = Math.max(Math.ceil(nexttick - Date.now()), this.delay)
		    this._thandle = window.setTimeout(callback, delay)
		}
	},
}


// UFX.touch: touch and multitouch event handling

// Still working out the API on this one. I don't really have a handle on touch events yet.
// Use with caution.

// Basically, though, I'm trying to make it mostly similar to UFX.muose.

// Basic usage:
// 1. Call UFX.touch.init(canvas)
// 2. Each frame call: var tstate = UFX.touch.state()

// TODO: add documentation to unifac wiki

"use strict"
var UFX = UFX || {}

UFX.touch = {
	// Some options
	capture: {
		start: true,
		end: true,
		tap: true,
		hold: true,
		swipe: true,
		release: true,
	},
	active: true,
	multi: true,
	touchmax: 0,
	tmulti: 100,
	usetouchid: true,
	ps: [],
	qtap: true,
	qdrag: true,
	thold: 300,
	roundpos: true,
	dmove: 50,
	_events: [],
	_mtouch: 0,  // max touches during current event
	_touches: {},  // info on all current touches
	_tkeys: [],   // valid keys for the _touches object
	_ntouches: 0,  // number of touches seen, used to give each a unique identifier
	init: function (element, backdrop) {
		this._captureevents(element, backdrop)
	},
	events: function () {
		this._checkhold()
		var e = this._events
		this._events = []
		return e
	},
	state: function () {
		var state = {
			ps: {},
			deltas: {},
		}
		var capture = this.capture, utid = this.usetouchid
		for (var type in capture) state[type] = []
		this.events().forEach(function (event) {
			if (!capture[event.type]) return
			var id = utid ? event.touchid : event.id, obj
			if (event.type == "tap") {
				obj = { dt: event.dt }
			} else if (event.type == "release") {
				obj = { dt: event.dt, v: event.v, multi: event.multi, }
			} else {
				obj = {}
			}
			obj.id = id
			obj.pos = event.pos
			obj.t = event.t
			state[event.type].push(obj)
		})
		state.ids = []
		for (var id in this._touches) {
			var touch = this._touches[id], tid = utid ? touch.touchid : id
			if (!touch.followed) continue
			state.ids.push(tid)
			var pos = touch.pos, opos = touch.opos
			state.ps[tid] = pos
			state.deltas[tid] = [pos[0] - opos[0], pos[1] - opos[1]]
			touch.ot = touch.t
			touch.opos = pos
		}
		state.ids.sort()
		return state
	},
	// static method. Pass it a state and get an object and get info about two-touch motions
	twotouchstate: function (state) {
		if (state.ids.length != 2) return null
		// convention: lowercase is first finger, uppercase is second finger
		var id = state.ids[0], ID = state.ids[1]
		var x1 = state.ps[id][0], y1 = state.ps[id][1]
		var X1 = state.ps[ID][0], Y1 = state.ps[ID][1]
		var dx1 = X1-x1, dy1 = Y1-y1
		var r1 = Math.sqrt(dx1*dx1+dy1*dy1)
		var theta1 = r1 ? Math.atan2(dy1,dx1) : 0
		var x0 = x1-state.deltas[id][0], y0 = y1-state.deltas[id][1]
		var X0 = X1-state.deltas[ID][0], Y0 = Y1-state.deltas[ID][1]
		var dx0 = X0-x0, dy0 = Y0-y0
		var r0 = Math.sqrt(dx0*dx0+dy0*dy0)
		var theta0 = r0 ? Math.atan2(dy0,dx0) : 0
		return {
			center: [(x1+X1)/2, (y1+Y1)/2],
			dcenter: [(x1+X1-x0-X0)/2, (y1+Y1-y0-Y1)/2],
			r: r1,
			dr: r1-r0,
			rratio: r0 ? r1/r0 : 1,
			theta: theta1,
			dtheta: theta1-theta0,
		}
	},
	_captureevents: function (element, backdrop) {
		element = element || document
		backdrop = backdrop || document
		if (typeof element == "string") element = document.getElementById(element)
		if (typeof backdrop == "string") backdrop = document.getElementById(backdrop)
		//backdrop.addEventListener("blur", UFX.mouse._onblur, true)
		// TODO: add these instead of replacing the event handlers
		function c(obj, mname) { return function (event) { obj[mname](event) } }
		element.ontouchstart = c(this, "_ontouchstart")
		element.ontouchmove = c(this, "_ontouchmove")
		element.ontouchend = c(this, "_ontouchend")
//		backdrop.ontouchmove = element.ontouchmove

		this._element = element
		this._backdrop = backdrop
	},
	_addevent: function (type, id, touchid, obj) {
		if (this.capture[type] && this._touches[id].followed) {
			obj.type = type
			obj.id = id
			obj.touchid = touchid
			this._events.push(obj)
		}
	},
	_handlestart: function (touch) {
		if (!this.active) return
		var id = touch.identifier, touchid = this._ntouches++
		var pos = this._eventpos(touch), t = Date.now()
		this._touches[id] = {
			id: id,   // ID as assigned by the DOM
			touchid: touchid,  // ID as assigned by UFX.touch (will be unique)
			t0: t,  // time of touchstart
			pos0: pos,  // position of touchstart
			tlast: t,  // time of last reconciliation
			poslast: pos,  // position of last reconciliation
			ot: t,  // time of last observation (via UFX.touch.state)
			opos: pos,  // position of last observation
			t: t,  // time of last update
			pos: pos,  // position of last update
			moved: false,  // has the touch moved at all?
			followed: true,  // are we registering events for this touch?
			held: false,  // has this touch registered a hold event?
			multi: 1,  // other touches co-generating multitouch events with this one
			multit0: t,
			vx: 0,
			vy: 0,
		}
		this._settkeys()
		if (this.touchmax && this._tkeys.length > this.touchmax) {
			this._touches[id].followed = false
		}
		this._addevent("start", id, touchid, {
			pos: pos,
			t: t,
		})
		if (this.multi) {
			//this._syncmulti(id)
		}
	},
	// Associate this touch with any other touches that were made at the same time.
/*	_syncmulti: function (id) {
		var t = this._touches[id].t0
		var tmstart = t - this.tmulti, mtouches = [], multit0 = t
		for (var k in this._touches) {
			if (k == id || this._touches[k].multit0 + this.tmstart < t) continue
			mtouches.push(this._touches[k])
		}
		if (mtouches.length == 0) return
		for (var j = 0 ; j < mtouches.length ; ++j) {
			var mmulti = this._touches[mtouches[j]].multi
			if (!mmulit
			
		}
	}, */
	_handlemove: function (touch) {
		if (!this.active) return
		var id = touch.identifier
		if (!this._touches[id]) this._handlestart(touch)
		var tobj = this._touches[id]
		var pos = this._eventpos(touch), t = Date.now()
		var dt = t - tobj.t, dx = pos[0] - tobj.pos[0], dy = pos[1] - tobj.pos[1]
		var dx0 = pos[0] - tobj.pos0[0], dy0 = pos[1] - tobj.pos0[1]
		tobj.t = t
		tobj.pos = pos
		if (!tobj.moved && Math.abs(dx0) + Math.abs(dy0) > this.dmove) {
			tobj.moved = true
		}
		if (dt) {
			tobj.vx = 1000 * dx / dt + 7
			tobj.vy = 1000 * dy / dt
		}
		this._checkhold()
	},
	_handleend: function (touch) {
		if (!this.active) return
		var id = touch.identifier
		if (!this._touches[id]) return
//		this._handlemove(touch)
		var tobj = this._touches[id]
		var pos = this._eventpos(touch)
		var t = Date.now(), dt = t - tobj.t0
		this._addevent("end", tobj.id, tobj.touchid, {
			t: t,
			dt: dt,
			pos: pos,
		})
		if (!tobj.moved && !tobj.held) {
			this._addevent("tap", tobj.id, tobj.touchid, {
				t: t,
				dt: dt,
				pos: pos,
			})
		} else {
			this._addevent("release", tobj.id, tobj.touchid, {
				t: t,
				dt: dt,
				pos0: tobj.pos0,
				pos: pos,
				v: [tobj.vx, tobj.vy],
				multi: tobj.multi,
			})
		}
		delete this._touches[id]
	},
	_settkeys: function () {
		this._tkeys = []
		for (var k in this._touches) this._tkeys.push(k)
		this._tkeys.sort()
		var n = this._tkeys.length
		for (var k in this._touches) {
			this._touches[k].multi = Math.max(this._touches[k].multi, n)
		}
	},
	_checkhold: function () {
		var t = Date.now()
		for (var k in this._touches) {
			var touch = this._touches[k]
			if (touch.held || touch.moved) continue
			if (touch.t0 + this.thold > t) continue
			touch.held = true
			this._addevent("hold", touch.id, touch.touchid, {
				t: touch.t0 + this.thold,
				pos: touch.pos,
			})
		}
	},
	_ontouchstart: function (event) {
		this.ps = this._getps(event.touches)
		this._mtouch = Math.max(this._mtouch, event.touches.length)
		for (var j = 0 ; j < event.changedTouches.length ; ++j) {
			this._handlestart(event.changedTouches[j])
		}
		this._checkhold()
		event.preventDefault()
	},
	_ontouchmove: function (event) {
		this.ps = this._getps(event.touches)
		this._mtouch = Math.max(this._mtouch, event.touches.length)
		for (var j = 0 ; j < event.changedTouches.length ; ++j) {
			this._handlemove(event.changedTouches[j])
		}
		this._checkhold()
		event.preventDefault()
	},
	_ontouchend: function (event) {
		this.ps = this._getps(event.touches)
		this._mtouch = Math.max(this._mtouch, event.touches.length)
		this._checkhold()
		for (var j = 0 ; j < event.changedTouches.length ; ++j) {
			this._handleend(event.changedTouches[j])
		}
		if (!event.touches.length) this._mtouch = 0
		this._settkeys()
		event.preventDefault()
	},
	_eventpos: function (event, elem) {
		elem = elem || this._element
		var rect = elem.getBoundingClientRect()
		var ex = rect.left + elem.clientLeft - elem.scrollLeft
		var ey = rect.top + elem.clientTop - elem.scrollTop
		var x = event.clientX - ex, y = event.clientY - ey
		return this.roundpos ? [Math.round(x), Math.round(y)] : [x, y]
	},
	_getps: function(touches) {
		var ps = []
		for (var j = 0 ; j < touches.length ; ++j) {
			ps.push(this._eventpos(touches[j], this._element))
		}
		return ps
	},
}


// UFX.Tracer: cache vector graphics commands for faster rendering.

// A tracer is a tool for optimizing vector graphics via caching
// If you've got a sequence of draw commands that you're executing over and over, and you need them
// to be rendered at a variety of zoom levels, use this module to cache them to a canvas.
// UFX.draw is not required to use this module, but it is required for a couple of features.

// spec can either be a callback that performs all the drawing operations,
// or a string or array that can be passed to UFX.draw.

// TODO: add documentation to unifac wiki

"use strict"
var UFX = UFX || {}

UFX.Tracer = function (spec, rect, zmax) {
    var tracer = Object.create(UFX.Tracer.prototype)
    tracer.spec = spec
    if (typeof spec === "function") tracer.trace = spec
    tracer.x0 = rect[0]
    tracer.y0 = rect[1]
    tracer.w = rect[2]
    tracer.h = rect[3]
    tracer.zmax = zmax || 4
    tracer.imgs = {}
    tracer.showbox = false
    return tracer
}
UFX.Tracer.prototype = {
    trace: function (context) {
    	if (typeof this.spec == "function") {
    		this.spec(context)
        } else if (context) {
            UFX.draw(context, this.spec)
        } else {
            UFX.draw(this.spec)
        }
    },
    choosez: function (zoom) {
        if (zoom > this.zmax) return null
        var z = 1
        while (zoom > z) z *= 2
        while (zoom < z/2) z /= 2
        return z
    },
    draw: function (zoom, context) {
        var z = this.choosez(zoom || 1)
        if (!z) {
            this.trace(context)
        } else {
            if (!(z in this.imgs)) this.makeimg(z)
            context = context || UFX.draw._context
            if (UFX.Tracer.showbox || this.showbox) {
                context.fillStyle = "rgba(255,128,0,0.3)"
                context.fillRect(this.x0, this.y0, this.w, this.h)
            }
            if (z == 1) {
                context.drawImage(this.imgs[1], this.x0, this.y0)
            } else {
                context.save()
                context.scale(1/z, 1/z)
                context.drawImage(this.imgs[z], this.x0*z, this.y0*z)
                context.restore()
            }
        }
    },
    makeimg: function (z) {
        var img = document.createElement("canvas")
        img.width = this.w * z
        img.height = this.h * z
        var con = img.getContext("2d")
        con.save()
        con.scale(z, z)
        con.translate(-this.x0, -this.y0)
        this.trace(con)
        con.restore()
        this.imgs[z] = img
    },
}



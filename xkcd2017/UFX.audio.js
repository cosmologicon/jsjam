// Web AudioContext convenience functions.
// This is not a wrapper library. It just aims to simplify some of the syntax for playing sounds.

"use strict"

var UFX = UFX || {}
UFX.audio = {
	context: null,
	// Override this if you want UFX.audio to use polyfill.
	newcontext: function () {
		return new AudioContext()
	},
	// Set UFX.audio.context, either to the given audio context, or to a new one.
	setcontext: function (acontext) {
		this.context = acontext || this.newcontext()
		this.nodes.context = this.context
	},
	// Call to begin. Can optionally set the context to an AudioContext object. If none is specified
	// then one will be generated.
	init: function (acontext) {
		this.nodes = {}
		this._nextjnode = 0
		this.buffers = {}
		this.setcontext(acontext)
	},
	// Get the desired name of a node. If the opts don't specify one, then return a number that is
	// not currently in use.
	_getnodename: function (opts) {
		opts = opts || {}
		if (opts.name) return opts.name
		while (this.nodes[this._nextjnode]) ++this._nextjnode
		return this._nextjnode++
	},
	// Add the given node to this.nodes and return it. If nodename is unspecified then a free name
	// will be chsen.
	_addnode: function (node, nodename) {
		if (nodename === undefined) nodename = this._getnodename()
		this.nodes[nodename] = node
		node.name = nodename
		return node
	},
	// Create a buffer source with the given buffer or buffer name and play it immediately.
	playbuffer: function (buffer, opts) {
		opts = opts || {}
		var node = this.makebuffernode(buffer, opts)
		node.start(this.context.currentTime + (opts.dt || 0))
	},
	// Retrieve the node corresponding to the given node or node name.
	_getnode: function (nodename) {
		var node
		if (nodename instanceof AudioNode) {
			node = nodename
		} else {
			node = this.nodes[nodename]
			if (!node) throw "Unrecognized node " + nodename
		}
		return node
	},
	// Retrieve the AudioBuffer object corresponding to the given buffer or buffer name.
	_getbuffer: function (buffername) {
		var buffer
		if (buffername instanceof AudioBuffer) {
			buffer = buffername
		} else {
			buffer = this.buffers[buffername]
			if (!buffer) throw "Unrecognized buffer " + buffername
		}
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
		opts = opts || {}
		var node = this._getnode(nodename)
		if ("fade" in opts) {
			node.gain.linearRampToValueAtTime(value, this.context.currentTime + (opts.fade || 0))
		} else {
			node.gain.setValueAtTime(value, this.context.currentTime + (opts.dt || 0))
		}
	},
	// Get the current gain of the specified gain node.
	getgain: function (nodename) {
		var node = this._getnode(nodename)
		return node.gain.value
	},
	// Create a gain node with the given options.
	makegainnode: function (opts) {
		var node = this._addnode(this.context.createGain(), opts.name)
		if (opts.gain !== undefined) this.setgain(node, opts.gain)
		var output = this._getoutput(opts.output)
		if (output) node.connect(output)
		return node
	},
	// Create a buffer node with the given options.
	makebuffernode: function (buffer, opts) {
		opts = opts || {}
		var sourcename = this._getnodename(opts)
		var output = this._getoutput(opts.output)
		if ("gain" in opts || opts.addgain) {
			var gain = this.makegainnode({
				name: opts.gainname || sourcename + "_gain",
				output: output,
				gain: opts.gain,
			})
			output = gain
		}
		var source = this._addnode(this.context.createBufferSource(), sourcename)
		source.buffer = this._getbuffer(buffer)
		if (opts.loop) source.loop = opts.loop
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

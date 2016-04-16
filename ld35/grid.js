// "1,2" => [1, 2]
function getcell(cstring) {
	return cstring.split(",").map(x => +x)
}

// Handles the camera
var grid = {
	x0: 0,  // center of grid window
	y0: 0,
	R: 4,  // approximate height of grid window, in blocks
	z: 20,  // scale of a single block, in pixels (set by calling think)
	
	think: function (dt) {
		var sx = canvas.width, sy = canvas.height
		
		var s = Math.min(sx, sy)
		this.z = s / this.R
	},
	look: function () {
		var sx = canvas.width, sy = canvas.height
		UFX.draw("t", sx / 2, sy / 2, "t", -this.x0, -this.y0, "z", this.z, this.z)
	},
}


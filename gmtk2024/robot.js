

function Block() {
	this.height = 1
	
}
Block.prototype = {
	draw: function () {
		UFX.draw("ss #aaa fs #666 tr -40 10 80 80 f s")
		UFX.draw("b o 0 50 30 fs #864 ss black f s")
		
	},
}

let robot = {
	x: 0,
	blocks: [new Block(), new Block()],
	draw: function () {
		UFX.draw("[ z 0.01 0.01 t", 100 * this.x, 0)
		UFX.draw("b o 0 40 40 fs black f")
		UFX.draw("( m 0 40 l -30 100 l 30 100 ) ss #aaa fs #666 lw 2 f s")
		UFX.draw("t 0 100")
		this.blocks.forEach(block => {
			block.draw()
			UFX.draw("t 0", 100 * block.height)
		})
		UFX.draw("ss #aaa fs #666 tr -40 10 80 60 f s")
		UFX.draw("tr -70 20 140 40 f s")
		UFX.draw("fs orange b o -40 40 15 f b o 40 40 15 f")
		UFX.draw("]")
	},
}



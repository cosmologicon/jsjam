let levels = {
	empty: {
		title: "Kingdom of Starteria",
		skycolor: "#777",
		groundcolor: "#333",
		edgecolor: "#bbb",
		R: 2000,
		signs: [],
		graphics: [],
		stars: [],
		portals: [],
		powerups: [],
	},

	start: {
		title: "Kingdom of Starteria",
		skycolor: "#77f",
		groundcolor: "#080",
		edgecolor: "#4b4",
		R: 2000,
		signs: [
//			[2289, -400, -0.1, "TAP~OR~SPACE:~JUMP"],
		],
		graphics: [
			[700, 0, 1, 400, "castle"],
		],
		stars: [
			[2400, -200],
			[3600, 0],
			[4400, 0],
		],
		portals: [
			[500, -300, "forest", 1],
		],
		powerups: [
			[1000, -200, 2],
		],
	},
	forest: {
		title: "Forest of Mysteriousness",
		skycolor: "#080",
		groundcolor: "#040",
		edgecolor: "#6a6",
		R: 2000,
		signs: [],
		graphics: [],
		groundspec: [[368,-288],[914,-404],[1668,-386],[1921,-332],[2169,-389],[2704,-203],[3298,-394],[3696,-324],[3963,-376]],
		platformspec: [
			[[3048,-32],[3492,143],[3900,0]],
			[[2084,-118],[2337,-68],[2678,-120],[3402,-167]],
		],
		mushrooms: [
			[2725, -160],
			[3120, -90],
		],
		hazards: [
			[2960, -110],
			[3500, 160],
			[3380, -370],
			[500, -290],
			[980, -380],
		],
		stars: [
			[3420, -120], // no powerup
			[980, -200], // up
			[2570, 40], // back
		],
		portals: [
			[3700, -250, "start", 0],
			[2170, -300, "ruins", 1],
			[160, 0, "mountain", 0],
		],
		powerups: [
			[0, -150, 2],
		],
	},
	ruins: {
		title: "The Forbidden Ruins",
		skycolor: "#ccf",
		groundcolor: "#ffc",
		edgecolor: "#963",
		R: 2000,
		signs: [],
		graphics: [],
		stars: [
		],
		portals: [
			[500, -230, "forest", 1],
			[800, -230, "under", 1],
			[1300, -230, "water", 1],
		],
		powerups: [],
	},
	mountain: {
		title: "Mountaintop",
		skycolor: "#aaf",
		groundcolor: "#888",
		edgecolor: "#fff",
		R: 2000,
		signs: [],
		graphics: [],
		stars: [
		],
		portals: [
			[500, -230, "forest", 1],
			[800, -230, "water", 1],
			[1300, -230, "win", 1],
		],
		powerups: [],
	},
	water: {
		title: "Underwater City",
		skycolor: "#336",
		groundcolor: "#111",
		edgecolor: "#888",
		R: 2000,
		signs: [],
		graphics: [],
		stars: [
		],
		portals: [
			[500, -230, "mountain", 1],
			[800, -230, "ruins", 1],
			[1300, -230, "fire", 1],
		],
		powerups: [],
	},
	under: {
		title: "Subterrania",
		skycolor: "#111",
		groundcolor: "#345",
		edgecolor: "#89a",
		R: 2000,
		groundspec: [[373,-17],[570,-332],[1268,-407],[1790,-200],[2223,-229],[2637,-399],[3583,-358],[3756,-71]],
		platformspec: [
			[[2086,-92],[2469,-249],[2844,-255],[2844,-255],[3089,-14],[3260,-37]],
		],
		hazards: [[760, -200], [3080, -300]],
		signs: [],
		graphics: [],
		stars: [
			[640, 0],
		],
		portals: [
			[3470, 0, "ruins", 1],
		],
		powerups: [
			[1160, -200, 3],
		],
	},
	space: {
		title: "The Mobius Dimension",
		skycolor: "#fc8",
		groundcolor: "#8ff",
		edgecolor: "#000",
		R: 2000,
		signs: [],
		graphics: [],
		stars: [
		],
		portals: [
			[500, -230, "mountain", 1],
		],
		powerups: [],
	},
	fire: {
		title: "Magma Pits",
		skycolor: "#800",
		groundcolor: "#432",
		edgecolor: "#000",
		R: 200,
		signs: [],
		graphics: [],
		stars: [
		],
		portals: [
			[500, -230, "water", 1],
		],
		powerups: [
			[500, 0, 1],
		],
	},
}


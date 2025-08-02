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
		groundspec: [[16,-201],[226,-233],[530,-271],[788,-219],[1114,-255],[1433,-224],[1700,-255],[2112,-252]],
		platformspec: [[[269,-162],[495,-50],[723,-64]]],
		R: 1200,
		z: 1.4,
		signs: [
//			[2289, -400, -0.1, "TAP~OR~SPACE:~JUMP"],
		],
		graphics: [
			[20, -10, 0.6, 400, "castle"],
		],
		mushrooms: [
			[257, -200],
			[494, 10],
		],
		stars: [
			[550, 80],
			[960, 0],
		],
		portals: [
			[500, -200, "forest", 1],
		],
		powerups: [
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
		groundspec: [[10,-33],[870,-487],[1754,-293],[2979,-611],[4510,-292],[5362,-447]],
		platformspec: [
			[[436,-56],[917,-204]],
			[[2153,-211],[2386,-173]],
			[[2502,-122],[2760,-231]],
			[[2847,-207],[3211,-293]],
		],
		hazards: [
			[0, 0],
			[660, -80],
			[1900, -280],
			[2510, -480],
			[3910, -370],
			[5280, -400],
		],
		R: 3000,
		z: 0.6,
		signs: [],
		graphics: [],
		stars: [
			[980, -114],
			[3150, -240],
			[5000, -190],
		],
		portals: [
			[840, -400, "forest", 2],
			[3000, -540, "under", 3],
			[5400, -150, "water", 0],
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


let progress = {
	score: 0,
	damage: 0,
	levelstars: {},
	got: {},
	unlocked: {},
	tutorial: {},
	lastlevel: "start",
}

function save() {
	window.localStorage.mobius = JSON.stringify(progress)
}
function load() {
	if (window.localStorage.mobius) {
		progress = JSON.parse(window.localStorage.mobius)
	}
}
function reset() {
	if (window.localStorage.mobius) {
		delete window.localStorage.mobius
	}
}


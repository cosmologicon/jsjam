"use strict"

function browcommand(fclose) {
	return ["[ vflip t 0", 22 - 20 * fclose * fclose, "b [ z 1 0.8 a 0 0 12 0", tau/2, "] [ z 1 1.1 aa 0 0 12", tau/2, "0 ] fs black f ]"]
}
function lidclipcommand(fclose) {
	return ["( o 0", 32 * fclose, "26 ) clip"]
}
function pupiloffset(xgaze, ygaze, fclose) {
	return [8 * xgaze, 10 * fclose + 10 * ygaze]
}
function pupilcommand(iriscolor, fopen) {
	return ["b o 0 0 10 fs", iriscolor, "f b o 0 0", 4 + 3 * fopen, "fs black f b o 3 -3 3 fs white f"]
}

function drawpeeper(pspec) {
	var fopen = pspec.fopen || 0
	var fclose = 1 - fopen
	var iriscolor = pspec.iriscolor || "blue"
	var xgaze = pspec.xgaze || 0
	var ygaze = pspec.ygaze || 0
	UFX.draw("[ z 0.01 0.01", "t", xgaze * 20, ygaze * 20, "z", 1 - 0.3 * xgaze * xgaze, 1 - 0.3 * ygaze * ygaze,
		"[ t 14 0",
			"[",
				lidclipcommand(fclose),
				"[ r 0.1 z 1 1.6 b o 0 0 12 ] lw 2 ss black fs white s f clip",
				"[ t", pupiloffset(xgaze, ygaze, fclose), pupilcommand(iriscolor, fopen),
				"]",
			"]",
			browcommand(fclose),
		"]",
		"[ t -14 0",
			"[",
				lidclipcommand(fclose),
				"[ r -0.1 z 1 1.6 b o 0 0 12 lw 2 ss black fs white s f ] clip",
				"[ t", pupiloffset(xgaze, ygaze, fclose), pupilcommand(iriscolor, fopen),
				"]",
			"]",
			browcommand(fclose),
		"]",
	"]")
}


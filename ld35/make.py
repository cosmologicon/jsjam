import random

def nps(shape, gsize, taken):
	taken = taken - set(shape)
	for dx, dy in [(1, 0), (0, 1), (-1, 0), (0, -1)]:
		np = tuple((x + dx, y + dy) for x, y in shape)
		if not all(0 <= x < gsize[0] and 0 <= y < gsize[1] for x, y in np):
			continue
		if taken & set(np):
			continue
		yield np

def adjs(state):
	gsize, you, asleep, awake, blocks, ideas, C = state
	if C:
		for a in asleep:
			nasleep = tuple(A for A in asleep if A != a)
			nawake = tuple(sorted(awake + (a,)))
			yield gsize, you, nasleep, nawake, blocks, ideas, C - 1
	taken = set(you) | set(blocks) | set(b for a in asleep for b in a) | set(b for a in awake for b in a)
	for nyou in nps(you, gsize, taken):
		nideas = len(set(ideas) & set(nyou))
		yield gsize, nyou, asleep, awake, blocks, tuple(sorted(set(ideas) - set(nyou))), C + nideas
	for a in awake:
		for na in nps(a, gsize, taken):
			nawake = tuple(sorted([A for A in awake if A != a] + [na]))
			yield gsize, you, asleep, nawake, blocks, ideas, C

def iswin(state):		
	gsize, you, asleep, awake, blocks, ideas, C = state
	return not asleep

def canadd(state, shape):
	gsize, you, asleep, awake, blocks, ideas, C = state
	taken = set(you) | set(blocks) | set(b for a in asleep for b in a) | set(b for a in awake for b in a)
	return not bool(taken & set(shape))

def addasleep(state, shape):	
	gsize, you, asleep, awake, blocks, ideas, C = state
	return gsize, you, tuple(sorted(asleep + (shape,))), awake, blocks, ideas, C

def randompos(gsize):
	gx, gy = gsize
	return random.choice(range(gx)), random.choice(range(gy))

def randomshape(gsize):
	offsets = random.choice([
		[[0,0]],
		[[0,0],[1,0]],
		[[0,0],[0,1]],
		[[0,0],[0,1],[0,2]],
		[[0,0],[1,0],[2,0]],
		[[0,0],[1,0],[0,1]],
		[[1,1],[1,0],[0,1]],
		[[0,0],[1,1],[0,1]],
		[[0,0],[1,0],[1,1]],
	])
	xs, ys = zip(*offsets)
	gx, gy = gsize
	x0, y0 = random.choice(range(gx - max(xs))), random.choice(range(gy - max(ys)))
	return tuple((x0 + x, y0 + y) for x, y in offsets)

def randomstate(gsize, nblock, nasleep):
	you = (randompos(gsize),)
	blocks, ideas = (), ()
	while len(blocks) < nblock:
		block = randompos(gsize)
		if block not in you and block not in blocks:
			blocks = blocks + (block,)
	while len(ideas) < nasleep:
		idea = randompos(gsize)
		if idea not in you and idea not in blocks and idea not in ideas:
			ideas = ideas + (idea,)
	state = gsize, you, (), (), blocks, ideas, 0
	while len(state[2]) < nasleep:
		shape = randomshape(gsize)
		if canadd(state, shape):
			state = addasleep(state, shape)
	return state

def solve(state):
	q = [state]
	scores = {state: 0}

	while q:
		state = q.pop(0)
		for nstate in adjs(state):
			if nstate in scores:
				continue
			q.append(nstate)
			scores[nstate] = scores[state] + 1
			if iswin(nstate):
				return scores[nstate]
	return None

def printstate(state):
	(gx, gy), you, asleep, awake, blocks, ideas, C = state
	grid = [[".." for x in range(gx)] for y in range(gy)]
	for x, y in you:
		grid[y][x] = "YY"
	for x, y in blocks:
		grid[y][x] = "XX"
	for j, a in enumerate(asleep):
		letter = chr(ord("a") + j)
		for x, y in a:
			grid[y][x] = grid[y][x][0] + letter
	for x, y in ideas:
		grid[y][x] = "!" + grid[y][x][1]
	for y in range(gy):
		for x in range(gx):
			print grid[y][x],
		print


best = 0
while True:
	state = randomstate((5, 4), 2, 6)
	n = solve(state)
	if n is None:
		continue
	if n > best:
		best = n
		print n
		printstate(state)



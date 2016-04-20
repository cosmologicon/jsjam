import random, time

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
#		[[0,0]],
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
	t0 = time.time()
	while len(state[2]) < nasleep:
		if time.time() - t0 > 10:
			print "breaking", len(state[2]), nasleep
			return state
		shape = randomshape(gsize)
		if canadd(state, shape):
			state = addasleep(state, shape)
	return state

def mutate(state):
	a = random.random()
	if a < 0.5:
		return mutateshape(state)
	elif a < 0.7:
		return mutateidea(state)
	elif a < 0.9:
		return mutateblock(state)
	else:
		return mutateyou(state)

def mutateshape(state):
	gsize, you, asleep, awake, blocks, ideas, C = state
	if not asleep:
		return state
	removed = random.choice(asleep)
	asleep = tuple(a for a in asleep if a != removed)
	nstate = gsize, you, asleep, awake, blocks, ideas, C
	while True:
		shape = randomshape(gsize)
		if canadd(nstate, shape):
			return addasleep(nstate, shape)
def mutateidea(state):
	gsize, you, asleep, awake, blocks, ideas, C = state
	if not ideas:
		return state
	removed = random.choice(ideas)
	ideas = tuple(i for i in ideas if i != removed)
	while True:
		p = randompos(gsize)
		if p not in you and p not in blocks and p not in ideas:
			ideas = tuple(sorted(ideas + (p,)))
			return gsize, you, asleep, awake, blocks, ideas, C
def mutateblock(state):
	gsize, you, asleep, awake, blocks, ideas, C = state
	if not blocks:
		return state
	removed = random.choice(blocks)
	blocks = tuple(b for b in blocks if b != removed)
	while True:
		p = randompos(gsize)
		if p not in you and p not in blocks and p not in ideas and not any(p in shape for shape in asleep):
			blocks = tuple(sorted(blocks + (p,)))
			return gsize, you, asleep, awake, blocks, ideas, C
def mutateyou(state):
	gsize, you, asleep, awake, blocks, ideas, C = state
	while True:
		nyou = randompos(gsize)
		if nyou not in blocks and nyou not in ideas and not any(nyou in shape for shape in asleep):
			return gsize, (nyou,), asleep, awake, blocks, ideas, C


def solve(state):
	t0 = time.time()
	q = [state]
	scores = {state: 0}

	while q:
		if time.time() - t0 > 10:
			break
		state = q.pop(0)
		for nstate in adjs(state):
			if nstate in scores:
				continue
			q.append(nstate)
			scores[nstate] = scores[state] + 1
			if iswin(nstate):
				return scores[nstate]
	return None

def solution(state):
	q = [state]
	scores = {state: 0}
	parent = {state: None}

	while q:
		state = q.pop(0)
		for nstate in adjs(state):
			if nstate in scores:
				continue
			q.append(nstate)
			scores[nstate] = scores[state] + 1
			parent[nstate] = state
			if iswin(nstate):
				sol = [nstate]
				while parent[sol[-1]] != None:
					sol.append(parent[sol[-1]])
				return reversed(sol)
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
	for j, a in enumerate(awake):
		letter = chr(ord("A") + j)
		for x, y in a:
			grid[y][x] = grid[y][x][0] + letter
	for x, y in ideas:
		grid[y][x] = "!" + grid[y][x][1]
	for y in range(gy):
		for x in range(gx):
			print grid[y][x],
		print

cscores = {}
def getscore(state):
	if state not in cscores:
		cscores[state] = solve(state)
	return cscores[state]

def randomgoodstate():
	while True:
		state = randomstate((5, 5), 2, 6)
		if getscore(state) != None:
			return state

state = (
	(5, 5),
	((2, 2),),
	(((1,0),(2,0),(3,0)),),
	(
		((0,0),(0,1),(1,1)),
		((3,1),(4,1)),
		((0,3),(0,4),(1,4)),
		((2,3),(2,4),(3,3)),
		((3,4),(4,4)),
	),
	((2,1),(4,3)),
	((4,0),),
	0
)

printstate(state)

for s in solution(state):
	print
	printstate(s)

exit()



states = []
while len(states) < 20:
	states.append(randomgoodstate())

best = [0]
while True:
	nstate = random.choice(states)
	while random.random() < 0.8:
		nstate = mutate(nstate)
	if getscore(nstate) == None:
		continue
	states.append(nstate)
	while len(states) < 20:
		states.append(randomgoodstate())
	states = sorted(set(states), key = getscore, reverse = True)[:20]
	s = [getscore(state) for state in states]
	if s > best:
		best = s
		print
		print s
		printstate(states[0])


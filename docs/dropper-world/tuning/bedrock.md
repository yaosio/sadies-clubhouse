# Dropper World's bedrock numbers

When and how the deepest fossils melt into bedrock (`core/bedrock.js`), and why. Read before
changing the bedrock or the board's piece limit. Units: `world-solver.md`.

## When it melts

Only there to keep the game smooth, so it waits until it's needed: nothing melts while the board has
400 pieces or fewer. Past 400, the deepest fossils melt (lowest first) until it's back down to 390,
so the board sits at about 390–400 pieces from then on. In normal play that's about 11 minutes in,
and the rock stays about 45 blocks under the top of the tower, out of sight unless you scroll down.

Why 400, and why one fixed number rather than one based on how fast the device is: sleeping buried
pieces cost very little, and time per physics step with nothing melting grew only slowly (about 2.4
ms at 270 pieces, 2.7 at 450, 3.2 at 630, 4.4 at 900), while playing with the mole always costs
about 3 ms. At 400 it's still in the flat part, with room to spare on a phone. A number based on the
device's speed would make the same save play differently on a phone and a computer, would flicker
with phones warming up or saving battery, would only kick in after the game had already slowed
down, and couldn't be tested the same way twice.

## How it melts

A fossil buried at least 12 blocks under the pile's surface (everywhere across its width) melts into
the bedrock, as long as nothing that can still move (or the barn) reaches within half a block under
its top. Checked every 0.5 s. It stops being a piece: the bedrock's top rises to exactly its upper
outline (its height is kept every quarter block, plus each of its corner points), filling any cave
under it. So whatever was resting on it is resting on the rock now. Any fossil left completely
under the new top melts too.

(Tried and dropped: smoothing the rock so it's never steeper than 45°. It pulled the rock down into
a V wherever one spot melted later than its neighbors, leaving pieces frozen in the air over the
gap, and kept caves in the pile from ever filling in.)

The rock can have steep steps (one piece melts before its neighbor). A point that ends up more than
a quarter block under the rock, or under a part steeper than 45°, has run into the side of a step:
it's pushed out sideways to the nearest open side within 1.5 blocks, like off a wall, instead of
being lifted on top (which flung pieces up into the air). Each piece leaves flecks of its color in
the rock (the newest 300 are kept) and a little glimmer.

## What it means

- The bedrock is the floor: pieces, Sadie, Chooter, the ball and the barn all stand on it. Before
  anything has melted it's flat ground at 0.
- The camera never looks more than 2 blocks below its lowest point. Heights (the ruler, bests)
  still count from the real ground.
- It's saved as its height every quarter block (193 numbers) plus the flecks, so a save stays small
  however tall the tower gets. Saves from before bedrock load with none.
- Why: however tall the tower gets, only the top 400 pieces stay pieces, so the game costs about
  the same after an hour as after 20 minutes (about 3–4 ms per step from then on).

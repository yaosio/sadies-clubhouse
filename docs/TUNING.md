# Tuning and behavior reference

These numbers are what make the game feel the way it does. Change them on purpose, one at a time,
and re-run `npm test`. Units: 1 block = 30 world px, y points up in the simulation.

## World
Board 48 blocks wide, walls at both edges, ground at y = 0. The camera's default zoom fits about
13 blocks across the screen.

## Solver (`core/physics/solver.js`)
Verlet integration, 4 substeps per 1/60 s frame, 2 constraint iterations per substep. Each block is
a 3×3 lattice of points; per-block shape matching plus a weaker whole-piece match for bending.
Boundary points pushed out of other pieces toward the nearest edge, split by inverse mass. Friction
only on the last iteration. Speed cap 0.4 blocks per substep.

Finding pairs: sleeping pieces go into a grid of 2×2-block cells once per frame, and each awake
piece only checks sleepers in the cells around it (plus every other awake piece). Pairs are
handled in the same order as checking everything against everything, so results are identical;
it only skips pairs that are far apart.

Dev panel defaults (stiffness 0.6, bendiness 0.6, jiggle 0.6, grip 0.6, gravity 1):
- block stiffness = 0.03 + 0.62 × stiffness²
- bend stiffness = (1 − bendiness) × 0.12
- damping per substep = 0.985 + jiggle × 0.0145
- gravity 1400 px/s²
- friction = grip × 0.5, times √(gripA × gripB) for each pair, capped at 1

Sleeping: a piece sleeps after its average boundary speed stays under 0.07 px/substep for 1.2 s and
then acts as solid. A piece moving faster than 0.2 wakes sleepers within 0.3 blocks.

## Materials (`core/physics/pieceTypes.js`)

| Piece | Name | kMul | bendMul | invMass | bounce | drag | grip |
|---|---|---|---|---|---|---|---|
| I | Ice bar | 1.6 | 1.5 | 1 | 0 | 1 | 0.08 |
| O | Sponge | 0.45 | 1 | 1.4 | 0 | 1 | 1.6 |
| T | Grape gum | 1.3 | 1.5 | 1 | 0.45 | 0.5 | 1 |
| S | Lime grip | 1 | 1 | 1 | 0 | 1 | 3 |
| Z | Cherry brick | 1.8 | 2 | 0.5 | 0 | 1 | 1 |
| L | Wobbler | 0.7 | 0.7 | 1 | 0 | 0.25 | 1 |
| J | Marshmallow | 0.35 | 0.6 | 1.8 | 0 | 1 | 1.3 |
| 6×1 | Noodle | 0.9 | 0 | 1 | 0 | 1 | 1 |
| 2×2 | Boulder | 4 | 5 | 0.25 | 0 | 1 | 1 |
| round | Bouncy ball | 2.5 | 7 | 0.7 | 0.75 | 0.15 | 1 |

Bounce is whole-body: if a bouncy piece touched something this substep while approaching faster
than 0.4 px/substep, its outgoing speed along the contact is set to bounce × incoming.

## Supply and dropper (`core/dropper.js`)
Up to 5 pieces, one refills every 1.5 s. Autodrops when the supply is full and the player hasn't
touched the dropper for 1.2 s. Hovers 2.5 blocks above the highest point under it (±0.6 blocks).
New pieces spawn at a random 90° rotation.

## Fossils (`core/fossil.js`)
A piece that has been at rest for 3 s and is buried at least 8 blocks under the pile's surface
(everywhere across its width) becomes a fossil: it stays asleep forever and still holds the pile up.
Checked every 0.5 s. This keeps a landing piece from waking a long chain of pieces deep in a tall
tower, so only the top 8 blocks or so can wobble and topple. First step toward an endless tower.

## Sadie's barn (`core/barn.js`, trips in `core/sadie/brain.js`)
4 blocks wide, walls 2.4 blocks tall, roof peak 3.9 blocks. Starts on the ground 4.5 blocks left of
the middle. It's a fixed piece: solid, never tips, never gets pushed, and pieces pile on it and bury
it. Sadie can stand on its roof. When nobody is dragging it, it drops onto whatever is under it
(gravity 1400, max 10 blocks/s), so it follows the pile down if the pile under it collapses.
Nothing above it becomes a fossil, so it can always be dragged out.

Trips home: at least 60 s apart. She goes when she's 6 blocks or more above the barn's floor, or
when the pile covers its whole roof by 1 block or more. She runs to its side, grabs the rope and
drags it toward the tallest point of the pile (not counting what's heaped on the barn itself), at
least 4 blocks. The barn follows 2.9 blocks behind her at up to 2.5 blocks/s, shoving pieces out
of its way; it rides over whatever is under its floor rather than being pulled down into the pile.
She walks at 70% speed while dragging and stops to heave whenever it falls more than 1.2 blocks
behind. A trip gives up after 60 s. While on a trip she ignores hay and isn't scared by pieces
shifting under her (falling still scares her).

## Chooter (`core/friends/chooter.js`)
Sadie meets him the first time she stands 15 blocks up (about 3 minutes into a game with a helpful
player). He comes running in from the far side of the board along the top of the pile. Once met,
he stays met (saved in the browser), even after clearing the tower.
- Trots 2.2 blocks/s, runs 4.2 when he has somewhere to be, 6.5 with the zoomies.
- Leaps up ledges up to 2.6 blocks tall (3.2 with the zoomies); anything taller stops him and he
  barks. Walks off drops and falls (gravity 1400). If a piece lands on him he wriggles out on top.
- Playing: picks a spot 1.4–3.6 blocks to one side of Sadie every 2–4.5 s and goes there; hops for
  joy or sends her a heart now and then.
- Zoomies: first one 20 s after a game starts (30 s after meeting him), then every 40–75 s, lasting
  7–10 s. He dashes 7–14 blocks one way, then the other, hopping every 0.6–1.8 s. Any piece that
  isn't a fossil in the space just ahead of his body gets knocked forward 5 blocks/s and up 3.5
  (times its lightness, up to 1.5×; a boulder barely moves), at most once per 0.6 s per piece. In
  test runs each bout moves between 1 and about 25 pieces more than a block.
- Ball: he chases it unless he has the zoomies, grabs it once it's near his mouth and coming down,
  and carries it to Sadie (she's not impressed). Gives up if he can't get to it for 5 s (25 s in
  all), or can't reach Sadie within 18 s. The ball vanishes 1.5 s after he drops it (3 s if he gave
  up), or after 40 s regardless.
- Out of the barn 70–120 s, then he heads home: in through the cat flap if the side of the barn is
  clear, or he digs in from on top if it's buried (or if he can't get there in 30 s). Home for
  25–45 s, poking his head out of the hayloft window; a thrown ball gets him out straight away.

## Toys (`core/toys.js`)
One out at a time. The dropper drone throws it, taking 0.6–1.3 s to land near where you tapped.
Ball radius 0.26 blocks, gravity 1400, keeps 55% of its speed on each bounce, rolls downhill.

## What counts as ground (`core/surface.js`)
Asleep, or older than 0.4 s with a smoothed speed under 0.6. The smoothing stops a ball at the top
of its bounce from counting.

## Hay (`core/hay.js`)
Always 3 bundles out. They form a trail: each new bundle goes 10–18 blocks sideways from the last
one placed, carrying on the same way until it would hit a wall (keeps 1.5 blocks clear), then the
trail turns around. So Sadie grazes back and forth across the board. When she eats one, the next
is placed at the far end of the trail.
A new bundle appears 0.7 blocks above the pile surface under it, plus 1.5–4.5 blocks extra, so
2.2–5.2 blocks above the pile. She reaches 1.6 blocks up, so a new bundle is never in reach: she
needs 0.6–3.6 blocks built under it, and she gets impatient while she waits. Because height is
measured from the pile, hay keeps up as the tower grows.
(Tried and set aside: 5–12 apart and 0–3 up, which the owner found too close and too easy. A
middle setting of 8–15 apart and 1–3.5 up made her impatient about 25% of the time instead of
about 45%.)
Covered by the pile for 0.5 s: float up to 0.7 blocks above the surface. Pile drops away for
0.5 s: sink back, never below where it appeared.

## Sadie (`core/sadie/brain.js`)
- Reach 1.6 blocks above her feet. Walk 1.7 blocks/s, climb 0.8 blocks/s.
- Steps up to 0.5 blocks; anything more than 0.55 blocks higher just ahead is a wall she climbs.
- Uses solid spans in a vertical slice (spans closer than 0.25 blocks merge), so overhangs above
  her head don't count as floor.
- Targets the nearest hay by |dx| + 1.5 × |dy|.
- Runs (2.5× speed) when her hay is more than 6 blocks away sideways; walks again under 2.5.
- Can't reach her hay: waits 1.5 s, then paces 1.5 blocks out, turning and going 1 block further
  each lap, up to 12.
- Moods: neutral, lookup (waiting), mad (pacing), happy (climbing), excited (ate hay or got her
  barn home), scared (falling or lurching ground), run, haul (dragging her barn).

## Debug tools (`core/debug.js`, the dev sheet's Debug tab)
For us, not players. Speed runs 1, 2, 4 or 8 simulation steps per normal step.
- Rain 25 here: 25 random pieces within 5 blocks of the dropper. Rain 100 everywhere: across the
  whole board. About 12 a second, each 4 blocks above the pile; a piece waits if something is still
  falling where it would appear.
- Build a tall pile: 110 pieces within 1 block of the dropper, one every 0.6 s, run at 8× (about 70 s
  of game time, roughly 9 s to watch), then 4 more seconds to settle before going back to the
  chosen speed. Makes a mound about 16–18 blocks tall.
- Put her on top: Sadie moves to the highest point. If her barn is now far below, she'll soon go
  back for it, as she normally would.
- Fetch the barn now, Meet Chooter now, Zoomies, Go home, Come out: start those right away (or as
  soon as Chooter finishes what he's doing).
- Clear tower also stops any rain.

## Saving (`core/save.js`)
Saved in the browser every 5 s, and when the page is hidden or closed, under the key
`sadies-dropper-world.save` (a name no other game on a shared site like itch.io will use). Each
browser and device keeps its own game. Piece positions are kept to 1/100 px; a 50-piece board is
about 24 KB, so even a very tall tower stays far under the browser's ~5 MB limit.
What comes back exactly: every piece (squish, speed, asleep, fossil), the barn, the hay and the
hay trail, the dropper and the piece it holds, the supply, Sadie and Chooter. What starts over:
any trip home Sadie was on, the hay she was heading for, a thrown ball, particles, and the debug
speed and rain.
Clear tower: fresh board, keeps Chooter and bests. Start over: forgets the save, bests and friends
(keeps the dev sheet's physics settings). Both need a second tap within 3 s.

## What the tests expect (`tests/run.mjs`, seeded, so results repeat exactly)
- 150-piece mixed pile: no broken numbers, deepest overlap about 0.6 px, about 140 asleep.
- Ball dropped from 6 blocks: bounces to 3.37, 2.13, 1.52 blocks.
- 70 pieces on one spot: a mound peaking around 12.5 blocks.
- Two minutes of play with the dropper kept near Sadie: she never rises faster than about 4 blocks
  per second, never stays buried, hay never sinks below where it appeared, there are always 3
  bundles out, each new one 10–18 blocks from the last, new hay always starts out of her reach, she
  eats about 6 bundles (the check wants at least 4), and her longest wait between snacks is about
  39 s (the check allows up to 40). Time spent fetching her barn doesn't count as waiting. (Before
  the barn this was about 33 s; over 10 other random runs the longest waits look the same with and
  without the barn, 18–40 s, so this is just how this run happens to go.)
- 110 pieces on one spot (peak about 16 blocks): 15 become fossils, all buried at least 8 blocks,
  and a boulder landing on top wakes none of them. (These numbers moved from 18 fossils and an
  18-block peak only because the tests share one stream of random numbers and the play test before
  it now uses a different amount of them.)
- Pieces dropped on the barn: the pile gets about 5 blocks over its roof, Sadie fetches it once
  (about 20 s), and it ends up about 6 blocks higher with nothing near it higher than its roof,
  inside the walls, with no piece sunk into it more than about 0.3 px.
- Chooter: meets Sadie only once she's 15 blocks up. On a pile grown for 90 s, over 4 minutes he
  greets her (about 12 s, running in from the far side), has 3 bouts of zoomies knocking about 28
  pieces, brings back all 10 balls thrown for him, moves into the barn and comes back out, and
  never gets stuck in the pile or leaves the board. This test runs after the others, so it doesn't
  change their numbers.
- Debug tools (runs after the play tests): raining 100 pieces drops them all in about 8 s with no piece sunk into
  another more than about 0.7 px; "Build a tall pile" peaks around 17.7 blocks and goes back to
  normal speed; "Put her on top" puts Sadie about 16 blocks up, standing; the Sadie and Chooter
  buttons each start what they say; clearing the tower stops any rain.
- Saving (runs last): a game saved after 70 s of play (47 pieces, 14 still moving, Chooter met)
  comes back the same after a JSON round trip, then plays on for 20 s with Sadie never stuck in the
  pile and no piece sunk into another more than about 0.7 px; a save from another version is
  refused; Clear tower keeps Chooter; Start over forgets him.

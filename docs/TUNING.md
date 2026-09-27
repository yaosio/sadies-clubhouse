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

## What counts as ground (`core/surface.js`)
Asleep, or older than 0.4 s with a smoothed speed under 0.6. The smoothing stops a ball at the top
of its bounce from counting.

## Hay (`core/hay.js`)
Always 3 bundles out. They form a trail: each new bundle goes 5–12 blocks sideways from the last
one placed, carrying on the same way until it would hit a wall (keeps 1.5 blocks clear), then the
trail turns around. So Sadie grazes back and forth across the board. When she eats one, the next
is placed at the far end of the trail.
A new bundle appears 0.7 blocks above the pile surface under it, plus 0–3 blocks extra. About a
third can be reached just by walking (she reaches 1.6 blocks up), the rest need a step or two
built. Because height is measured from the pile, hay keeps up as the tower grows.
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
- Moods: neutral, lookup (waiting), mad (pacing), happy (climbing), excited (ate hay), scared
  (falling or lurching ground), run.

## What the tests expect (`tests/run.mjs`, seeded, so results repeat exactly)
- 150-piece mixed pile: no broken numbers, deepest overlap about 0.6 px, about 140 asleep.
- Ball dropped from 6 blocks: bounces to 3.37, 2.13, 1.52 blocks.
- 70 pieces on one spot: a mound peaking around 12.5 blocks.
- Two minutes of play with the dropper kept near Sadie: she never rises faster than about 4 blocks
  per second, never stays buried, hay never sinks below where it appeared, there are always 3
  bundles out, each new one 5–12 blocks from the last, she eats about 13 bundles, and her longest
  wait between snacks is about 26 s (the check allows up to 40).
- 110 pieces on one spot (peak about 19 blocks): 16 become fossils, all buried at least 8 blocks,
  and a boulder landing on top wakes none of them.

# Dropper World's board, solver and game loop numbers

The board's size, the soft-body solver's numbers, when pieces sleep, and the game loop's catch-up
rule. Read before changing any of them, or the physics' speed.

## How to change tuning numbers

These numbers (here and in the other `tuning/` pages) are what make the game feel the way it does.
Change them on purpose, one at a time, and re-run `npm test`. Paths are inside
`src/activities/dropper-world/`. Units: 1 block = 30 world px, y points up in the simulation.

## World

Board 48 blocks wide, walls at both edges, ground at y = 0 (until the bedrock rises over it). The
camera's default zoom fits about 13 blocks across the screen.

## Solver (`core/physics/solver.js`)

Verlet integration, 4 substeps per 1/60 s frame, 2 constraint iterations per substep. Each block is
a 3×3 lattice of points; per-block shape matching plus a weaker whole-piece match for bending.
Boundary points pushed out of other pieces toward the nearest edge, split by inverse mass. Friction
only on the last iteration. Speed cap 0.4 blocks per substep.

Finding pairs: sleeping pieces go into a grid of 2×2-block cells once per frame, awake pieces into
a second grid each iteration, and each awake piece only checks the pieces in the cells around it.
Pairs are handled in the same order as checking everything against everything, so results are
identical; it only skips pairs that are far apart. (Emptying the grids only touches the cells
filled since last time: emptying every cell the tower had ever reached, eight times a step, made
each step about a sixth slower on a full board, and slower still as the tower grew.)
(`node tools/dropper-world/physics-load.mjs` prints a fingerprint of the board after two minutes: a
speed-up like this must leave it unchanged.)

Dev panel defaults (stiffness 0.6, bendiness 0.6, jiggle 0.6, grip 0.6, gravity 1):
- block stiffness = 0.03 + 0.62 × stiffness²
- bend stiffness = (1 − bendiness) × 0.12
- damping per substep = 0.985 + jiggle × 0.0145
- gravity 1400 px/s²
- friction = grip × 0.5, times √(gripA × gripB) for each pair, capped at 1

## Sleeping

A piece sleeps after its average boundary speed stays under 0.07 px/substep for 1.2 s and then acts
as solid. Under 0.12 (trembling or creeping) counts as half as still, so it sleeps after 2.4 s of
that. With more than 16 pieces awake, still pieces sleep sooner: after 1.2 × 16 / awake seconds
(never under 0.3 s). A piece moving faster than 0.2 wakes sleepers within 0.3 blocks.

Why: each step costs more with every piece awake (on a fast computer, about 1 ms with 8 awake, 2.5
with 25, 5 with 50), and each drop wakes 10 to 20 pieces. Before these rules, half the time pieces
spent awake they were already still and only waiting out the 1.2 s, and a full board spent about a
third of its time in a pile-up (40+ awake); now it's under a tenth, with the average awake down from
about 26 to 17. The first try (under 0.15 counting half, from 12 awake) froze pieces shoved aside
by the barn a bit early, leaving a steeper heap beside it (the barn test failed on 2 of 9 seeds).

## Game loop (`loop.js`)

Up to 3 steps a frame to catch up after a slow one, but only while the steps so far have taken
under 12 ms, or 40% of a typical frame if that's more: past that, the time owed is dropped and the
game runs slower for a moment instead of stuttering, like an old console with too much on screen.
The perf overlay shows it as "Game speed". (A flat 12 ms let a phone whose drawing is slow fall to a
quarter speed; 30% of a frame wasn't smoother than 40%, just slower.) On a phone 2x slower than
Claude's machine, in a hidden browser, frames over 50 ms went from 147 to about 10 in 40 s with
these changes and the physics speed-ups, at 90% game speed. At 4x slower the hidden browser's
drawing (no graphics card) swamps everything, so it says little about real phones.

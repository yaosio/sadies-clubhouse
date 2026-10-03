# Dropper World's barn numbers

Sadie's barn (`core/barn.js`) and her trips home with it (`core/sadie/brain.js`). Read before
changing the barn or when Sadie drags it. Why she does it and how the wants work:
`docs/dropper-world/characters/sadie.md`. Units: `world-solver.md`.

## The barn

4 blocks wide, walls 2.4 blocks tall, roof peak 3.9 blocks. Starts on the ground 4.5 blocks left of
the middle. It's a fixed piece: solid, never tips, never gets pushed, and pieces pile on it and bury
it. Sadie can stand on its roof. When nobody is dragging it, it drops onto whatever is under it
(gravity 1400, max 10 blocks/s), so it follows the pile down if the pile under it collapses.
Nothing above it becomes a fossil, so it can always be dragged out.

## Trips home

After a trip she feels settled (`settled`, 1 falling to 0 over 60 s). Once that's gone she goes
when she's 6 blocks or more above the barn's floor, or when the pile covers its whole roof by 1
block or more (then fetching the barn wants 3, more than hay's 1–2).

She runs to its side, grabs the rope and drags it toward the tallest point of the pile (not counting
what's heaped on the barn itself), at least 4 blocks. The barn follows 2.9 blocks behind her at up
to 2.5 blocks/s, shoving pieces out of its way; it rides over whatever is under its floor rather
than being pulled down into the pile. She walks at 70% speed while dragging and stops to heave
whenever it falls more than 1.2 blocks behind. A trip gives up after 60 s. While on a trip she
ignores hay and isn't scared by pieces shifting under her (falling still scares her).

# Dropper World's fossil numbers

When a buried piece turns into a fossil (`core/fossil.js`). Read before changing how deep the pile
can wobble. What fossils then melt into: `bedrock.md`. Units: `world-solver.md`.

A piece that has been at rest for 3 s and is buried at least 8 blocks under the pile's surface
(everywhere across its width) becomes a fossil: it stays asleep forever and still holds the pile
up. Checked every 0.5 s.

Two more ways in, so nothing deep stays awake forever:
- a piece at least 8 blocks down that's been barely moving (under 0.12 px per substep) for 10 s
  without quite falling asleep (jammed in, jiggling just too much to count as still);
- anything at least 16 blocks down, however it's moving.

Both are stopped where they are. (Without these, pieces like that can jiggle or creep for 15
minutes or more deep in the pile, costing time every frame and keeping the bedrock from forming
above them.)

This keeps a landing piece from waking a long chain of pieces deep in a tall tower, so only the top
8 blocks or so can wobble and topple.

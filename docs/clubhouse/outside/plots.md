# Plots and spots

Where a building outside goes. Read when placing a new building outside or changing the outside's
layout.

**Plots stay put once placed. That is Claude's own rule, not the owner's** (made 2026-09-30 so a
change can't shift a building by accident; changeable). It was lifted once on purpose, 2026-10-04,
when the buildings moved into a curve round the town square (`square.md`). The check
(`tests/clubhouse/spots.json`, listing every spot) only guards against an accidental move: to move one
on purpose, change it there and in the code, and tell the owner. A new spot goes on the end of its list.
- `LOTS` (`src/clubhouse/town/layout.js`): plots round the town square (`x`, `z`: the middle of the
  front door's threshold; `y`: the ground's height; `yaw`: the way the door faces, towards the middle
  of the square). A plot is just a place and a facing, so a new one can go anywhere: beside one of the
  paths out of the square, say. The next free one has a COMING SOON stake. Four so far.
- `GROUNDS`: spots in the grounds round the house, for a building that isn't on a plot (`x`, `z`,
  `y`, and how much room: `w` across, `d` deep). 0 runs beside the house from the front garden to the
  backyard, on your left as you go out of the front door (on your right walking up from the gate).
  It's the only one so far, so the next grounds building adds a spot.
- The walkable edge grows to take in every plot and spot (`EDGE`). The scenery doesn't yet: the
  fences, the grass and the hills are fixed sizes, so a plot past about 30 m to
  either side needs them to grow too (a known limit, `docs/clubhouse/decisions/known-limits.md`).
- A new plot or spot is the one time adding an activity touches the shared code.

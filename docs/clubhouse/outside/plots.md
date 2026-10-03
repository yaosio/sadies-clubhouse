# Plots and spots

Where a building outside goes. Read when placing a new building outside or changing the outside's
layout.

Nothing placed ever moves (`tests/clubhouse/spots.json` locks every spot; a new one goes on the end
of its list, there and in the code).
- `LOTS`: plots along the lane outside the gate (`x`, `z`: the middle of the front door's threshold;
  `y`: the ground's height; the house faces the gate). 0 is left of the path as you go out, 1 across
  from it, then further along each way. The next free one has a COMING SOON stake. Four so far.
- `GROUNDS`: spots in the grounds round the house, for a building that isn't on the lane (`x`, `z`,
  `y`, and how much room: `w` across, `d` deep). 0 runs beside the house from the front garden to the
  backyard, on your left as you go out of the front door (on your right walking up from the gate).
  It's the only one so far, so the next grounds building adds a spot.
- The walkable edge grows to take in every plot and spot (`EDGE`). The scenery doesn't yet: the
  lane's strip, the fences, the grass and the hills are fixed sizes, so a plot past about 30 m to
  either side needs them to grow too (a known limit, `docs/clubhouse/decisions/known-limits.md`).
- A new plot or spot is the one time adding an activity touches the shared code.

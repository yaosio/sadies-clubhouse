# How the Hedge Maze grows

`grow.js`: the maze as plain numbers (the tests run it), its doors, and what happens when you leave
by a gate. Read before changing how the maze grows.

## The maze

Square cells 3 m across on a grid; a corridor is a run of cells that ends by turning one way, both
ways (the other a dead end) or stopping dead. Only the corridor you're in, the ones it turns into
and the ones those turn into are made. The way through starts heading in from the gate (`fwd`) and
only ever turns sideways or back to heading on, so it can't cross itself; each corner on it counts
one, and after K (5 to 8, picked for each maze) the next corner is the end. Dead ends only head
sideways or back, so they're never in its way.

## Doors, leaving and regions

- Each gate is a doorway out: `doors.door` (the front gate) and `doors.back` (the backyard's). When
  the end's made, the backyard's door moves there, as soon as you can see neither where it is nor
  where it's going (`sees`: a line across the grid that only crosses open sides).
- Leaving by a gate (`leave`), the bit you can see from it, to its first corner, is kept just as it
  was and the rest of that maze is forgotten (`reset`); a new maze grows past the corner when you
  come back. If the other door was in that maze (you went in the front and out the back), it's put
  somewhere fresh.
- Each door's maze is in a region of its own, 1200 m apart, so they never meet; three regions are
  used over and over.
- `ahead(x, z)`: the next step on the way through, for the checks.

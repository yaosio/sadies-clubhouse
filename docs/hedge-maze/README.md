# The Hedge Maze

A block of clipped hedge in the grounds beside Sadie's clubhouse, on the left as you walk up
(`src/activities/hedge-maze/`). The owner asked for it on 2026-10-01: not on a plot along the lane
and not in place of any house, just next to the clubhouse, with a little path to it off the path up
to the front door. It's in the grounds' first spot (`grounds` 0: `GROUNDS` in
`src/clubhouse/outside.js`), which runs from the front garden back to the backyard.

**Outside** it's a hedge block with a leafy arch and a green garden gate at each end. The front
one's sign says HEDGE MAZE / ENTRANCE; the backyard one's says MAZE EXIT / NO ENTRY!!, which nobody
minds. A path turns off the main path just before the porch (by the last lantern) to the front gate,
and one runs from the backyard's path to the back gate.

**Inside** it's much bigger than the block: corridors of hedge under an open sky, with soft music.
It's made in front of you as you walk. After 5 to 8 corners, the next corner you turn is the end: a
short stretch with a garden gate at the end of it, which lets you out into **the backyard**, behind
the clubhouse.

**Sadie** is in it the way she'd most like to be: not in the maze at all, but asleep on the bench in
the sun in the backyard, where the maze lets you out (built with the backyard, in `outside.js`).

## Design pillars (these win over any feature idea)

- **It stays put.** What's been made is never changed while you could see it: walk back and the
  hedges you passed are all still there. Only new ground is made up, always two corners ahead of
  you, where you can't see.
- **The way through always works.** It heads on or sideways, never back, so it can't wall itself in;
  the turns that aren't the way through are short dead ends that never get in its way.
- **It's sneaky.** The end always lets you out into the backyard, even if you came in from the
  backyard (so the NO ENTRY gate brings you straight back out where you started). And after you
  leave, the gate still shows the bit of maze you just walked out of: turn round and walk back in,
  and it all looks the same until the first corner, but past it it's a new maze. Turns hide every
  change. (The owner's design.)
- **A new maze every visit**, from either gate.
- **Not a trap.** The backyard is also just round either side of the house: the maze is one way
  there, not the only one.
- **Kind to the ears** (the owner has misophonia): the music is a soft garden music box, composed
  as it plays, so it never loops; every note dies away by itself, and there's a quiet moment between
  pieces. No other sounds.

## How it works

- `card.js`: in the grounds (`grounds: 0`), not on the landing or the lane. No saves (`keeps`):
  it's new every time anyway.
- `grow.js`: the maze as plain numbers (the tests run it). Square cells 3 m across on a grid; a
  corridor is a run of cells that ends by turning one way, both ways (the other a dead end) or
  stopping dead. Only the corridor you're in, the ones it turns into and the ones those turn into
  are made. The way through starts heading in from the gate (`fwd`) and only ever turns sideways or
  back to heading on, so it can't cross itself; each corner on it counts one, and after K (5 to 8,
  picked for each maze) the next corner is the end. Dead ends only head sideways or back, so they're
  never in its way.
  - Each gate is a doorway out: `doors.door` (the front gate) and `doors.back` (the backyard's).
    When the end's made, the backyard's door moves there, as soon as you can see neither where it is
    nor where it's going (`sees`: a line across the grid that only crosses open sides).
  - Leaving by a gate (`leave`), the bit you can see from it, to its first corner, is kept just as it
    was and the rest of that maze is forgotten (`reset`); a new maze grows past the corner when you
    come back. If the other door was in that maze (you went in the front and out the back), it's put
    somewhere fresh.
  - Each door's maze is in a region of its own, 1200 m apart, so they never meet; three regions are
    used over and over.
  - `ahead(x, z)`: the next step on the way through, for the checks.
- `room.js`: draws the maze. Every time it changes, what should be there (a stretch of hedge on each
  shut side of each cell, a post at each corner, a gate where there's a gate) is compared with what
  is, and the difference added or taken away; the shapes are made once and shared. A gate with no
  door at it shows a shut gate. The grass is one big square per region, centred on its gate (in
  whole tiles, so it never seems to move); the sky follows you (from outside, it's round each gate).
  It notices you coming in and going out by a door (`ears()`), and tells the maze.
- `block.js`: the hedge block outside, its arches, gates, signs and paths. Its two gates are its
  `doors` (`door` and `back`), joined by the mansion to the room's two doors of the same names.
- `art.js`: the hedge, the gates and the signs.
- `music.js`: `makeComposer` writes the music a piece at a time (each its own key, mode, speed, beats
  a bar and instruments: a harp, a bell, a little flute): a wandering tune that rests often, a few
  soft chord notes under it, home at the end, then 6 to 11 seconds of quiet. `makeMusic` plays it
  on the browser's own oscillators through a music line (`src/shared/sound.js`), starting as you come
  in and fading as you leave. The clubhouse's theme makes way for it by itself.

## Checks

- `tests/hedge-maze/run.mjs` (headless, seeded): hundreds of mazes from each gate, each found
  through by walking every corridor in turn, with K + 1 corners on the way; every hedge where it
  should be; what's made stays made; the backyard's door at the end; leaving by a gate keeps its view
  and the maze past it is new (and its end is the backyard's gate again); the doors' mazes never
  meet; the end can't be seen until you're nearly there; and an hour of music (in key, soft, short
  notes, no flurries, quiet between pieces, never the same eight notes twice).
- `tests/hedge-maze/browser.mjs`: the gate opening onto the maze, walking in (its music on), finding
  the way through and out into the backyard, turning round and back in where you came out, a new
  maze out to the backyard again, and walking round the side of the house to the backyard.
  Screenshots in `dist/check/hedge-maze/`.

## Parked ideas

None yet.

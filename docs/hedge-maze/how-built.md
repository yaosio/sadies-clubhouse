# How the Hedge Maze is built

The code in `src/activities/hedge-maze/`: which file does what, how it plugs into the clubhouse, and
its checks. Read before changing any of its code. How `grow.js` makes the maze is in `growing.md`.

## Files

- `card.js`: in the grounds (`grounds: 0`), not on the landing or the lane. No saves (`keeps`):
  it's new every time anyway.
- `grow.js`: the maze as plain numbers (see `growing.md`).
- `room.js`: draws the maze. Every time it changes, what should be there (a stretch of hedge on each
  shut side of each cell, a post at each corner, a gate where there's a gate) is compared with what
  is, and the difference added or taken away; the shapes are made once and shared. A gate with no
  door at it shows a shut gate. The grass is one big square per region, centred on its gate (in
  whole tiles, so it never seems to move); the sky follows you (from outside, it's round each gate).
  It notices you coming in and going out by a door (`ears()`), and tells the maze.
- `block.js`: the hedge block outside, its arches, gates, signs and paths. Its two gates are its
  `doors` (`door` and `back`), joined by the clubhouse to the room's two doors of the same names.
- `art.js`: the hedge, the gates and the signs.
- `music.js`: `makeComposer` writes the music a piece at a time (each its own key, mode, speed,
  beats a bar and instruments: a harp, a bell, a little flute): a wandering tune that rests often, a
  few soft chord notes under it, home at the end, then 6 to 11 seconds of quiet. `makeMusic` plays
  it on the browser's own oscillators through the toolbox's band (`src/shared/band.js`, a music line
  on `src/shared/sound.js`), starting as you come in and fading as you leave. The clubhouse's theme
  makes way for it by itself.

## The clubhouse over the hedges

As it's built, `room.js` takes a picture of the outside's `house` group with the kit's `snapshot`
(from the block's side of the house, 28 m off, at eye height, wide enough for all of it), and hangs
it 70 m off, facing you, drawn after the grass and before the hedges. Inside, it's turned the way
the door nearest you turns things (so it's on your left as you come in the front, as the house is
outside), easing round if that changes; from outside, there's one beyond each gate.
`tools/hedge-maze/look.mjs` takes pictures from inside, looking all round.

## Checks

- `tests/hedge-maze/run.mjs` (headless, seeded): hundreds of mazes from each gate, each found
  through by walking every corridor in turn, with K + 1 corners on the way; every hedge where it
  should be; what's made stays made; the backyard's door at the end; leaving by a gate keeps its
  view and the maze past it is new (and its end is the backyard's gate again); the doors' mazes
  never meet; the end can't be seen until you're nearly there; and an hour of music (in key, soft,
  short notes, no flurries, quiet between pieces, never the same eight notes twice).
- `tests/hedge-maze/browser.mjs`: the gate opening onto the maze, walking in (its music on), finding
  the way through and out into the backyard, turning round and back in where you came out, a new
  maze out to the backyard again, and walking round the side of the house to the backyard.
  Screenshots in `dist/check/hedge-maze/`.

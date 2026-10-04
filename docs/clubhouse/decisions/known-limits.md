# Known limits

Things that are fine today but will need work as the game grows. Add any new limit a feature hits;
remove one once it's fixed. Each review also asks of every shared file (the clubhouse, the outside,
the toolbox): is there anything here only one room uses, or that grows with every new kind of room?
A limit that's written down still needs a plan for when it gets fixed, not just a line here.
- **Saves:** all rooms share the browser's about 5 MB. The pause menu warns when it's nearly full,
  but nothing makes room by itself; a room that saves a lot (pictures) should keep them small.
- **The outside is built whole.** It has levels now, but a town walkable as one space will need it
  to load in pieces as you walk, like rooms. (When the town starts growing.)
- **Every building outside is built at the start** (only its room is ever put away; the house lives
  all game), so starting gets slower with each one. A town needs houses built and put away by
  distance.
- **Putting away is counted in doors.** Every building outside is one door from the outside, so in
  a big town none would ever count as far: it needs distance in metres there.
- **The outside's scenery is a fixed size** (the square's paving, fences, grass, hills); only the walkable
  edge grows with the plots. A plot past about 30 m either side needs it to grow.
- **One outside, shared by every building.** A place's settings (`hush`, `brush`, `watch`)
  are one each for the whole outside, so two outdoor activities would fight over them. Music a room plays isn't heard outside (only an
  `everywhere` line is, and that's heard everywhere). The every-room checks visit rooms, not
  houses or things to use outside.
- **The every-room check gets longer with every room**; split it across computers when it's slow
  (the 180 s warning in `tools/check.mjs` says when).
- **Every room's browser checks wait for every room to be built** (`up()`, 15 s). Fine at ten
  rooms; at a few dozen it fails, and once the house loads in pieces "every room built" never
  happens. Plan: `up()` waits for just the clubhouse, the room's own check walks up to its door
  (which builds it), and the every-room loops walk to each room. `up()` warns (on GitHub too) once
  it takes over 8 s: that's when to do it.
- **The game page carries a copy of the whole project** (source, docs, tests) for anyone to unpack.
  It's about 2 MB now and the page limit is 16 MB: at around 70 rooms it no longer fits. Plan: leave
  the docs and tests out of the copy (or split it into several files fetched by the unpack tool).
  Do it when the copy passes 8 MB.
- **The computer activities' pages are in the first download** (Dropper World, TypeFitter), though
  most visits never open them. Plan: fetch each when its computer is used, like a room's code. Do it
  when the first download passes 1.5 MB (it's 1.4 MB now).
- **The full check grows by about a minute with every room** (about 15 s of fixed cost, since every
  room's browser run loads the page twice, as a phone and a desktop, plus its own walk). 7 min 18 s at
  11 browser runs (2026-10-04). Plan: run the rooms' browser checks side by side, then (past about 15
  rooms) only the changed places plus one walk through every room.
- **Code files have no size limit** (the owner: no hard limit, and splitting isn't very necessary,
  2026-10-04). A big file only costs Claude reading time. Split one when it gets in the way, not by
  rule; the biggest are `clubhouse.js` (58 KB), `look.js` and `outside.js` (22 KB, next to split).
- **Docs sizes are guides, not limits** (`tools/docs.mjs` prints a note; the owner wants no hard limit).

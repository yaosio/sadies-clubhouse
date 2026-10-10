# Building rooms, putting them away, starting quickly

When rooms are built and put away, and how the game starts fast however many rooms there are. Read
when changing any of that. What a room must do to be put away: `docs/clubhouse/rooms/place.md`.

## Building rooms as they're needed
- Only the garden, the hall, and the buildings outside you can see from the gate as you start (in
  front of you there) are built before the clubhouse opens (and the room you're coming back to). The
  buildings behind you at the gate are built straight after the first picture, first in line.
- Each other room is built afterwards, one at a time, nearest door first: while you stand still (or
  read the letter, or pause), when you're within 7 m of its door, or when you walk up to its door,
  which stays shut until the room's ready.
- A room takes a breath between its big parts (`await m.breathe()`, in the kit): if it's been busy
  more than 6 ms, the game draws a picture before it carries on, so building a room never holds the
  game up for long (the checks fail a bit longer than 200 ms).
- What it made is noted, and warmed onto the graphics card straight away.

## Putting rooms away
- A room that's three doors or more from you for 20 seconds is put away: it stops its sounds, its own `putAway()` (if it has one)
  takes back what it put elsewhere, everything it made that no other place uses goes back to the
  graphics card, and it's built again from its save as you come back.
- There is no cap on how many rooms stay built (there was one, 16, Claude's number, removed on the
  owner's say: all 11 rooms built is about 28 MB of page memory). If a phone ever struggles, the
  speed readout will show it first (`docs/clubhouse/world/speed-readout.md`).
- Every room can be put away (not while it says it's `busy()`).
- A building outside keeps its house: the clubhouse hands it back to the room as `house` when it's
  built again, and keeps the house's `update` going meanwhile (`docs/clubhouse/outside/buildings.md`).
- Far-off buildings are drawn as plain blocks (`docs/clubhouse/outside/buildings.md`).

## Starting quickly
- Everything the page needs before the first picture is asked for at once: the build lists the shell's
  and the clubhouse's files (and three.js) at the top of the page (`modulepreload`), the shell asks
  for the buildings outside's files alongside the clubhouse's, the page asks for the clubhouse's
  lettering straight away, and the page itself is tiny (the copy of the project is a file beside it,
  never fetched by the game).
- Left alone, a browser finds each file only once the one before it has come, a wait for each in a
  row (that, and building every house outside before the first picture, had made starting about
  twice as slow).
- How long it takes: `tools/clubhouse/startup.mjs`. How quick it all is: `tools/clubhouse/speed.mjs`.

## Each room's code is a file of its own
- The build splits the game into files beside the page (`game/`): the shell, the clubhouse, each room
  or activity (whatever its card's `room` or `start` imports), and the parts several share
  (three.js). A room's file is fetched the first time it's built, so the page doesn't grow with the
  number of rooms.
- If it won't come (or the room won't build), its door stays shut, nothing else waits, and it's tried
  again a little later (a few times, asking for the file under a new name, since a browser won't
  fetch a failed file twice). The clubhouse and an activity's own page are tried again the same way,
  and then the page says it couldn't load rather than staying blank.
- So the game can't be opened as a file on its own: it's served (the game page, and
  `tools/serve.mjs` for the checks and tools).

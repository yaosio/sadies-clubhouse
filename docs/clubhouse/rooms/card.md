# An activity's card

What `src/activities/<id>/card.js` says, and where an activity goes. Read when making an activity
or changing its card.

## The card
An activity is a folder in `src/activities/` with a `card.js`:
- `id` (the folder name) and `name`.
- Where it is, one of: `slot` (a door on the landings), `lot` (a plot on the lane), `grounds` (a
  spot in the grounds).
- `keeps` if it saves anything: the start of its save keys, for the pause menu's start-over
  buttons and backups (`saves.md`).
- Either `room` (a game that lives in its room) or `page`, `styles` and `start()` (an activity on
  a computer), below.
- For a door on the landings:
  - `door`: a picture, from `door.js`, drawn by a script under `art/` (its `door.js` header says which); the back of the door
    is the same with the sign painted over. Without one it gets a plain door with its name.
  - `box`: `front`, a picture (on its computer's screen and its poster); `side`, a colour (the
    plain computer room's walls, and the plain door's).
  - `doorstep`: `'dirt'` puts the mole's dirt pile by its door.

## The two kinds of activity
- **On a computer:** `page` (its HTML, from `page.html`), `styles` (its CSS, from `styles.css`) and
  `start()`, which loads the rest of it. None of its code runs until `start()` is called (the build
  keeps it waiting), so its modules can look up its page's elements as they load. You lean into the
  computer in its room, the clubhouse leaves the page and the activity's page comes in
  (`docs/clubhouse/world/shell.md`). These don't get the building kit.
- **A game that lives in its room:** no page, styles or `start()`. Its card has `room` instead, which
  loads its module; the clubhouse calls that module's `buildRoom(kit)` when it opens (`kit.md`) and
  it hands back a place (`place.md`). It imports `three` itself, never the clubhouse.
- **A building outside** is a game that lives in its room whose card has `lot` or `grounds` instead
  of `slot` (`docs/clubhouse/outside/buildings.md`).

## Doors, plots and spots never move
- Each card says which door on the landings is its own: `slot`, its place in `SLOTS` (0 is the
  first one up the stairs). Folder order used to decide, and adding an activity once moved two
  doors, so a new activity takes the next free slot and never shuffles the others.
- Every door, plot and spot is written down in `tests/clubhouse/spots.json`, and the room checker
  fails if one moves. A new one goes on the end of its list, there and in the code.
- Doors don't have to be in sensible places: a new kind of spot (halfway up the scratching post, on
  the ceiling, in another room) is welcome, as a new list. The landings: `docs/clubhouse/world/hall.md`.
  Plots and grounds spots: `docs/clubhouse/outside/plots.md`.
- An address naming an activity after the `#` just opens the clubhouse (one on a computer: goes
  straight into it).

# The building kit

What the clubhouse hands a room's `buildRoom(kit)` (built in `src/clubhouse/clubhouse.js`, with `neighbours.js`).
Anything added to the kit reaches every room with no room edited. Read when a room needs something
from the clubhouse.

## Making things
- `T` (the textures), `C` (the palette), `psx` (the PS1 material), `keep`, `tex`, `words` (the 3x5
  pixel font, `docs/clubhouse/world/drawing.md`), `picture`, `loadImage`.
- The shapes: `kit`, `wallGeometry`, `doorway`.
- `sadie(width, { awake, asleep, unlit, shape, tint, centred })`: Sadie's sprite, always her own 58:47 shape
  and standing on the spot it's put at; `.userData.blink(dt)` (call it every update) blinks her now and
  then, at random, and `.userData.set(asleep)` holds her awake or asleep. For her in a helmet or scuba
  gear, pass those pictures as `awake` and `asleep`, with their own `shape` (height over width).
- `shell({ w, d, h, paper, wainscot, doorAt, wholeWainscot })` (on `kit(scene)`): the four papered walls with the doorway hole, and the wainscot and gold rail all the way round.
- `walker`: how far round you the walls and furniture keep you (`P` in every floor).
- `breathe()`: a pause between big parts while building (`docs/clubhouse/world/building-rooms.md`).
- `card` (its card), its door's `leaf`, its door's picture (`doorImage`).
- `snapshot(obj, place, { from, at, fov, w, h })`: a picture of one thing in a place, taken once,
  with everything else see-through. `skyMat`: the outside's sky, for a room that's out of doors.

## Saving, sound, the page
- `saves`: its save box (`saves.md`). Sounds come from the toolbox, not the kit
  (`docs/clubhouse/sound/system.md`).
- `after(secs, fn)`: runs `fn` once `secs` of game time have passed: held while the pause menu is up,
  gone when the room's put away. Never `setTimeout` in a room (a check fails it).
- `paused()`: whether the pause menu is up (a place keeps updating while it is).
- `ears()`: where you are right now (`place`, `x`, `y`, `z`: your eye, and `yaw`, `pitch`: where
  you're looking), so a game can play a sound only where you'd hear it, and `outside`: where
  outside is seen from (you, out there, or the door you're looking out of; null when it can't be
  seen: the weather works out its rain and snow only then, round that spot).
- `ears()` and `paused()` work while a room's still being built.
- `overlay(css)`: a layer of the page of its own, just over the 3D view and under the pause menu,
  with those styles, gone when the room's put away.
- `testing`: it's the test version.
- `checks(name, hook)`: puts a test hook for the browser checks on the page as `window[name]` (`__<room>`),
  and takes it away when the room's put away. Never assign `window.__x` directly: it would keep a
  put-away room's whole state alive (the room checker fails it).
- `weather` (for whatever makes weather): `docs/clubhouse/outside/weather.md`.

## What it's lent next door
A room is lent the hall, its landing door and (a building) the outside, never the places themselves
(`src/clubhouse/neighbours.js`). Asking the kit, the hall, the outside or its door for anything this
page and `docs/clubhouse/outside/buildings.md` don't list is an error on the spot, so the checks fail
it. Something a room needs from next door is added here first.
- `landingDoor`: its `pos` and `normal` (which way it faces), and `paint(texture)`, which puts a new
  picture on its front (an OUT OF ORDER sign).
- `hall`:
  - `add(...things)` and `face(...things)` (things that turn to face you) into it, each handing back
    how to take them out again;
  - `is(place)`: whether a place, like `ears().place`, is the hall;
  - `shape`: its solid shape, for things bouncing round it;
  - Sadie asleep in her box: `borrowSadie()` hands back how to give her back; she's out of her box
    while anyone has her (`sadieBorrowed()`).
  So a game can let something loose in the hall (a ball, and Sadie chasing it): its room's `update`
  moves them, since every place updates every frame.
- `outside`, `lot` or `ground`, and `house` (a building only): `docs/clubhouse/outside/buildings.md`.

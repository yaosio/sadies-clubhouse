# The mansion and the page shell

How Sadie's mansion is built (`src/clubhouse/`) and the shell every activity runs in (`src/main.js`).
The short overview is `ARCHITECTURE.md`; read this page when you're changing the mansion itself:
its places and doorways, building and putting rooms away, walking and controls, or how it's drawn.

- **The clubhouse** (`src/main.js`) gets every card from the build (`import cards from
  'activities'`: `tools/build.mjs` makes that list from the folders, in folder order, so adding an
  activity never touches the clubhouse). The page opens in the mansion; an address naming an activity
  after the `#` (`#dropper-world`, used by its checks) goes straight into it. It runs one activity
  at a time: it puts that activity's styles and page in, then calls `start()`. It also puts
  an ESC BACK key in the activity's top left corner (its own look, in a candy keycap style; an
  activity keeps that corner free, with the toolbox's `roomForBack(strip, host)`, `src/shared/back.js`). Pressing it, or Escape when the activity didn't use the key for
  something itself (`preventDefault()`, like Dropper World closing its dev sheet), reloads the page
  into the clubhouse, so an activity never has to tidy up after itself (its timers, listeners and
  loop just stop). It must save when the page goes away, through the save director's `onLeave(fn)`
  (`src/shared/storage.js`), as Dropper World does.

- **The mansion** (`src/clubhouse/`, loaded only when the page opens on it) is Sadie's clubhouse
in crappy late-90s 3D, made with three.js (the one library, bundled into the page). It's made of
separate **places**, each its own scene with its own floor and light: `outside.js` (the garden,
the house's shell, the backyard behind it, and the lane outside the gate with its plots), `hall.js` (the entrance hall: the bottom of the cat tree) and `room.js`
(an activity's room, one per card). Places are joined only by **doorways** (`build.js`): a hole
in a wall, two leaves that swing open, and a shallow box behind the hole whose inside shows the
other place. Each frame, every open doorway in front of you (the nearest three: two doors on the landing can
be open at once, and one of them showing black was a bug) has the other place drawn into its own
picture the size of the screen, from where you'd be if you'd already walked through (its near
plane tilted to lie in the far doorway, so nothing on the near side of it shows); the box looks
that picture up by screen position. Walking across a doorway moves you to the same spot on the
other side, turned round. So there are no loading screens, a place can be any size (bigger inside
than out), and changing one place never touches another. Only the place you're in, and through
the doorways open in front of you, get drawn.
- **Building rooms as they're needed.** Only the garden, the hall, the buildings outside you can
  see from the gate as you start (in front of you there: the Hedge Maze) are built before the
  mansion opens (and the room you're coming back to). The buildings behind you at the gate are
  built straight after the first picture, first in line. Each other room is built afterwards, one at a time, nearest door first: while you stand
  still (or read the letter, or pause), when you're within 7 m of its door, or when you walk up to
  its door, which stays shut until the room's ready. A room takes a breath between its big parts
  (`await m.breathe()`, in the kit): if it's been busy more than 6 ms, the game draws a picture
  before it carries on, so building a room never holds the game up for long (the checks fail a
  bit longer than 200 ms). What it made is noted, and warmed onto the
  graphics card straight away. A room that's three doors or more from you for 20
  seconds (or the ones you were near longest ago, once more than 16 are built) is put away: it
  stops its sounds, its own `putAway()` (if it has one) takes back what it put elsewhere, everything it made that no other place uses goes back to the graphics
  card, and it's built again from its save as you come back. Every room can be put away (not while
  it says it's `busy()`). A building outside keeps its house: the mansion hands it back
  to the room as `house` when it's built again, and keeps the house's `update` going meanwhile (`OUTSIDE.md`). A new room
  must be able to be put away, and must look the same built again from its save.
- **Starting quickly.** Everything the page needs before the first picture is asked for at once:
  the build lists the clubhouse's and the mansion's files (and three.js) at the top of the page
  (`modulepreload`), the clubhouse asks for the buildings outside's files alongside the mansion's,
  the page asks for the mansion's lettering straight away, and the page itself is tiny (the copy of
  the project is a file beside it, never fetched by the game). Left alone, a browser finds each
  file only once the one before it has come, a wait for each in a row (that, and building every
  house outside before the first picture, had made starting about twice as slow). How long it
  takes: `tools/clubhouse/startup.mjs`.
- **Each room's code is a file of its own.** The build splits the game into files beside the
  page (`game/`): the clubhouse, the mansion, each room or activity (whatever its card's `room` or
  `start` imports), and the parts several share (three.js). A room's file is fetched the first time
  it's built, so the page doesn't grow with the number of rooms. If it won't come (or the room
  won't build), its door stays shut, nothing else waits, and it's tried again a little later (a few
  times, asking for the file under a new name, since a browser won't fetch a failed file twice). The
  mansion and an activity's own page are tried again the same way, and then the page says it
  couldn't load rather than staying blank. So the game can't be opened as a file on its own any more:
  it's served (the game page, and `tools/serve.mjs` for the checks and tools).
- **Far-off buildings** are drawn as plain blocks (`OUTSIDE.md`). `tools/clubhouse/speed.mjs`
  prints how quick it all is.
- A door opens only when you walk up to it facing it (one at a time), and
closes behind you (the one you just came through waits till you're out of its swing). Both sides of a doorway show the same real door: it swings into the place
further in (`swing`), so it's hinged on opposite sides as seen from each side.
- `mansion.js`: you (walking, the eye following steps smoothly), the controls (WASD/arrows; the
  mouse, locked to the view after a click, or dragging if the browser won't lock it; on a phone a
  thumb stick that stays in the bottom left corner (only a touch starting on it walks), dragging
  anywhere else to look; the camera
  turns round the upright first, then looks up or down, so the view never tips over; E, or the button on a phone, to use), the
  doorways, using the computer (you lean in until the screen fills the view, then the mansion
  leaves the page and the activity comes in; it notes which one in `sessionStorage`, so coming
  back puts you at that computer), easing your view somewhere (`glideTo`), passing keys, presses and
  frames to the ways of playing, Sadie's letter (`mansion.invited`: the first time only), the
  pause menu (Esc or the pause button; it also starts over everything, the invitation, or an
  activity's saves, each only after a YES on its "are you sure?"; and YOUR SAVES: how full they are, and backups), and `window.__mansion` for the checks.
- `play/`: the ways of playing, each lent only what it needs (`you`: the view, the controls held,
  the mode, `glideTo`). `arcade.js`, playing a game that lives in its room (mode `arcade`: the view
  glides back until the game's `view` fits the screen, looking at it square on from a little below;
  A/D, the arrows, the mouse without clicking, or a finger sliding anywhere go to the game; Esc, W,
  S or STEP BACK glide you back to where you stood; the pause menu stops the game too). `paint.js`,
  painting a place with a `brush` (its LOOK and PAINT buttons, box and dot are its own HTML and CSS beside it).
- `neighbours.js`: what a room is lent of the hall, the outside and its landing door (only what
  `ROOMS.md` lists; anything else a room asks the kit or them for is an error on the spot).
- `look.js`: the PS1 material (corners snapping to the pixel grid, light per corner, few colours
  with dithering; no swimming textures, which the owner found far too distracting), the doorway
  and sky materials, and every texture, drawn
  on little canvases when it opens. `pictures.js` (Sadie's sprite; drawn by
  `art/clubhouse/pictures.py`, never edited by hand) is still where her picture comes from.
- The hall: sixteen flat walls, three storeys, the spiral stairs going round twice to two landings.
  Every wall on both landings can have a door: a card's `slot` is its place in `SLOTS` (the first
  six by the first landing's stairs, taken; then the rest of the first landing; then the second
  landing). The next three free ones are boarded up with SOON on them, the rest are plain wall. Above
  the second landing the top's still being built. Walking: the floor under you is worked out per
  place (`floor(x, z, y)`: the ground, each tread, the bridges, the landings); a step is at most half
  a metre, so the railings and the landings' edges hold you in by themselves.
- It only resizes the drawing when the screen's size really changes, and draws again at once.
- No flicker: things painted on a floor (the path, rugs, the sunbeam) skip the depth test and
  are drawn straight after their floor (`onFloor`, floor `renderOrder` -2, them -1); things on
  walls stand at least 4 cm off them. The camera's near plane is 0.1 m (phones' depth is coarse).
  Decals (`decal`, nudged toward the camera) are only for things seen up close: seen from far off
  the nudge is big enough to draw them over what's in front, and a phone's depth is too coarse to
  keep even 15 cm between a window and its wall. So the mansion's outside windows are painted
  into their walls' pictures (`painted()` in `outside.js`). A doorway's see-through box sits a
  hair above any ground that runs on under it (Clyde's house), or the ground shows through.
  Door leaves open to 80 degrees, not flat, so they stay in sight as you go through.
- Nothing flickers as you go through a doorway, and nothing jumps (the owner saw even a few
  centimetres as a stutter). Standing on a doorway's line, corners of the walls and floor along it
  sit almost exactly level with your eye, and the maths loses so much precision that whole walls
  drew wrong for a frame. So in `look.js`, a corner that close to level with your eye counts as
  just behind you, and isn't snapped to the pixel grid; exactly on the line (to 0.1 mm) the view
  is drawn from 0.1 mm off it; and within 40 cm of a doorway the far side is drawn without the
  tilted near plane (its own door bits are always hidden).
- The view on a phone: at most 68 degrees tall, looking at most 43 degrees up or down (more made
  the walls lean like the view had tipped over), dragging up and down slower than sideways, and
  your gaze drifting back to level while you walk with the thumb stick.
- Every word painted in the mansion (signs, labels) uses the kit's 3x5 pixel font, drawn
  straight in (`words`), so none of them waits for a web font.

- **The test version's label** goes where an activity's `page.html` (or the mansion's
  `mansion.html`) says `<!--@badge-->` (at the end of the page if none does).

- **The outside** (the grounds, the lane, its plots and the buildings on them, walking on more than
  one level, growing into a town) has its own page: `OUTSIDE.md`.

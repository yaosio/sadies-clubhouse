# How the clubhouse is built

Sadie's Clubhouse is Sadie's mansion with activities in it, like a 90s activity center. This page
is everything the activities share: the page they run in, the mansion, the toolbox, and the build
and check tools. Each activity's own code is described in `docs/<activity>/ARCHITECTURE.md` (or its
README, for a small one). Plain ES modules in `src/`, bundled by esbuild into one page
(`tools/build.mjs`).

## The clubhouse, the activities and the toolbox

```
src/main.js, src/index.html     the clubhouse: the shell every activity runs in
src/clubhouse/                  Sadie's mansion: the 3D clubhouse you walk round, a room per activity
src/activities/<name>/          one folder per activity: everything that's only its own
src/shared/                     the toolbox: the few things more than one activity needs
tests/<name>/                   each activity's own checks (tests/clubhouse/: the mansion's)
tools/<name>/                   each activity's own tools (tools/clubhouse/: the mansion's)
docs/<name>/                    each activity's own docs (docs/clubhouse/: this page and the look)
art/                            mock-ups, and the scripts that draw pictures (art/clubhouse/pictures.py: Sadie's sprite and every box and door)
```

The point is that changing one activity never means retesting the others. An activity only
imports from its own folder and from `src/shared/`, never from another activity or from the
clubhouse. `tools/check.mjs` knows what each activity's checks depend on, and only runs the ones
whose files changed (see its row below). The toolbox stays small: a change there means every
activity is checked again, so something moves into it only once a second activity really needs it.

- **An activity** is a folder in `src/activities/` with a `card.js`: its `id` (the folder name),
  `name`, `page` (its HTML, from `page.html`), `styles` (its CSS, from `styles.css`), `start()`,
  which loads the rest of it, and for the mansion `box` (`front`, a picture: on its computer's
  screen and its poster; `side`, a colour: its room's walls), `door` (a picture: its door on the
  landing, from `door.js`, drawn by `art/clubhouse/pictures.py`; the back of the door is the same
  with the sign painted over; without one it gets a plain door with its name), and `keeps` if it
  saves anything (the start of its storage keys, for the pause menu's start-over buttons).
  None of an activity's code runs until `start()` is called (the build keeps it waiting), so its modules can look up its page's elements as they load.
- **A game that lives in its room** (Brickbuster '96, the Music Room) has no page, styles or `start()`: its card
  has `room` instead, which loads its module; the mansion calls that module's `buildRoom(kit)` when
  it opens, handing it the building kit (its textures `T`, the palette `C`, `psx`, `keep`, `tex`,
  `words`, `picture`, `loadImage`, `breathe` (a pause between big parts), the shapes `kit`, `wallGeometry`, `doorway`, the card and its
  door's leaf), so the game still never imports the clubhouse (it imports `three` itself). It hands
  back a place like any room (`name`, `scene`, `floor`, `doors`, `faces`, `uses`, `light`, `spots`,
  `update(t, dt)`, and if the mansion may put it away when you're far off, `putAway()`, which stops
  anything of its own for good, like its sounds, and takes back anything it put in other places;
  `busy()` if it mustn't be put away just now, like mid-game; and `scenes` if it has more than one), where a use with `play` is the game: `view` (the middle, facing way, width and
  height the screen has to fit), `start()` (called during the press, so sound is allowed),
  `stop()`, `steer(v, dt)` (held keys, -1 to 1) and `nudge(metres)` (the mouse or a finger, already
  turned into metres across the game), and `over` (set when the game ends: the mansion steps you
  back). An instrument (the Music Room's) instead has `key(code, down, repeat)`, which gets every
  key (it returns true for the ones it used; only Esc steps back then, W and S are notes), and
  `touch(id, ray, 'down' | 'move' | 'up')`, every press on the screen as a line out into the room
  (`origin`, `dir`) for it to find what's under it; its `view` can say `down` (how far, in radians,
  to look down on it: a keyboard lying flat), and `hint` (`keys`, `touch`) is what the hint at the
  top says while you play it. A use with `act` instead of `play` just does something when you press
  E (turning a dial or a sign): its `label` can change, and `button` names it on a phone. `act` is
  handed `{ from, EYE, glide }`: where you stand, and `glide(to, secs, then)`, which eases your view
  to `to` (`x`, `z`, `eye`, `yaw`, `pitch`) and then calls `then`; once a `then` doesn't glide on,
  you have the controls back (the aquarium's tap on the glass, rising over the rim and sinking into
  the water; a `to` with `y` also sets where you stand once there). A place can also say `speed` (how
  fast you get about in it, metres a second) and `far` (how far you can see), and change its own
  `scene`, `floor`, `faces`, `uses` and `light` whenever it likes: the mansion reads them every frame
  (the aquarium's room becomes the ocean that way, and is quicker to get about and see further in). Its place can hold its door open (`holding`: the doorway, while something goes out through
  it), and make everyone in it watch something (`watch`: a point; your view follows it and you
  can't walk or look away until it's null again: Brickbuster's escaping yarn ball; the thumb stick hides meanwhile). A `watch` can also
  say `at` (`x`, `z`, and `y`, where you stand: you're eased there, or put there at once with `snap`): Space Adventure straps
  you into its pilot's seat that way. The kit's `paused()` says whether the pause menu is up (a place keeps updating while it is). The kit also has its door's picture (`doorImage`) and its door on the landing
  (`landingDoor`, whose `paint(texture)` puts a new picture on its front: Brickbuster's OUT OF
  ORDER sign) and the hall itself (`hall`: its scene and `faces`, `napping`, Sadie asleep in her
  box, and `shape`, its solid shape for things bouncing round it), so a game can let something
  loose in the hall (Brickbuster's yarn ball, and Sadie chasing it: its room's `update` moves them,
  since every place updates every frame), and `ears()`, where you are right now (`place`, `x`, `y`, `z`: your eye, and `yaw`, `pitch`: where you're looking), so a
  game can play a sound only where you'd hear it (Sadie out in the hall). An address naming it after the `#` just opens the mansion.
- **A building outside the gate** (Clyde's House) is a game that lives in its room whose card has
  `lot` instead of `slot`: which plot along the lane outside the front gate is its (`LOTS` in
  `outside.js`: 0 is left of the path as you go out, 1 across from it, then further along each way;
  the next free one has a COMING SOON stake). The kit handed to its `buildRoom` also has `outside`
  (the outside place: its `scene` and `faces` to add to, and `block(x0, x1, z0, z1)` and
  `blockRound(x, z, r)` for what's solid) and `lot` (its plot: `x`, `z`, the middle of the front
  door's threshold; the house faces the gate). It builds the house into the outside's scene
  itself, and hands back, with its place, `house` (`door`: its front door, a `doorway` in the
  outside's scene, facing the gate), which the mansion joins to the room's own `doors.door`. Its
  place's `update` runs every frame wherever you are, so it animates the outside too. Nothing on the
  landing changes (the hall skips cards with a `lot`).
- **Doors never move.** Each card says which door on the landing is its (`slot`: 0 is the first
  one up the stairs; Brickbuster 0, Dropper World 1, TypeFitter 2, the Music Room 3, the aquarium 4, Space Adventure 5), so a new activity never
  shuffles the others (folder order used to decide, and adding Brickbuster moved two doors). A new
  activity takes the next free slot (the Music Room 3). A card's `doorstep: 'dirt'` puts the mole's dirt pile by its
  door (Dropper World).
- **The clubhouse** (`src/main.js`) gets every card from the build (`import cards from
  'activities'`: `tools/build.mjs` makes that list from the folders, in folder order, so adding an
  activity never touches the clubhouse). The page opens in the mansion; an address naming an activity
  after the `#` (`#dropper-world`, used by its checks) goes straight into it. It runs one activity
  at a time: it puts that activity's styles and page in, then calls `start()`. It also puts
  an ESC BACK key in the activity's top left corner (its own look, in a candy keycap style; an
  activity keeps that corner free). Pressing it, or Escape when the activity didn't use the key for
  something itself (`preventDefault()`, like Dropper World closing its dev sheet), reloads the page
  into the clubhouse, so an activity never has to tidy up after itself (its timers, listeners and
  loop just stop). It must save when the page goes away (`pagehide`), as Dropper World does.
- **The mansion** (`src/clubhouse/`, loaded only when the page opens on it) is Sadie's clubhouse
  in crappy late-90s 3D, made with three.js (the one library, bundled into the page). It's made of
  separate **places**, each its own scene with its own floor and light: `outside.js` (the garden,
  the house's shell, and the lane outside the gate with its plots), `hall.js` (the entrance hall: the bottom of the cat tree) and `room.js`
  (an activity's room, one per card). Places are joined only by **doorways** (`build.js`): a hole
  in a wall, two leaves that swing open, and a shallow box behind the hole whose inside shows the
  other place. Each frame, every open doorway in front of you (the nearest three: two doors on the landing can
  be open at once, and one of them showing black was a bug) has the other place drawn into its own
  picture the size of the screen, from where you'd be if you'd already walked through (its near
  plane tilted to lie in the far doorway, so nothing on the near side of it shows); the box looks
  that picture up by screen position. Walking across a doorway moves you to the same spot on the
  other side, turned round. So there are no loading screens, a place can be any size (bigger inside
  than out), and changing one place never touches another. Only the place you're in, and through
  one doorway, get drawn.
  - **Building rooms as they're needed.** Only the garden, the hall and any building outside the
    gate (seen from the lane) are built before the mansion opens (and the room you're coming back
    to). Each other room is built afterwards, one at a time, nearest door first: while you stand
    still (or read the letter, or pause), when you're within 7 m of its door, or when you walk up to
    its door, which stays shut until the room's ready. A room takes a breath between its big parts
    (`await m.breathe()`, in the kit): if it's been busy more than 6 ms, the game draws a picture
    before it carries on, so building a room never holds the game up for long (the checks fail a
    bit longer than 200 ms). What it made is noted, and warmed onto the
    graphics card straight away. A room with `putAway()` that's three doors or more from you for 20
    seconds (or the ones you were near longest ago, once more than 16 are built) is put away: it
    stops its own things, everything it made that no other place uses goes back to the graphics
    card, and it's built again from its save as you come back. Every room can be put away (not while
    it says it's `busy()`). A building outside the gate keeps its house: the mansion hands it back
    to the room as `house` when it's built again, and keeps its `update` going meanwhile. A new room
    must be able to be put away, and must look the same built again from its save. `tools/clubhouse/speed.mjs`
    prints how quick it all is. A door opens only when you walk up to it facing it (one at a time), and
  closes behind you (the one you just came through waits till you're out of its swing). Both sides of a doorway show the same real door: it swings into the place
  further in (`swing`), so it's hinged on opposite sides as seen from each side.
  - `mansion.js`: you (walking, the eye following steps smoothly), the controls (WASD/arrows; the
    mouse, locked to the view after a click, or dragging if the browser won't lock it; on a phone a
    thumb stick that stays in the bottom left corner (only a touch starting on it walks), dragging
    anywhere else to look; the camera
    turns round the upright first, then looks up or down, so the view never tips over; E, or the button on a phone, to use), the
    doorways, using the computer (you lean in until the screen fills the view, then the mansion
    leaves the page and the activity comes in; it notes which one in `sessionStorage`, so coming
    back puts you at that computer), playing a game that lives in its room (mode `arcade`: the view
    glides back until the game's `view` fits the screen, looking at it square on from a little below;
    A/D, the arrows, the mouse without clicking, or a finger sliding anywhere go to the game; Esc,
    W, S or STEP BACK glide you back to where you stood; the pause menu stops the game too), Sadie's letter (`mansion.invited`: the first time only), the
    pause menu (Esc or the pause button; it also starts over everything, the invitation, or an
    activity's saves, each only after a YES on its "are you sure?"), and `window.__mansion` for the checks.
  - `look.js`: the PS1 material (corners snapping to the pixel grid, light per corner, few colours
    with dithering; no swimming textures, which the owner found far too distracting), the doorway
    and sky materials, and every texture, drawn
    on little canvases when it opens. `pictures.js` (Sadie's sprite; drawn by
    `art/clubhouse/pictures.py`, never edited by hand) is still where her picture comes from.
  - The hall: sixteen flat walls, three storeys. The first landing has a door per activity, each at
    its card's `slot` starting where the stairs come out (`SLOTS`: six, all taken now that Space
    Adventure has the sixth); the second landing is still being built. The next activity's door needs
    the second landing finished (or a building outside the gate instead). Walking: the floor under you is worked out per place (`floor(x, z,
    y)`: the ground, each tread, the bridge, the landing); a step is at most half a metre, so the
    railings and the landing's edge hold you in by themselves.
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
- **Saves** belong to each activity: its keys start with its own name (Dropper World's is
  `sadies-dropper-world.save`; a few older settings keys start with `jellystack.`). A new activity
  uses `sadies-clubhouse.<id>.` for its keys, and lists what its keys start with in its card's
  `keeps` (the pause menu's start-over buttons use it). The
  mansion's own keys start with `mansion.`. Never rename a key that's already in use: everyone's
  saves would be lost.
- **The test version's label** goes where an activity's `page.html` (or the mansion's
  `mansion.html`) says `<!--@badge-->` (at the end of the page if none does).
- **The toolbox** (`src/shared/`) so far: `storage.js`, a safe localStorage wrapper (get, set,
  remove; never throws). The one place that touches browser storage, so a different home for saves
  (itch.io, a desktop app) only changes this file.

**Adding an activity:** a folder `src/activities/<name>/` with its `card.js`, `page.html`,
`styles.css` and a `main.js` for `start()` to load; `tests/<name>/run.mjs` for its headless checks
(Node, no browser) and `tests/<name>/browser.mjs` for its checks in a browser (see Dropper World's
for the shape; it opens the page at `#<name>`). Its docs go in `docs/<name>/`, starting with a
`README.md` (what it is, its own design rules, its parked ideas, and its other pages if it has
any), and it gets a line in the list of activities in the main `README.md`. Nothing else changes.

## Tests and tools shared by every activity

| File | What it does |
|---|---|
| `tests/run.mjs` | `npm test`: every activity's headless checks, one activity after another (`npm test -- dropper-world` for one). |
| `tests/clubhouse/browser.mjs` | The mansion in headless Chromium as a phone and a desktop (run by `tools/check.mjs` whenever anything in the page changed: about half a minute, the phone and the desktop side by side): it opens at the gate with Sadie's letter (and only the first time), walking (keys, and the thumb stick), the front door showing the hall through it and walking through it, climbing the stairs to the landing, the rooms built after the mansion opens (each under a time limit, all drawn with the same few materials), a room put away and built again as you walk up to its door with nothing piling up, two doors open side by side both showing their rooms, Dropper World's door into its room, playing it at the computer with the mansion gone from the page, ESC BACK coming back to that computer with the tower saved, Escape coming back from a page opened at `#dropper-world`, pausing, and the start-over buttons (NO keeps things, YES starts the letter over). Fails on any page error; screenshots in `dist/check/clubhouse/`. |
| `tools/clubhouse/shots.mjs` | Pictures of the mansion from its main spots (the gate, the front door from both sides, the hall, the stairs, the landing, an activity's door and room), as a desktop and a phone, from the built page: `dist/shots/clubhouse/`. |
| `tools/clubhouse/speed.mjs` | How quick the mansion is, from the built page: how long the first picture took, how long each place took to build, what's on the graphics card, and three rounds of putting every room away and building it again (the numbers must come back the same). |
| `tools/clubhouse/spot.mjs` | A picture of the mansion from anywhere: `node tools/clubhouse/spot.mjs <name> <place> <x> <z> <y> <lookX> <lookY> <lookZ>` stands there and looks at that point (`dist/shots/clubhouse/spot-<name>.png`), for checking how one thing looks. |
| `tools/build.mjs` | `npm run build`: the one-file page in `dist/index.html` (the clubhouse and every activity), with the source embedded (everything but `art/`). Squeezed small (three.js is big); the readable source is what's embedded. `--preview` makes the test version (says "test version", with the time and commit, in the corner and the tab title). |
| `tools/check.mjs` | `npm run check`: each activity's headless tests, a build, then the page in headless Chromium: the mansion's checks (unless exactly this page already passed them), then each activity's browser checks, each playing the phone and the desktop side by side. It prints how long each stage took. Each activity is skipped when it already passed on exactly the same files (remembered in `dist/`): for its tests, its folder, its tests, `src/shared/` and `package.json`; for its browser checks, those plus its tools (`tools/<name>/`), the clubhouse's shell (files directly in `src/`, not the mansion, unless its card has a `room`: then the mansion too), `tools/build.mjs` and `tools/check.mjs`. So the check at merge is quick. `--quick` skips the tests, `--preview` checks the test version, `--retest` runs everything regardless. `--live <file>` (the live game page, saved) also counts an activity's tests as passed when its files are exactly what that page was built from, since it only goes live after passing. An activity's `browser.mjs` can export `prepare()` for anything its checks need made first (Dropper World's full board): it's started at the very beginning and runs alongside the headless tests. |
| `tools/unpack.mjs` | Rebuilds the project folder from a built page's embedded source. |

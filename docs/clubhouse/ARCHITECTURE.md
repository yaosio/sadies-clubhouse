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
  saves anything (the start of its storage keys, for the test version's start-over buttons).
  None of an activity's code runs until `start()` is called (the build keeps it waiting), so its modules can look up its page's elements as they load.
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
  separate **places**, each its own scene with its own floor and light: `outside.js` (the garden
  and the house's shell), `hall.js` (the entrance hall: the bottom of the cat tree) and `room.js`
  (an activity's room, one per card). Places are joined only by **doorways** (`build.js`): a hole
  in a wall, two leaves that swing open, and a shallow box behind the hole whose inside shows the
  other place. Each frame, the nearest open doorway in front of you has the other place drawn into
  a picture the size of the screen, from where you'd be if you'd already walked through (its near
  plane tilted to lie in the far doorway, so nothing on the near side of it shows); the box looks
  that picture up by screen position. Walking across a doorway moves you to the same spot on the
  other side, turned round. So there are no loading screens, a place can be any size (bigger inside
  than out), and changing one place never touches another. Only the place you're in, and through
  one doorway, get drawn. A door opens only when you walk up to it facing it (one at a time), and
  closes behind you (the one you just came through waits till you're out of its swing). Both sides of a doorway show the same real door: it swings into the place
  further in (`swing`), so it's hinged on opposite sides as seen from each side.
  - `mansion.js`: you (walking, the eye following steps smoothly), the controls (WASD/arrows; the
    mouse, locked to the view after a click, or dragging if the browser won't lock it; on a phone a
    thumb stick that stays in the bottom left corner (only a touch starting on it walks), dragging
    anywhere else to look; the camera
    turns round the upright first, then looks up or down, so the view never tips over; E, or the button on a phone, to use), the
    doorways, using the computer (you lean in until the screen fills the view, then the mansion
    leaves the page and the activity comes in; it notes which one in `sessionStorage`, so coming
    back puts you at that computer), Sadie's letter (`mansion.invited`: the first time only), the
    pause menu (Esc or the pause button; in the test version, found by its label, it also starts
    over everything, the invitation, or an activity's saves), and `window.__mansion` for the checks.
  - `look.js`: the PS1 material (corners snapping to the pixel grid, light per corner, few colours
    with dithering; no swimming textures, which the owner found far too distracting), the doorway
    and sky materials, and every texture, drawn
    on little canvases when it opens. `pictures.js` (Sadie's sprite; drawn by
    `art/clubhouse/pictures.py`, never edited by hand) is still where her picture comes from.
  - The hall: sixteen flat walls, three storeys. The first landing has a door per activity, in
    folder order starting where the stairs come out (`SLOTS`: six so far), and boarded-up ones for
    the next; the second landing is still being built. More activities than that will need the
    second landing finished. Walking: the floor under you is worked out per place (`floor(x, z,
    y)`: the ground, each tread, the bridge, the landing); a step is at most half a metre, so the
    railings and the landing's edge hold you in by themselves.
  - It only resizes the drawing when the screen's size really changes, and draws again at once.
  - No flicker: things painted on a floor (the path, rugs, the sunbeam) skip the depth test and
    are drawn straight after their floor (`onFloor`, floor `renderOrder` -2, them -1); things on
    walls stand at least 4 cm off them. The camera's near plane is 0.1 m (phones' depth is coarse).
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
  `keeps` (only the test version's start-over buttons use it; players never see it). The
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
| `tests/clubhouse/browser.mjs` | The mansion in headless Chromium as a phone and a desktop (run by `tools/check.mjs` whenever anything in the page changed: about half a minute, the phone and the desktop side by side): it opens at the gate with Sadie's letter (and only the first time), walking (keys, and the thumb stick), the front door showing the hall through it and walking through it, climbing the stairs to the landing, Dropper World's door into its room, playing it at the computer with the mansion gone from the page, ESC BACK coming back to that computer with the tower saved, Escape coming back from a page opened at `#dropper-world`, pausing, and the start-over buttons (only in the test version). Fails on any page error; screenshots in `dist/check/clubhouse/`. |
| `tools/clubhouse/shots.mjs` | Pictures of the mansion from its main spots (the gate, the front door from both sides, the hall, the stairs, the landing, an activity's door and room), as a desktop and a phone, from the built page: `dist/shots/clubhouse/`. |
| `tools/build.mjs` | `npm run build`: the one-file page in `dist/index.html` (the clubhouse and every activity), with the source embedded (everything but `art/`). Squeezed small (three.js is big); the readable source is what's embedded. `--preview` makes the test version (says "test version", with the time and commit, in the corner and the tab title). |
| `tools/check.mjs` | `npm run check`: each activity's headless tests, a build, then the page in headless Chromium: the mansion's checks (unless exactly this page already passed them), then each activity's browser checks, each playing the phone and the desktop side by side. It prints how long each stage took. Each activity is skipped when it already passed on exactly the same files (remembered in `dist/`): for its tests, its folder, its tests, `src/shared/` and `package.json`; for its browser checks, those plus its tools (`tools/<name>/`), the clubhouse's shell (files directly in `src/`, not the mansion), `tools/build.mjs` and `tools/check.mjs`. So the check at merge is quick. `--quick` skips the tests, `--preview` checks the test version, `--retest` runs everything regardless. `--live <file>` (the live game page, saved) also counts an activity's tests as passed when its files are exactly what that page was built from, since it only goes live after passing. An activity's `browser.mjs` can export `prepare()` for anything its checks need made first (Dropper World's full board): it's started at the very beginning and runs alongside the headless tests. |
| `tools/unpack.mjs` | Rebuilds the project folder from a built page's embedded source. |

# Architecture

Sadie's Play Place is a clubhouse with activities in it, like a 90s activity center. Sadie's Dropper
World is the first activity. Plain ES modules in `src/`, bundled by esbuild into one page
(`tools/build.mjs`).

## The clubhouse, the activities and the toolbox

```
src/main.js, src/index.html     the clubhouse: the shell every activity runs in
src/clubhouse/                  the clubhouse menu: a 3D room with a box per activity on its shelves
src/activities/<name>/          one folder per activity: everything that's only its own
src/shared/                     the toolbox: the few things more than one activity needs
tests/<name>/                   each activity's own checks (tests/clubhouse/: the menu's)
tools/<name>/                   each activity's own tools
```

The point is that changing one activity never means retesting the others. An activity only
imports from its own folder and from `src/shared/`, never from another activity or from the
clubhouse. `tools/check.mjs` knows what each activity's checks depend on, and only runs the ones
whose files changed (see its row below). The toolbox stays small: a change there means every
activity is checked again, so something moves into it only once a second activity really needs it.

- **An activity** is a folder in `src/activities/` with a `card.js`: its `id` (the folder name),
  `name`, `page` (its HTML, from `page.html`), `styles` (its CSS, from `styles.css`), `start()`,
  which loads the rest of it, and for the menu `box` (its box on the shelf: `front`, a picture,
  and `side` and `top` colours) and `blurb` (the lines the menu's LED board shows under its name,
  in capitals, up to about 34 letters each). None of an activity's code runs until `start()` is called (the build
  keeps it waiting), so its modules can look up its page's elements as they load.
- **The clubhouse** (`src/main.js`) gets every card from the build (`import cards from
  'activities'`: `tools/build.mjs` makes that list from the folders, in folder order, so adding an
  activity never touches the clubhouse). The page opens on the menu; an address naming an activity
  after the `#` (`#dropper-world`, used by its checks) goes straight into it. It runs one activity
  at a time: it puts that activity's styles and page in, then calls `start()`. Leaving an activity
  will reload the page into the clubhouse (for now there's no button for it; reloading the page
  does it), so an activity never has to tidy up after itself (its timers, listeners and loop just
  stop).
- **The menu** (`src/clubhouse/`, loaded only when the page opens on it) is the clubhouse room in
  crappy late-90s 3D, made with three.js (the one library, bundled into the page): `room.js` builds
  the room and the PS1 look (corners snapping to the pixel grid, swimming textures, few colours
  with dithering, all in its one material), `menu.js` the rest: walking and looking, tapping a box
  to go and see it, the LED board, the F-keys and PLAY!. Every activity gets a box, in folder order,
  on the back-wall shelf (6 cubbies), then on the side-wall shelf (MORE SHELVES); empty cubbies get
  locked "under construction" boxes and a "coming soon" card. PLAY! shows a loading bar, then takes
  the whole menu out of the page (its screen, look, listeners and 3D drawing) before the activity
  comes in. Its pictures (`pictures.js`, and Dropper World's `box.js`) are drawn by
  `art/play-place/pictures.py`; never edit them by hand.
- **Saves** belong to each activity: its keys start with its own name (Dropper World's is
  `sadies-dropper-world.save`; a few older settings keys start with `jellystack.`). A new activity
  uses `sadies-play-place.<id>.` for its keys. Only an activity knows whether it saves anything,
  and the clubhouse never shows it.
- **The test version's label** goes where an activity's `page.html` says `<!--@badge-->` (at the
  end of the page if none does).
- **The toolbox** (`src/shared/`) so far: `storage.js`, a safe localStorage wrapper (get, set,
  remove; never throws). The one place that touches browser storage, so a different home for saves
  (itch.io, a desktop app) only changes this file.

**Adding an activity:** a folder `src/activities/<name>/` with its `card.js`, `page.html`,
`styles.css` and a `main.js` for `start()` to load; `tests/<name>/run.mjs` for its headless checks
(Node, no browser) and `tests/<name>/browser.mjs` for its checks in a browser (see Dropper World's
for the shape; it opens the page at `#<name>`). Nothing else changes.

# Dropper World (`src/activities/dropper-world/`)

Paths below are inside this folder unless they start with `src/`, `tests/` or `tools/`. Three
layers, and dependencies only point downward:

```
ui/  input/         screen widgets and player input      (may use anything below)
render/             drawing the world onto the canvas     (reads core, never changes it*)
core/               the simulation: no DOM, no canvas     (runs headless in Node for tests)
config.js, src/shared/
```
*The camera lives in `render/view.js` and is the one piece of state render owns.

`core/` must never import from `render/`, `ui/` or `input/`, and must not touch `document` or
`window`. That's what lets `tests/dropper-world/run.mjs` run the real game in Node. When the
simulation needs to tell the screen something, it emits an event (below).

## Module map

| File | What it does |
|---|---|
| `card.js`, `page.html`, `styles.css` | Its card for the clubhouse, its screen (the canvases, the buttons, the thought bubble, the dev sheet) and its look. |
| `main.js` | Loaded by the card's `start()`. Boots everything: sizes the canvas, applies tuning, loads the saved game (or starts a board), saves once a minute and when the page is hidden or closed, starts the loop. Also exposes `window.__jellyDebug()` for browser tests. |
| `loop.js` | Fixed 1/60 s simulation steps (max 3 catch-up steps while they take under 12 ms or 40% of a typical frame, otherwise the owed time is dropped and the game slows down instead of stuttering; each run 1–8 times over at the dev sheet's speed setting), then tells the mole how much of the time the simulation took (`feelStrain`; not while sped up), then camera, draw, HUD, perf recording. |
| `config.js` | Board size (`U` = 30 px per block, 48 blocks wide), solver constants, dev-panel defaults, and the live `tuning` object (`tuning.set` = panel values, `tuning.P` = solver numbers). |
| **core/** | |
| `core/world.js` | The `world` object: every piece, the held piece, hay, supply, timers, particles, bests. Shared state lives here. |
| `core/events.js` | Tiny event bus (`on`, `emit`). |
| `core/game.js` | `resetGame()` and `update(dt)`: the one place that decides what runs each tick, in order. |
| `core/physics/pieceTypes.js` | Every piece type: shape, color, name, and material numbers. **Add new piece types here.** |
| `core/physics/templates.js` | Builds each type's rest shape (point lattice per block, or rings for the ball). |
| `core/physics/body.js` | Creates a live piece; bounding boxes. Every piece starts with every field anything fills in later (`LATER`; the barn too), so the browser sees one kind of object and the physics stays fast: add a new piece field there, not on the fly. |
| `core/physics/solver.js` | The soft-body solver: integration, shape matching, finding nearby pairs (a grid for sleepers, another for awake pieces), collisions, friction, floor (the bedrock heightmap, or flat ground; a point that runs into the side of a step in the bedrock is pushed out sideways, like off a wall)/walls, bounce, sleeping, and fixed pieces (the barn) that only move when told to. Pure math. |
| `core/surface.js` | Reading the pile: heightmap `surf` (hay, the mole's hover height) and `groundAt` (exact solid spans so Sadie can tell floor from overhang). Also holds the bedrock's top (`rock`, `rockAt`, `rockTop`, `rockInfo`): the real floor under everything. The sleeping pieces' part of `surf` is kept between steps and only redone when one wakes, falls asleep or goes, or the bedrock changes. |
| `core/fossil.js` | Turns pieces buried deep in the pile into fossils: permanent ground that never wakes. |
| `core/bedrock.js` | Once the board has more than 400 pieces, melts the deepest fossils (buried deeper still) into the bedrock, just enough to stay under: they stop being pieces and raise the floor to exactly their top (filling any cave under them, so nothing is left hanging), leaving flecks of their color. This is what lets the tower grow forever without getting slower. |
| `core/friends/chooter.js` | Chooter, Sadie's first friend: feelings (energy, tired, missing), activities (`greet`, `play`, `zoom` knocking pieces aside, `fetch` the ball, `home` to rest in the barn), his body (trot, leap, fall). Before they meet he listens from next door (`listen`: the pieces thudding and the barn scraping wind him up), peeks in over the wall nearer Sadie, and bursts in once he can't stand it. Offers `friend` once met. |
| `core/toys.js` | Toys the player throws for the friends (a ball so far): one out at a time, bounces off the pile without pushing it, vanishes once played with. |
| `core/barn.js` | Sadie's barn: a fixed building in the pile (pieces land on it and bury it, Sadie can stand on it). Dragged behind Sadie on a trip home, otherwise drops onto whatever is under it. |
| `core/hay.js` | Sadie's hay: bundles the mole flings (`throwHay`, aimed along a trail; up to 3 about, `hayWanted` says when another's due), flying and bouncing over the pile without pushing it, then floating up out of reach once settled, and riding the pile up/down (never below where it floated to). Offers `food` once landed. Can be picked up (`pickUpHay`, it goes where the carrier puts it) and put down (`putDownHay`, drops onto the pile). |
| `core/dropper.js` | The piece the mole carries and the supply: flying to a spot (`flyTo`), hover height, letting go (`dropHeld`, only with a full supply), the piece bag. No decisions: the mole makes those. |
| `core/mole.js` | The mole, who drops the pieces: its feeling (`tired`, from how hard the game is working: `feelStrain`), activities (`bury` anyone restless, `barn`, `nap`), where it aims and when it lets go, digging up hay instead of a piece now and then and flinging it away (`drp.hay` while it holds it), its thoughts. |
| `core/save.js` | Saving and loading: `snapshot()` turns the board, the bedrock, Sadie, barn, hay, the mole's piece and Chooter into plain data; `restore()` puts it back (throws on a save it can't read, and `loadGame()` then starts fresh). `clearTower()` (keeps friends and bests) and `startOver()` (forgets everything). Saved under `sadies-dropper-world.save`, format `SAVE_VERSION`. |
| `core/debug.js` | Dev-sheet helpers (for us, not players): game speed, raining lots of pieces, building a tall pile fast, putting Sadie on top, and making Sadie, Chooter and the mole do things right now (wearing the mole out: `tireMoleNow`). Uses no random numbers unless a button was pressed. |
| `core/effects.js` | Particles and Sadie's floating emotes (notes, hearts, steam). |
| `core/mind/feelings.js` | Feelings: 0–1 numbers on each character that drift over time and get nudged by events. |
| `core/mind/offers.js` | Offers: things register what they're good for (`food`, `home`, `fetch`, `friend`); characters look for offers, not particular things. |
| `core/mind/thoughts.js` | What each character is thinking, in plain words, for the thought bubble: characters register `{ who, name, x, y, h, think() }` (`mindsFrom`); `think()` returns what they're doing, why, and their feelings as 0–1 bars (4 at most). Reading it never changes anything. |
| `core/mind/think.js` | Choosing: each tick every activity says how much the character wants it; the biggest want wins (small bonus for the current one; `busy` activities can't be interrupted). |
| `core/sadie/brain.js` | Sadie (`sadie` object): feelings (hunger, settled), activities (`eat`: nearest hay, wait, pace; `fetchBarn`: drag the barn up), her body (walk, run, climb, fall). Offers `friend`. |
| `core/sadie/mood.js` | Sadie's mood from her state and events, blinking, emote timing. |
| **render/** | |
| `render/view.js` | Canvas, viewport, camera (`cam`), world/screen conversion, follow-Sadie camera (dragging or zooming stops it following for good: after that the camera only moves when the player moves it). The chunky pixels: everything draws on a small canvas (`#pixels`, `ctx`, still in screen pixels; `vp.P` is one big pixel, a whole number of the screen's own pixels), and the browser blows it up to fill the screen with hard edges (CSS `image-rendering: pixelated`), which the phone's graphics chip does for free. (We used to blow it up ourselves each frame: over half of every frame's time in the profile.) Numbers and emotes go on sharp afterwards (`crisp`), on the full-size `#world` canvas on top, which also takes the touches; `present()` draws them, and only clears it when something was on it. There's no effect over the whole screen (one was tried and made phones stutter). The camera never looks more than 2 blocks below the lowest point of the bedrock. |
| `render/hayView.js` | Draws the hay bales: tumbling while flung, then glowing and floating with a twinkle under them (the mystery float, drawn under the mole too). |
| `render/scene.js` | Draws a frame back to front: sky (sun, drifting clouds, each drawn once into its own little picture and stamped after that, and two rows of hills that move slower than the board), ruler, walls, ground, hay, drop lane, barn, pieces, the bedrock (marbled candy rock with flecks of what melted in), Sadie's rope, Sadie, held piece, the mole, particles. Skips pieces and hay that are off screen. |
| `render/barnView.js` | Draws Sadie's barn and the rope she drags it with. |
| `render/chooterView.js` | Draws Chooter in every mood, his face in the barn's hayloft window while he's home, and his head peeking in over a wall before they meet (mirrored for the left one). |
| `render/toyView.js` | Draws the toys (the tennis ball). |
| `render/jelly.js` | Draws one jelly piece as a gummy shape (darker rim, rim light on the bottom right, dark outline in its own color, white shine, material decorations). A sleeping piece is drawn once into its own little picture (`p.spr`) and stamped after that (`drawPiece`), redrawn only when it wakes or the zoom changes: with a big tower most pieces are asleep, so this is what keeps drawing cheap. While the zoom is moving (a pinch), the pictures are only stretched; once it holds still they're redrawn, about 2 ms' worth a frame (`mayRedraw`; redrawing them all every frame of a pinch made drawing 4x slower). |
| `render/sadieView.js` | Draws Sadie in every mood, and her emotes. |
| `render/moleView.js` | Draws the mole (squinting, drooping when tired, snoozing when napping, aghast at hay it dug up) holding its piece or the hay. |
| `render/color.js` | Color helpers. |
| `render/pixels.js` | The 90s dotted shading, drawn into each thing: `dots(color, amount)` (a see-through pattern of big pixels), `bands()` (colors fading in dotted bands, for sky, hills, ground, bedrock), `snap()` (round to the pixel grid). |
| **ui/ and input/** | |
| `ui/hud.js` | The first-run tip (gone at the first touch of the board) and the one pop-up left (a new friend). Listens to simulation events. It's a toy, so there's no score, height, supply or next-piece display on screen (the numbers still exist in the world for saves and tests). |
| `ui/thoughts.js` | The thought bubble: tap Sadie, Chooter (his face in the hayloft window while he's home) or the mole to see what they're doing, why, and how they feel. Follows them each frame: above their head if it fits, and if it doesn't, the camera (following Sadie) looks up to make room, as long as Sadie stays well in view (`roomFor`, `camState.room`); failing that, beside them on a wide screen, and only then below their feet. It picks a side when it opens and only moves once it's 40 px past an edge (or above comes free), and not again for a second, so it never flickers. Smaller print on phones, so it covers less. A tap anywhere else closes it. |
| `ui/toybox.js` | The Toys button and its tray (shows once Sadie has a friend). Pick a toy, then tap the board; the mole throws it there. |
| `ui/devPanel.js` | The dev sheet, in tabs: Debug (speed, rain pieces, Sadie and Chooter buttons, clear tower), Physics (sliders, restore defaults), Info (perf toggle, piece count, mouse help). A short bottom sheet on phones that can shrink to its title bar; a right-side panel on screens 900 px and wider. It tells the camera (`camState.insetB`/`insetR`) and the on-screen buttons (`--dev-b`/`--dev-r`) how much it covers. |
| `ui/perf.js` | Performance overlay (the dev sheet's Info tab), including the game speed (under 100% when the loop is dropping time to keep up), how busy the simulation keeps the mole and how tired it is. |
| `input/pointer.js` | Touch/mouse on the board: pan, pinch, wheel zoom, throw a toy picked from the toy box, or tap a character for their thought bubble. Nothing steers the mole. |
| `input/controls.js` | Escape closes the dev sheet. No keyboard controls, and no way to move, spin or drop pieces: the mole decides all that. |
| **tests/ and tools/** | |
| `tests/run.mjs` | `npm test`: every activity's headless checks, one activity after another (`npm test -- dropper-world` for one). |
| `tests/clubhouse/browser.mjs` | The menu in headless Chromium as a phone and a desktop (run by `tools/check.mjs` every time: a few seconds): the room draws, the first activity is chosen, tapping a locked box and Sadie, MORE SHELVES there and back, walking with the arrow pad, and PLAY! starting Dropper World with the menu gone from the page. Fails on any page error; screenshots in `dist/check/clubhouse/`. |
| `tests/dropper-world/run.mjs` | Dropper World's headless checks: the real simulation in Node, seeded. Each numbered section runs in its own process, several at once, about 3.5 minutes in all (`--section=N` runs one). |
| `tests/dropper-world/browser.mjs` | Dropper World in headless Chromium as a phone and a desktop (run by `tools/check.mjs`): new game (the mole digging up the first hay), tapping Sadie and the mole (its bubble must sit above or beside it, not over the pile), Chooter peeking in, the dev sheet, a full board loaded from a save and reloaded, and how smooth that board is on a phone 4x slower. Fails on any page error; screenshots in `dist/check/dropper-world/`. |
| `tools/build.mjs` | `npm run build`: the one-file page in `dist/index.html` (the clubhouse and every activity), with the source embedded. Squeezed small (three.js is big); the readable source is what's embedded. `--preview` makes the test version (says "test version", with the time and commit, in the corner and the tab title). |
| `tools/check.mjs` | `npm run check`: each activity's headless tests, a build, then the page in headless Chromium: the menu's checks (every time), then each activity's browser checks. Each activity is skipped when it already passed on exactly the same files (remembered in `dist/`): for its tests, its folder, its tests, `src/shared/` and `package.json`; for its browser checks, those plus the clubhouse's shell (files directly in `src/`, not the menu), `tools/build.mjs` and `tools/check.mjs`. So the check at merge is quick. `--quick` skips the tests, `--preview` checks the test version, `--retest` runs everything regardless. `--live <file>` (the live game page, saved) also counts an activity's tests as passed when its files are exactly what that page was built from, since it only goes live after passing. |
| `tools/dropper-world/fullboard.mjs` | A save of a full board (14 minutes of real play, about 400 pieces, bedrock melting). Its browser checks make one when `core/` changes and keeps it in `dist/`. Handy for any experiment that needs a big tower. |
| `tools/dropper-world/profile.mjs` | Where the time goes: plays the full board in headless Chromium as a phone slowed down 4x (`--slow N`, `--desktop`, `--seconds N`, `--zoom` to keep zooming in and out, `--zoomed-out` to look at the whole tower), and prints how even the frames are, the game speed (under 100% when it slows down to keep up), which functions take the most time overall and in the slowest frames, and what the browser does besides (garbage collection, putting the picture on screen). A hidden browser has no graphics card, so it blows the pixels up to screen size on the processor ("Commit" in its main-thread events), which a real phone's graphics chip does for free; the game's own code is measured fairly. (Its `--use-angle=swiftshader` pretend graphics chip was tried: far too slow to tell anything.) `--slow 2` is the better guide to a real phone. |
| `tools/dropper-world/physics-load.mjs` | How hard the physics works on the full board, in Node: one step's cost with few, some and many pieces awake, and how many pieces each drop wakes and for how long. For judging physics speed-ups. |
| `tools/dropper-world/arrival.mjs` | When Chooter first peeks in and bursts in on new boards, for a few random seeds (`node tools/dropper-world/arrival.mjs [seeds]`). For tuning how friends turn up. |
| `tools/unpack.mjs` | Rebuilds the project folder from a built page's embedded source. |

## Events

| Event | Sent by | Heard by |
|---|---|---|
| `hayEaten` (bundle) | sadie/brain | nobody right now (pop-ups other than a new friend were removed) |
| `homeRush` | sadie/brain | nobody right now (pop-ups other than a new friend were removed) |
| `barnHome` | sadie/brain | nobody right now (pop-ups other than a new friend were removed) |
| `friendMet` (name) | friends/chooter | hud (toast), toybox (shows the Toys button) |
| `friendMovedIn` (name) | friends/chooter | nobody right now |
| `zoomies` | friends/chooter | nobody right now (pop-ups other than a new friend were removed) |
| `ballBack` | friends/chooter | nobody right now (pop-ups other than a new friend were removed) |
| `hayStolen` (bundle) | friends/chooter | sadie/brain ("hey!") |
| `toyThrown` (kind) | toys | nobody yet |
| `nextChanged` (type) | dropper | nobody right now (the next-piece preview was removed) |
| `reset` | game | main (camera follows Sadie again) |
| `followChanged` (on/off) | render/view | nobody right now (the Follow Sadie button was removed) |

## Tick order (`core/game.js`)

physics → piece bookkeeping (rest time, age, smoothed speed, top heights) → surface heightmap →
hay rides the pile → fossils → bedrock (the deepest fossils melt) → Sadie's brain → barn (dragged or dropping) → Chooter → toys → Sadie's mood → Sadie's best height → particles and emotes →
the mole (tiredness, what to bury, flying there, letting go) → dropper (supply refill, hover, flying, spawn) → debug rain. The camera and drawing happen after all steps in
`loop.js`.

## Common changes

- **New piece type:** add it to `SHAPES`, `COLORS`, `NAMES` and `MATERIALS` in
  `core/physics/pieceTypes.js`. It joins the bag automatically. Optional decoration: add a flag in
  `templates.js` and draw it in `render/jelly.js`.
- **New behavior or interaction:** read `docs/CHARACTERS.md` first. Work out why the character
  would do it, then add a feeling, an offer on the thing they'd want, or an activity (in
  `SADIE_DOES` / `CHOOTER_DOES`), rather than a rule naming another character. If it needs a new
  look, add a mood (`core/sadie/mood.js`, drawn in `render/sadieView.js`; Chooter's in
  `render/chooterView.js`).
- **New friend:** a module in `core/friends/` like `chooter.js` (a reason they turn up, from something
  happening in the world, never a height or a time; their feelings and activities using `core/mind/`, their offers, their thoughts for the bubble via
  `mindsFrom`, a reset), called from `core/game.js`;
  add them to `docs/CHARACTERS.md`; a drawing in `render/`; their toy in `ui/toybox.js`'s
  `TOYS` list and `core/toys.js`. Anything random they do must wait until they've been met, so the
  seeded tests before the meeting stay the same. A friend can move pieces the way Chooter's zoomies
  do: `wake()` the piece, then give its points a speed by moving `px`/`py`.
- **Something solid that isn't a jelly piece** (like the barn): put it in `world.pieces` with
  `asleep: true, fixed: true` and move it by setting `kvx`/`kvy` (px per second). The solver
  never wakes, pushes or tips it, and nothing above it turns to fossil.
- **New debug button:** the action goes in `core/debug.js` (so the tests can press it too), the
  button in the Debug tab in `page.html`, wired up in `ui/devPanel.js` (`act(...)`, plus its
  on/off state in `refresh()`).
- **Feel of the physics:** the dev panel defaults in `config.js`, or a piece's material numbers.
  Never expose these to the player.
- **Anything new that changes over time** goes in `core/`, is driven from `update()` in
  `core/game.js`, and gets drawn by something in `render/`. If it should survive closing the page,
  add it to `snapshot()` and `restore()` in `core/save.js` (and the save test). If old saves can't
  be loaded into the new format, bump `SAVE_VERSION` (old saves then start fresh).

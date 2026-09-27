# Architecture

Plain ES modules in `src/`, bundled by esbuild into one page (`tools/build.mjs`). Three layers,
and dependencies only point downward:

```
ui/  input/         screen widgets and player input      (may use anything below)
render/             drawing the world onto the canvas     (reads core, never changes it*)
core/               the simulation: no DOM, no canvas     (runs headless in Node for tests)
config.js, platform/
```
*The camera lives in `render/view.js` and is the one piece of state render owns.

`core/` must never import from `render/`, `ui/` or `input/`, and must not touch `document` or
`window`. That's what lets `tests/run.mjs` run the real game in Node. When the simulation needs to
tell the screen something, it emits an event (below).

## Module map

| File | What it does |
|---|---|
| `main.js` | Boots everything: sizes the canvas, applies tuning, loads the saved game (or starts a board), saves every 5 s and when the page is hidden or closed, starts the loop. Also exposes `window.__jellyDebug()` for browser tests. |
| `loop.js` | Fixed 1/60 s simulation steps (max 3 catch-up steps, each run 1–8 times over at the dev sheet's speed setting), then tells the mole how much of the time the simulation took (`feelStrain`; not while sped up), then camera, draw, HUD, perf recording. |
| `config.js` | Board size (`U` = 30 px per block, 48 blocks wide), solver constants, dev-panel defaults, and the live `tuning` object (`tuning.set` = panel values, `tuning.P` = solver numbers). |
| `platform/storage.js` | Safe localStorage wrapper (get, set, remove; never throws). The one place that touches browser storage, so a different home for saves (itch.io, a desktop app) only changes this file. |
| **core/** | |
| `core/world.js` | The `world` object: every piece, the held piece, hay, supply, timers, particles, bests. Shared state lives here. |
| `core/events.js` | Tiny event bus (`on`, `emit`). |
| `core/game.js` | `resetGame()` and `update(dt)`: the one place that decides what runs each tick, in order. |
| `core/physics/pieceTypes.js` | Every piece type: shape, color, name, and material numbers. **Add new piece types here.** |
| `core/physics/templates.js` | Builds each type's rest shape (point lattice per block, or rings for the ball). |
| `core/physics/body.js` | Creates a live piece; bounding boxes. |
| `core/physics/solver.js` | The soft-body solver: integration, shape matching, finding nearby pairs (sleeper grid), collisions, friction, floor (the bedrock heightmap, or flat ground; a point that runs into the side of a step in the bedrock is pushed out sideways, like off a wall)/walls, bounce, sleeping, and fixed pieces (the barn) that only move when told to. Pure math. |
| `core/surface.js` | Reading the pile: heightmap `surf` (minimap, hay, the mole's hover height) and `groundAt` (exact solid spans so Sadie can tell floor from overhang). Also holds the bedrock's top (`rock`, `rockAt`, `rockTop`, `rockInfo`): the real floor under everything. |
| `core/fossil.js` | Turns pieces buried deep in the pile into fossils: permanent ground that never wakes. |
| `core/bedrock.js` | Melts fossils buried deeper still into the bedrock: they stop being pieces and raise the floor to exactly their top (filling any cave under them, so nothing is left hanging), leaving flecks of their color. This is what lets the tower grow forever without getting slower. |
| `core/friends/chooter.js` | Chooter, Sadie's first friend: feelings (energy, tired, missing), activities (`greet`, `play`, `zoom` knocking pieces aside, `fetch` the ball, `home` to rest in the barn), his body (trot, leap, fall). Meets Sadie at 15 blocks. Offers `friend` once met. |
| `core/toys.js` | Toys the player throws for the friends (a ball so far): one out at a time, bounces off the pile without pushing it, vanishes once played with. |
| `core/barn.js` | Sadie's barn: a fixed building in the pile (pieces land on it and bury it, Sadie can stand on it). Dragged behind Sadie on a trip home, otherwise drops onto whatever is under it. |
| `core/hay.js` | Sadie's hay: the trail of bundles (always 3 out, a new one placed when one is eaten) and hay riding the pile up/down (never below where it appeared). Offers `food`. Can be picked up (`pickUpHay`, it goes where the carrier puts it) and put down (`putDownHay`, drops onto the pile). |
| `core/dropper.js` | The piece the mole carries and the supply: flying to a spot (`flyTo`), hover height, letting go (`dropHeld`, only with a full supply), the piece bag. No decisions: the mole makes those. |
| `core/mole.js` | The mole, who drops the pieces: its feeling (`tired`, from how hard the game is working: `feelStrain`), activities (`bury` anyone restless, `barn`, `nap`), where it aims and when it lets go, its thoughts. |
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
| `render/view.js` | Canvas, viewport, camera (`cam`), world/screen conversion, follow-Sadie camera. The camera never looks more than 2 blocks below the lowest point of the bedrock. |
| `render/scene.js` | Draws a frame back to front: sky, ruler, walls, ground, hay, drop lane, barn, pieces, the bedrock (marbled candy rock with flecks of what melted in), Sadie's rope, Sadie, held piece, the mole, particles. Skips pieces and hay that are off screen. |
| `render/barnView.js` | Draws Sadie's barn and the rope she drags it with. |
| `render/chooterView.js` | Draws Chooter in every mood, and his face in the barn's hayloft window while he's home. |
| `render/toyView.js` | Draws the toys (the tennis ball). |
| `render/jelly.js` | Draws one jelly piece (smooth outline, shine, material decorations). |
| `render/sadieView.js` | Draws Sadie in every mood, and her emotes. |
| `render/moleView.js` | Draws the mole (squinting, drooping when tired, snoozing when napping) holding its piece, or an edge marker when it's off screen. |
| `render/color.js` | Color helpers. |
| **ui/ and input/** | |
| `ui/hud.js` | The first-run tip (gone at the first touch of the board) and the one pop-up left (a new friend). Listens to simulation events. It's a toy, so there's no score, height, supply or next-piece display on screen (the numbers still exist in the world for saves and tests). |
| `ui/thoughts.js` | The thought bubble: tap Sadie, Chooter (his face in the hayloft window while he's home) or the mole to see what they're doing, why, and how they feel. Follows them each frame, above their head or below their feet: it picks a side when it opens and only swaps once it's 40 px past the edge, and not again for a second, so it never flickers. A tap anywhere else closes it. |
| `ui/minimap.js` | The map strip, from just under the bedrock's lowest point up (the bedrock shown at the bottom); tap or drag to look there. |
| `ui/toybox.js` | The Toys button and its tray (shows once Sadie has a friend). Pick a toy, then tap the board; the mole throws it there. |
| `ui/devPanel.js` | The dev sheet, in tabs: Debug (speed, rain pieces, Sadie and Chooter buttons, clear tower), Physics (sliders, restore defaults), Info (perf toggle, piece count, mouse help). A short bottom sheet on phones that can shrink to its title bar; a right-side panel on screens 900 px and wider. It tells the camera (`camState.insetB`/`insetR`) and the on-screen buttons (`--dev-b`/`--dev-r`) how much it covers. |
| `ui/perf.js` | Performance overlay (the dev sheet's Info tab), including how busy the simulation keeps the mole and how tired it is. |
| `input/pointer.js` | Touch/mouse on the board: pan, pinch, wheel zoom, throw a toy picked from the toy box, or tap a character for their thought bubble. Nothing steers the mole. |
| `input/controls.js` | The Follow Sadie button, and Escape to close the dev sheet. No keyboard controls, and no way to move, spin or drop pieces: the mole decides all that. |

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
| `followChanged` (on/off) | render/view | hud (Follow Sadie button look) |

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
- **New friend:** a module in `core/friends/` like `chooter.js` (a height to meet them at, their
  feelings and activities using `core/mind/`, their offers, their thoughts for the bubble via
  `mindsFrom`, a reset), called from `core/game.js`;
  add them to `docs/CHARACTERS.md`; a drawing in `render/`; their toy in `ui/toybox.js`'s
  `TOYS` list and `core/toys.js`. Anything random they do must wait until they've been met, so the
  seeded tests before the meeting stay the same. A friend can move pieces the way Chooter's zoomies
  do: `wake()` the piece, then give its points a speed by moving `px`/`py`.
- **Something solid that isn't a jelly piece** (like the barn): put it in `world.pieces` with
  `asleep: true, fixed: true` and move it by setting `kvx`/`kvy` (px per second). The solver
  never wakes, pushes or tips it, and nothing above it turns to fossil.
- **New debug button:** the action goes in `core/debug.js` (so the tests can press it too), the
  button in the Debug tab in `index.html`, wired up in `ui/devPanel.js` (`act(...)`, plus its
  on/off state in `refresh()`).
- **Feel of the physics:** the dev panel defaults in `config.js`, or a piece's material numbers.
  Never expose these to the player.
- **Anything new that changes over time** goes in `core/`, is driven from `update()` in
  `core/game.js`, and gets drawn by something in `render/`. If it should survive closing the page,
  add it to `snapshot()` and `restore()` in `core/save.js` (and the save test). If old saves can't
  be loaded into the new format, bump `SAVE_VERSION` (old saves then start fresh).

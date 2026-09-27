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
| `main.js` | Boots everything: sizes the canvas, applies tuning, starts a board, starts the loop. Also exposes `window.__jellyDebug()` for browser tests. |
| `loop.js` | Fixed 1/60 s simulation steps (max 3 catch-up steps, each run 1–8 times over at the dev sheet's speed setting), then camera, draw, HUD, perf recording. |
| `config.js` | Board size (`U` = 30 px per block, 48 blocks wide), solver constants, dev-panel defaults, and the live `tuning` object (`tuning.set` = panel values, `tuning.P` = solver numbers). |
| `platform/storage.js` | Safe localStorage wrapper. |
| **core/** | |
| `core/world.js` | The `world` object: every piece, the held piece, hay, supply, timers, particles, bests. Shared state lives here. |
| `core/events.js` | Tiny event bus (`on`, `emit`). |
| `core/game.js` | `resetGame()` and `update(dt)`: the one place that decides what runs each tick, in order. |
| `core/physics/pieceTypes.js` | Every piece type: shape, color, name, and material numbers. **Add new piece types here.** |
| `core/physics/templates.js` | Builds each type's rest shape (point lattice per block, or rings for the ball). |
| `core/physics/body.js` | Creates a live piece; bounding boxes. |
| `core/physics/solver.js` | The soft-body solver: integration, shape matching, finding nearby pairs (sleeper grid), collisions, friction, floor/walls, bounce, sleeping, and fixed pieces (the barn) that only move when told to. Pure math. |
| `core/surface.js` | Reading the pile: heightmap `surf` (minimap, hay, dropper) and `groundAt` (exact solid spans so Sadie can tell floor from overhang). |
| `core/fossil.js` | Turns pieces buried deep in the pile into fossils: permanent ground that never wakes. |
| `core/friends/chooter.js` | Chooter, Sadie's first friend (a black lab/pitbull mix): meeting him at 15 blocks, playing near Sadie, the zoomies (knocks pieces out of his way), fetching the ball, going home to the barn and back out. Walks on top of the pile like Sadie, but leaps up ledges instead of climbing. |
| `core/toys.js` | Toys the player throws for the friends (a ball so far): one out at a time, bounces off the pile without pushing it, vanishes once played with. |
| `core/barn.js` | Sadie's barn: a fixed building in the pile (pieces land on it and bury it, Sadie can stand on it). Dragged behind Sadie on a trip home, otherwise drops onto whatever is under it. |
| `core/hay.js` | Sadie's hay: the trail of bundles (always 3 out, a new one placed when one is eaten) and hay riding the pile up/down (never below where it appeared). |
| `core/dropper.js` | The dropper drone and the supply: moving, rotating, dropping, hover height, autodrop, the piece bag. |
| `core/debug.js` | Dev-sheet helpers (for us, not players): game speed, raining lots of pieces, building a tall pile fast, putting Sadie on top, and making Sadie and Chooter do things right now. Uses no random numbers unless a button was pressed. |
| `core/effects.js` | Particles and Sadie's floating emotes (notes, hearts, steam). |
| `core/sadie/brain.js` | Sadie's behavior (`sadie` object): target the nearest hay, walk/run/climb, wait, pace, and trips home to drag her barn up. |
| `core/sadie/mood.js` | Sadie's mood from her state and events, blinking, emote timing. |
| **render/** | |
| `render/view.js` | Canvas, viewport, camera (`cam`), world/screen conversion, follow-Sadie camera. |
| `render/scene.js` | Draws a frame back to front: sky, ruler, walls, ground, hay, drop lane, barn, pieces, Sadie's rope, Sadie, held piece, dropper, particles. Skips pieces and hay that are off screen. |
| `render/barnView.js` | Draws Sadie's barn and the rope she drags it with. |
| `render/chooterView.js` | Draws Chooter in every mood, and his face in the barn's hayloft window while he's home. |
| `render/toyView.js` | Draws the toys (the tennis ball). |
| `render/jelly.js` | Draws one jelly piece (smooth outline, shine, material decorations). |
| `render/sadieView.js` | Draws Sadie in every mood, and her emotes. |
| `render/dropperView.js` | Draws the drone, or an edge marker when it's off screen. |
| `render/color.js` | Color helpers. |
| **ui/ and input/** | |
| `ui/hud.js` | Height, hay eaten, supply pips, next-piece preview, tip, toasts. Listens to simulation events. |
| `ui/minimap.js` | The map strip; tap to send the dropper and look there. |
| `ui/toybox.js` | The Toys button and its tray (shows once Sadie has a friend). Pick a toy, then tap the board to throw it. |
| `ui/devPanel.js` | The dev sheet, in tabs: Debug (speed, rain pieces, Sadie and Chooter buttons, clear tower), Physics (sliders, restore defaults), Info (perf toggle, keys). A short bottom sheet on phones that can shrink to its title bar; a right-side panel on screens 900 px and wider. It tells the camera (`camState.insetB`/`insetR`) and the on-screen buttons (`--dev-b`/`--dev-r`) how much it covers. |
| `ui/perf.js` | Performance overlay (P key or the dev sheet). |
| `input/pointer.js` | Touch/mouse on the board: drag or tap the dropper, pan, pinch, wheel zoom, or throw a toy picked from the toy box. |
| `input/controls.js` | On-screen buttons and keyboard shortcuts. |

## Events

| Event | Sent by | Heard by |
|---|---|---|
| `hayEaten` (bundle) | sadie/brain | hud (toast) |
| `homeRush` | sadie/brain | hud (toast) |
| `barnHome` | sadie/brain | hud (toast) |
| `friendMet` (name) | friends/chooter | hud (toast), toybox (shows the Toys button) |
| `friendMovedIn` (name) | friends/chooter | hud (toast) |
| `zoomies` | friends/chooter | hud (toast) |
| `ballBack` | friends/chooter | hud (toast) |
| `toyThrown` (kind) | toys | nobody yet |
| `nextChanged` (type) | dropper | hud (preview) |
| `playerActed` | dropper | hud (hides the first-run tip) |
| `reset` | game | main (camera follows Sadie again) |
| `followChanged` (on/off) | render/view | hud (Follow Sadie button look) |

## Tick order (`core/game.js`)

physics → piece bookkeeping (rest time, age, smoothed speed, top heights) → surface heightmap →
hay rides the pile → fossils → Sadie's brain → barn (dragged or dropping) → Chooter → toys → Sadie's mood → Sadie's best height → particles and emotes →
dropper (supply refill, hover, autodrop, spawn) → debug rain. The camera and drawing happen after all steps in
`loop.js`.

## Common changes

- **New piece type:** add it to `SHAPES`, `COLORS`, `NAMES` and `MATERIALS` in
  `core/physics/pieceTypes.js`. It joins the bag automatically. Optional decoration: add a flag in
  `templates.js` and draw it in `render/jelly.js`.
- **New Sadie behavior:** state and movement in `core/sadie/brain.js`; if it needs a new mood, add
  it in `core/sadie/mood.js` and draw it in `render/sadieView.js` (ears, eyes, mouth, tail and
  emotes all switch on `mood`).
- **New friend:** a module in `core/friends/` like `chooter.js` (a height to meet them at, what they
  do, a reset), called from `core/game.js`; a drawing in `render/`; their toy in `ui/toybox.js`'s
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
  `core/game.js`, and gets drawn by something in `render/`.

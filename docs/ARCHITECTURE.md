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
| `loop.js` | Fixed 1/60 s simulation steps (max 3 catch-up steps), then camera, draw, HUD, perf recording. |
| `config.js` | Board size (`U` = 30 px per block, 48 blocks wide), solver constants, dev-panel defaults, and the live `tuning` object (`tuning.set` = panel values, `tuning.P` = solver numbers). |
| `platform/storage.js` | Safe localStorage wrapper. |
| **core/** | |
| `core/world.js` | The `world` object: every piece, the held piece, stars, supply, timers, particles, bests. Shared state lives here. |
| `core/events.js` | Tiny event bus (`on`, `emit`). |
| `core/game.js` | `resetGame()` and `update(dt)`: the one place that decides what runs each tick, in order. |
| `core/physics/pieceTypes.js` | Every piece type: shape, color, name, and material numbers. **Add new piece types here.** |
| `core/physics/templates.js` | Builds each type's rest shape (point lattice per block, or rings for the ball). |
| `core/physics/body.js` | Creates a live piece; bounding boxes. |
| `core/physics/solver.js` | The soft-body solver: integration, shape matching, collisions, friction, floor/walls, bounce, sleeping. Pure math. |
| `core/surface.js` | Reading the pile: heightmap `surf` (minimap, stars, dropper) and `groundAt` (exact solid spans so Sadie can tell floor from overhang). |
| `core/stars.js` | Star layout and stars riding the pile up/down (never below their start). |
| `core/dropper.js` | The dropper drone and the supply: moving, rotating, dropping, hover height, autodrop, the piece bag. |
| `core/effects.js` | Particles and Sadie's floating emotes (notes, hearts, steam). |
| `core/sadie/brain.js` | Sadie's behavior (`sadie` object): target the nearest star, walk/run/climb, wait, pace. |
| `core/sadie/mood.js` | Sadie's mood from her state and events, blinking, emote timing. |
| **render/** | |
| `render/view.js` | Canvas, viewport, camera (`cam`), world/screen conversion, follow-Sadie camera. |
| `render/scene.js` | Draws a frame back to front: sky, ruler, walls, ground, stars, drop lane, pieces, Sadie, held piece, dropper, particles. |
| `render/jelly.js` | Draws one jelly piece (smooth outline, shine, material decorations). |
| `render/sadieView.js` | Draws Sadie in every mood, and her emotes. |
| `render/dropperView.js` | Draws the drone, or an edge marker when it's off screen. |
| `render/color.js` | Color helpers. |
| **ui/ and input/** | |
| `ui/hud.js` | Height, stars, supply pips, next-piece preview, tip, toasts. Listens to simulation events. |
| `ui/minimap.js` | The map strip; tap to send the dropper and look there. |
| `ui/devPanel.js` | Dev tuning sheet (physics sliders for us, not players), restore defaults, clear tower. |
| `ui/perf.js` | Performance overlay (P key or the dev sheet). |
| `input/pointer.js` | Touch/mouse on the board: drag or tap the dropper, pan, pinch, wheel zoom. |
| `input/controls.js` | On-screen buttons and keyboard shortcuts. |

## Events

| Event | Sent by | Heard by |
|---|---|---|
| `starCollected` (star) | sadie/brain | hud (toast) |
| `nextChanged` (type) | dropper | hud (preview) |
| `playerActed` | dropper | hud (hides the first-run tip) |
| `reset` | game | main (camera follows Sadie again) |
| `followChanged` (on/off) | render/view | hud (Follow Sadie button look) |

## Tick order (`core/game.js`)

physics → piece bookkeeping (rest time, age, smoothed speed, top heights) → stars ride the pile →
surface heightmap → Sadie's brain → Sadie's mood → Sadie's best height → particles and emotes →
dropper (supply refill, hover, autodrop, spawn). The camera and drawing happen after all steps in
`loop.js`.

## Common changes

- **New piece type:** add it to `SHAPES`, `COLORS`, `NAMES` and `MATERIALS` in
  `core/physics/pieceTypes.js`. It joins the bag automatically. Optional decoration: add a flag in
  `templates.js` and draw it in `render/jelly.js`.
- **New Sadie behavior:** state and movement in `core/sadie/brain.js`; if it needs a new mood, add
  it in `core/sadie/mood.js` and draw it in `render/sadieView.js` (ears, eyes, mouth, tail and
  emotes all switch on `mood`).
- **Feel of the physics:** the dev panel defaults in `config.js`, or a piece's material numbers.
  Never expose these to the player.
- **Anything new that changes over time** goes in `core/`, is driven from `update()` in
  `core/game.js`, and gets drawn by something in `render/`.

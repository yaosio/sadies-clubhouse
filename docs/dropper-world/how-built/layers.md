# How Dropper World is built: the layers

Its code's three layers and the one rule that keeps the simulation testable. Read before changing
any of its code (`src/activities/dropper-world/`).

What it is and its design rules: `docs/dropper-world/README.md`. How it fits into the clubhouse (its
card, the page it runs in, the build and the checks): `docs/clubhouse/ARCHITECTURE.md`.

Paths in the `how-built/` pages are inside this folder unless they start with `src/`, `tests/` or
`tools/`. Three layers, and dependencies only point downward:

```
ui/  input/         screen widgets and player input      (may use anything below)
render/             drawing the world onto the canvas     (reads core, never changes it*)
core/               the simulation: no DOM, no canvas     (runs headless in Node for tests)
config.js, src/shared/
```
*The camera lives in `render/view.js` and is the one piece of state render owns.

`core/` must never import from `render/`, `ui/` or `input/`, and must not touch `document` or
`window`. That's what lets `tests/dropper-world/run.mjs` run the real game in Node. When the
simulation needs to tell the screen something, it emits an event (`events.md`).

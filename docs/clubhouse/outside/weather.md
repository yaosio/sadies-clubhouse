# The weather

The world's weather (`src/clubhouse/weather/`), over every place out of doors. It belongs to the
world, not any building. Read when changing the weather, or making a place out of doors.

- `rules.js`: the kinds and how each looks. `sky.js`: the clouds, sunlight, rain, snow, cats and
  Sadie's reactions on the gatepost. `twister.js`: the tornado (a far-off funnel with Sadie riding a
  tuna round it; it wanders slowly round the whole sky; a place's `sky.twister` `{ x, z }` says where it starts). Saved as `mansion.weather`.
- It comes over every place out of doors: one whose place says `sky` (`dome`, how far off its cloud
  cover is, inside its sun and outside its hills; `follow`, for a sky that goes round you; `sun2`,
  where a second sun comes up, if it has a sun).
- Its sunlight is dimmed or brightened from the place's own clear-day `light.sun`.
- What falls, falls in every place out of doors you can see at once: round you, and round each open
  doorway you're looking through into one (up to four places; nothing's worked out in a place nobody
  can see).
- Whatever makes weather uses its kit's `weather`: `now()`, `set(kind)` (`rain`, `snow`, `sun`,
  `cats`, `tornado` or `clear`), `kinds`. Two things setting it just take turns; neither owns it.
- Checks: `tests/clubhouse/run.mjs` (its rules) and `tests/clubhouse/browser.mjs` (rain over every
  place with a `sky`, found as they're built, so a new one is checked with no new test).

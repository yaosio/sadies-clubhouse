# Lily's House: how it's built

## Files (`src/activities/lily-house/`)
- `card.js`: its plot (`lot` 5) and colour.
- `house.js`: the cottage outside, built into the town at the start like every building outside (the
  clubhouse lifts it onto its ledge). Lily in the window is a flat picture swapped pose by pose; the
  bow colour is picked here and shared with the room (`house.shared.bow`).
- `lily-art.js`: every picture of Lily, dot by dot (`lilyPoses`, painted in either bow), her chicken,
  and Chooter's portrait. `art.js`: the house's and room's pictures. `toots-pic.js`: Toots for her
  picture, a frozen copy made by `tools/lily-house/toots-pic.mjs` (rooms can't share files).
- `plan.js`: the two rooms as numbers (`ground`: where you can stand). `moves.js`: Lily inside, as
  numbers (following you, the chicken leap, chasing a thrown one and her zoomies), and the chicken
  itself (`makeChicken`: flying, bouncing, skidding).
- `music.js`: the game's tune, made up as it plays, through the toolbox's band (`src/shared/band.js`).
- `climb.js`: the game as plain numbers (no browser): the level, Lily, Marbles, the things, suds,
  hammers, scores. `climb-art.js`: its little pictures. `climb-view.js`: draws a frame onto the wall's
  canvas (the clubhouse's `words` handed in).
- `room.js`: the inside, built from those; the uses (PLAY, HOLD UP THE CHICKEN, THROW THE CHICKEN);
  the game's `play` (with `key` and `pad`, see `docs/clubhouse/rooms/controls.md`) and the fanfare;
  the window views (four `snapshot`s of the town hung 60 m all round, as in Toots' house).
- The trampoline outside (`house.js`, `TR`) is a `surface` you step onto and a `bounce`
  (`docs/clubhouse/outside/buildings.md`), with a round solid under it from the ledge up: you stand on
  the floor nearest your feet, so without it the ledge would win and you'd walk through the mat.

## Shared
The phone's game buttons are the clubhouse's (`src/clubhouse/play/arcade.js`, `pad.html`, `pad.css`),
for any game that asks with `pad`. Chooter's portrait is copied into Toots' house as
`src/activities/toots-house/chooter-pic.js` by `tools/lily-house/chooter-pic.mjs`.

## Tools (`tools/lily-house/`)
- `climb-bot.mjs`: plays many games in Node and prints wins, hits and times (tuning).
- `climb-sheet.mjs`, `sprites.mjs`: the game's pictures and Lily's, on one PNG each.
- `toots-pic.mjs`, `chooter-pic.mjs`: the frozen picture copies above.
- `trampoline.mjs`: walks onto the trampoline from each side, printing your height and bounce.

## Checks
- `tests/lily-house/run.mjs`: the card; every ladder joins two girders; a game starts; each hammer can
  be reached and blocks climbing; reaching the chicken wins; a simple player wins some of 8 games; a
  thrown chicken is chased, zoomed about with and brought back; the music's notes are all short.
- `tests/lily-house/browser.mjs`: bouncing on the trampoline, in through her door, a throw, the pictures, PLAY, the phone buttons (and
  none on a computer), the music, a win with the fanfare, and stepping back after.

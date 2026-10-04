# The sound system

`src/shared/sound.js`: every sound in the game is played through it, on one audio engine for the
whole page. Read before adding or changing any sound.

## Playing sounds
- A room gets a handle with `soundsFor(owner)` (its place's name, `room:<id>`) and plays by name:
  `handle.play(key, make, { loud, bus, rate, hold, gap, at })` (the samples made the first time, then
  kept).
- `handle.line(bus)` (`{ ctx, out }`) is for music it streams note by note (or a held note).
- A room wraps its handle (`wrap(handle, more)`, its sounds by name on top), never changes it: the
  handle can't be added to or have its own `play` replaced (trying is an error, which the checks
  catch).
- Sounds that belong to a building's house rather than its room (they carry on while the room's put
  away) use an owner of their own, `house:<name>` (`docs/clubhouse/outside/buildings.md`).

## Buses
Three, each with its volume on the pause menu (ON, SOFT, OFF, kept as `mansion.music`,
`mansion.sounds`, `mansion.voices`): `music`, `sounds` (effects, instruments you play) and `voices`
(the characters).

## The rules live here, once (the owner has misophonia)
- The same sound never again within its `gap` (0.08 s unless it says).
- A voice never says the same thing twice running (within 10 s: a room with only one meow still
  meows later).
- Nothing but music behind the pause menu (the clubhouse says when it's up: `paused()`, so no room
  needs pause code for its sounds).
- `at` (where the sound is, `{x, z}` or `{x, y, z}`) fades it the further it is from you
  (`nearness`; `dist` if a room works it out itself).
- Never more than 14 sounds at once (more are dropped).
- A room's music is only heard while you're in that room (the clubhouse tells it where you are,
  `youAreIn`). A line made with `{ everywhere: true }` is heard everywhere (the main theme's).
- Any music playing (a meter on every music line) makes the main theme fade out (`otherMusic()`,
  `main-theme.md`).
- When the clubhouse puts a room away it stops everything that room started (`closeSounds`), whatever
  the room forgot, and every sound when it leaves the page (`closeSounds()`).
So a new room just plays through its handle (music on a music line) and keeps every rule for free.

## Checked
- The clubhouse's headless test fails if anything else makes an AudioContext or plays straight to
  the speakers.
- Nothing checks how calm or loud a room's sounds are in play any more (`docs/clubhouse/decisions/fatal-only.md`).

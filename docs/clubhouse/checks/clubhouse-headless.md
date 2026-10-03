# The clubhouse's headless checks

`tests/clubhouse/run.mjs`: what it checks. Read this when changing the main theme, the sound-system
rule, the room checker or the save director. `tools/check.mjs` runs it with the activities' tests
whenever anything in `src/` changed.

## The main theme (a few seconds)
Three hours of it from seeds, and it must have:
- Pieces a minute or two long with quiet between; every mode, beat and instrument turning up.
- Every note in its key; slow and gentle (no flurries); no drums, drones or long notes; soft starts.
- The tune resting a good share of phrases, and no eight bars ever coming round again.

## Two rules about the code
- Nothing in `src/` but the sound system makes an AudioContext.
- No room uses `setTimeout` or `setInterval`: its waits go through `m.after`, on the game's time.
- The shared code (`src/clubhouse/`, `src/shared/`, `src/main.js`, `src/index.html`, comments aside)
  never names an activity, by its folder or its card's name.

## The room checker (`tests/clubhouse/cards.mjs`)
Every activity's card, read as the build reads it:
- Its id is its folder's name, and it only uses fields the clubhouse knows.
- It's on a computer or in its room.
- It has exactly one place (a door, a plot or a spot in the grounds) that exists and no other card
  has taken.
- Its saves start `sadies-clubhouse.<id>.` (or are an older activity's keys from before the save director), are listed in `keeps`
  if it saves anything, never name another activity's, and don't overlap anyone's.
- No door, plot or spot has moved from where `tests/clubhouse/spots.json` says.
- A room never touches storage itself (only its kit's box).
- Every activity has tests of its own (`tests/<id>/run.mjs` or `browser.mjs`).

## The save director's own checks
- A bad save put aside.
- A full browser noticed.
- Backups saved and put back whole or not at all.

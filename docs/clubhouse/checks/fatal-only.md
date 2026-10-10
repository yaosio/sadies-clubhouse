# Checks test fatal errors only

Decided by the owner, 2026-10-03: a check exists only if its failure means the game won't start,
freezes or crashes, loses someone's progress, or leaves them stuck. Sound, looks, text, timings,
exact numbers and how it plays are not tested: a check for those costs minutes on every change and
guards nothing fatal. The reasons and the list of what was dropped are in
`docs/clubhouse/decisions/fatal-only.md`.

## Before adding a check, ask
- Would its failure be a crash, a freeze, lost progress, or being stuck? If not, don't add it.
- Can it be one of the checks every room already gets, so a new room needs no test of its own?
- How many seconds does it add to a full check (`npm run check` prints each stage)? A full check
  should stay around seven minutes however many rooms there are.

## What is kept
- Page errors on any page a check opens fail it.
- Opening, walking, doors into every room (indoors and out), every computer activity opening and
  coming back, a room put away and built again over and over with nothing piling up or leaking,
  one room's error not freezing the game, a room's file not loading.
- Saves: unreadable ones put aside, old saves still load, backups, START OVER erasing only the game's own saves (EVERYTHING included: another page on the same address keeps its things), no 3D saying so in words.
- Each room: a short play-through that touches its main thing once and, where it saves, a reload.
- Each room's headless tests (about a second each; a game's tuning sections can be left to run by hand).

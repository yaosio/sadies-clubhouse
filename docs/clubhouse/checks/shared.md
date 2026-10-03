# Checks every room gets

Three checks that need no code in an activity: every room, a new one included, gets them. Read this
when changing one of them. They live in `tests/shared/` and `tests/saves/`, and `tools/check.mjs`
runs them after each activity's browser checks.

## Old saves still load (`tests/shared/saves.mjs`, `tests/saves/`)
- After each activity's browser checks, `tools/check.mjs` opens the game on every sample of that
  activity's saves in `tests/saves/<activity>/` (one per shape its saves have ever had: which keys,
  and how each is laid out inside).
- It fails if anything is put aside as unreadable, the activity's own saves are gone afterwards, or
  the page has an error.
- The samples make themselves: what an activity saved while its checks played it is kept as a new
  sample whenever its shape is new (locally only, never on GitHub); commit it with the change. A
  shape is new only if it has a key or kind of value no sample has: a list is judged by all its
  items, an empty list or a `null` (a mole holding a piece or not) matches anything. The smallest
  save with the most keys is kept.
- Samples stay small (a check fails over 50 KB each, 500 KB for an activity): they ship in the
  project copy and every check loads each. A new sample that's too big is trimmed to a few of each
  kind of thing (for a board, a few pieces of each kind) before it's committed.
- So a version's saves are kept before the next version can change them, and every activity, a new
  one included, is checked against all of them.
- It can't tell a save that loads but quietly ignores what it no longer understands.

## Kind to the ears (`tests/shared/ears.mjs`)
- After each clubhouse room's browser checks (and outside at the gate and in the hall, after the
  clubhouse's), `tools/check.mjs` stands still there for 30 s of game time.
- It counts every sound played by anyone (the sound system counts them by name, `soundState()`).
- It fails on one sound more than 4 times, more than 12 in all, or a line held on that isn't music.
- Music is left to the music checks; a sound that only comes when you do something isn't heard
  standing still.

## Something is drawn (`tests/shared/looks.mjs`)
- Wherever the ears check stands (every clubhouse room, the gate, the hall), and on every activity
  started from its address, a picture of what you see fails if one colour covers more than 85% of it
  or it has fewer than 12 colours: a room drawn black, a page that never drew.
- It can't tell a picture drawn wrong, only one that's missing.

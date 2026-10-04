# Checks every room gets

One check that needs no code in an activity: every room, a new one included, gets it. Read this
when changing it. It lives in `tests/shared/` and `tests/saves/`, and `tools/check.mjs` runs it after
each activity's browser checks.

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

## Saves stay small (`tools/check.mjs`, `SAVE_MAX`)
- The fullest a room's own saves got while its checks played it must stay under 300 KB. The owner
  asked for this one back (2026-10-04): a save that doesn't fit is lost progress. The 300 KB is
  Claude's choice (about 5 MB of browser room for every room together; the biggest board today is
  about 206 KB); raise it if a room really needs more.

## Dropped on purpose (2026-10-03)
The calm-sounds check (`ears.mjs`: 30 s standing still in every room) and the something-is-drawn check
(`looks.mjs`) were removed: only fatal errors are tested now, and those two cost about six of the
sixteen minutes of a full check. Don't bring them back without the owner's say: `docs/clubhouse/decisions/fatal-only.md`.

# Things that build themselves by distance

How things in the world are built when you're near and put away when you're far. Read when changing
`src/clubhouse/things.js`, or before adding anything to the outside that should not be built all game.
The plan and its seven steps are in the project's shared files, review-2026-10-10/distance-plan.md
(the owner approved step 1, 2026-10-10).

## Where it stands
Step 1 only: the keeper exists and is checked, and **nothing uses it yet**. The outside is still
built whole at the start (about 390 ms for the outside and the hall together, in headless Chrome
on a desktop; not a phone), and `docs/clubhouse/decisions/known-limits.md` still lists that.

## The idea
A *thing* is a place and a size in the world plus one function, `show(state)`. It has no area name
and nothing says which part of town it belongs to, so moving it is changing its position.
`makeThings()` decides which of three states each thing is in and tells it:
- `near`: built and running.
- `far`: far but still in view: a cheap stand-in (a plain block by default), nothing running.
- `gone`: too far to see: nothing in the scene.

## The rule
- Distance is straight metres from where outside is seen from (you, or the open door you look out of) to the
  thing's edge (its middle less its size `r`), not its middle.
- It builds inside `near`. It is let go only past `near + gap`, and only after `grace` seconds of
  staying out there, so standing on an edge never flickers. A stand-in turns to nothing only past
  `seen + gap`.
- A thing that says it's `busy()` is never let go. If outside can't be seen, nothing changes.
- One thing builds at a time, the nearest first. One that fails to build is tried again a little
  later, up to 6 times, like rooms.
- What's solid is **not** the keeper's business: a thing keeps its solids whatever state it is in
  (otherwise arriving by a door beside an unbuilt thing would let you walk through it).
- `setScale(k)` pulls every range in or pushes it out at once, for the checks and the test page.

## Claude's numbers (the owner can change any)
`RANGE` in `things.js`: near 60 m, gap 15 m, seen 250 m, grace 5 s. A thing can name its own.
No limit on how many things are built at once (add one only if a phone says it must, and say so).

## Checks
`tests/clubhouse/things.mjs` (run by `tests/clubhouse/run.mjs`): no drawing, fake things and
positions; fatal errors only.

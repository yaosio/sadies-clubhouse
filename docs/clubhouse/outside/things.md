# Things that build themselves by distance

How things in the world are built when you're near and put away when you're far. Read when changing
`src/clubhouse/things.js`, or before adding anything to the outside that should not be built all game.
The plan and its seven steps are in the project's shared files, review-2026-10-10/distance-plan.md
(the owner approved step 1, 2026-10-10).

## Where it stands
Steps 1 and 2 are done. The keeper exists, and **the pool is the first thing**: `outside.js` lists it
in `things` (its place, size, `near`, a stand-in slab, and `build()` that hands back `putAway()`), and
`clubhouse.js` wires each listed thing to the keeper, builds what's near before the first picture,
steps the keeper every frame, and when a thing is put away hands back everything it made to the
graphics card (the same `made()` list rooms use) and takes its things to use and things that face you
out of the outside's lists. The pool is `watched: false` (the owner, 2026-10-10): it is built once at the start and its distance
is not checked again, so in play it is always built and nothing looks different. The capability stays: `watch(id, true)` turns the
checking on for a thing. The browser check does that and pulls every range in
(`__clubhouse.thingWatch`, `thingRange(k)`) to see it put away and built again, over and over, with nothing left
behind. Building the pool took 8 ms in headless Chrome on a desktop (the outside and the hall
together take about 320 ms, mostly the rest of the outside); not a phone. The rest of the outside is
still built whole, and `docs/clubhouse/decisions/known-limits.md` still says so.

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
  (otherwise arriving by a door beside an unbuilt thing would let you walk through it). The pool's
  solids are numbers in `pool/layout.js` that `outside.js` always keeps.
- `setScale(k)` pulls every range in or pushes it out at once, for the checks and the test page.

## Claude's numbers (the owner can change any)
`RANGE` in `things.js`: near 60 m, gap 15 m, seen 250 m, grace 5 s. A thing can name its own.
No limit on how many things are built at once (add one only if a phone says it must, and say so).

## Later (the owner's direction, 2026-10-10; not built)
- The ranges stay wide: the keeper is a tool for heavy things and a big world, not something to
  apply to everything now. He tried a test page with every range pulled in to a fifth: it worked,
  and he saw both the stand-in block and the vanishing, and the swap showed as a pop.
- Vanishing should follow the camera's real draw distance (`cam.far`, 300 m now) so it never happens
  where you can still see, and moves out when height lets you see further. No big empty space.
- A level-of-detail system, so far things look right from far off: it has to be delightfully 90s, not
  perfect (chunky far pictures, a dithered dissolve like the see-through fade the material already
  has). More work, so its own plan first.
- Measure a real phone before tightening any range (the hidden speed readout in the review list).

## Checks
`tests/clubhouse/things.mjs` (run by `tests/clubhouse/run.mjs`): no drawing, fake things and
positions; fatal errors only.

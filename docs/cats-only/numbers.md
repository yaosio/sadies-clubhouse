# Cats Only's numbers

The tuning, in `src/activities/cats-only/herd.js` and `sounds/`. They're all Claude's choices
(2026-10-06), not the owner's rules, and any can change: change them in one place and `tests/cats-only/run.mjs`
re-checks what matters.

- **How many Sadies: 64** (`COUNT`). The owner asked for a lot, a whole herd. 64 is dozens, and
  every one is a flat picture sharing one picture and one shape, so a phone keeps up. More is easy,
  at a cost to phones.
- **They pour out within 1.4 s** (`SPAWN`), thickest at the start.
- **Each reaches the front door 2.2 to 3 s after setting off** (`RUN`), 30 to 40 m of running, about
  10 to 14 metres a second (about four times your walking pace, 3.2 m/s).
- **The front door is let go 0.3 s after the last one is through** (`AFTER`), and takes about a
  second to shut. So the whole thing, from the closet door opening to the front door shut, is
  never more than about 5.9 s (`LONGEST`), against about 9 s for the quickest possible walk to the
  front door (the tests check the first is well under the second: `LONGEST < 0.75 x` the walk).
- **Outside: down the porch steps over 2.3 to 3.8 m, then on along the path**, gone after 40 m or
  when the front door has shut, whichever's first (`PORCH`, `OUTSIDE_MAX`).
- **The ways:** 65% down the stairs, 35% over the railing and a lap of the post (`herd.js`
  `makeStampede`). The lanes differ, so no two take quite the same line.
- **Meows: at most 10 in the whole stampede, never closer than 0.35 s, six versions, never the same
  one twice running, one cat one meow** (`MEOWS`, `MEOW_GAP`, `MEOW_VARIANTS`), and each plays at
  0.2 of full volume (`sounds/meow.js` `LOUD`). The owner has misophonia
  (`docs/clubhouse/RULEBOOK.md` section 4): this is soft, varied and rare per cat, with no loop, drone or
  tick. The herd is mostly quiet on purpose; the rest of the noise is the picture of it.
- **The closet: 1.7 m wide, 1.7 m deep, 2.6 m high** (`RW`, `RD`, `H` in `room.js`), the bed at the back.

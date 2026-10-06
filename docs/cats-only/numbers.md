# Cats Only's numbers

The tuning, in `src/activities/cats-only/herd.js` and `sounds/`. They're all Claude's choices
(2026-10-06), not the owner's rules, and any can change: change them in one place and `tests/cats-only/run.mjs`
re-checks what matters.

- **How many Sadies: 180** (`COUNT`). The owner asked for more and a pile up to the ceiling. All of
  them are drawn as one instanced picture (a single draw per place), so a phone keeps up. More is
  possible, at some cost to phones.
- **The pile:** while the button's armed they sit packed into the closet (1.7 m deep, up to 1.95 m
  high), fidgeting a little, visible through the door as it swings open. The ones at the front of the
  pile go first and the back tumbles out after.
- **They pour out within 3 s** (`SPAWN`), a hard rush at first and then the back of the pile trailing.
- **Each reaches the front door 4.2 to 6 s after setting off** (`RUN`), about 5 to 8 metres a second:
  slow enough to see each one (the owner said the first version was too fast to get a look at).
- **The front door is let go 0.3 s after the last one is through** (`AFTER`), and takes about a
  second to shut. Then every Sadie still about puffs away over 0.45 s (`POP`: she swells a little,
  spins, shrinks and floats up in a shower of sparkles). The whole thing from the closet door
  opening to the last puff is never more than about 11 s (`LONGEST`). It no longer has to beat you to
  the front door: you can walk down and watch them go.
- **Outside: down the porch steps over 2.3 to 3.8 m, then on along the path**, gone after 40 m or
  when the front door has shut, whichever's first (`PORCH`, `OUTSIDE_MAX`).
- **The ways:** 65% down the stairs, 35% over the railing and a lap of the post (`herd.js`
  `makeStampede`). The lanes differ, so no two take quite the same line.
- **Meows: a caterwaul, up to 90 in the whole stampede, as close as 0.04 s apart, eight kinds at six
  pitches** (`MEOWS`, `MEOW_GAP`, `MEOW_TYPES`, `MEOW_PITCHES`), never the same kind at the same pitch
  twice running, one cat one meow, each at 0.2 of full volume (`sounds/meow.js` `LOUD`). The pitches
  run from a big old tom to a kitten (0.72x to 1.7x speed). Never more than 14 sounds at once (the
  sound system's own cap). There's also one soft rush of them piling out of the closet when it opens
  (`pile`). The owner has misophonia (`docs/clubhouse/RULEBOOK.md` section 4): every meow is short and
  soft, nothing loops, drones or ticks; it's dense on purpose (the owner asked for chaos) but happens
  once, for about ten seconds, only when you press the button.
- **The closet: 1.7 m wide, 1.7 m deep, 2.6 m high** (`RW`, `RD`, `H` in `room.js`), the bed at the back.

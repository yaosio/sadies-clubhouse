# Cats Only's numbers

The tuning, in `src/activities/cats-only/herd.js` and `sounds/`. They're all Claude's choices
(2026-10-06), not the owner's rules, and any can change: change them in one place and `tests/cats-only/run.mjs`
re-checks what matters.

- **How many Sadies: 180** (`COUNT`). The owner asked for more and a pile up to the ceiling. All of
  them are drawn as one instanced picture (a single draw per place), so a phone keeps up. More is
  possible, at some cost to phones.
- **The pile:** once the button's armed and the closet's door is shut, they appear packed into the
  closet (kept 0.6 m or more behind the door and off the walls, so none pokes out through them; up to
  1.95 m high), fidgeting a little, visible through the door as it swings open. They never appear while
  the door is open. The ones at the front of the
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
- **Meows: a caterwaul.** Up to 90 individual meows in the stampede, as close as 0.04 s apart, eight
  kinds at six pitches (`MEOWS`, `MEOW_GAP`, `MEOW_TYPES`, `MEOW_PITCHES`), at 0.32 of full volume
  (`sounds/meow.js` `LOUD`), plus **one ten-second recording of ninety cats yowling over each other**
  (`chorus`, 0.55) that starts as the door opens, swells fast, carries on and dies away, so the room
  really sounds packed with cats (the sound system's own cap of 14 sounds at once would otherwise
  limit it). They're made like real cats (rough wobbling throat, breath, three mouth shapes gliding
  through the meow), at 22 kHz without the 8-bit crunch the rest of the game's sounds have, so they
  don't sound like an arcade machine. One soft rush of them piling out of the closet (`pile`) goes with
  it. The owner has misophonia (`docs/clubhouse/RULEBOOK.md` section 4) but asked for this to be
  loud and chaotic: it's a one-off of about ten seconds, only when the button's pressed, with no loop,
  drone or tick. All the loudness numbers are Claude's choices and can come down.
- **The closet: 1.7 m wide, 1.7 m deep, 2.6 m high** (`RW`, `RD`, `H` in `room.js`), the bed at the back.

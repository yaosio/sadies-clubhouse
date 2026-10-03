# Dropper World's debug tools

What the dev sheet's Debug tab does (`core/debug.js`). For us, not players. Read before changing or
adding a debug button (adding one: `docs/dropper-world/how-built/common-changes.md`).

Speed runs 1, 2, 4 or 8 simulation steps per normal step.
- Rain 25 here: 25 random pieces within 5 blocks of the mole. Rain 100 everywhere: across the whole
  board. About 12 a second, each 4 blocks above the pile; a piece waits if something is still
  falling where it would appear.
- Build a tall pile: 110 pieces within 1 block of the mole, one every 0.6 s, run at 8× (about 70 s
  of game time, roughly 9 s to watch), then 4 more seconds to settle before going back to the
  chosen speed. Makes a mound about 21–22 blocks tall.
- Put her on top: Sadie moves to the highest point. If her barn is now far below, she'll soon go
  back for it, as she normally would.
- Peek in: Chooter is wound up just enough to start peeking in (the rest still takes the noise).
- Fetch the barn now, Meet Chooter now, Zoomies, Go home, Come out: start those right away (or as
  soon as Chooter finishes what he's doing).
- Wear the mole out: it naps right away (no pieces) and wakes about 12 s later, if the game isn't
  struggling.
- Clear tower also stops any rain.

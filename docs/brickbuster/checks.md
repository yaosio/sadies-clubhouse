# Brickbuster's checks

Its tests and its picture tool. Read before changing what's checked, or when a check fails.

- **`tests/brickbuster/run.mjs`**: headless: the arcade music (twenty minutes at each heat: only
  its three soft instruments, every note short and in range, quicker with an arpeggio as it heats
  up, a breath at the end of most rounds, never the same round twice), pretend players for two
  hours of play (the ball never leaves the glass or gets stuck sideways), the paddle's angles,
  missing: three cracks at the bottom and it breaks (every brick on the heap, each its own spot),
  good play breaks the top, the last brick breaks it, bricks, saves (broken stays broken), the
  sounds (8-bit, never silent, each crack bigger, the shatter biggest; Sadie's softer than any
  crack, each version different), the cracks' drawing, the heap's spots (80, where nobody walks,
  none on thin air), the ball loose in the hall for 90 minutes, and Sadie's sounds while she plays
  (now and then, never two close together, never more than 5 a minute, never the same twice
  running). About 20 seconds.
- **`tests/brickbuster/browser.mjs`**: phone and desktop: through its door, stepping up (the
  arcade music playing, the theme faded out; stopping when you step back, the theme coming back),
  the paddle by keys, mouse and finger, a crack (sound and wince), stepping back (the game waits),
  the crack kept after a reload, breaking it (shatter, stepped back, the heap, the sad paddle, the
  ball hitting the poster and going out the door, Sadie after it, the sign), still broken after a
  reload, Sadie's meow heard in the hall but not from her room (and the ball silent), fixed by the
  pause menu's start-over button.
- **`tools/brickbuster/shots.mjs`**: pictures of the room and the game from the built page:
  `dist/shots/brickbuster/`.

What the tests expect in numbers is in `numbers.md`.

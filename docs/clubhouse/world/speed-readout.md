# The speed readout

A button in the pause menu, SPEED, that shows how fast the game is running on this device and how
much memory it holds, so it can be opened on a phone and read out (the owner asked, 2026-10-10: he
wondered what the performance is like, and the only numbers so far were from a desktop in headless
Chrome). Read when changing it. `src/clubhouse/meter.js` writes the numbers down, `clubhouse.js`
shows them.

## What it shows
- **Right now:** frames a second over the last 120 frames, and the slowest of them.
- **Here, and the slowest place:** the place you were in (average a second, how many frames were
  slow, how long the game's own work took), and the slowest place of those with at least 30 frames.
- **All together:** frames a second, the share of slow frames and the worst frame since the count began.
- **Memory:** what the graphics card holds (shapes, pictures, and about how many MB the pictures
  are), the page's memory now, its highest so far and its limit (browsers other than Chrome and
  Android's won't say), the device's rough memory, how many rooms are built, the picture size and
  the graphics chip's name (a name with SwiftShader or llvmpipe in it means software drawing, which is slow).
- START THE COUNT OVER clears it, so one room can be tried on its own.

## How it counts
- A frame's length is the time since the one before it, drawing and waiting included: what you feel.
- Frames behind the pause menu and frames over 2 seconds long (the page was in the background) are
  left out, so open the readout after playing for a bit, not straight away.
- It costs a few additions a frame and nothing is drawn for it. Nothing in the game reacts to it.
- Claude's numbers (changeable): 120 frames is "right now", 30 frames before a place can be the
  slowest, a frame over 33 ms (under 30 a second) is slow.

## Checks
`tests/clubhouse/meter.mjs` (the arithmetic, with fake frames) and the clubhouse's browser check
(SPEED opens, says frames a second and memory, starts over and closes). Whether the numbers are good
isn't checked: that is for a person to read.

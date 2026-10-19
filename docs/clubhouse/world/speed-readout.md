# The speed readout and the live stats

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

## The live stats strip
A box that stays on screen while you walk about, so the numbers can be watched in the room they're about
(the pause menu's SPEED can only be read paused). Switched on by LIVE STATS in the pause menu (or P on a
computer), off until then, remembered (`mansion.live`). `src/clubhouse/overlay.js` (`makeLive` does the
sums and has no screen, `liveBox` shows them); the clubhouse's frame hands it each frame's numbers.
- **Compact** (the start on a phone): one line, top left and clear of the pause button: frames a second,
  our work in ms, draw calls, doorways drawn through, the place; under it a bar graph of the last 100
  frames. **Tap it for the full list** (the start on a computer), capped at a third of the screen: update
  against draw time, calls split into the room and the doorways, triangles, rooms built and places
  running, the three slowest places to update, page memory (Chrome and Android only), shapes and
  pictures held, and the last hitch (a frame over 50 ms: where, update against draw, and whether a room
  was built in it). Tapping it doesn't turn the view.
- **The graph** is each frame's length against this screen's own: the quickest quarter of recent frames
  (so a 144 Hz phone and a 60 Hz one both read right); a bar is red over 1.5 times that.
- **Draw calls** are counted over the whole frame, doorway pictures included (`renderer.info` is set
  to not reset itself; `draw()` resets it once a frame).
- **What it costs:** while off, a check of one flag a frame. While on, a few `performance.now()` calls a
  frame, one pair per built place (for the update times), a 100-bar canvas drawn and the words rewritten
  2 or 3 times a second. A number read with it on is very slightly worse than with it off.
- **What it can't see:** how long the graphics chip takes (not readable from a page on most phones).
  Draw calls, doorways drawn through and a small "work" with a big frame length point at it.
- **SAVE LOG** (in the pause menu while LIVE STATS is on): every frame since the strip went on is also
  written down as a line (time, frame length, our work, drawing, the chip's own time, calls, doorways,
  place, a room built, page memory, memory fell) and handed over as a `.txt` file (the phone's share
  sheet, the Claude app's own way to save a file, or a plain download), to be sent in and read. The
  last 20000 frames are kept. Why: "our work" only times our own code, not the graphics chip, so a
  device's real unevenness (doorway pictures, memory cleanup) can only be read from its own log.
- **The chip's time** (`src/clubhouse/gpu.js`): where the device allows it (Chrome and Android's
  usually do, iPhones don't), the chip is asked how long a frame's drawing took; the answer arrives a
  few frames late and fills in its log line. Shown as THE CHIP in the list and in the log (-1: unknown).
- Claude's numbers (changeable): 100 bars, 1.5 times the screen's own frame for red, 50 ms for a hitch,
  400 ms between refreshes. SPEED stays as the long view (all together, slowest place, graphics chip).
- Checks: `tests/clubhouse/meter.mjs` (the sums, with fake frames) and the clubhouse's browser check
  (off by default, switches on, shows words and calls, clear of the pause button, opens to the list, P,
  switches off).

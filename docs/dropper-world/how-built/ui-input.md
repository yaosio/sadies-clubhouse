# Dropper World's screen widgets and input (ui/, input/)

The dashboard, windows, dev sheet, and what touches and keys do. Read before changing any of them.

## The dashboard (`ui/dashboard.js`)

- Always shows someone (Sadie to start with): their face (drawn live by their own drawing code via
  `drawFace`, so it shows their mood), name and mood word, what they're doing, their strongest
  feeling as one LED meter (not all of them: the owner's call), and why (on a phone, tap the
  strip).
- Tap a character on the board (`mindAt`) or their stamp (Chooter's once met) to watch them; a gold
  arrow bobs over them on the board.
- Also the LED sign (`say`, `hush`): the first-time hint until the board's first touch, a new
  friend, "tap where to throw it". On a phone it covers the strip for a few seconds; on a wide
  screen it's always there and cycles the shareware's promises.
- Every part of it is one fixed size, like a 90s program's panel (the owner asked: nothing on
  screen changes size). Each box of words is a whole number of lines tall (on a wide screen, "why"
  gets as many as its space holds), and words that don't fit wait, step up a line at a time like
  an old terminal, wait, and start again (`rollText`).
- It's a toy, so there's no score, height, supply or next-piece display.

## Windows and the dev sheet

- `ui/help.js`: F1 HELP: the HELP.TXT window over the board.
- `ui/toybox.js`: the TOYS button on the key bar and its TOY BOX window (shows once Sadie has a
  friend). Pick a toy, then tap the board; the mole throws it there. The LED sign says what to do.
- `ui/devPanel.js`: the dev sheet, in tabs: Debug (speed, rain pieces, Sadie and Chooter buttons,
  clear tower), Physics (sliders, restore defaults), Info (perf toggle, piece count, mouse help).
  A short bottom sheet on phones that can shrink to its title bar; a right-side panel on screens
  900 px and wider. Opened by clicking the F12 DEV button (the F12 key itself is the browser's). It tells the camera (`camState.insetB`/`insetR`)
  how much of the board it covers.
- `ui/perf.js`: performance overlay (the dev sheet's Info tab), including the game speed (under
  100% when the loop is dropping time to keep up), how busy the simulation keeps the mole and how
  tired it is.

## Input

- `input/pointer.js`: touch/mouse on the board: pan, pinch, wheel zoom, throw a toy picked from the
  toy box, or tap a character to watch them in the dashboard (a tap also puts the help and "why"
  pop-ups away). Nothing steers the mole.
- `input/controls.js`: Escape closes the dev sheet, help or the toy box (before the clubhouse gets
  it); F1 opens help. No game controls, and no way to move, spin or drop pieces: the mole decides
  all that.

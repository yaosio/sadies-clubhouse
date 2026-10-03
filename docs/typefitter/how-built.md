# How TypeFitter is built

Which file does what (in `src/activities/typefitter/`), and its checks. Read before changing the
code.

A small activity: no simulation, no saves. Only `main.js`, `text.js` and `scan.js` (its own little
canvas) touch the page; `love.js` and `says.js` are plain logic the tests run in Node.

## Files

- **`card.js`, `page.html`, `styles.css`**: its card (its door on the landing is the third one up
  the stairs), its screen and its look: TypeFitter's parts straight in the clubhouse's candy-purple
  frame, no windows (its own copy of the frame's look). The layout is in `look.md`.
- **`box.js`, `door.js`**: the front of its box (on its computer's screen and its poster in the
  clubhouse) and its door on the landing. Drawn by `art/clubhouse/pictures.py`.
- **`main.js`**: loaded by `start()`. Wires it all up: a button (or its key) changes the style,
  Sadie says something, the meter moves; FIT IT! runs the fitting show, the win and the
  certificate, then NEXT SENTENCE. Escape closes a pop-up. Exposes `window.__typefitter()` for the
  browser checks.
- **`love.js`**: the TEXT LOVE meter (`makeMeter`: a rigged dice roll, full on a secret change from
  the 4th to the 10th) and `boxFor` (the box for text of a given size: always too small, closer as
  the meter fills).
- **`says.js`**: everything Sadie and the program say: her made-up facts per button, the sentences
  to fit, the bragging, the fitting steps, README.TXT and HELP.
- **`text.js`**: the text's style and the buttons that change it, drawing it one letter per span
  (WarpArt bends them, the ransom note mixes fonts), and `layout`: measure it, put the box round
  it, zoom the page out if it wouldn't be seen whole.
- **`scan.js`, `photo.js`**: Sadie's picture: her real photo (`photo.js`, 256x218 JPEG) shrunk to
  128x109, squashed to 16 colors with a dot pattern, traced over with wobbly lines, JPEG-crushed
  twice (`jpegCrush`, a real 8x8 block round trip). Drawn once at the start.

## Checks

- **`tests/typefitter/run.mjs`**: headless: the meter always fills from the 4th to the 10th change
  and goes down now and then, the box never fits, Sadie has a line for every button, the JPEG
  crusher smears without wrecking. A second.
- **`tests/typefitter/browser.mjs`**: phone and desktop: starts, Sadie drawn, no windows, FIT IT!
  on screen (on a desktop, in short windows too), presses buttons until the meter fills (never
  more than 10, box never fitting), FIT IT!, the win and certificate, NEXT SENTENCE, README.TXT,
  keys. Screenshots in `dist/check/typefitter/`.

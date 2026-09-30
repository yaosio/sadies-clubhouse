# TypeFitter Deluxe 3.1

The clubhouse's second activity (`src/activities/typefitter/`), built 2026-09-28, on the computer in
its room. Small enough that this one page is all its docs.

A 1993 program by someone who loved what their text engine could do and spent ten minutes on the
box. Fonts, bold, outline, shadow, WarpArt, secret symbols: every button changes the text, and Sadie
(a flat, badly scanned picture traced from her real photo) gushes about it with made-up facts about
how the computer does it. Her TEXT LOVE meter goes up and down (it's rigged: always full by the 10th
change), then FIT IT! makes a big show of fitting, the text still doesn't fit (it never can: the box
is always a few pixels too small), and you win anyway, with a certificate. It's a joke on the long
fight to make Dropper World's dashboard text fit.

## Design pillars (the owner's rules; these win over any feature idea)

- The text can never fit its box. It's obviously broken on purpose, never by accident.
- The player always wins anyway.
- It shows off 90s text tricks (fresh after DOS).
- No puzzle, nothing for the game or the player to keep track of.
- Nothing carried over from Dropper World's mechanics.
- Sadie is a flat, static picture traced from her real photo (dithered, few colors, badly
  compressed, no outline round her) with a speech bubble of made-up facts.

The approved mock-up is `art/typefitter/mockup.html`.

## How it's built

A small activity: no simulation, no saves (each visit starts on a fresh sentence). Only `main.js`
and `text.js` touch the page; `love.js` and `says.js` are plain logic the tests run in Node.

| File | What it does |
|---|---|
| `card.js`, `page.html`, `styles.css` | Its card (its door on the landing is the third one up the stairs), its screen and its look: TypeFitter's parts straight in the clubhouse's candy-purple frame, no windows (its own copy of the frame's look). Top strip (left end free for ESC BACK, measured), tool buttons (each shows its key; gold when on), the page (the text and its box), Sadie's corner (her picture, speech bubble, TEXT LOVE meter, FIT IT!), the LED sign (sizes, zoom, bragging), the key bar (F1 HELP, F5 README.TXT). Phone and any tall screen: stacked, buttons in a grid without their keys. Wide and sideways (700 px+, landscape): Sadie's corner is a column down the right. Pop-ups are candy panels with rivets. |
| `box.js`, `door.js` | The front of its box (on its computer's screen and its poster in the mansion) and its door on the landing. Drawn by `art/clubhouse/pictures.py`. |
| `main.js` | Loaded by `start()`. Wires it all up: a button (or its key) changes the style, Sadie says something, the meter moves; FIT IT! runs the fitting show, the win and the certificate, then NEXT SENTENCE. Escape closes a pop-up (and doesn't leave in the middle of a win). Exposes `window.__typefitter()` for the browser checks. |
| `love.js` | The TEXT LOVE meter (`makeMeter`: a rigged dice roll, full on a secret change from the 4th to the 10th) and `boxFor` (the box for text of a given size: always too small, closer as the meter fills). |
| `says.js` | Everything Sadie and the program say: her made-up facts per button, the sentences to fit, the bragging, the fitting steps, README.TXT and HELP. |
| `text.js` | The text's style and the buttons that change it, drawing it one letter per span (WarpArt bends them, the ransom note mixes fonts), and `layout`: measure it, put the box round it, zoom the page out if it wouldn't be seen whole. |
| `scan.js`, `photo.js` | Sadie's picture: her real photo (`photo.js`, 256x218 JPEG) shrunk to 128x109, squashed to 16 colors with a dot pattern, traced over with wobbly lines, JPEG-crushed twice (`jpegCrush`, a real 8x8 block round trip). Drawn once at the start. |
| `tests/typefitter/run.mjs` | Headless: the meter always fills from the 4th to the 10th change and goes down now and then, the box never fits, Sadie has a line for every button, the JPEG crusher smears without wrecking. A second. |
| `tests/typefitter/browser.mjs` | Phone and desktop: starts, Sadie drawn, no windows, presses buttons until the meter fills (never more than 10, box never fitting), FIT IT!, the win and certificate, NEXT SENTENCE, README.TXT, keys. Screenshots in `dist/check/typefitter/`. |

## Numbers

- **TEXT LOVE meter** (`love.js`): 10 hearts. Each round secretly picks how many changes it takes,
  4 to 10 (`FEWEST`, `MOST`: the owner asked for at most ten). Each change moves it to about where
  it should be by then, give or take 2 hearts, and 22% of the time it drops 2 or 3 below where it was instead (she
  changed her mind), never full before its change; about a fifth of changes go down. Once full it
  stays full until FIT IT!.
- **The box** (`boxFor`): 74% of the text's width and 80% of its height with no hearts, up to 96%
  and 96% when full, but always at least 5 px too wide and 3 px too tall. It never fits.
- **Fit score**: one of 104, 107, 112, 118, 121, 133, 150%: always over 100, always a win.
- **Pacing**: the fitting show takes about 5 s (6 steps of 0.65 s, then 1.3 s of "does not fit"),
  the certificate prints a line every 0.38 s. That, and the meter needing 4+ changes, is what stops
  button-mashing wins; there's no score to farm.
- **Text sizes**: 22, 30, 40, 52 (start), 66, 84, 104 px. The page zooms out (never in) so the
  whole text shows.
- **What the tests expect** (`tests/typefitter/run.mjs`): over 3000 seeded rounds, full on the 4th
  change at the soonest and the 10th at the latest, every count from 4 to 10 turning up, 10 to 40%
  of changes going down; the box too small by at least 5 px at every size and never shrinking as
  the meter fills.

## Sadie in TypeFitter

Not the Dropper World Sadie: none of the feelings, offers or activities above. Here she's the
program author's cat, a flat scanned picture who loves text and knows everything about fonts, all
of it wrong ("Italics are typed on a keyboard tilted exactly 12 degrees"). She reacts only to the
last change, with no memory: her TEXT LOVE meter looks like opinions but is a rigged dice roll. When
it goes up she gushes, when it goes down she's unsure but still gives a fact, and when it fills she
tells you to press the button. She's always sure the text fitted.

## Its look

- **No windows.** It's a DOS program that invented its own look, like Dropper World: its parts sit
  straight in the clubhouse's candy-purple frame (no title bars, menu bars or close boxes; the
  owner turned a Windows-style window down). Tool buttons are chunky candy stamps showing the key
  that works them, gold when on; the page is sunk into the frame; a green LED sign for the numbers
  and the bragging; pop-ups are candy panels with gold rivets.
- **The text shows off**: real fonts (a Times-ish serif, a Comic-ish one, gothic, a script, the DOS
  one, a loud billboard one, a ransom note of all of them), bold, italic, underline, outline,
  shadow, WarpArt (arch, wave, off into space, growing), spacing, color (red, rainbow, chrome) and
  secret symbols. Brand names are made up (TIMELY ROMAN, COMIC SANDS, WARPART).
- **Sadie is a flat picture**, not drawn like in Dropper World: her real photo (the loaf on the
  brown blanket), shrunk to 128x109, 16 colors with a dot pattern, traced over by mouse (wobbly
  lines on her eyes, nose patch, nose, mouth, whiskers, cap and inside her ears, a little off,
  some gone over twice; no outline round her, the owner took it off), then JPEG-crushed twice.
  It never moves; only her speech bubble changes. Shown at 2x on a wide screen, 1x on a phone.
- **Its box** (on its computer's screen and poster in its room): a white page, a red dashed box, big letters spilling out of it, a gold
  band saying TYPEFITTER (drawn by `art/clubhouse/pictures.py`).

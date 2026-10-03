# TypeFitter's look

How TypeFitter looks: its screen, the text's tricks, Sadie's scanned picture and its box. Read
before changing how anything looks (with `docs/clubhouse/look/README.md`). The approved mock-up is
`art/typefitter/mockup.html`.

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
- **Its box** (on its computer's screen and poster in its room): a white page, a red dashed box,
  big letters spilling out of it, a gold band saying TYPEFITTER (drawn by
  `art/clubhouse/pictures.py`).

## The screen's layout

The top strip (left end free for ESC BACK, measured), tool buttons (each shows its key; gold when
on), the page (the text and its box), Sadie's corner (her picture, speech bubble, TEXT LOVE meter,
FIT IT!), the LED sign (sizes, zoom, bragging), the key bar (F1 HELP, F5 README.TXT).

- **Phone and any tall screen**: stacked, buttons in a grid without their keys.
- **Wide and sideways** (700 px+, landscape): Sadie's corner is a column down the right; in a short
  window her picture shrinks (her bubble first gives way down to its smallest) so the meter and
  FIT IT! always fit.

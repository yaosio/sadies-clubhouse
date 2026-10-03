# Dropper World's frame, boot and loop

The files at the top of its folder: its card, screen, start-up, game loop and settings. Read before
changing the screen's layout, how it starts or the loop. The loop's numbers and why:
`docs/dropper-world/tuning/world-solver.md`.

- `card.js`, `page.html`, `styles.css`: its card for the clubhouse, its screen and its look.
  - The card: its door on the landing (the second one up the stairs), and the mole's dirt pile by
    it.
  - The 90s frame: a top strip whose left end is left free for the clubhouse's ESC BACK key
    (measured so it never covers the name), the board with the canvases, the dashboard, the key
    bar.
  - The help and toy box windows, and the dev sheet (still the modern look: only we use it).
  - Phone and any tall screen: everything stacked, the dashboard a slim strip. Wide and sideways
    (700 px+, landscape): the dashboard is a column down the right.
- `box.js`, `door.js`: the front of its box (on its computer's screen and its poster in the
  clubhouse) and its door on the landing. Drawn by `art/clubhouse/pictures.py`: change the drawing
  there, never these files.
- `main.js`: loaded by the card's `start()`. Boots everything: sizes the canvas (again whenever the
  board's size changes), applies tuning, loads the saved game (or starts a board), saves once a
  minute and when the page is hidden or closed, starts the loop. Also exposes
  `window.__jellyDebug()` for browser tests (its `sx`/`sy` are page positions, for tapping; `dash`
  is what the dashboard says).
- `loop.js`: each frame:
  - fixed 1/60 s simulation steps (max 3 catch-up steps while they take under 12 ms or 40% of a
    typical frame, otherwise the owed time is dropped and the game slows down instead of
    stuttering);
  - each run 1–8 times over at the dev sheet's speed setting (sped up, there's no catching up,
    just 1 step a frame);
  - then tells the mole how much of the time the simulation took (`feelStrain`; not while sped
    up);
  - then camera, draw, dashboard, perf recording.
- `config.js`: board size (`U` = 30 px per block, 48 blocks wide), solver constants, dev-panel
  defaults, and the live `tuning` object (`tuning.set` = panel values, `tuning.P` = solver
  numbers).

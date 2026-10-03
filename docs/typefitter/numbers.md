# TypeFitter's numbers

The meter, the box, the fit score, the pacing, the text sizes and what the tests expect. Read before
changing how quickly the meter fills or how badly the text misses.

- **TEXT LOVE meter** (`love.js`): 10 hearts. Each round secretly picks how many changes it takes,
  4 to 10 (`FEWEST`, `MOST`: the owner asked for at most ten). Each change moves it to about where
  it should be by then, give or take 2 hearts, and 22% of the time it drops 2 or 3 below where it
  was instead (she changed her mind), never full before its change; about a fifth of changes go
  down. Once full it stays full until FIT IT!.
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

# Activity checks and how a browser check is written

What every activity's own tests are and how a browser check is written. Read this when adding or
changing an activity's tests or `tests/shared/browser.mjs`.

## What an activity has
- Every activity has tests of its own: `tests/<id>/run.mjs` (headless) or `browser.mjs` (the page in
  Chromium). The room checker fails if it has neither (see `clubhouse-headless.md`).
- `tests/run.mjs` is `npm test`: every activity's headless checks, one activity after another
  (`npm test -- dropper-world` for one).
- An activity's `browser.mjs` can export `prepare({ dir })` (see `runner.md`).

## Writing a browser check (`tests/shared/browser.mjs`)
What every room's browser checks start with:
- The phone and the desktop side by side (`bothDevices`), and the page's errors collected.
- The moves every check makes: `M` (the clubhouse's hook for the checks, `window.__mansion`), `up`,
  `walk`, `rest`, `use`, `modeIs` and `shot`.

## Game time, not the clock
- `walk` and `rest` count in the game's own time (`window.__mansion.played()`), not the clock's. On a
  slower computer, like GitHub's, the game runs fewer frames and falls behind the clock, and a walk
  timed by the clock stops short of a door.
- A check that waits for something to happen in the game should use them, or `until(fn, arg, ms)`,
  which waits for the thing itself and gives up only after `ms` of the game's time.
- Never use a clock-timed `waitForFunction` for anything the game does on its own timers (Sadie
  getting up, a ball coming back). Those gave up too soon on GitHub and failed with nothing wrong.
- A change to `tests/shared/browser.mjs` runs every room's browser checks again.

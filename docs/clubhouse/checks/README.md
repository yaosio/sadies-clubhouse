# Checks and tools

What `npm run check` runs and where each part is written up. The short overview is
`docs/clubhouse/ARCHITECTURE.md`; read this page first when you're changing a check, the build or a
tool, then only the file below that fits.

`npm run check` (`tools/check.mjs`) runs the code checker, each activity's headless tests, a build,
then the page in headless Chromium: the clubhouse's checks (unless exactly this page already passed
them), then each activity's browser checks, each played as a phone and a desktop side by side. It
prints how long each stage took. It's the only check: GitHub's copy runs only when started by hand.

## The files
- `fatal-only.md`: read first: what a check here is for (fatal errors only), and what was dropped.
- `activity.md`: read when you're writing or changing an activity's own tests, `tests/run.mjs`, or
  how a browser check is written (`tests/shared/browser.mjs`).
- `clubhouse-headless.md`: read when changing the main theme's checks, the AudioContext rule, the
  rule that shared code names no activity, the room checker (`cards.mjs`) or the save director's checks.
- `clubhouse-browser.md`: read when changing `tests/clubhouse/browser.mjs`, the clubhouse's browser
  checks (walking, doors, rooms, put away and built again, pause menu, saves).
- `shared.md`: read when changing the checks every room gets with no code of its own: old saves
  still load.
- `runner.md`: read when changing `tools/check.mjs` (what's skipped when, the flags) or
  `.github/workflows/check.yml` (GitHub's plan and remember, run by hand only).
- `safari.md`: read when changing the by-hand look at the game in Safari's engine (WebKit).
- `tools.md`: read when changing the build, the publishing tools, the docs checker or the code
  checker's rules.
- `look-tools.md`: read when you want pictures of the clubhouse, its weather, its speed or start-up
  time, or are changing one of those tools.

## Small tools
`tools/unpack.mjs`, `tools/browser.mjs`, `tools/activities.mjs`, `tools/serve.mjs` and
`tools/publish.mjs` are one line each in `tools.md`.

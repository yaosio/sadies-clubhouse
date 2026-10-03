# The check runner and GitHub

`tools/check.mjs` (`npm run check`) and `.github/workflows/check.yml`. Read this when changing what
is skipped, the flags, or how GitHub runs the checks.

## What `tools/check.mjs` runs
- Each activity's headless tests, a build, then the page in headless Chromium: the clubhouse's
  checks (unless exactly this page already passed them), then each activity's browser checks, each
  playing the phone and the desktop side by side.
- It prints how long each stage took, and each note of a pass says how long it took.
- An activity whose browser checks or headless tests take over 180 s is pointed out (a warning on
  GitHub too), so slow checks are looked at before they slow every change down.

## What is skipped when
- Each activity is skipped when it already passed on exactly the same files (remembered in `dist/`).
- For its tests: its folder, its tests, `src/shared/` and what everything runs on (`package.json`,
  `package-lock.json`, `.nvmrc`).
- For its browser checks: those plus its tools (`tools/<name>/`), the clubhouse's shell (files
  directly in `src/`, not the clubhouse, unless its card has a `room`: then the clubhouse too),
  `tests/shared/`, the build and check tools (`tools/build.mjs`, `check.mjs`, `serve.mjs`,
  `browser.mjs`, `activities.mjs`, `source.mjs`) and `.github/workflows/check.yml`.
- Nothing else can change what a check finds. Everything else (the docs, the other tools, the code
  checker's rules) is covered by the code checker and the docs check, which `npm run check` runs every
  time whatever changed. So the check at merge is quick.
- The clubhouse's browser checks run again on any change in `src/`: that's what catches one room
  breaking or slowing another (a room's own checks only run when its own files change). Never narrow
  what they depend on without a cross-room check in their place.

## Flags
- `--quick` skips the tests, `--preview` checks the test version, `--retest` runs everything
  regardless.
- `--live <file>` (the live game page, saved) also counts an activity's tests as passed when its
  files are exactly what that page was built from, since it only goes live after passing.
- `--only a,b` (or `a+b`) checks just those activities (`clubhouse`: the clubhouse's own).
- `--plan` prints which still need checking, grouped for GitHub's computers.
- `--no-lint` skips the code checker (GitHub runs it once, not on every computer).

## Order and safety
- Every hash is worked out once, before anything's checked, so a file changed while the checks run
  is never noted as passed.
- A check that gets stuck counts as failed and the rest still run.
- An error on any page a room's checks open fails that room, whether or not its checks looked.
- An activity's `browser.mjs` can export `prepare({ dir })` for anything its checks need made first
  (a game's full board, say), kept in its own `dir`, `dist/prepared/<activity>/` (on GitHub kept
  until that activity's files change). It's started at the very beginning and runs alongside the
  headless tests.
- It's finished before the clubhouse's browser checks start, since they time how quick each room
  builds and a busy computer makes those times jumpy.
- The browser checks run one after another: side by side on one computer, each game runs slower (the
  hidden browser draws on the processor) and checks that let the game run for a moment fail.

## `.github/workflows/check.yml`
The same checks on GitHub's computers, run only by hand (the Actions page's "Run workflow"): the
repository is private, so they cost minutes, and on every push they used the free month up in two
days (2026-10-03). Nothing waits on them; `npm run check` here is the check.
- `plan` runs the code checker and the docs check (whatever it changes) and
  works out which activities haven't passed on exactly their code. What passed is remembered
  between runs.
- Each of those activities gets a computer of its own running `npm run check -- --only <activity>`,
  all at once. Past 16, the clubhouse and the biggest activity keep one each and the rest share
  (`--only a+b`), shared out by how long each took last time.
- `remember` saves what passed and gives the one tick or cross.
- A full retest takes about as long as the slowest activity rather than all of them in a row.
- Screenshots of a failure are kept with the run for a week.
- Started on a Monday's schedule (it no longer is) it checked everything from scratch (`--retest`).

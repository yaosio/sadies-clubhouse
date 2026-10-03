# Tools

The build, the project and publishing tools, and the checkers. Read this when changing one of them.
The tools that take pictures of the clubhouse or measure it are in `look-tools.md`.

## The build
`tools/build.mjs` is `npm run build`.
- It makes the page, `dist/index.html` (tiny), a copy of the project beside it
  (`dist/game/source-<fingerprint>.json`, everything but `art/`, named in the page), and the game in
  files beside it in `dist/game/` (the clubhouse, then each room or activity's own, fetched when
  needed). Each name has a fingerprint of what's in it, so a browser never mixes old and new.
- `dist/game-files.json` says which file each room's code went into, for the checks.
- It's squeezed small (three.js is big); the readable source is that copy.
- `--preview` makes the test version (says "test version", with the time and commit, in the corner
  and the tab title).
- `--readable` leaves it unsqueezed, so a profile shows the game's own function names
  (`tools/dropper-world/profile.mjs` builds it that way).

## Project and publishing tools
- `tools/unpack.mjs`: rebuilds the project folder from a built page and the copy of the project
  beside it (`tools/source.mjs` finds it; older pages had it inside).
- `tools/publish.mjs`: gets a build ready to publish and checks it first: the real game from main's
  latest commit with no test label, and the live page's copy of the project one of main's commits
  (or the test version, copied outside `dist/`). Prints what to pass to the Artifact tool, with
  `null` for the page's old files.
- `tools/browser.mjs`: what every picture-taking or measuring tool starts with: Playwright (found in
  the project or installed for everyone), a hidden browser that draws 3D in software (`launch()`),
  the desktop and phone screens (`DEVICES`), and the web fonts answered with nothing (`quietFonts()`).
  The checks' own version is `tests/shared/browser.mjs`.
- `tools/activities.mjs`: which activities there are (every folder in `src/activities/` with a
  `card.js`), for the build, the checks and the room checker alike.
- `tools/serve.mjs`: serves `dist/` from a local web address (the page at `/`, its game files beside
  it), for the checks and every picture-taking tool: a page opened as a file can't fetch its game
  files.

## The checkers
- `tools/docs.mjs`: keeps the docs laid out by task (`docs/TASKS.md`). It fails when a docs page is
  over its size limit (5,000 bytes; tighter for `CLAUDE.md`, `README.md`, `docs/TASKS.md`,
  `docs/clubhouse/ARCHITECTURE.md` and an activity's README), doesn't start with a `# title`, names a
  `.md` page that doesn't exist, or isn't listed in its folder's `README.md`. It also checks that
  every activity's docs have the same shape (README with `## Design pillars` then `## Its pages`, and a
  `parked.md`), and that the shared pages in `docs/clubhouse/` name no activity. Run with the code
  checker by `npm run check`, and on GitHub for every pull request, even one that only changes docs.
- `eslint.config.js`: `npm run lint`, the code checker (ESLint, its recommended rules). It reads the
  code without running it and points out mistakes: a misspelt or missing name, a leftover that's
  never used, code that can never run. Not how the code is laid out.
  - It also keeps the folder rules: an activity only imports from its own folder and `src/shared/`,
    the toolbox only from itself, and an activity's `core/` (the game with no page, like Dropper
    World's) never from its `render/`, `ui/` or `input/` (its own small rule, `clubhouse/own-folder`,
    in the same file), nor using the page's own words (`document`, `window`: only what Node has too).
  - `npm run check` runs it first, every time (a few seconds), and fails if it finds anything.
  - `art/` (the old mockups) isn't checked.

# Sadie's Clubhouse

A lost 90s shareware activity center: Sadie's mansion, with a room per activity. Sadie is the
owner's late cat, and she's in every activity (not always in the same way). The activities so far
are Sadie's Dropper World (a cozy physics toy), TypeFitter Deluxe 3.1 (text that never fits) and
Brickbuster '96 (Breakout in the wall of its room, whose ball escapes into the house).

## The owner
- Doesn't code, installs nothing, and doesn't know GitHub. Claude does all building, testing,
  committing, merging and publishing.
- Talk plainly and casually. No jargon.
- After every change, say what to look for in-game.
- Don't narrate the work step by step (they can see Claude is working, and the details mean nothing
  to them). Before building, explain how the thing will work in the game; after, say what changed
  and what to look for.

## Before changing anything
Read `README.md` (the clubhouse and its activities) and `docs/clubhouse/ARCHITECTURE.md` (how
they fit together). Then only the docs of what you're changing:
- **An activity:** its `docs/<activity>/README.md` first: what it is and its design pillars, which
  win over any feature idea. It lists its other pages; in Dropper World always read
  `ARCHITECTURE.md` and `TUNING.md`, plus `CHARACTERS.md` before changing how a character behaves
  (who they are and why they do things comes first) and `ART_STYLE.md` before changing how
  anything looks.
- **How anything looks:** also `docs/clubhouse/ART_STYLE.md` (the approved misremembered-90s look).
- **The mansion, the page shell, the toolbox, the build or the checks:** `docs/clubhouse/` is enough.

Don't start a parked idea (each activity's README lists them) unless asked.

## Making a change
1. `npm install` (esbuild, the bundler, and three.js, for the mansion), then edit only the modules
   involved. Keep the docs true: a change to an activity updates its own docs folder.
2. Each activity lives in `src/activities/<name>/` and never imports from another activity or the
   clubhouse; only from its own folder and `src/shared/` (the toolbox, kept small: a change there
   retests every activity). In Dropper World, `core/` never touches the DOM or imports from
   `render/`, `ui/` or `input/`.
3. `npm run check -- --preview` must pass: it runs `npm test`, builds the test version, and plays
   it in headless Chromium as a phone and a desktop (any page error fails). Look at the screenshots
   in `dist/check/`. While working, `--quick` skips the tests (Dropper World's take about a
   minute). Each activity's checks (and the mansion's) are skipped anyway if they already passed on exactly its code; the check prints how long each stage took. If a change is meant to move
   a test's numbers, explain why in plain words and update that activity's tuning notes (`docs/dropper-world/TUNING.md`).
4. Commit with a plain-English message saying what changed and what to look for in-game. Push to
   the working branch. Never commit `dist/`, `node_modules/` or `package-lock.json`.
5. Publish that build to the test page (below) and give the owner the link, so they can try it.
   Build it again after committing (`npm run build -- --preview`): its label names the commit it
   was built at, and a build from before the commit shows the previous one, which confuses the owner.
6. When the owner says to, open a pull request, merge it into `main`, and publish the real game.
7. Checking something new by hand? If the script would be useful again, put it in `tools/<activity>/`
   (or add it to `tests/<activity>/browser.mjs`), not the scratchpad, which is gone next session.

## Publishing
- GitHub `main` is the source of truth. The game page is https://claude.ai/artifact/3vqbn276s3a4hCN462QjsB
- Only publish a build of `main` (`npm run check`, no `--preview`), to that same URL.
  Before publishing, make sure `grep -c '<div id="testBadge"' dist/index.html` is 0 (that's the test
  version's label; the bare word also appears in the embedded source of the build tool).
  If main's code is exactly what already passed on the branch, the check skips those tests by
  itself, so this is quick.
- Read the live page first. If its embedded source differs from `main` (unpack it with
  `tools/unpack.mjs` and compare), stop and ask. Then pass
  the saved copy of it to the check (`npm run check -- --live <file>`): an activity whose code is
  exactly what's already live (say, only docs or art changed) skips its tests even in a fresh
  session.
- The test page is https://claude.ai/artifact/N7uvNgLxdePKW72SsM3NFX : the working branch, built
  with `--preview`, published after every pushed change without asking. It's never the source of
  truth and can be overwritten any time. Publish it from a copy outside `dist/` (the scratchpad),
  always passing its URL, so it can never land on the real game page. It keeps its own save, so
  the owner's real tower is never touched by a test build.

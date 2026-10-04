# Sadie's Clubhouse

A lost 90s shareware activity center: Sadie's clubhouse (her house) and the world round it, with
activities behind doors in the house and in buildings outside. The project's name for the house is
**the clubhouse**, never "the mansion" (`docs/clubhouse/RULEBOOK.md`). What's in it, activity by
activity: `README.md`.

## The owner
- Doesn't code, installs nothing, and doesn't know GitHub. Claude does all building, testing,
  committing, merging and publishing.
- Talk plainly and casually. No jargon.
- After every change, say what to look for in-game.
- Don't narrate the work step by step (they can see Claude is working, and the details mean nothing
  to them). Before building, explain how the thing will work in the game; after, say what changed
  and what to look for.

## Before changing anything
Read `docs/TASKS.md`: find your job, read the files in its row and nothing else (an activity's
`README.md` first: what it is and its design pillars, which win over any feature idea). For any new
feature idea, `docs/clubhouse/RULEBOOK.md` and `docs/clubhouse/ARCHITECTURE.md`.

**The architect step:** before building a feature, say in the first reply (in plain words) which
shared systems it touches, whether another room would want the same thing (then it goes in the
toolbox, the building kit or the clubhouse, not the room; and the other way round, nothing only one
room needs goes in the shared files), and whether it uses up a spot or hits one of the known limits
(`docs/clubhouse/decisions/known-limits.md`). When a doc says "never X", ask whether a check could
enforce it.

**Sound:** everything that makes sound plays through the sound system, `src/shared/sound.js` (never
its own AudioContext; a check fails otherwise): `docs/clubhouse/sound/system.md`. The owner has
misophonia: no droning or ticking sounds, nothing loud or constant (written once, in
`docs/clubhouse/RULEBOOK.md` section 4).

Don't start a parked idea (each activity's `parked.md`) unless asked. Never move a room: a new
activity takes the next free door, plot or spot (`docs/clubhouse/rooms/card.md`), and anything by a
door stays with it.

## Making a change
1. `npm install` (esbuild, three.js, ESLint and Playwright, at the exact versions `package-lock.json`
   locks), then edit only the modules involved. Keep the docs true: a change to an activity updates
   its own docs folder, in the shape every activity's docs have (`docs/clubhouse/rooms/adding.md`).
   One topic per small file; `tools/docs.mjs`, part of the check, limits sizes and checks the shape.
2. Each activity lives in `src/activities/<name>/` and never imports from another activity or the
   clubhouse; only from its own folder and `src/shared/` (the toolbox, kept small: a change there
   retests every activity). In Dropper World, `core/` never touches the DOM or imports from
   `render/`, `ui/` or `input/`.
3. **See it first, check after** (Yaosio, 2026-10-04: less waiting before the owner can look). Once the
   change is written: the quick look passes (`npm run check -- --preview --quick --only
   clubhouse,<the rooms touched>`: code checker, build, and those pages open in headless Chromium with no
   page error), then commit, push, build again (`npm run build -- --preview`: its label names the commit)
   and publish to the test page (below), saying "checks still running" with the link. Open a draft pull
   request right away: that starts GitHub's copy of the checks in the background. Then run the full
   `npm run check -- --preview` (the code checker, `npm test`, a test build, and the game in headless
   Chromium as a phone and a desktop, any page error fails; look at the screenshots in `dist/check/`).
   If it finds something, fix it, push, and publish to the same link, telling the owner plainly. Say
   when it passes. Only the test page goes out early: the merge and the real game still wait for the
   full check (step 4). Checks test fatal errors only (`docs/clubhouse/checks/fatal-only.md`): none for
   sound, looks or polish. `--quick` skips the tests. Details: `docs/clubhouse/checks/README.md`. If a
   change is meant to move a test's numbers, explain why in plain words and update that activity's
   tuning notes.
4. Before a merge: bring in the latest `main` and `npm run check -- --since-main` must pass on exactly
   that (it checks only what differs from `main`; a full `npm run check -- --retest` every review
   round). GitHub also runs the checks on every pull request and every night
   (free, the repository is public) but never waits for it: the local check is the gate. Never
   commit `dist/` or `node_modules/`; do commit `package-lock.json`.
   **Docs-only changes** (no code, no game files; Yaosio, 2026-10-03, because the full check keeps
   getting longer as the game grows): the quick checks are enough (`node tools/docs.mjs`, lint); skip
   the full run. Anything touching game code still gets the full check on the latest `main`.
5. Commit messages are plain English, saying what changed and what to look for in-game.
6. When the owner says to (or the change is behind the scenes and needs no in-game check), open a pull
   request, merge it into `main`, and publish the real game.
7. A script that would be useful again goes in `tools/<activity>/` (or `tests/<activity>/browser.mjs`),
   not the scratchpad, which is gone next session.

## Publishing
- GitHub `main` is the source of truth. The game page is https://claude.ai/artifact/3vqbn276s3a4hCN462QjsB
- Only publish a build of `main`'s latest commit, to that same URL, once `npm run check -- --live
  <the saved page>` passes on it (what the live page already passed is skipped). First read the live page and its copy of the project
  (`game/source-*.json`, named in the page) into a folder, and list its files into a text file; then
  `node tools/publish.mjs --live <folder> --published <list>` builds the real game and checks it:
  main's latest commit, no test label, and the live copy is one of main's commits (if not, the game
  was changed some other way: stop and ask). It writes what to pass to the Artifact tool: the page,
  every game file as `game/<name>`, `null` for the page's old ones, and `capabilities:
  {downloads: true}` (the pause menu's SAVE A BACKUP needs it, on both pages).
- The test page is https://claude.ai/artifact/N7uvNgLxdePKW72SsM3NFX : the working branch, built with
  `--preview`, published after every pushed change without asking. It's never the source of truth.
  `node tools/publish.mjs --preview --to <scratchpad folder> --published <list>` builds it and copies
  it outside `dist/`; publish that, always passing the test page's URL, so it can never land on the
  real game page. It keeps its own save, so the owner's real progress is never touched by a test.

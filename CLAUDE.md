# Sadie's Dropper World

A cozy physics toy, not a game. Sadie is the owner's late cat.

## The owner
- Doesn't code, installs nothing, and doesn't know GitHub. Claude does all building, testing,
  committing, merging and publishing.
- Talk plainly and casually. No jargon.
- After every change, say what to look for in-game.

## Before changing anything
Read `README.md`, `docs/ARCHITECTURE.md` and `docs/TUNING.md`. Before changing how a character behaves,
also read `docs/CHARACTERS.md`: who they are and why they do things comes first.

## Making a change
1. `npm install`, then edit only the modules involved.
2. `core/` never touches the DOM or imports from `render/`, `ui/` or `input/`.
3. `npm run check -- --preview` must pass: it runs `npm test`, builds the test version, and plays
   it in headless Chromium as a phone and a desktop (any page error fails). Look at the screenshots
   in `dist/check/`. While working, `--quick` skips the tests (about 3.5 minutes; they're skipped
   anyway if they already passed on exactly this code). If a change is meant to move
   a test's numbers, explain why in plain words and update `docs/TUNING.md`.
4. Commit with a plain-English message saying what changed and what to look for in-game. Push to
   the working branch. Never commit `dist/`, `node_modules/` or `package-lock.json`.
5. Publish that build to the test page (below) and give the owner the link, so they can try it.
6. When the owner says to, open a pull request, merge it into `main`, and publish the real game.
7. Checking something new by hand? If the script would be useful again, put it in `tools/` (or add
   it to `tools/check.mjs`), not the scratchpad, which is gone next session.

## Publishing
- GitHub `main` is the source of truth. The game page is https://claude.ai/artifact/3vqbn276s3a4hCN462QjsB
- Only publish a build of `main` (`npm run check`, no `--preview`), to that same URL.
  Before publishing, make sure `dist/index.html` has no `testBadge` in it (that's the test version).
  If main's `src/` and `tests/` are exactly what already passed on the branch, the check skips the
  tests by itself, so this is quick.
- Read the live page first. If its embedded source differs from `main`, stop and ask.
- The test page is https://claude.ai/artifact/N7uvNgLxdePKW72SsM3NFX : the working branch, built
  with `--preview`, published after every pushed change without asking. It's never the source of
  truth and can be overwritten any time. Publish it from a copy outside `dist/` (the scratchpad),
  always passing its URL, so it can never land on the real game page. It keeps its own save, so
  the owner's real tower is never touched by a test build.

## Design pillars (these win over any feature idea)
- The satisfying part is watching pieces squish, pile up, and topple. Protect that above all.
- No fast clicking. Pieces come one at a time from a supply that refills, never faster than one
  every 1.5 s.
- Physics feel is tuned by us, never by the player. Variety comes from piece types.
- The mole decides where pieces go, for its own reasons (everything belongs underground). It never
  means to help Sadie; when it does, it's by accident.
- Sadie is a character with moods, not a cursor.
- One feature at a time. Make sure it's fun before the next.

## Parked ideas (don't start unless asked)
Sadie batting pieces around, upgrading Sadie's barn, more friends after Chooter, friends building
things out of dropped pieces, sky zones with different physics, unlocking piece types, prestige by
melting the tower, a desktop-toy version.

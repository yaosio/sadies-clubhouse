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
3. `npm test` must pass. If a change is meant to move a test's numbers, explain why in plain words
   and update `docs/TUNING.md`.
4. `npm run build`, then check `dist/index.html` in headless Chromium: no console errors, and a
   screenshot that looks right.
5. Commit with a plain-English message saying what changed and what to look for in-game. Push to
   the working branch. Never commit `dist/`, `node_modules/` or `package-lock.json`.
6. When the owner says to, open a pull request, merge it into `main`, and publish.

## Publishing
- GitHub `main` is the source of truth. The game page is https://claude.ai/artifact/3vqbn276s3a4hCN462QjsB
- Only publish a build of `main`, to that same URL.
- Read the live page first. If its embedded source differs from `main`, stop and ask.

## Design pillars (these win over any feature idea)
- The satisfying part is watching pieces squish, pile up, and topple. Protect that above all.
- No fast clicking. Pieces come from a supply that refills over time.
- Physics feel is tuned by us, never by the player. Variety comes from piece types.
- The dropper stays where the owner puts it and never moves on its own to help Sadie.
- Sadie is a character with moods, not a cursor.
- One feature at a time. Make sure it's fun before the next.

## Parked ideas (don't start unless asked)
Sadie batting pieces around, upgrading Sadie's barn, more friends after Chooter, friends building
things out of dropped pieces, sky zones with different physics, unlocking piece types, prestige by
melting the tower, a desktop-toy version.

# Sadie's Dropper World

A cozy physics toy. Squishy jelly pieces drop from a little drone and pile up; Sadie (the owner's
late cat, drawn from a photo) climbs the piles to eat bundles of hay (she thought she was a cow), and
every so often drags her barn back up to the top of the pile. The player watches and helps. It's a
toy, not a game to win.

The owner doesn't code and installs nothing. Claude does all the building.

## Where things live

- **The source of truth is this GitHub repo:** https://github.com/yaosio/sadies-dropper-world
  All changes are made, tested and committed here first.
- **The game** is published at https://claude.ai/artifact/3vqbn276s3a4hCN462QjsB
  Claude publishes it from the coding session, always built from `main`. The page also carries
  a backup copy of the source, as JSON in `<script type="application/json" id="jelly-source">`.
  If the page and the repo ever disagree, trust the repo and say so.
- `docs/ARCHITECTURE.md` is the map of the code. Read it before changing anything.
- `docs/TUNING.md` lists the numbers that make the game feel right, and what the tests expect.

## Making a change (for Claude)

1. `npm install` (just esbuild, the bundler).
2. Edit only the modules involved. `core/` never touches the DOM or imports from `render/`, `ui/`
   or `input/`.
3. `npm test` runs the headless checks. They must all pass. If a change is meant to move a test's
   expected numbers, explain why in plain words and update `docs/TUNING.md` to match.
4. `npm run build` writes `dist/index.html`: the game plus a fresh copy of the source.
5. Check it in a headless browser: no console errors, and a screenshot that looks right.
6. Commit with a plain-English message saying what changed and what to look for in-game, and push
   to a working branch. `dist/`, `node_modules/` and `package-lock.json` stay out of git.
7. When the owner says so, open a pull request and merge it into `main`.
8. Publish: check out `main`, `npm test`, `npm run build`, then publish `dist/index.html` to the
   artifact URL above (Artifact tool, same URL, so the link never changes). Read the live page
   first; if its embedded source differs from `main` (unpack it with `tools/unpack.mjs` and
   compare), stop and ask before overwriting. Only ever publish from `main`, never a branch, and
   only from here, so the page always matches GitHub.

If the repo is ever lost, `node tools/unpack.mjs <page.html> <folder>` rebuilds the project from
the backup inside the published page.

## Design pillars

- The satisfying part is watching pieces squish, pile up, and topple. Protect that above all.
- No fast clicking. Pieces come from a supply that refills over time.
- Physics feel is tuned by us, never by the player. Variety comes from piece types.
- The dropper stays where the player puts it and never moves on its own to help Sadie.
- Sadie is a character with moods, not a cursor.
- Add one feature at a time and make sure it's fun before the next.

## Parked ideas (not now)

Sadie batting pieces around, upgrading Sadie's barn, friends she meets moving into the barn, sky
zones with different physics, unlocking piece types, prestige by melting the tower, a desktop-toy
version.

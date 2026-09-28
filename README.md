# Sadie's Dropper World

A cozy physics toy. A mole up in the sky (in a propeller beanie) drops squishy jelly pieces on
anything it thinks should be underground: the barn, and anyone who looks restless. Sadie (the
owner's late cat, drawn from a photo) climbs the piles to eat bundles of hay (she thought she was a
cow), and every so often drags her barn back up out of the pile. Friends turn up because of what
happens in the world, then move into the barn: the first is Chooter, a black lab/pitbull mix next
door who hears all the thudding, can't stand it, and bursts in. He gets the zoomies and fetches the
ball you throw him from the toy box. The player watches, taps anyone to see what they're thinking,
and throws Chooter his ball. The tower can grow forever: once it's big, the weight of everything above
melts the deepest pieces into candy bedrock. It's a toy, not a game to win.

The owner doesn't code and installs nothing. Claude does all the building.

## Where things live

- **The source of truth is this GitHub repo:** https://github.com/yaosio/sadies-dropper-world
  All changes are made, tested and committed here first.
- **The game** is published at https://claude.ai/artifact/3vqbn276s3a4hCN462QjsB
  Claude publishes it from the coding session, always built from `main`. The page also carries
  a backup copy of the source, as JSON in `<script type="application/json" id="jelly-source">`.
  If the page and the repo ever disagree, trust the repo and say so.
- **The test version** is at https://claude.ai/artifact/N7uvNgLxdePKW72SsM3NFX : the work in
  progress, for the owner to try before it's merged. It says "test version" near the top right and keeps
  its own save.
- `docs/ARCHITECTURE.md` is the map of the code. Read it before changing anything.
- `docs/CHARACTERS.md` is who each character is and why they do what they do, and how feelings,
  offers and activities turn that into behavior.
- `docs/TUNING.md` lists the numbers that make the game feel right, and what the tests expect.

## Making a change (for Claude)

1. `npm install` (just esbuild, the bundler).
2. Edit only the modules involved. `core/` never touches the DOM or imports from `render/`, `ui/`
   or `input/`.
3. `npm run check -- --preview` runs the headless checks (`npm test`), builds `dist/index.html`
   (the game plus a fresh copy of the source; `--preview` marks it as the test version), and plays
   it in a headless browser as a phone and a desktop. Everything must pass; look at the
   screenshots in `dist/check/`. If a change is meant to move a test's expected numbers, explain
   why in plain words and update `docs/TUNING.md` to match.
4. Commit with a plain-English message saying what changed and what to look for in-game, and push
   to a working branch. `dist/`, `node_modules/` and `package-lock.json` stay out of git.
5. Publish that build to the test version's URL above, so the owner can try it.
6. When the owner says so, open a pull request and merge it into `main`.
7. Publish: check out `main`, `npm run check` (no `--preview`), then publish `dist/index.html` to
   the game's artifact URL above (Artifact tool, same URL, so the link never changes). Read the live page
   first; if its embedded source differs from `main` (unpack it with `tools/unpack.mjs` and
   compare), stop and ask before overwriting. Only ever publish from `main`, never a branch, and
   only from here, so the page always matches GitHub.

If the repo is ever lost, `node tools/unpack.mjs <page.html> <folder>` rebuilds the project from
the backup inside the published page.

## Design pillars

- The satisfying part is watching pieces squish, pile up, and topple. Protect that above all.
- No fast clicking. Pieces come one at a time from a supply that refills, never faster than one
  every 1.5 s.
- Physics feel is tuned by us, never by the player. Variety comes from piece types.
- The mole decides where pieces go, for its own reasons (everything belongs underground). It never
  means to help Sadie; when it does, it's by accident.
- Sadie is a character with moods, not a cursor.
- Add one feature at a time and make sure it's fun before the next.

## Parked ideas (not now)

Sadie batting pieces around, upgrading Sadie's barn, more friends after Chooter, friends building
things out of dropped pieces, sky zones with different physics, unlocking piece types, prestige by
melting the tower, a desktop-toy version.

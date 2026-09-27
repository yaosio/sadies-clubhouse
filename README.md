# Sadie's Dropper World

A cozy physics toy. Squishy jelly pieces drop from a little drone and pile up; Sadie (the owner's
late cat, drawn from a photo) climbs the piles to collect stars. The player watches and helps. It's a
toy, not a game to win.

The owner doesn't code and installs nothing. Claude does all the building.

## Where things live

- **The game** is published at https://claude.ai/artifact/3vqbn276s3a4hCN462QjsB
- **The source** is embedded inside that published page, as JSON in
  `<script type="application/json" id="jelly-source">`. The published page is the source of truth.
- **A history of every change** is on GitHub (private): https://github.com/yaosio/sadies-dropper-world
  It mirrors the published page. If the two ever disagree, trust the published page and say so.
- `docs/ARCHITECTURE.md` is the map of the code. Read it before changing anything.
- `docs/TUNING.md` lists the numbers that make the game feel right, and what the tests expect.

## Making a change (for Claude)

1. Read the artifact (Artifact tool, action "read") to get the published `index.html`.
2. Unpack the source into a folder called `jelly`:
   `node -e "const fs=require('fs'),p=require('path');const h=fs.readFileSync(process.argv[1],'utf8');const b=JSON.parse(h.match(/id=\"jelly-source\">([\s\S]*?)<\/script>/)[1]);for(const[f,t]of Object.entries(b.files)){fs.mkdirSync(p.dirname(p.join('jelly',f)),{recursive:true});fs.writeFileSync(p.join('jelly',f),t)}" index.html`
   (after that, `node tools/unpack.mjs <page> <folder>` does the same job).
3. `cd jelly && npm install` (just esbuild, the bundler).
4. Edit only the modules involved.
5. `npm test` runs the headless checks. They must all pass.
6. `npm run build` writes `dist/index.html`: the game plus a fresh copy of the source.
7. Check it in a browser (a headless screenshot is fine), then publish `dist/index.html` to the
   same artifact URL.
8. Commit to GitHub with a plain-English message saying what changed and what to look for. Clone
   the repo, copy the unpacked project over it, commit, push. The owner pastes a fine-grained token
   (this repo only, Contents read/write) each chat. Pass it per command as an
   `http.extraHeader` and never write it into `.git/config`, the project, the page, or memory.

## Design pillars

- The satisfying part is watching pieces squish, pile up, and topple. Protect that above all.
- No fast clicking. Pieces come from a supply that refills over time.
- Physics feel is tuned by us, never by the player. Variety comes from piece types.
- The dropper stays where the player puts it and never moves on its own to help Sadie.
- Sadie is a character with moods, not a cursor.
- Add one feature at a time and make sure it's fun before the next.

## Parked ideas (not now)

Sadie batting pieces around, a home for Sadie to upgrade, sky zones with different physics,
unlocking piece types, prestige by melting the tower, a desktop-toy version.

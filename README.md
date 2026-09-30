# Sadie's Clubhouse

A lost 90s shareware activity center. Sadie is the owner's late cat, and this is her clubhouse:
she's decided to share it with all her friends. It's her mansion, in crappy late-90s 3D. You start
at the front gate (the first time, Sadie's letter invites you in), walk in through the front door,
up the spiral staircase round a giant scratching post, and through an activity's door into its
room, where you play it at the computer (or, for a game that lives in its room, right there in it). Normal game controls: WASD and the mouse, or a thumb stick
on a phone. It's a real, recognizable mansion a cat has clearly taken over.

Sadie is in every activity, but not always in the same way: in one she's a living character with
moods, in another a badly scanned photo who's very sure of herself.

The owner doesn't code and installs nothing. Claude does all the building (how: `CLAUDE.md`).

## The activities

| Activity | What it is | Its docs |
|---|---|---|
| **Sadie's Dropper World** | A cozy physics toy: a mole in a propeller beanie drops squishy jelly pieces, Sadie climbs the pile for her hay, and friends turn up. | `docs/dropper-world/` |
| **TypeFitter Deluxe 3.1** | A 1993 text-fitting program where the text can never fit its box, on purpose, and you win anyway. | `docs/typefitter/` |
| **Brickbuster '96** | Breakout built into the wall of a tall room (no computer): every miss, and every hit on the top, cracks the glass, until it breaks and Sadie's ball of yarn escapes into the house. Being built in steps. | `docs/brickbuster/` |
| **The Music Room** | A room full of instruments you play right where they stand (a toy piano, drums, a fish xylophone, a synth, a theremin, a tape deck), and Sadie, who now and then walks across one. | `docs/music-room/` |
| **The aquarium** | A room with a big fish tank where Sadie swims in a diving suit. Don't tap on the glass (you can, though): one day it takes you out into the ocean. Being built in steps. | `docs/aquarium/` |

Each activity's docs start with its `README.md`: what it is, its own design rules (they win over
any feature idea for it), and its parked ideas. You only need to read the one you're working on.

## What every activity shares

- **It's a lost 90s program.** The look everything shares, and the mansion's: `docs/clubhouse/ART_STYLE.md`.
- **Sadie's in it** somehow.
- **Its own rules.** Each activity has its own design pillars, and nothing carries over from
  another activity unless the owner says so.
- **Its own folder.** Each activity's code, tests, tools and docs live apart from the others', so
  changing one never means retesting the others. How the clubhouse and the activities fit
  together: `docs/clubhouse/ARCHITECTURE.md`.

## Where things live

- **The source of truth is this GitHub repo:** https://github.com/yaosio/sadies-dropper-world
  (named after the first activity, from before there was a clubhouse). All changes are made,
  tested and committed here first.
- **The game** is published at https://claude.ai/artifact/3vqbn276s3a4hCN462QjsB
  Claude publishes it from the coding session, always built from `main`. The page also carries
  a backup copy of the source, as JSON in `<script type="application/json" id="jelly-source">`.
  If the page and the repo ever disagree, trust the repo and say so.
- **The test version** is at https://claude.ai/artifact/N7uvNgLxdePKW72SsM3NFX : the work in
  progress, for the owner to try before it's merged. It says "test version" near the top right and keeps
  its own save.
- If the repo is ever lost, `node tools/unpack.mjs <page.html> <folder>` rebuilds the project from
  the backup inside the published page (everything but `art/`: the mock-ups and the scripts that
  draw the pictures, which only live here).

```
README.md                  this page: the clubhouse
CLAUDE.md                  how Claude works on it (building, checking, publishing)
docs/clubhouse/            how the clubhouse is built, and the look everything shares
docs/<activity>/           each activity's own docs, starting with its README.md
src/  tests/  tools/       the code, its checks and tools: see docs/clubhouse/ARCHITECTURE.md
art/                       mock-ups, and the scripts that draw pictures
```

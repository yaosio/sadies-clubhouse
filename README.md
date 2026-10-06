# Sadie's Clubhouse

A lost 90s shareware activity center. Sadie is the owner's late cat, and this is her clubhouse:
she's decided to share it with all her friends. It's her clubhouse, in crappy late-90s 3D. You start
at the front gate (the first time, Sadie's letter invites you in), walk in through the front door,
up the spiral staircase round a giant scratching post, and through an activity's door into its
room (or, outside the gate, across the town square to a house of its own, or beside the house, into the hedge maze), where you play it at the computer (or, for a game that lives in its room, right there in it). Normal game controls: WASD and the mouse, or a thumb stick
on a phone. It's a real, recognizable house a cat has clearly taken over.

Sadie is in every activity, but not always in the same way: in one she's a living character with
moods, in another a badly scanned photo who's very sure of herself.

The owner doesn't code and installs nothing. Claude does all the building (how: `CLAUDE.md`).

## The activities

| Activity | What it is | Its docs |
|---|---|---|
| **Sadie's Dropper World** | A cozy physics toy: a mole in a propeller beanie drops squishy jelly pieces, Sadie climbs the pile for her hay, and friends turn up. | `docs/dropper-world/` |
| **TypeFitter Deluxe 3.1** | A 1993 text-fitting program where the text can never fit its box, on purpose, and you win anyway. | `docs/typefitter/` |
| **Brickbuster '96** | Breakout built into the wall of a tall room (no computer): every miss, and hitting the top, cracks the glass, until it breaks and Sadie's ball of yarn escapes into the house. | `docs/brickbuster/` |
| **The Music Room** | A room full of instruments you play right where they stand (a toy piano, drums, a fish xylophone, a synth, a theremin, a tape deck), and Sadie, who now and then walks across one. | `docs/music-room/` |
| **The aquarium** | A room with a big fish tank where Sadie swims in a diving suit. Don't tap on the glass (you can, though): it takes you out into a whole ocean, in a little sailboat, to find six things for the cabinet, with a mountain looming over it all that turns out to be tiny. | `docs/aquarium/` |
| **Space Adventure** | A room that's a spaceship's cockpit: walk in and you're strapped in for Sadie's slow, philosophical trip down to a planet (sad synthwave, a landing by the sea), which she finds disappointing. Afterwards it's her space room, with a radio and a button to go again. | `docs/space-adventure/` |
| **The Hedge Maze** | Not in the house: a hedge block beside it, much bigger inside, made in front of you as you walk. After 5 to 8 turns, the next turn is the end, which lets you out into the backyard, where Sadie lounges by the pool. It's sneaky: even going in from the backyard, the end lets you out into the backyard, and walking back in, it's a new maze past the first corner. | `docs/hedge-maze/` |
| **Clyde's House** | Not in the house: the first house outside the front gate, down a little path off the town square. Clyde (a little orange spark who overthinks everything) built the Good Morning Machine, a ten-step contraption to give Sadie one treat; you fill its missing pieces from a box of mostly junk and pull the lever. Beside it, Clyde's Weather Machine: four levers (rain, snow, a second sun, cats) that change the weather outside, and Sadie reacts. | `docs/clydes-house/` |
| **Chooter's Paint Shop** | Not in the house: across the path from Clyde's House. Chooter (the dog from Dropper World) runs it, wagging, in a painter's cap, with a brush in his mouth. You paint the room itself, as you walk about: the walls, floor, ceiling and the things in it (a plaster Sadie, a wooden fish, an easel), with pots of loud paint, a brush, roller, spray can, bucket, stamps, and dynamite to blow the paint off. Sadie wanders in and leaves paw prints. | `docs/paint-shop/` |
| **Marbles' Cut & Curl** | Not in the house: next to Clyde's House on the town square. Marbles (a mischievous brown tabby) runs a barbershop where Sadie sits in the barber chair and you pick her hairdo, taildo and outfit from wig heads, ribbons and a clothes rail (nothing is saved). Seven outfits come with a short show on the stage: she sings (all meows), builds a cat tower that falls over, waltzes in a ball gown, vanishes as a magician, flies into a box, solves a mystery, or falls asleep. | `docs/barbershop/` |

Each activity's docs start with its `README.md`: what it is, its own design rules (they win over
any feature idea for it), and its parked ideas. You only need to read the one you're working on.

## What every activity shares

- **It's a lost 90s program.** The look everything shares, and the clubhouse's: `docs/clubhouse/look/README.md`.
- **Sadie's in it** somehow.
- **Its own rules.** Each activity has its own design pillars, and nothing carries over from
  another activity unless the owner says so.
- **The clubhouse's music and sound.** A soft main theme plays round the clubhouse, composed as it
  plays so it never repeats; it fades out whenever an activity's own music plays. Every sound goes
  through one sound system with the kind-to-the-ears rules built in, and the pause menu's MUSIC,
  SOUNDS and VOICES buttons turn each SOFT or OFF.
- **Its own folder.** Each activity's code, tests, tools and docs live apart from the others', so
  changing one never means retesting the others. How the clubhouse and the activities fit
  together: `docs/clubhouse/ARCHITECTURE.md`.

## Where things live

- **The source of truth is this GitHub repo:** https://github.com/yaosio/sadies-dropper-world
  (named after the first activity, from before there was a clubhouse). All changes are made,
  tested and committed here first.
- **The game** is published at https://claude.ai/artifact/3vqbn276s3a4hCN462QjsB
  Claude publishes it from the coding session, always built from `main`. It also carries a backup
  copy of the project, a file beside the page (`game/source-*.json`, named in the page's
  `<link id="jelly-source">`; `tools/unpack.mjs` turns it back into the folder).
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
docs/TASKS.md              which docs to read for which job
docs/clubhouse/            how the clubhouse is built, the rulebook, and the look everything shares
docs/<activity>/           each activity's own docs, starting with its README.md
src/  tests/  tools/       the code, its checks and tools: see docs/clubhouse/ARCHITECTURE.md
art/                       mock-ups, and the scripts that draw pictures
```

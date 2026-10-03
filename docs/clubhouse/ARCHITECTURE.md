# How the clubhouse is built

Sadie's Clubhouse is Sadie's house and the world round it, like a 90s activity center: activities
behind doors in the house, and buildings outside, in her grounds and along the lane past the gate.
Plain ES modules in `src/`, bundled by esbuild into one page and the game files it fetches
(`tools/build.mjs`). **Keep this page short:** it says how things fit, never one room's special cases
(its own docs) or the details of one system (that system's folder). `docs/TASKS.md` says which pages
a job reads.

## Where things live
```
src/main.js, src/index.html     the page shell every activity runs in
src/clubhouse/                  the 3D world you walk round: the clubhouse (mansion.js), the outside
src/activities/<name>/          one folder per activity: everything that's only its own
src/shared/                     the toolbox: the few things more than one activity needs
tests/<name>/  tools/<name>/    each activity's own checks and tools (tests/clubhouse/: the clubhouse's)
docs/<name>/                    each activity's own docs (docs/clubhouse/: the shared ones)
```

## The rules that keep it manageable
- **An activity keeps to itself.** It imports only its own folder and `src/shared/`, never another
  activity or the clubhouse (the code checker enforces it).
- **The toolbox stays small.** A change there retests every activity.
- **Anything many rooms need is one shared system** (a "director"), never something each room does
  for itself, and **a check loops over every room** for it.
- **Adding an activity never touches the shared code.** The build finds every
  `src/activities/*/card.js`. The exception: a new plot or grounds spot.
- **The shared code names no room;** a check fails if it does.
- **Nothing that's placed ever moves:** a door, a plot, a spot. A new activity takes a new one.
- **Every place follows `RULEBOOK.md`.** Why things are the way they are: `decisions/`.

## Two kinds of activity
Every activity has a `card.js` (`rooms/card.md`); the room checker checks it.
- **On a computer:** you lean into the computer in its room, the page's own screen comes in, ESC BACK
  returns. No building kit.
- **A game that lives in its room:** the clubhouse calls its `buildRoom(kit)` and it hands back a
  place you walk about in. A building outside is the same, with a house of its own outside.

## What the shared systems do for a room
| System | Where | What it gets for free | Pages |
|---|---|---|---|
| Building kit | `mansion.js` hands it to `buildRoom` | Anything added reaches every room | `rooms/kit.md` |
| Building and putting away | `mansion.js` | Built near you a bite at a time, put away when far, its file fetched when needed | `world/building-rooms.md` |
| Sound | `src/shared/sound.js` | Volumes, the kind-to-the-ears rules, stopped when put away | `sound/` |
| Saves | `src/shared/storage.js` | Start-over, backups, nearly-full warning, unreadable saves put aside | `rooms/saves.md` |
| Outside | `outside.js` | Its plot or spot, levels, its house kept while its room's put away | `outside/` |
| Weather | `src/clubhouse/weather/` | Sunlight, clouds, rain, snow, cats, wherever it's seen from | `outside/weather.md` |
| Pause | `mansion.js` | Sounds held; controls stopped | `world/walking.md` |

## Where to read more
`docs/TASKS.md`: your job, and the exact files it reads. Folders (each has a `README.md`):
`rooms/`, `world/`, `outside/`, `sound/`, `look/`, `checks/`, `decisions/`, all in `docs/clubhouse/`.

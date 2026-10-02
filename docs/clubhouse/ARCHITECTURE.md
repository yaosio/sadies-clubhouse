# How the clubhouse is built

Sadie's Clubhouse is Sadie's mansion and the world round it, like a 90s activity center: activities
behind doors in the mansion, and buildings outside, in her grounds and along the lane past the gate. This page is
the short overview every change starts from: how the parts fit together, what the shared systems do
for a room, and which page to read for the details. Plain ES modules in `src/`, bundled by esbuild
into one page and the game files it fetches (`tools/build.mjs`).

**Keep this page short.** Every thread reads it for every change, so it says how things fit, never
one room's special cases (those go in the room's own docs) or the details of one system (those go in
its reference page below). `tools/docs.mjs` fails the check if it, `README.md` or `CLAUDE.md` grow
past their limit.

## Where things live

```
src/main.js, src/index.html     the clubhouse: the shell every activity runs in
src/clubhouse/                  the 3D world you walk round: the mansion, and the outside
src/activities/<name>/          one folder per activity: everything that's only its own
src/shared/                     the toolbox: the few things more than one activity needs
tests/<name>/                   each activity's own checks (tests/clubhouse/: the mansion's)
tools/<name>/                   each activity's own tools (tools/clubhouse/: the mansion's)
docs/<name>/                    each activity's own docs (docs/clubhouse/: the shared ones)
art/                            mock-ups, and the scripts that draw pictures
```

## The rules that keep it manageable

- **An activity keeps to itself.** It imports only from its own folder and `src/shared/`, never from
  another activity or the clubhouse (the code checker enforces it). So changing one activity never
  means retesting the others, and a thread only reads that activity's code and docs.
- **The toolbox stays small.** A change there retests every activity, so something moves into it
  only once a second activity really needs it.
- **Anything many rooms need is one shared system** (a "director"), never something each room does
  for itself, and **a check loops over every room** for it, so a new room is checked with no new test.
- **Adding an activity never touches the clubhouse.** The build finds every `src/activities/*/card.js`.
  The exception: a new plot or grounds spot (`OUTSIDE.md`). A new kind of control is a file of its own
  in `src/clubhouse/play/` any place can use (`ROOMS.md`).
- **The shared code names no room.** Anything only one room needs lives in its folder; a check fails
  if the mansion, the outside, the shell or the toolbox name an activity.
- **Nothing that's placed ever moves:** a door, a plot along the lane, a spot in the grounds. A new
  activity takes a new one. The clubhouse can grow in any direction, with doors anywhere.
- **Why things are the way they are:** `DECISIONS.md`. Check it before undoing something.

## Two kinds of activity

Every activity has a `card.js`: its `id`, `name`, where it is (a door on the landings, `slot`; a plot
on the lane, `lot`; a spot in the grounds, `grounds`), and `keeps` (what its saves start with). Full details: `ROOMS.md`. The room checker (`tests/clubhouse/cards.mjs`) checks
every card against these rules and says plainly what's wrong.

- **On a computer** (Dropper World, TypeFitter): you lean into the computer in its room, the mansion
  leaves the page and the activity's own page comes in. ESC BACK reloads into the mansion. These
  don't get the building kit.
- **A game that lives in its room** (every other one): the mansion calls its `buildRoom(kit)` and it
  hands back a place you walk about in. A building outside (on the lane or in the grounds) is the
  same, with a house of its own outside (`OUTSIDE.md`).

## What the shared systems do for a room

| System | Where | What a room does | What it gets for free |
|---|---|---|---|
| **Building kit** | `mansion.js` hands it to `buildRoom` | Uses its tools (materials, shapes, words, `breathe`) | Anything added to the kit reaches every room, with no room edited |
| **Building and putting away** | `mansion.js` | Can be built again from its save; optional `putAway()` and `busy()` | Built near you (a building outside: at the start), a bite at a time; put away when far off; its file fetched only when needed |
| **Sound** | `src/shared/sound.js` | `soundsFor('room:<id>')`, plays by name; music on `line('music')` | Volumes, the kind-to-the-ears rules, the main theme making way, quiet behind the pause menu, stopped when put away |
| **Saves** | `src/shared/storage.js` | Saves with its kit's box `saves` (`get`, `set`), listed in the card's `keeps` | Start-over buttons, backups and a nearly-full warning in the pause menu; an unreadable save put aside, never wiped; never throws |
| **Pause** | `mansion.js` | Can ask `paused()` | Sounds held; controls stopped |
| **Outside** | `outside.js` | A building adds its house, what's solid and where to walk (`outside` in its kit) | Its plot or spot, levels, its house kept while its room's put away, a plain block from far off |
| **Weather** | `src/clubhouse/weather/` (the world's) | A place out of doors says `sky`; whoever makes weather says which with its kit's `weather.set` | Its sunlight, clouds, rain, snow and cats, wherever it's seen from; saved |

## Where to read more

Read only the page for what you're changing:

| Page | Read it when you're changing |
|---|---|
| `ROOMS.md` | an activity's card or room: the kit, the place it hands back, the ways of playing (arcade, instruments, using things, painting), saves |
| `OUTSIDE.md` | the outside or a building in it: the grounds, the lane and its plots, levels, the house a building hands back, growing into a town |
| `MANSION.md` | the mansion and the page shell: places and doorways, building and putting rooms away, starting quickly, controls, how it's drawn, the page shell |
| `SOUND.md` | how anything sounds: the sound system and its rules, the main theme |
| `CHECKS.md` | the checks, the build or the tools |
| `ART_STYLE.md` | how anything looks |
| `DECISIONS.md` | (before undoing a big choice) why it was made |

**Adding an activity:** a folder `src/activities/<name>/` with its `card.js` (and for one on a
computer, `page.html`, `styles.css` and a `main.js`; for a room, `room.js`), `tests/<name>/run.mjs`
and `tests/<name>/browser.mjs` (`CHECKS.md`), docs in `docs/<name>/` starting with a `README.md`
(what it is, its own design rules, its parked ideas, its other pages), and a line in the main
`README.md`. Nothing else changes.

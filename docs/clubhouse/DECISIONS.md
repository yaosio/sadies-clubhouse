# Decisions, and why

The big choices that shape the clubhouse, one line each, so a later change doesn't undo one by
accident. Read it before undoing something; add a line when a new big choice is made (or one is
changed, saying when and why).

## How it's built
| Decision | Why |
|---|---|
| Activities never import from each other or the clubhouse; only their own folder and `src/shared/` | Changing one never means retesting or rereading the others |
| The toolbox (`src/shared/`) stays small | A change there retests every activity |
| Anything many rooms need is one shared system, with a check that loops over every room | The game may grow to hundreds of rooms; a new room is checked with no new test (the owner's rule) |
| New tools for rooms go in the building kit the mansion hands every room | One place to add, every room has it, no room edited |
| Places joined by doorways that show the other side, no loading screens | A place can be any size, bigger inside than out, and changing one never touches another |
| Rooms are built near you a bite at a time, put away when far, rebuilt from their save | Starting stays quick and memory stays flat however many rooms there are |
| Each room's code is its own file, fetched when first needed | The page doesn't grow with the number of rooms (16 MB page limit) |
| The copy of the project travels as a file beside the page (`game/source-*.json`), not inside it | The page stays tiny; inside, it grew with every room towards the 16 MB limit |
| Doors, plots and spots never move (`tests/clubhouse/spots.json`, checked); a new activity takes a new one; the clubhouse can grow in any direction, doors anywhere | Moving a door once shuffled two others; nothing the owner knows should move |
| Everything outside the gate belongs to somebody else (Clyde, Chooter); inside the fence is Sadie's | The world's rule (the owner, 2026-10-01) |

## Sound
| Decision | Why |
|---|---|
| One sound system, one audio engine; a check fails on any other | The kind-to-the-ears rules live in one place (the owner has misophonia) |
| The main theme is composed as it plays and never repeats; no drums, drones or held notes | The owner asked for it; misophonia |
| The theme makes way by itself for any other music | No room has to manage it |

## Look
| Decision | Why |
|---|---|
| PS1-style materials, no swimming textures | The approved look; the owner found swimming far too distracting |
| No fog for far things | The PS1 material has none; adding it would change the approved look |
| Words in the mansion use the 3x5 pixel font, drawn in | Nothing waits for a web font |
| Pixels are read only from canvases made with `willReadFrequently` | Reading a drawn canvas froze the game up to half a second per room |

## Saves
| Decision | Why |
|---|---|
| `src/shared/storage.js` is the only thing touching browser storage; rooms save through their kit's box | A new home for saves (itch.io, a desktop app) changes one file |
| A save that can't be read is put aside (`.unreadable`), never wiped; old save shapes are upgraded | Nobody loses progress to a bug or a change |
| Backups are a file the owner saves and loads from the pause menu, all or nothing | Browsers can clear saves; a half-loaded backup would mix two games |
| Never rename a save key in use | Everyone's saves would be lost |
| The test page keeps its own save | A test build never touches the owner's real progress |

## Checks and tools
| Decision | Why |
|---|---|
| Each activity's checks are skipped when its exact code already passed | Merges stay quick |
| On GitHub, one computer per activity, all at once | A full retest takes as long as the slowest activity, not all of them |
| Never run several activities' browser checks side by side on one computer | The hidden browser draws on the processor; games slow down and checks trip |
| Browser checks wait in game time or for the thing itself, never a clock-timed pause | Slower computers (GitHub's) run fewer frames and fall behind the clock |
| `package-lock.json` is committed | Every tool at an exact version, so builds are repeatable |
| No auto-formatter | Only Claude writes the code; reformatting every file gains little and clashes with work in progress |
| The real game is published once GitHub's check on main is green, without running the checks again | GitHub already checked exactly that code, as the real build; running it again took ten minutes |
| Every card is checked against the clubhouse's rules (`tests/clubhouse/cards.mjs`) | A misplaced or misspelt card shows up as a plain reason, not a broken game |
| The docs every change reads have a size limit (`tools/docs.mjs`) | Each thread reads only a small part of the project to change one area |
| Each kind of control (a way of playing) is a file of its own in `src/clubhouse/play/`, lent only what it needs; the mansion just passes it keys, presses and frames | They used to be written into `mansion.js` one by one, so it grew with every new kind of play, inside or out |
| The shared code (mansion, outside, shell, toolbox) never names an activity, and a check fails if it does | Reviews noted controls piling up in the mansion but only listed it as a limit; a check catches it the day it happens |

## Known limits (go through these in every review)
Things that are fine today but will need work as the game grows. Add any new limit a feature hits;
remove one once it's fixed. Each review also asks of every shared file (the mansion, the outside,
the toolbox): is there anything here only one room uses, or that grows with every new kind of room?
A limit that's written down still needs a plan for when it gets fixed, not just a line here.
- **Saves:** all rooms share the browser's about 5 MB. The pause menu warns when it's nearly full,
  but nothing makes room by itself; a room that saves a lot (pictures) should keep them small.
- **The outside is built whole.** It has levels now, but a town walkable as one space will need it
  to load in pieces as you walk, like rooms. (When the town starts growing.)
- **Every building outside is built at the start** (only its room is ever put away; the house lives
  all game), so starting gets slower with each one. A town needs houses built and put away by
  distance.
- **Putting away is counted in doors.** Every building outside is one door from the outside, so in
  a big town none would ever count as far: it needs distance in metres there.
- **The outside's scenery is a fixed size** (the lane, fences, grass, hills); only the walkable
  edge grows with the plots. A plot past about 30 m either side needs it to grow.
- **One outside, shared by every building.** A place's settings (`hush`, `brush`, `watch`, `light`)
  are one each for the whole outside, so two outdoor activities would fight over them, and two
  `weather` cards would both set the light. Music a room plays isn't heard outside (only an
  `everywhere` line is, and that's heard everywhere). The every-room checks visit rooms, not
  houses or things to use outside.
- **The every-room check gets longer with every room**; split it across computers when it's slow.

# Decisions: how it's built

Why the clubhouse is built the way it is. Read before undoing one of these; add a line when a big choice is made or changed (saying when and why).

| Decision | Why |
|---|---|
| Activities never import from each other or the clubhouse; only their own folder and `src/shared/` | Changing one never means retesting or rereading the others |
| The toolbox (`src/shared/`) stays small | A change there retests every activity |
| Anything many rooms need is one shared system, with a check that loops over every room | The game may grow to hundreds of rooms; a new room is checked with no new test (the owner's rule) |
| New tools for rooms go in the building kit the clubhouse hands every room | One place to add, every room has it, no room edited |
| Places joined by doorways that show the other side, no loading screens | A place can be any size, bigger inside than out, and changing one never touches another |
| Rooms are built near you a bite at a time, put away when far, rebuilt from their save | Starting stays quick and memory stays flat however many rooms there are |
| Each room's code is its own file, fetched when first needed | The page doesn't grow with the number of rooms (16 MB page limit) |
| The copy of the project travels as a file beside the page (`game/source-*.json`), not inside it | The page stays tiny; inside, it grew with every room towards the 16 MB limit |
| Doors, plots and spots never move (`tests/clubhouse/spots.json`, checked); a new activity takes a new one; the clubhouse can grow in any direction, doors anywhere | Moving a door once shuffled two others; nothing the owner knows should move |
| Everything outside the gate belongs to somebody else (Clyde, Chooter); inside the fence is Sadie's | The world's rule (the owner, 2026-10-01) |
| The weather is the world's (`src/clubhouse/weather/`), over every place out of doors; Clyde's levers only say which (2026-10-02) | It lived in Clyde's House: his room failing to load meant no weather, starting it over reset the world's, and the Hedge Maze stayed sunny in the rain |
| Sadie's house is "the clubhouse" everywhere, never "the mansion" (2026-10-02) | The owner's call: it's the project's name and what players see. The code was renamed on 2026-10-03; one old name is left on purpose: saves starting `mansion.` must keep it, or players lose their settings |


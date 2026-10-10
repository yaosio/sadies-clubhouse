# Which docs for which job

Find your job, read the files in its row, and nothing else. `CLAUDE.md` (how Claude works here) is
always read first. Folders have a `README.md` listing their pages: open it if the row says "folder".
`<name>` is an activity's folder in `docs/`; each has a `README.md` with its design pillars (which
win over any feature idea) and its pages.

| The job | Read |
|---|---|
| Any new idea for a feature or place | `docs/clubhouse/RULEBOOK.md`, `docs/clubhouse/ARCHITECTURE.md` |
| Change what an activity does or how you play it | `docs/<name>/README.md`, then its `playing.md` |
| Change an activity's code | `docs/<name>/README.md`, then its `how-built.md` (Dropper World: its `how-built/` folder) and the page it points to for your part |
| Change an activity's numbers or tuning | `docs/<name>/README.md`, then its numbers or tuning page |
| Change how an activity looks | `docs/<name>/README.md`, `docs/clubhouse/look/README.md`, its own look page if it has one |
| Change how a character behaves (Dropper World) | `docs/dropper-world/README.md`, then its `characters/` folder |
| Add an activity | `docs/clubhouse/rooms/adding.md`, `card.md`, then `kit.md` and `place.md` |
| Change an activity's card, door, plot or spot | `docs/clubhouse/rooms/card.md`, `docs/clubhouse/outside/plots.md` for a plot |
| Something a room needs from the clubhouse | `docs/clubhouse/rooms/kit.md` |
| How a room is put away, built again, or starts fast | `docs/clubhouse/rooms/place.md`, `docs/clubhouse/world/building-rooms.md` |
| Make a new way of playing, or change one | `docs/clubhouse/rooms/controls.md`, `docs/clubhouse/world/walking.md` |
| A room saves something | `docs/clubhouse/rooms/saves.md` |
| Any sound or music | `docs/clubhouse/sound/README.md`, then `system.md` |
| The main theme | `docs/clubhouse/sound/main-theme.md` |
| Add a building outside | `docs/clubhouse/outside/plots.md`, `buildings.md`, then `docs/clubhouse/rooms/card.md` |
| The weather | `docs/clubhouse/outside/weather.md` |
| Something in the world that builds by distance | `docs/clubhouse/outside/things.md` |
| The outside, or the town | `docs/clubhouse/outside/README.md`, `town.md`, and `square.md` for the town square, `pool.md` for the pool |
| The clubhouse itself: walking, doorways, the hall | folder `docs/clubhouse/world/` (its README says which page) |
| How the clubhouse is drawn (materials, flicker) | `docs/clubhouse/world/drawing.md`, `docs/clubhouse/look/README.md` |
| The page shell (opening an activity, ESC BACK, fonts) | `docs/clubhouse/world/shell.md` |
| A check, the build, a tool, or GitHub's checks | folder `docs/clubhouse/checks/` (its README says which page) |
| The docs themselves | `tools/docs.mjs`, `docs/clubhouse/decisions/checks.md` |
| Undoing or changing a big choice | folder `docs/clubhouse/decisions/`, and update it |
| A review (things done several ways, growing files) | `docs/clubhouse/decisions/known-limits.md`, `docs/clubhouse/ARCHITECTURE.md` |
| Publishing | `CLAUDE.md` (the Publishing part) |

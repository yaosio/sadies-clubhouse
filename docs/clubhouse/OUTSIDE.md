# The outside: the grounds, the lane and the buildings on it

Everything round Sadie's house (`src/clubhouse/outside.js`): her front garden and backyard inside the
fence, and the lane outside the front gate with plots for other people's buildings. The short
overview is `ARCHITECTURE.md`; read this page when you're adding a building outside, changing the
outside itself, or making something to play out of doors.

**Whose it is.** Inside the fence (the garden, the backyard, the grounds round the house) is Sadie's.
Everything outside the gate belongs to somebody else (Clyde's House, Chooter's Paint Shop).

**Where things go.** Nothing placed ever moves (`tests/clubhouse/spots.json` locks every spot; a new
one goes on the end of its list, there and in the code).
- `LOTS`: plots along the lane outside the gate (`x`, `z`: the middle of the front door's threshold;
  `y`: the ground's height; the house faces the gate). 0 is left of the path as you go out, 1
  across from it, then further along each way. The next free one has a COMING SOON stake. Four so far.
- `GROUNDS`: spots in the grounds round the house, for a building that isn't on the lane (`x`, `z`,
  `y`, and how much room: `w` across, `d` deep). 0 runs beside the house from the front garden to the
  backyard, on your left as you go out of the front door (on your right walking up from the gate):
  the Hedge Maze. It's the only one so far, so the next grounds building adds a spot.
- The walkable edge grows to take in every plot and spot (`EDGE`). The scenery doesn't yet: the
  lane's strip, the fences, the grass and the hills are fixed sizes, so a plot past about 30 m to
  either side needs them to grow too (a known limit, `DECISIONS.md`).

**A building outside** is a game that lives in its room (`ROOMS.md`) whose card has `lot` or
`grounds` instead of `slot`. Nothing on the landings changes (the hall skips it). Its kit also has:
- `outside`: the outside place. Its `scene` and `faces` to add to; `block(x0, x1, z0, z1, y0, y1)`
  and `blockRound(x, z, r, y0, y1)` for what's solid (from the ground up unless it says);
  `surface((x, z) => height or null)` for somewhere more to walk on, a bridge or a balcony (each of
  these hands back how to take it away); `uses`, for things to use out there (Clyde's weather
  levers); and its `light` (the weather sets its sunlight).
- `lot` (its plot) or `ground` (its spot).
- `skyMat` (the outside's sky, for a room that's out of doors) and `snapshot(obj, place, { from, at,
  fov, w, h })`, a picture of one thing in a place, taken once, with everything else see-through
  (the maze shows the real house over its hedges that way). Every room's kit has these too.

It builds its house into the outside's scene itself and hands back, with its place, `house`:
- `door`: its front door, a `doorway` in the outside's scene, joined to the room's own `doors.door`.
  Or `doors` (`{ door, back }`) for more than one way in, each joined to the room's door of that
  name (the outside calls them by its card's id, and `<id>.back`). A doorway can move (`moveTo(pos,
  yaw)`): the maze's door to the backyard is always wherever its end is.
- `update(t, dt, ears)`: called every frame, even while its room is put away (the house stays: the
  mansion hands it back as `house` when the room is built again).
- `group` (everything in the house), `body` (what a plain block is sized to) and `farTint` (its
  colour): from further than 90 m (from you, or the door you're looking out of) the house is drawn as
  a plain block. None is that far yet. (Fog, to hide the far end, is parked: the PS1 material has
  none, and adding it would change the approved look.)

**The weather** is the world's, not any building's (`src/clubhouse/weather/`: `rules.js`, the kinds
and how each looks; `sky.js`, the clouds, sunlight, rain, snow, cats and Sadie's reactions on the
gatepost; saved as `mansion.weather`). It comes over every place out of doors: one whose place says
`sky` (`dome`, how far off its cloud cover is, inside its sun and outside its hills; `follow`, for a
sky that goes round you; `sun2`, where a second sun comes up, if it has a sun): the outside and the
Hedge Maze. Its sunlight is dimmed or brightened from its own clear-day `light.sun`, and what falls,
falls round wherever out of doors is seen from (you, or the door you're looking out of; nothing's
worked out while nobody can see out). Whatever makes weather (Clyde's Weather Machine) uses its
kit's `weather`: `now()`, `set(kind)` (`rain`, `snow`, `sun`, `cats` or `clear`), `kinds`. Two things
setting it just take turns; neither owns it. The checks: `tests/clubhouse/run.mjs` (its rules) and
`browser.mjs` (rain over every place with a `sky`, found as they're built, so a new one is checked
with no new test).

**Sounds outside.** A building's sounds that belong to the house, not the room, use their own owner
(`soundsFor('house:<name>')`, like Clyde's weather machine), so they carry on while its room is put
away; leaving the page stops them. Music a room plays is only heard inside that room, so music meant
for outside needs `line('music', { everywhere: true })`, which is heard everywhere (`SOUND.md`).

**When it's built.** The buildings you can see from the gate as you start (ahead of you there) are built
before the first picture; the rest of the buildings outside
straight after it, first in line, wherever they are. Only a building's room is ever put away.

**Growing into a town.** The clubhouse is meant to sit on a hill in the middle of a town, one space
you walk round, with bridges, sewers and paths going over and under each other. Walking on more than
one level already works outside (`floor(x, z, y)`: the ground and every `surface`, standing on
whichever is nearest your feet; a step is at most half a metre), what's solid has a height, plots and
spots have a height, and a sewer or a cave can be a place of its own behind a doorway. Don't build
anything new that assumes the outside is flat. What a big town still needs is in `DECISIONS.md`'s
known limits: the outside built whole, every house built at the start, the scenery's fixed size, one
outside shared by every building, and putting away counted in doors.

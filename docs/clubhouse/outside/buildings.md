# A building outside

A game that lives in its room (`docs/clubhouse/rooms/place.md`) whose card has `lot` or `grounds`
instead of `slot`, with a house of its own outside. Read when making or changing one. Nothing on the
landings changes (the hall skips it).

## What its kit also has
- `outside`: the outside, lent (never to a room that isn't a building):
  - `add(...things)` into it, `face(...things)` that turn to face you, `use(...uses)` for things to
    use out there (levers);
  - `block(x0, x1, z0, z1, y0, y1)` and `blockRound(x, z, r, y0, y1)` for what's solid (from the
    ground up unless it says);
  - `surface((x, z) => height or null)` for somewhere more to walk on, a bridge or a balcony (each of
    these hands back how to take it away);
  - `is(place)`: whether a place (like `ears().place`) is the outside;
  - `house`: the clubhouse itself (for a picture of it).
- `lot` (its plot) or `ground` (its spot, with `joins`: where its little paths meet the outside's).
  A plot is turned (`yaw`) to face the town square, so a house builds itself in its own terms (x across,
  z out from its door) in a group set on the plot turned the way it faces (`userData.turn` is its yaw,
  so things that face you inside it still do), and uses the plot's `at(x, z)` (a place in those terms,
  as `[x, z]` on the outside), `block(x0, x1, z0, z1, y0, y1)` and `blockRound(x, z, r, y0, y1)` (what's
  solid, in the same terms). Only the door is given in the outside's terms: `doorway` with the
  plot's `x`, `z` and `yaw`.
- `house`: its house, handed back when the room is built again (below).
- `skyMat` and `snapshot` (every room's kit has these: `docs/clubhouse/rooms/kit.md`). A snapshot
  can show the real house over a building's walls.

## The house it hands back
It builds its house into the outside's scene itself and hands back, with its place, `house`:
- `door`: its front door, a `doorway` in the outside's scene, joined to the room's own `doors.door`.
  Or `doors` (`{ door, back }`) for more than one way in, each joined to the room's door of that name
  (the outside calls them by its card's id, and `<id>.back`). A doorway can move (`moveTo(pos, yaw)`).
- `update(t, dt, ears)`: called every frame by the clubhouse, whether or not its room is built (the
  house stays: the clubhouse hands it back as `house` when the room is built again).
- `group` (everything in the house), `body` (what a plain block is sized to) and `farTint` (its
  colour): from further than 90 m (from you, or the door you're looking out of) the house is drawn as
  a plain block. None is that far yet. (Fog, to hide the far end, is parked: the PS1 material has
  none, and adding it would change the approved look.)

## Its sounds
A building's sounds that belong to the house, not the room, use their own owner
(`soundsFor('house:<name>')`), so they carry on while its room is put away; leaving the page stops
them. Music a room plays is only heard inside that room, so music meant for outside needs
`line('music', { everywhere: true })`, which is heard everywhere (`docs/clubhouse/sound/system.md`).

## When it's built
The buildings you can see from the gate as you start (ahead of you there) are built before the first
picture; the rest of the buildings outside straight after it, first in line, wherever they are. Only
a building's room is ever put away.

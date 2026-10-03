# The hall and its landings

The hall inside the front door (`hall.js`), and which wall a door goes on. Read when changing the
hall or giving an activity a door. How the house looks: `docs/clubhouse/look/clubhouse.md`.

- Sixteen flat walls, three storeys, the spiral stairs going round twice to two landings.
- Every wall on both landings can have a door: a card's `slot` is its place in `SLOTS` (the first six
  by the first landing's stairs, taken; then the rest of the first landing; then the second
  landing). The next three free ones are boarded up with SOON on them, the rest are plain wall.
- Above the second landing the top's still being built.
- Walking: the floor under you is worked out per place (`floor(x, z, y)`: the ground, each tread,
  the bridges, the landings). A step is at most half a metre, so the railings and the landings'
  edges hold you in by themselves.
- Sadie asleep in her box, which a room can borrow: `docs/clubhouse/rooms/kit.md`.
- A card's `doorstep` puts something by its door (`docs/clubhouse/rooms/card.md`).
- Doors never move: `docs/clubhouse/rooms/card.md`.

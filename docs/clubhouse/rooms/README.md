# How a room plugs in

The contract between the clubhouse and an activity, a page per part. Read only the part your change
touches. The room checker (`tests/clubhouse/cards.mjs`) checks every card against these pages: a field
it doesn't know, a place that doesn't exist or is taken, or saves that aren't the card's own.

- `card.md`: an activity's card (`card.js`), the two kinds of activity, and its door, plot or spot
  (which never move). Read when making an activity or changing its card.
- `kit.md`: the building kit the clubhouse hands a room, and what it's lent of the hall, the outside
  and its door. Read when a room needs something from the clubhouse.
- `place.md`: the place a room hands back (`scene`, `update`, `putAway`, `busy`, `watch`...). Read
  when changing how a room behaves as a place.
- `controls.md`: the ways of playing: a game (`play`), an instrument, a thing you use (`act`),
  painting (`brush`). Read when changing how you play something.
- `saves.md`: saving through the save director. Read when a room saves anything.
- `adding.md`: the files a new activity needs. Read when adding one.

A building outside is a room too, with a house of its own: `docs/clubhouse/outside/buildings.md`.

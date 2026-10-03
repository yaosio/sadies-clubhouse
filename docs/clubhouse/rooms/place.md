# The place a room hands back

What `buildRoom(kit)` returns, and what the clubhouse does with it every frame. Read when changing
how a room behaves as a place. How you play things in it: `controls.md`.

## What it hands back
Like any room:
- `name`, `scene`, `floor`, `doors`, `faces` (things that turn to face you), `uses` (things to use,
  `controls.md`), `light`, `spots` (places to stand).
- `update(t, dt)`: called every frame, wherever you are (so a room can move things it let loose in
  the hall).
- `hush`: if the main theme should stay out of it altogether (`docs/clubhouse/sound/main-theme.md`;
  music of its own usually doesn't need it).
- `putAway()`: if it has anything to take back when the clubhouse puts it away (anything it put in
  other places, a save to write, something on the page). Its sounds are stopped for it.
- `busy()`: if it mustn't be put away just now, like mid-game.
- `scenes`: if it has more than one.
- `speed` (how fast you get about in it, metres a second) and `far` (how far you can see).
- `sky`: if it's out of doors (`docs/clubhouse/outside/weather.md`).

## Changing as it goes
- It can change its own `scene`, `floor`, `faces`, `uses` and `light` whenever it likes: the
  clubhouse reads them every frame (a room can become a whole different place that way, quicker to
  get about and seeing further).
- `holding`: it holds its door open (the doorway, while something goes out through it).
- `watch`: a point everyone in it watches. Your view follows it and you can't walk or look away
  until it's null again (the thumb stick hides meanwhile). A `watch` can also say `at` (`x`, `z`,
  and `y`, where you stand): you're eased there, or put there at once with `snap` (strapping you
  into a seat).

## When a room goes wrong
One place's mistake doesn't stop the game: if a place's `update` (or `putAway`) throws, it's said once
in the console and the game carries on without it that frame. A room that fails to build has what it
started taken away (sounds, boxes on the page, test hooks, what it made), so the retry doesn't pile a
copy on top.

## Being put away and built again
A room far from you is put away and built again from its save as you come back
(`docs/clubhouse/world/building-rooms.md`). So a new room must be able to be put away, and must look
the same built again from its save. Its sounds are stopped for it, everything it made goes back to
the graphics card, and its `putAway()` takes back what it put anywhere else.

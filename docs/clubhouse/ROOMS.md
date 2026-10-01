# How a room plugs in

The full contract between the mansion and an activity: its card, the building kit the mansion
hands a room, the place a room hands back, and the ways of playing. The short overview is
`ARCHITECTURE.md`; read this page when you're making or changing an activity's room or card. The
room checker (`tests/clubhouse/cards.mjs`) checks every card against what this page says: a field
it doesn't know, a place that doesn't exist or is taken, or saves that aren't the card's own.

- **An activity** is a folder in `src/activities/` with a `card.js`: its `id` (the folder name),
  `name`, `page` (its HTML, from `page.html`), `styles` (its CSS, from `styles.css`), `start()`,
  which loads the rest of it, and for the mansion `box` (`front`, a picture: on its computer's
  screen and its poster; `side`, a colour: its room's walls), `door` (a picture: its door on the
  landing, from `door.js`, drawn by `art/clubhouse/pictures.py`; the back of the door is the same
  with the sign painted over; without one it gets a plain door with its name), and `keeps` if it
  saves anything (the start of its storage keys, for the pause menu's start-over buttons).
  None of an activity's code runs until `start()` is called (the build keeps it waiting), so its modules can look up its page's elements as they load.
- **A game that lives in its room** (Brickbuster '96, the Music Room, the aquarium, Space Adventure, Clyde's House, Chooter's Paint Shop, the Hedge Maze) has no page, styles or `start()`: its card
  has `room` instead, which loads its module; the mansion calls that module's `buildRoom(kit)` when
  it opens, handing it the building kit (its textures `T`, the palette `C`, `psx`, `keep`, `tex`,
  `words`, `picture`, `loadImage`, `breathe` (a pause between big parts), `saves` (its save box, below), the shapes `kit`, `wallGeometry`, `doorway`, the card and its
  door's leaf), so the game still never imports the clubhouse (it imports `three` itself). It hands
  back a place like any room (`name`, `scene`, `floor`, `doors`, `faces`, `uses`, `light`, `spots`,
  `update(t, dt)`, `hush` if the main theme should stay out of it altogether (see below; music of its own usually doesn't need it), and `putAway()` if it has anything to take back when the mansion puts it away (anything it put in other places, a save to write, something on the page; its sounds are stopped for it);
  `busy()` if it mustn't be put away just now, like mid-game; and `scenes` if it has more than one), where a use with `play` is the game: `view` (the middle, facing way, width and
  height the screen has to fit), `start()` (called during the press, so sound is allowed),
  `stop()`, `steer(v, dt)` (held keys, -1 to 1) and `nudge(metres)` (the mouse or a finger, already
  turned into metres across the game), and `over` (set when the game ends: the mansion steps you
  back). An instrument (the Music Room's) instead has `key(code, down, repeat)`, which gets every
  key (it returns true for the ones it used; only Esc steps back then, W and S are notes), and
  `touch(id, ray, 'down' | 'move' | 'up')`, every press on the screen as a line out into the room
  (`origin`, `dir`) for it to find what's under it; its `view` can say `down` (how far, in radians,
  to look down on it: a keyboard lying flat), and `hint` (`keys`, `touch`) is what the hint at the
  top says while you play it. A use with `act` instead of `play` just does something when you press
  E (turning a dial or a sign): its `label` can change, and `button` names it on a phone. `act` is
  handed `{ from, EYE, glide }`: where you stand, and `glide(to, secs, then)`, which eases your view
  to `to` (`x`, `z`, `eye`, `yaw`, `pitch`) and then calls `then`; once a `then` doesn't glide on,
  you have the controls back (the aquarium's tap on the glass, rising over the rim and sinking into
  the water; a `to` with `y` also sets where you stand once there). A place can also say `speed` (how
  fast you get about in it, metres a second) and `far` (how far you can see), and change its own
  `scene`, `floor`, `faces`, `uses` and `light` whenever it likes: the mansion reads them every frame
  (the aquarium's room becomes the ocean that way, and is quicker to get about and see further in). Its place can hold its door open (`holding`: the doorway, while something goes out through
  it), and make everyone in it watch something (`watch`: a point; your view follows it and you
  can't walk or look away until it's null again: Brickbuster's escaping yarn ball; the thumb stick hides meanwhile). A `watch` can also
  say `at` (`x`, `z`, and `y`, where you stand: you're eased there, or put there at once with `snap`): Space Adventure straps
  you into its pilot's seat that way. The kit's `paused()` says whether the pause menu is up (a place keeps updating while it is). The kit also has its door's picture (`doorImage`) and its door on the landing
  (`landingDoor`, whose `paint(texture)` puts a new picture on its front: Brickbuster's OUT OF
  ORDER sign) and the hall itself (`hall`: its scene and `faces`, `napping`, Sadie asleep in her
  box, and `shape`, its solid shape for things bouncing round it), so a game can let something
  loose in the hall (Brickbuster's yarn ball, and Sadie chasing it: its room's `update` moves them,
  since every place updates every frame), and `ears()`, where you are right now (`place`, `x`, `y`, `z`: your eye, and `yaw`, `pitch`: where you're looking), so a
  game can play a sound only where you'd hear it (Sadie out in the hall), and `outside` (where outside
  is seen from: you, out there, or the door you're looking out of; null when it can't be seen: the
  weather works out its rain and snow only then, round that spot). Both `ears()` and `paused()` work
  while a room's still being built. An address naming it after the `#` just opens the mansion.
- **A place you paint** (Chooter's Paint Shop) has a `brush(id, ray, 'down' | 'move' | 'up')`: you
  walk about as normal, and pressing paints the place itself. With the mouse locked, holding its
  button presses where the dot in the middle of the view is (`#aim`, shown only then); on a phone or
  with the mouse free, the LOOK | PAINT switch (`#paint`) says whether pressing looks around or paints
  where you press (the thumb stick still walks; it goes back to LOOK when you leave or pause, and to
  PAINT when you pick something up). The YOU'RE HOLDING box (`#holding`) shows what you're holding
  and how to use it right now. The place
  gets each press as a line out into it (`origin`, `dir`) when it goes down, every frame while it's
  held (so walking or turning while you hold it paints a stroke), and when it lets go, and says what
  you're holding with `brushLook()`: `{ color` (the switch, dot and pointer), `tool` (its name),
  `icon` (a little picture), `paint` (its name, or none), `verb` (PAINT, STAMP...), `drags` (whether
  dragging paints a line), `picks }` (a count that goes up each time something's picked up). What it does with the line is its own business (the shop's `surfaces.js`).
- **A building outside the gate** (Clyde's House, Chooter's Paint Shop) is a game that lives in its room whose card has
  `lot` instead of `slot`: which plot along the lane outside the front gate is its (`LOTS` in
  `outside.js`: 0 is left of the path as you go out, 1 across from it, then further along each way;
  the next free one has a COMING SOON stake). The kit handed to its `buildRoom` also has `outside`
  (the outside place: its `scene` and `faces` to add to, and `block(x0, x1, z0, z1)` and
  `blockRound(x, z, r)` for what's solid) and `lot` (its plot: `x`, `z`, the middle of the front
  door's threshold; the house faces the gate). It builds the house into the outside's scene
  itself, and hands back, with its place, `house` (`door`: its front door, a `doorway` in the
  outside's scene, facing the gate), which the mansion joins to the room's own `doors.door`. Its
  place's `update` runs every frame wherever you are, so it animates the outside too. It can also
  put things to use in the outside's `uses` (Clyde's weather levers) and set the outside's
  `light` (the weather: the mansion reads it every frame); one that does says `weather: true` on
  its card, so it's built before the first picture wherever you start. Nothing on the
  landing changes (the hall skips cards with a `lot`).
- **A building in the grounds** (the Hedge Maze) is the same, but beside the house rather than on
  the lane: its card has `grounds` instead of `lot`, which spot in the grounds is its (`GROUNDS` in
  `outside.js`, each with its middle `x`, `z` and its room, `w` across and `d` deep; 0 is beside the
  house on the left, from the front garden to the backyard). Its kit has `ground` (that spot) instead
  of `lot`, `skyMat` (the outside's sky, for a room that's out of doors) and `snapshot(obj, place,
  { from, at, fov, w, h })`, which takes a picture of one thing in a place, once, with everything
  else see-through (the outside's `house` is the house itself, in a group of its own, so the maze
  can show it over its hedges and it's never out of date). A building can have more
  than one way in: its `house` can hand back `doors` (`{ door, back }`), each joined to the room's
  own door of that name (the outside's names for them: its card's id, and `<id>.back`). A doorway can
  move (`moveTo(pos, yaw)`): the maze's door to the backyard is always wherever its end is.
- **Doors never move.** Each card says which door on the landing is its (`slot`: 0 is the first
  one up the stairs; Brickbuster 0, Dropper World 1, TypeFitter 2, the Music Room 3, the aquarium 4, Space Adventure 5), so a new activity never
  shuffles the others (folder order used to decide, and adding Brickbuster moved two doors). A new
  activity takes the next free slot (the Music Room 3). A card's `doorstep: 'dirt'` puts the mole's dirt pile by its
  door (Dropper World).

- **Saves** go through the save director (`src/shared/storage.js`), the one thing that touches the
  browser's storage. A room saves with its kit's box, `m.saves`: `get(name, fallback)`,
  `set(name, value)`, `remove(name)`, each kept as `sadies-clubhouse.<id>.<name>` (a room never
  touches storage itself; the room checker fails it). An activity on a computer uses
  `saveBox('<id>')` from the toolbox (Dropper World's older keys, `sadies-dropper-world.save` and
  a few starting `jellystack.`, use `store`). Its card's `keeps` lists what its keys start with
  (the pause menu's start-over buttons and backups use it). The mansion's own keys start with `mansion.`.
  A save that can't be read is **put aside, never wiped**: `get` keeps it as `<its key>.unreadable`
  and hands back the fallback, and an activity that can't make sense of an old save calls
  `putAside(name)` before starting fresh. When a save's shape changes, read the old one and turn it
  into the new (never throw away someone's progress). The pause menu's YOUR SAVES says how full the
  browser's room for saves (about 5 MB for everything) is, warns when it's nearly full or a save
  didn't fit, and saves or loads a backup file of every save (loading asks first, and is all or
  nothing). The mansion's checks put every room away and build it again three times over, and fail
  if any save changed. Never rename a key that's already in use: everyone's saves would be lost.

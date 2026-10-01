# How a room plugs in

The full contract between the mansion and an activity: its card, the building kit the mansion
hands a room, the place a room hands back, and the ways of playing (each a file of its own in
`src/clubhouse/play/`: `arcade.js` for a use with `play`, `paint.js` for a `brush`; a new kind of
control goes there as something any place can use, never in `mansion.js` or a room). The short overview is
`ARCHITECTURE.md`; read this page when you're making or changing an activity's room or card. The
room checker (`tests/clubhouse/cards.mjs`) checks every card against what this page says: a field
it doesn't know, a place that doesn't exist or is taken, or saves that aren't the card's own.

- **An activity** is a folder in `src/activities/` with a `card.js`: its `id` (the folder name),
  `name`, where it is (one of `slot`: a door on the landings; `lot`: a plot on the lane; `grounds`: a
  spot in the grounds), `keeps` if it saves anything (the start of its save keys, for the pause
  menu's start-over buttons and backups), and either `room` (a game that lives in its room, below)
  or `page` (its HTML, from `page.html`), `styles` (its CSS, from `styles.css`) and `start()`, which
  loads the rest of it (an activity on a computer). For a door on the landings: `door` (a picture,
  from `door.js`, drawn by `art/clubhouse/pictures.py`; the back of the door is the same with the
  sign painted over; without one it gets a plain door with its name), `box` (`front`, a picture: on
  its computer's screen and its poster; `side`, a colour: the plain computer room's walls, and the
  plain door's) and `doorstep` (below). A building outside can say `weather` (`OUTSIDE.md`).
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
- **A building outside** (Clyde's House and Chooter's Paint Shop on the lane, the Hedge Maze in the
  grounds) is a game that lives in its room whose card has `lot` or `grounds` instead of `slot`.
  Its kit has the outside to build its house into, and it hands back a `house` too: `OUTSIDE.md`.
- **Doors never move.** Each card says which door on the landings is its (`slot`, its place in
  `SLOTS`: 0 is the first one up the stairs; Brickbuster 0, Dropper World 1, TypeFitter 2, the Music
  Room 3, the aquarium 4, Space Adventure 5; 6 is the next, still on the first landing), so a new
  activity never shuffles the others (folder order used to decide, and adding Brickbuster moved two
  doors). A new activity takes the next free slot. Every door, plot and spot is written down in
  `tests/clubhouse/spots.json`, and the room checker fails if one moves; a new one goes on the end of
  its list, there and in the code. Doors don't have to be in sensible places: a new kind of spot
  (halfway up the scratching post, on the ceiling, in another room) is welcome, as a new list. A card's `doorstep: 'dirt'` puts the mole's dirt pile by its
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

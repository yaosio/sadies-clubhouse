# How Brickbuster is built

Which code file does what (in `src/activities/brickbuster/`), and being put away. Read before
changing the code. Its sounds and music are in `sounds.md`, its checks in `checks.md`.

## Files

- **`card.js`**: its card: no page and no `start()`, just `room` (loads `room.js`) and `door`.
  `keeps` its save for the pause menu's start-over button.
- **`game.js`**: the game with no screen, in metres (the glass 4.2 x 6.6): the ball, the paddle, 8
  rows of 10 bricks, the cracks, the score, the heap (`pile`: the rows of the bricks on the floor,
  in the order they fell) and whether it's broken (and how); `step()` returns what happened (for
  the sounds and faces; a brick's event says its spot on the heap; `break` says why and which
  bricks spilled). What's kept between visits (`save`, `load`).
- **`room.js`**: the room (10 x 13 m, 11 m tall, arcade carpet, the QUIET!! poster by the door,
  Sadie on her box), the case (zigzag 90s plastic, a copper-bar marquee with the score, FREE PLAY /
  NO COINS stickers), the glass (a glint, and the cracks drawn on a see-through picture from each
  crack's seed: `crackLines`), the bricks (bits fall down inside when knocked out), the yarn ball
  and the paddle (an extruded rounded slab, its face a 32 x 10 picture per mood and gaze, plus sad
  and sighing). The heap (`pileSlots`: 80 spots, a layer at a time, nearest the hatch first;
  `heapZone`: where nobody walks), things flying on arcs to it, the break (`smash`), the yarn
  ball's way out (a list of hops, each with its noise), Sadie's run, and the OUT OF ORDER sign
  (`outOfOrder`, painted on the landing's side of the door). Hands the clubhouse its place (with
  `holding`, the door held open while they go out) and the `play` on the case (`over` once it's
  broken). `window.__brickbuster` for the checks (`knockOut` fills the heap without playing).
- **`loose.js`**: the yarn ball loose in the hall, and Sadie chasing it, with no screen (the tests
  run it): bouncing with gravity off the hall's solid shape (which the hall hands over: its walls,
  post, landing and railing, stair treads and furniture), stopping, Sadie's leaps and whacks,
  popping it back if it's ever wedged. `stepLoose` says what happened (`pounce`, `whack`,
  `mighty`, `pop`), for her sounds. `room.js` draws them in the hall (lent by the clubhouse, see
  `docs/clubhouse/rooms/kit.md`, and Sadie borrowed from her box in it), and plays her sounds when
  you're in the hall (the clubhouse's `ears`: where you are).
- **`door.js`, `poster.js`**: its door on the landing (an arcade marquee, bricks, the yarn ball)
  and Sadie's QUIET!! poster (a speaker crossed out, her underneath with cross eyebrows). Drawn by
  `art/clubhouse/pictures.py`.

## Put away when you're far off

The clubhouse puts the room away when you've been three doors or more from it for a while (see
`docs/clubhouse/world/building-rooms.md`), but never mid-game or while the ball's getting out
(`busy()`, see `docs/clubhouse/rooms/place.md`). `putAway()` saves the game, closes its sounds,
and takes the yarn ball and Sadie out of the hall; when it's built again from its save, they're
back. The OUT OF ORDER sign stays on the landing door meanwhile (it's made once, and the room built
again uses the same one), so the landing never shows the door without it.

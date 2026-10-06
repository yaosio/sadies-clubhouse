# How Cats Only is built

Which code file does what (in `src/activities/cats-only/`), what it asks of the clubhouse, its save
and being put away. Read before changing the code. Its checks are in `checks.md`.

## Files
- **`card.js`**: its card: no page and no `start()`, just `room` (loads `room.js`), `door`,
  `slot: 6` (the first landing, the wall over the front door), `box` and `keeps`
  (`sadies-clubhouse.cats-only.`, for starting over).
- **`room.js`**: the closet (shell, floor, the bed; `floor` lets you step in about half a metre and
  stops you at the bed), and everything it puts in other places: the sign and red button on the
  landing wall beside its door (put into the hall with the hall's `add`, the button as a `use` with
  an `act`), and the herd, flat Sadies drawn as one instanced picture in the hall and one in the garden (a
  runner is drawn in the other as it crosses the front door; psx's vertex shader is patched to read
  each instance's matrix), with a second instanced picture of sparkles for the puff. It works the little state machine (`idle`, `slam`, `opening`, `pour`,
  `drain`, `puff`), turns every Sadie to face you wherever you're looking from (`eyes()`), plays the meows
  and puts it all away.
- **`herd.js`**: the stampede in plain numbers, no screen (the tests read it): the ways a runner can
  take (`route`: the stairs, or the leap over the railing and a lap of the post, each worked out from
  the hall's `shape` and the two doors, so it follows the hall if the hall changes), the timing
  (`makeStampede`: when each one sets off, how fast it goes, where it is at any moment), who meows
  and when, and `across`: where a spot in one doorway comes out in another's place (the clubhouse's
  own doorway sum).
- **`sounds/`**: `meow.js` makes the eight kinds of meow (the sound system plays each at one of six pitches), the rush of them piling out and the button's thump; `index.js` names them and says
  how loud; the clubhouse's sound system plays them (`docs/clubhouse/sound/system.md`).
- **`door.js`**: the door picture, drawn by `art/cats-only/door.js` (`node tools/cats-only/pictures.mjs`).

## What it asks of the clubhouse
Nothing room-specific lives in the clubhouse: the room uses these shared parts (`docs/clubhouse/rooms/kit.md`),
which any room can use:
- `hall.front`: the front door (where it is on each side, `open()`, `hold()`, and `outside`, the
  garden beyond it to put things into).
- `landingDoor.open()` and `.yaw`: how far open its own door is, and where it faces.
- `place.shut`: a room can slam its own door shut for a moment (`docs/clubhouse/rooms/place.md`).

## Its save
One value, `armed` (the button's been pressed and the door not yet opened), through the kit's `m.saves`.

## Being put away
`busy()` says so for the whole stampede, so it's never put away mid-run. Putting it away lets go of
the front door and the closet's own door, hides every Sadie, and takes the sign, button, herd and
garden group out of the hall and the garden (`putAway`); building it again puts them back, and the
button is still pressed if it was.

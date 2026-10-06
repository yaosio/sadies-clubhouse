# Cats Only's checks

Its tests and its pictures tool. Read before changing what's checked, or when a check fails.

- **`tests/cats-only/run.mjs`**: the card and door; every way a Sadie can run (many lanes of each
  kind) ends on the front door's threshold, never goes through the scratching post or under the floor;
  the stampede is finite and in bounds at 60, 20 and 10 frames a second, some of the herd get out into
  the garden and it all ends; the whole thing is over well before the quickest walk to the front door;
  the meows are few, apart, different and one per cat; the doorway sum goes there and back; the voices
  are short and not loud.
- **`tests/cats-only/browser.mjs`**: the door opens with nothing coming out when the button wasn't
  pressed; stepping into the closet, finding there's no further to go, and stepping out; looking at the
  button (it says DO NOT PRESS) and pressing it with the real USE; opening the door sets the herd off,
  the front door swings open, a whole herd is out, they reach the garden, and it's all over and the front
  door has shut with nobody left; the player wasn't moved; the meows were few; the same with the door
  already open when the button's pressed (slam, then the herd); the closet still works after. Any page
  error is a failure.
- **`tools/cats-only/shots.mjs`**: pictures of the stampede from the landing, the ground floor and the
  garden (`dist/shots/cats-only/`). **`tools/cats-only/pictures.mjs`** draws the door.

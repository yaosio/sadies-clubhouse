# Places and doorways

How the clubhouse is made of separate places joined by doorways. Read when changing a doorway, or
how one place is seen from another.

## Places
The clubhouse is Sadie's house in crappy late-90s 3D, made with three.js (the one library, bundled
into the page), loaded only when the page opens on it. It's made of separate **places**, each its
own scene with its own floor and light:
- `outside.js`: the garden, the house's shell, the backyard behind it, and the town square outside the gate
  with its plots (`docs/clubhouse/outside/README.md`).
- `hall.js`: the entrance hall, the bottom of the cat tree (`hall.md`).
- `room.js`: the plain den with a computer, for an activity played at a computer (the others build their own room).

## Doorways
Places are joined only by **doorways** (`build.js`): a hole in a wall, two leaves that swing open,
and a shallow box behind the hole whose inside shows the other place.
- Each frame, every open doorway in front of you (the nearest three: two doors on a landing can be
  open at once, and one of them showing black was a bug) has the other place drawn into its own
  picture the size of the screen, from where you'd be if you'd already walked through. Its near
  plane is tilted to lie in the far doorway, so nothing on the near side of it shows; the box looks
  that picture up by screen position.
- Walking across a doorway moves you to the same spot on the other side, turned round.
- So there are no loading screens, a place can be any size (bigger inside than out), and changing
  one place never touches another. Only the place you're in, and what's through the doorways open in
  front of you, get drawn.
- How a doorway is drawn without flicker or jumps: `drawing.md`.

## Doors
- A door opens only when you walk up to it facing it (one at a time), and closes behind you (the one
  you just came through waits till you're out of its swing).
- Both sides of a doorway show the same real door: it swings into the place further in (`swing`), so
  it's hinged on opposite sides as seen from each side.
- Door leaves open to 80 degrees, not flat, so they stay in sight as you go through.
- A room's door stays shut until the room's built (`building-rooms.md`).

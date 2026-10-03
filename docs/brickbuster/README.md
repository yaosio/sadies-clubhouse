# Brickbuster '96

The clubhouse's third activity (`src/activities/brickbuster/`), and the first that lives in the
clubhouse itself instead of on a computer: a Breakout machine built into the far wall of a tall
arcade room, two storeys of glass. Its ball is a ball of yarn, its paddle is a chunky plastic
character with a face, and Sadie sits on a box beside it watching the ball. Crack the glass three
times and it shatters, and the yarn ball escapes into the hall for good.

## Design pillars (the owner's rules; these win over any feature idea)

- It's in the room, not on a separate screen. The room is tall because the game is.
- Missing isn't losing: the ball cracks the glass. Three cracks at the top (playing too well) or at
  the bottom (too badly) and it breaks. Either way, you broke it.
- The cracks are loud, crunchy and wonderfully 90s. Once the ball is out, it's silent (the poster
  explains why; and the owner has misophonia, so nothing out there ever makes a constant noise).
- Sadie's sounds are rare and soft: never close together, never the same twice running, never
  louder than a crack, fading with distance. Anything new that repeats gets the same treatment.
- The ball is Sadie's ball of yarn; the paddle is a character (a real 3D paddle, not a flat
  picture), happy, focused, nervous, wincing, and sad once it's broken.
- The escaped ball never gets in your way.
- Once broken, it stays broken (until the pause menu starts Brickbuster, or everything, over).
- No loose strand of yarn trailing from the ball (the owner said no need).

## Its pages

- `playing.md`: stepping up, the controls, the cracks, the heap of bricks and the arcade music;
  read before changing how the game plays or feels.
- `the-break.md`: the glass shattering, the yarn ball's escape and the room left OUT OF ORDER; read
  before changing the break.
- `the-hall.md`: the yarn ball loose in the hall, Sadie chasing it and her sounds; read before
  changing the ball or Sadie out there.
- `numbers.md`: sizes, speeds, the heap, the loose ball, Sadie's sounds and what the tests expect;
  read before changing any of them.
- `how-built.md`: which code file does what, and being put away; read before changing the code.
- `sounds.md`: how its sounds and arcade music are made and played; read before changing or adding
  a sound.
- `checks.md`: its tests and picture tool; read before changing what's checked.
- `history.md`: the five steps it was built in. Only read before undoing a choice.
- `parked.md`: parked ideas.

# The Music Room

The clubhouse's fourth room (`src/activities/music-room/`), and like Brickbuster '96 it lives in
the clubhouse itself instead of on a computer: a room full of instruments you play right where they
stand. Sadie is in it as herself: she naps on her cushion by the piano, and now and then she gets
up and walks across one of the instruments, and it sounds exactly like a cat walking on it.

## Design pillars (the owner's rules; these win over any feature idea)

- **It's a fun place to play instruments that exist in the 3D world.** No computer, no screen of
  its own: you step up to an instrument and play it there.
- **Sadie walks on them sometimes, and it sounds just like a cat walking on them.** A few slow,
  clumsy notes, a paw or two at a time, never the same walk twice.
- **Kind to the ears** (`docs/clubhouse/RULEBOOK.md` section 4). Nothing plays by itself for long and nothing
  repeats on its own: holding a key plays it once, the tape only loops if you press LOOP (and stops
  when you leave), Sadie's walks are rare and soft, and the wind chimes only sound when you walk
  under them, then rest. Every sound is soft, starts without a click and fades right away. A
  volume dial on the wall (it has OFF), and a sign on the door that keeps Sadie off them.
- **The tape deck's LOOP may repeat a take for as long as you leave it on.** The owner decided
  this on 2026-10-02: a loop you choose to switch on
  (`docs/clubhouse/RULEBOOK.md` section 4).
- **Sounds stay modular:** one small file per instrument in `sounds/`, never one giant sound file.

## Its pages

- `playing.md`: every instrument, the tape deck, the dial, the sign and the chimes, and stepping up
  to play; read before changing an instrument or how you play it.
- `sadie.md`: when and how Sadie walks across the instruments, and when she won't; read before
  changing what she does.
- `how-built.md`: which code file does what, the main theme, its saves, being put away and its
  checks; read before changing the code.
- `history.md`: when it was asked for, and the approved mock-up. Only read before undoing a choice.
- `parked.md`: parked ideas.

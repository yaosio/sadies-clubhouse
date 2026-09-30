# The Music Room

The clubhouse's fourth room (`src/activities/music-room/`), and like Brickbuster '96 it lives in
the mansion itself instead of on a computer: a room full of instruments you play right where they
stand. Sadie is in it as herself: she naps on her cushion by the piano, and now and then she gets
up and walks across one of the instruments, and it sounds exactly like a cat walking on it. The
owner asked for it on 2026-09-30, after okaying the mock-up (`art/music-room/`, published at
https://claude.ai/artifact/1d2eB5kFC121fqX8Akez7K).

## Design pillars (the owner's rules; these win over any feature idea)

- **It's a fun place to play instruments that exist in the 3D world.** No computer, no screen of
  its own: you step up to an instrument and play it there.
- **Sadie walks on them sometimes, and it sounds just like a cat walking on them.** A few slow,
  clumsy notes, a paw or two at a time, never the same walk twice.
- **Kind to the ears** (the owner has misophonia). Nothing plays by itself for long and nothing
  repeats on its own: holding a key plays it once, the tape only loops if you press LOOP (and stops
  when you leave), Sadie's walks are rare and soft, and the wind chimes only sound when you walk
  under them, then rest. Every sound is soft, starts without a click and fades right away. A
  volume dial on the wall (it has OFF), and a sign on the door that keeps Sadie off them.
- **Sounds stay modular:** one small file per instrument in `sounds/`, never one giant sound file.

## In the room

The door is the fourth on the landing (`slot` 3: teal, a sign with piano keys on it, notes floating
off it). Inside, teal wallpaper with music notes and fish bones in it:

- **The toy piano** (TINKLE-TONE JR., pink, clawed): ten white keys and seven black ones, each with
  a sticker saying which computer key plays it (A to ; and W E T Y U O P). The pink **?** key is
  out of tune (sharp, and it wobbles: Sadie's favourite), one key has a bite out of it. The
  songbook says FEED ME NOW.
- **The drum kit**, really Sadie's bed: a blanket stuffed in the bass drum, fur all over the snare,
  so everything's muffled and soft. A S D F G H and Space.
- **The xylophone**, its bars fish, its mallets pom-poms: A to K. Slide a finger across it for a
  run up the fish.
- **The KEYCAT 3000**, a cheap 90s keyboard laid out like the piano: 1 to 4 pick its sound (CAT, a
  tiny mew; BIRD, a chirp; BELL, a doorbell's ding; CAN, a plinked tin can), 0 is DEMO: three notes,
  then the screen says FULL VER. 1997!
- **The theremin** by the left wall: it sings only while you hold it (the mouse or a finger:
  across for the pitch, higher on the screen for louder; or hold a key), and stops when you let go.
- **The TAPE-O-MATIC** on its table: REC (R), PLAY (P), STOP (S), LOOP (L), and T (or tapping the
  cassette beside it) swaps tapes. Your tape (MY SONG) holds what you record on any instrument, up
  to a minute, starting from your first note; the other one, SADIE LIVE!, always holds her last
  walk. REC always records on yours. (The theremin doesn't go on tape.)
- **The volume dial** on the back wall: E turns it SOFT, MEDIUM, LOUD, OFF (it starts on MEDIUM).
- **The sign by the door**: E turns it between SADIE WELCOME and SHH, SADIE NAPPING.
- **The wind chimes** by the window: walk under them and they chime a few soft notes, then not
  again for 25 seconds.
- The band poster (SADIE & THE PAWS, LIVE! 1 NITE ONLY 1996) and a mirror ball, turning slowly.

Stepping up to an instrument (E, or PLAY on a phone) eases the view in until it fills the screen,
looking down on it (like the Brickbuster case, but from above). Then every key goes to it (W and S
are notes here, not steps), and every press on the screen plays what's under it. Esc (STEP BACK on
a phone) steps back.

## Sadie

Most of the time she's on her cushion by the piano, blinking now and then. Only while you're in the
room: the first time a minute or so after you come in, then every three to six minutes, she hops up
onto one instrument (the piano most, then the drums, the xylophone, the synth; never the one
you're playing, and not the same one twice running if she can help it) and walks across it once:
4 to 6 slow steps, a paw on a key or two at a time (her back paws come down heavier), a different
walk every time. Then she sits on the end (one last low note) or, now and then, lies down on it (one
soft chord) and naps there a while. On the drums she ends up curled on the bass drum. Then back to
her cushion, and she leaves them alone for a long time. Her walk goes on the SADIE LIVE! tape.

If you step up to the instrument she's on, she hops straight off without a sound. If the sign says
SHH, she goes and sits beside one instead, silently, offended, then goes back to her cushion.

## How it's built

| File | What it does |
|---|---|
| `card.js` | Its card: no page and no `start()`, just `room` (loads `room.js`), `door`, `slot` 3, `keeps`. |
| `room.js` | The room (12 x 10 m, 4.6 m tall), every instrument, Sadie drawn where `sadie.js` has her, the notes floating up off whatever's played, the chimes, the dial and the sign. Hands the mansion its place: a `play` on each instrument (`view` with `down`, looking down on it; `key` and `touch`, see `docs/clubhouse/ARCHITECTURE.md`) and an `act` on the dial and the sign. `window.__musicRoom` for the checks (`sadieNow` sends her off). |
| `art.js` | Its pictures, drawn when it opens (from the mock-up), and the ones drawn again as things change: the lit keys, the synth's screen, the tape deck's buttons and reels, the dial, the sign. |
| `layout.js` | Which computer key plays what, and which key is where on the keyboards' picture (for presses). |
| `sadie.js` | Sadie, with no screen (the tests run it): when she goes, where, her steps and notes, napping, sulking, hopping off. `FAVOURITES` and `TIMING` are her numbers. |
| `tape.js` | The tape deck, with no screen: recording, playing, looping, the two tapes, what's saved. |
| `sounds/` | One file per instrument (`piano.js`, `drums.js`, `xylophone.js`, `synth.js`, `chimes.js`), all made in code as 8-bit 11 kHz samples with the kit in `retro.js` (gentle: soft starts, clean fades, a whisper of echo); `player.js` plays them through the volume dial, and makes the theremin's voice (it can't be a sample: it slides while you hold it); `index.js` names them all and how loud each is. A new instrument gets its own file and a line in `index.js`. (Brickbuster has its own copy of this kit: activities never share files. Once a third room wants sound, `retro.js` and `player.js` could move to the toolbox.) |
| `door.js` | Its door on the landing. Drawn by `art/clubhouse/pictures.py`. |
| `tests/music-room/run.mjs` | Headless: every sound (8-bit, soft, no click, fading to nothing), which key plays what, three hours of Sadie (how often, how many notes, never on what you're playing, never while SHH or while you're out), the tape deck. A few seconds. |
| `tests/music-room/browser.mjs` | Phone and desktop: through its door, the piano (keys, a tap), the drums, the synth's sounds and demo, the theremin (only while held), recording and playing back a tune, the sign and Sadie sulking, Sadie across the piano (and on her tape), her hopping off the xylophone, the dial, the chimes, kept after a reload. |

Saves (`sadies-clubhouse.music-room.`): `tape` (both tapes, and which is in), `sign`, `volume`.

## Parked ideas

- A tiny audience: Sadie's friends from the other rooms on a bench, reacting to a whole song.
- A songbook you can follow, lighting up the next key ("Feed Me Now", "Where Is My Yarn").
- The yarn ball from the hall rolling in now and then and bonking a drum (only if the owner wants).
- The door humming one soft note the first time you pass it.

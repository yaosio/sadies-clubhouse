# Brickbuster '96

The clubhouse's third activity (`src/activities/brickbuster/`), and the first that lives in the
mansion itself instead of on a computer: a Breakout machine built into the far wall of a tall arcade
room, two storeys of glass. Its ball is a ball of yarn, its paddle is a chunky plastic character
with a face, and Sadie sits on a box beside it watching the ball. It's being built in steps (the
owner's plan, 2026-09-29):

1. **The room and the game (built).** The tall room, the case, the paddle and its faces, the
   controls, the cracks and the 90s sounds.
2. **The break (next).** The third crack at the top or the bottom shatters all the glass at once
   (a big cheesy shatter): every brick tumbles out onto the floor in a heap, the paddle drops to
   the floor, and the yarn ball flies out and bounces round the room a few times, loudly, until it
   smacks into Sadie's QUIET!! poster (a sad little squeak, a speaker being muted) and never makes a
   sound again. It bumps the door open and bounces out into the hall; Sadie bolts after it. The door
   gets Sadie's OUT OF ORDER sign (crooked, scrawled, a paw print). Inside, the bricks stay heaped on
   the floor, the case is empty, and the paddle lies in the rubble looking sad, sighing now and then.
   Broken for good: only the test version's pause menu can fix it (the glass, the bricks, the
   paddle, the ball back in its case, the sign off the door).
3. **Out in the hall (after that).** The yarn ball bounces round the hall silently, forever, off the
   stairs, the landings and the railings, and goes straight through you. It can't get into any
   room (doors just bounce it back). Whenever it slows down, Sadie catches up and whacks it again,
   so she's always somewhere in the house chasing it. If it ever wedged itself somewhere, it quietly
   pops back into the hall.

## Design pillars (the owner's rules; these win over any feature idea)

- It's in the room, not on a separate screen. The room is tall because the game is.
- Missing isn't losing: the ball cracks the glass. Three cracks at the top (playing too well) or at
  the bottom (too badly) and it breaks. Either way, you broke it.
- The cracks are loud, crunchy and wonderfully 90s. Once the ball is out, it's silent (the poster
  explains why).
- The ball is Sadie's ball of yarn; the paddle is a character (a real 3D paddle, not a flat
  picture), happy, focused, nervous, wincing, and sad once it's broken.
- The escaped ball never gets in your way.
- Once broken, it stays broken (only the test version can fix it).
- No loose strand of yarn trailing from the ball (the owner said no need).

## Playing it

Look at the case and press E (PLAY on a phone): your view eases back (and a little below) until the
whole glass and the marquee fit the screen, square on. Then A/D or the arrows (or just moving the
mouse) move the paddle; on a phone, sliding a finger anywhere moves it exactly as far as the finger
goes. Esc, W or S (STEP BACK on a phone) eases you back to where you stood, and the game waits, the
ball hanging where it was. The ball starts on the paddle and is sent off by itself after a moment.

## How it's built

| File | What it does |
|---|---|
| `card.js` | Its card: no page and no `start()`, just `room` (loads `room.js`) and `door`. `keeps` its save for the test version's start-over button. |
| `game.js` | The game with no screen, in metres (the glass 4.2 x 6.6): the ball, the paddle, 8 rows of 10 bricks, the cracks, the score; `step()` returns what happened (for the sounds and faces). What's kept between visits (`save`, `load`). |
| `sound.js` | Every sound, made in code as 8-bit 11 kHz samples (each held 4 times over at 44.1 kHz, so no smoothing): the three cracks (a snap, a thump, crackle bursts, glass pings, a slapback echo; the third a long crash), the paddle's BOING, brick blips (higher rows higher), the case's tock and the tink of glass that can't crack any more. `makePlayer()` plays them, made when you step up (a press, so the browser allows sound). |
| `room.js` | The room (10 x 13 m, 11 m tall, arcade carpet, the QUIET!! poster by the door, Sadie on her box), the case (zigzag 90s plastic, a copper-bar marquee with the score, FREE PLAY / NO COINS stickers), the glass (a glint, and the cracks drawn on a see-through picture from each crack's seed: `crackLines`), the bricks (bits fall down inside when knocked out), the yarn ball and the paddle (an extruded rounded slab, its face a 32 x 10 picture per mood and gaze). Hands the mansion its place and the `play` on the case. `window.__brickbuster` for the checks. |
| `door.js`, `poster.js` | Its door on the landing (an arcade marquee, bricks, the yarn ball) and Sadie's QUIET!! poster (a speaker crossed out, her underneath with cross eyebrows). Drawn by `art/clubhouse/pictures.py`. |
| `tests/brickbuster/run.mjs` | Headless: pretend players for two hours of play (the ball never leaves the glass or gets stuck sideways), the paddle's angles, missing cracks the bottom three times and no more, good play cracks the top three times, bricks, saves, the sounds (8-bit, never silent, each crack bigger), the cracks' drawing. About 20 seconds. |
| `tests/brickbuster/browser.mjs` | Phone and desktop: through its door, stepping up, the paddle by keys, mouse and finger, a crack (sound and wince), stepping back (the game waits), the crack kept after a reload, starting over in the test version. |
| `tools/brickbuster/shots.mjs` | Pictures of the room and the game from the built page: `dist/shots/brickbuster/`. |

## Numbers

- **The glass**: 4.2 m wide, 6.6 m tall, its bottom 1.4 m off the floor. The ball's radius 0.16 m;
  the paddle 1.3 x 0.46 m, its middle 0.7 m up. Bricks 0.4 x 0.24 m (with gaps), 8 rows of 10, the
  top row's top edge 1.25 m under the top of the glass (the gap you break through into).
- **Speed**: 4.2 m/s at the start, 0.04 faster per brick, never over 6.4. The paddle sends it up to
  60 degrees off straight up (at its very ends); the keys move the paddle 6 m/s.
- **Cracks**: 3 at the top or 3 at the bottom. The ball rattles about above the bricks once it's
  through, so after a crack at the top the next one waits until the ball's been back to the paddle.
- **Points**: 80 for the top row down to 10 for the bottom one.
- **What the tests expect**: a pretend player that never misses and aims for gaps gets three top
  cracks in about a minute (0.8 to 1.1 minutes over five games; never under half a minute), a real
  person takes a good few minutes. Leaving the paddle alone cracks the bottom within seconds.

## Parked ideas

- A loose strand of yarn trailing from the ball (the owner: not needed).
- A name for the paddle ("Paddy"?): the owner hasn't said.

# Brickbuster '96

The clubhouse's third activity (`src/activities/brickbuster/`), and the first that lives in the
mansion itself instead of on a computer: a Breakout machine built into the far wall of a tall arcade
room, two storeys of glass. Its ball is a ball of yarn, its paddle is a chunky plastic character
with a face, and Sadie sits on a box beside it watching the ball. It's being built in steps (the
owner's plan, 2026-09-29):

1. **The room and the game (built).** The tall room, the case, the paddle and its faces, the
   controls, the cracks and the 90s sounds. Every knocked-out brick falls down inside the glass,
   into the BRICK RETURN slot and out of the hatch at the foot of the machine onto a heap on the
   floor (along the front of the machine and down its right side, where nobody walks), so a player
   who clears them all has all 80 in the room.
2. **The break (built).** The third crack at the top or the bottom, or knocking out the very last
   brick (so it always breaks in the end), shatters all the glass at once (a big cheesy shatter,
   glass flying): the bricks left tumble out onto the heap, the paddle drops out into the rubble,
   and you're stepped back to watch, to a corner well away from its way out and the door (wherever
   you'd started playing from), on the floor: your view follows the yarn ball (no walking or looking away) until it's
   out of the room. The yarn ball bounces round the room a few times, loudly
   (floor, wall, floor, high on the wall, floor), until it smacks into Sadie's QUIET!! poster (a squeak,
   cut off like a speaker being switched off) and never makes a sound again. The door opens for it
   and it bounces out; Sadie jumps off her box and bolts after it. The door shuts and its landing
   side has Sadie's OUT OF ORDER sign (cardboard, crooked, taped on, wobbly marker, a paw print).
   Inside, the glass is gone but for a jagged edge, there's glitter all over the floor, the marquee
   says OUT OF ORDER, the case doesn't offer to play, and the paddle lies on the heap looking sad,
   sighing now and then. Broken for good: only the test version's pause menu can fix it (the
   glass, the bricks, the paddle, the ball back in its case, Sadie back on her box, the sign off
   the door).
3. **Out in the hall (built).** The yarn ball bounces out of the door onto the landing and round
   the hall silently, forever: off the walls, the scratching post, the furniture, the stairs, the
   landing and its railing (whacked high enough, it goes over and drops to the ground floor), and
   straight through you. It can't get into any room (the walls and doors bounce it back). Sadie
   trots after it while it's going, and the moment it's stopped (or all but) she pounces over in
   cat leaps, never through a floor (down off the landing she hops over the railing and drops; up
   onto it she jumps from just below its edge, up and over the railing), and whacks it off again, towards the middle of the hall; down below, now and then a mighty one that
   lands it back up on the landing. Her napping box in the sunbeam is empty now. If it ever wedged
   itself somewhere, it quietly pops back into the middle of the hall.
4. **Sadie's sounds (built, 2026-09-30).** The ball stays silent (the owner has misophonia and can't
   stand constant noise), but Sadie makes a sound now and then while she plays, and only now and
   then: a soft pat of her paw on some whacks, a little "mrrp" chirp as she pounces, a happy trill
   for a mighty whack, and once in a while a small meow. Never two close together, never more than
   five a minute, never the same one twice running, and all of them softer than the smallest crack.
   You only hear her in the hall, fading the further off she is (silent past about 15 m).

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

## Playing it

Look at the case and press E (PLAY on a phone): your view eases back (and a little below) until the
whole glass, the marquee and the floor in front (where the knocked-out bricks land) fit the
screen, square on, up in the air if need be (you're back on the floor when you step back). The
marquee's letters are big (3 and 2 pixels a dot on a 192 x 64 picture) so they read from there.
You have to be within 8.5 m of the machine to play it. Then A/D or the arrows (or just moving the
mouse) move the paddle; on a phone, sliding a finger anywhere moves it exactly as far as the finger
goes. Esc, W or S (STEP BACK on a phone) eases you back to where you stood, and the game waits, the
ball hanging where it was. The ball starts on the paddle and is sent off by itself after a moment.

## How it's built

| File | What it does |
|---|---|
| `card.js` | Its card: no page and no `start()`, just `room` (loads `room.js`) and `door`. `keeps` its save for the pause menu's start-over button. |
| `game.js` | The game with no screen, in metres (the glass 4.2 x 6.6): the ball, the paddle, 8 rows of 10 bricks, the cracks, the score, the heap (`pile`: the rows of the bricks on the floor, in the order they fell) and whether it's broken (and how); `step()` returns what happened (for the sounds and faces; a brick's event says its spot on the heap; `break` says why and which bricks spilled). What's kept between visits (`save`, `load`). |
| `sounds/` | Every sound, made in code as 8-bit 11 kHz samples (each held 4 times over at 44.1 kHz, so no smoothing), a file per kind of sound: `glass.js` (the three cracks: a snap, a thump, crackle bursts, glass pings, a slapback echo, the third a long crash; the shatter: a snap and a boom, a crash in two waves, three seconds of glass tinkling down; and the tink of glass that can't crack any more), `machine.js` (the paddle's BOING, brick blips, higher rows higher, and the case's tock, bricks landing on the heap too), `quiet.js` (the poster's squeak-click, `mute`) and `sadie.js` (Sadie's sounds while she plays in the hall, and `makeChatter`, the rules for when she makes them). `retro.js` is the kit they're all made with (the echo and 8-bit finish, pings, resonances for voices) and `player.js` plays them in the browser (waking on the next press or key, since browsers hold sound back till then; `nearness` for fading with distance). Neither knows about Brickbuster, so they can move to `src/shared/` as they are once a second activity wants sound. `index.js` is the list of every sound by name and how loud: `makeSounds()`, made when you step up to the case (or when Sadie first makes a sound while you're in the hall). **A new sound** goes in the file it belongs with (or a new file for a new kind), and gets a line in `index.js`. |
| `room.js` | The room (10 x 13 m, 11 m tall, arcade carpet, the QUIET!! poster by the door, Sadie on her box), the case (zigzag 90s plastic, a copper-bar marquee with the score, FREE PLAY / NO COINS stickers), the glass (a glint, and the cracks drawn on a see-through picture from each crack's seed: `crackLines`), the bricks (bits fall down inside when knocked out), the yarn ball and the paddle (an extruded rounded slab, its face a 32 x 10 picture per mood and gaze, plus sad and sighing). The heap (`pileSlots`: 80 spots, a layer at a time, nearest the hatch first; `heapZone`: where nobody walks), things flying on arcs to it, the break (`smash`), the yarn ball's way out (a list of hops, each with its noise), Sadie's run, and the OUT OF ORDER sign (`outOfOrder`, painted on the landing's side of the door). Hands the mansion its place (with `holding`, the door held open while they go out) and the `play` on the case (`over` once it's broken). `window.__brickbuster` for the checks (`knockOut` fills the heap without playing). |
| `loose.js` | The yarn ball loose in the hall, and Sadie chasing it, with no screen (the tests run it): bouncing with gravity off the hall's solid shape (which the hall hands over: its walls, post, landing and railing, stair treads and furniture), stopping, Sadie's leaps and whacks, popping it back if it's ever wedged. `stepLoose` says what happened (`pounce`, `whack`, `mighty`, `pop`), for her sounds. room.js draws them in the hall (the mansion hands the hall over too), and plays her sounds when you're in the hall (the mansion's `ears`: where you are). |
| `door.js`, `poster.js` | Its door on the landing (an arcade marquee, bricks, the yarn ball) and Sadie's QUIET!! poster (a speaker crossed out, her underneath with cross eyebrows). Drawn by `art/clubhouse/pictures.py`. |
| `tests/brickbuster/run.mjs` | Headless: pretend players for two hours of play (the ball never leaves the glass or gets stuck sideways), the paddle's angles, missing: three cracks at the bottom and it breaks (every brick on the heap, each its own spot), good play breaks the top, the last brick breaks it, bricks, saves (broken stays broken), the sounds (8-bit, never silent, each crack bigger, the shatter biggest; Sadie's softer than any crack, each version different), the cracks' drawing, the heap's spots (80, where nobody walks, none on thin air), the ball loose in the hall for 90 minutes, and Sadie's sounds while she plays (now and then, never two close together, never more than 5 a minute, never the same twice running). About 20 seconds. |
| `tests/brickbuster/browser.mjs` | Phone and desktop: through its door, stepping up, the paddle by keys, mouse and finger, a crack (sound and wince), stepping back (the game waits), the crack kept after a reload, breaking it (shatter, stepped back, the heap, the sad paddle, the ball hitting the poster and going out the door, Sadie after it, the sign), still broken after a reload, Sadie's meow heard in the hall but not from her room (and the ball silent), fixed by the pause menu's start-over button. |
| `tools/brickbuster/shots.mjs` | Pictures of the room and the game from the built page: `dist/shots/brickbuster/`. |

## Numbers

- **The glass**: 4.2 m wide, 6.6 m tall, its bottom 1.4 m off the floor. The ball's radius 0.16 m;
  the paddle 1.3 x 0.46 m, its middle 0.7 m up. Bricks 0.4 x 0.24 m (with gaps), 8 rows of 10, the
  top row's top edge 1.25 m under the top of the glass (the gap you break through into).
- **Speed**: 4.2 m/s at the start, 0.04 faster per brick, never over 6.4. The paddle sends it up to
  60 degrees off straight up (at its very ends); the keys move the paddle 6 m/s.
- **Cracks**: 3 at the top or 3 at the bottom breaks it (so does the last brick). The ball rattles
  about above the bricks once it's through, so after a crack at the top the next one waits until
  the ball's been back to the paddle.
- **The heap**: 61 bricks in three layers along the front of the machine, 19 down its right side;
  bricks are 0.21 m apart up a layer. A knocked-out brick takes a moment to fall inside the glass,
  then 0.55 s from the hatch to its spot.
- **Loose in the hall**: bounces keep 72% of their speed (85% off walls), it rolls to a stop.
  Sadie trots after it (leaps at 4 m/s) keeping 1.6 m off while it's going, and goes for it once
  it's slower than 1.2 m/s on something: leaps up to 2.2 m (6.5 m/s), a swat after a 0.25 s crouch,
  sending it 5 to 8 m/s and 2.5 to 7.5 m/s up (on the landing 5 to 7.5); from below, 30% of the
  time a mighty one (10.5 to 11.5 m/s up, out towards the landing). The tests expect about 9
  whacks a minute, never more than a minute apart, a third or so of its time on the landing, it
  never outside the hall or through the landing, and Sadie never through the landing or its
  railing, nor standing about while the ball rolls off.
- **Sadie's sounds** (`CHATTER` and `LOUD` in `sounds/sadie.js`): a pat on 30% of whacks (at most
  one every 10 s), a meow on 8% of whacks (at most one every 75 s), a chirp on 20% of pounces (one
  every 30 s), a trill on 60% of mighty whacks (one every 25 s); never two of her sounds within 5 s,
  never two chirps, trills or meows within 15 s, never more than 5 in a minute. The tests expect about
  3 a minute (pats 1.5, chirps 0.8, trills 0.6, meows 0.2). Right next to her they play at 0.25 to
  0.35 of full volume, fading to nothing 18 m off.
- **The escape**: 9 hops, each 0.25 s plus its length at 8.5 m/s, about 6 seconds in all; Sadie
  runs at 5.5 m/s. The shatter lasts 3 seconds; shards lie on the floor 1.5 to 2.5 s.
- **Points**: 80 for the top row down to 10 for the bottom one.
- **What the tests expect**: a pretend player that never misses and aims for gaps gets three top
  cracks in about a minute (0.8 to 1.1 minutes over five games; never under half a minute), a real
  person takes a good few minutes. Leaving the paddle alone cracks the bottom within seconds.

**Put away when you're far off.** The mansion puts the room away when you've been three doors or more from it for a while, but never mid-game or while the ball's getting out (`busy()`). `putAway()` saves the game, closes its sounds, and takes the yarn ball and Sadie out of the hall; when it's built again from its save, they're back. The OUT OF ORDER sign stays on the landing door meanwhile (it's made once, and the room built again uses the same one), so the landing never shows the door without it.

## Parked ideas

- A loose strand of yarn trailing from the ball (the owner: not needed).
- A name for the paddle ("Paddy"?): the owner hasn't said.

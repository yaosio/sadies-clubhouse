# Brickbuster's numbers

Sizes, speeds, cracks, the heap, the loose ball, Sadie's sounds, the escape and what the tests
expect. Read before changing any of them.

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
  sending it 5 to 8 m/s and 2.5 to 5 m/s up (on the landing 5 to 7.5); from below, 30% of the
  time a mighty one (10.5 to 11.5 m/s up, out towards the landing). The tests expect about 9
  whacks a minute, never more than a minute apart, a third or so of its time on the landing, it
  never outside the hall or through the landing, and Sadie never through the landing or its
  railing, nor standing about while the ball rolls off.
- **Sadie's sounds** (`CHATTER` and `LOUD` in `sounds/sadie.js`): a pat on 30% of whacks (at most
  one every 10 s), a meow on 8% of whacks (at most one every 75 s), a chirp on 20% of pounces (one
  every 30 s), a trill on 60% of mighty whacks (one every 25 s); never two of her sounds within
  5 s, never two chirps, trills or meows within 15 s, never more than 5 in a minute. The tests
  expect about 3 a minute (pats 1.5, chirps 0.8, trills 0.6, meows 0.2). Right next to her they
  play at 0.25 to 0.35 of full volume, fading to nothing 18 m off.
- **The escape**: 9 hops, each 0.25 s plus its length at 8.5 m/s, about 8 seconds in all; Sadie
  runs at 5.5 m/s. The shatter lasts 3 seconds; shards lie on the floor 1.5 to 2.5 s.
- **Points**: 80 for the top row down to 10 for the bottom one.
- **What the tests expect**: a pretend player that never misses and aims for gaps gets three top
  cracks in about a minute (0.8 to 1.1 minutes over five games; never under half a minute), a real
  person takes a good few minutes. Leaving the paddle alone cracks the bottom within seconds.

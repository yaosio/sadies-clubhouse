# The pool

The pool in the backyard (the owner asked for it, 2026-10-06; it took the place of the bird bath and
the bench Sadie napped on). Read when changing the pool, who is at it, or the beach ball.
`src/clubhouse/pool/`; `outside.js` builds it and walks round what it says is solid.

## What's there
A paved deck inside a low fence with a gate straight out from the patio, a pool about 7 m by 4.5 m
that you can't go in (its edge is solid, the owner's call: "the user can't go into the pool right
now"), and a diving board at the far end. Things Claude added for the owner to like: two pink
flamingos at the gate, bunting along the back fence, a POOL RULES sign, a rubber duck drifting on the
water, a striped umbrella and a table with a tuna drink, a spare lounger, and Marbles' toy box.

## Who's at it
- **Sadie** lounges on a lounger: dozing (Zs), awake and blinking, and cross (a shake and a "!") for
  a few seconds whenever she's been got at, now and then with a mew.
- **Marbles** (the brown tabby from the town square, in a straw hat) sits by the pool, then every 7 to
  13 seconds tries one of four ways to annoy Sadie, never the same one twice running: scoops water at
  her from the edge, throws the beach ball at her, squirts her with a water pistol, or fetches a bucket
  from the toy box and tips it over her (and runs). If the ball is out of reach in the middle of the
  water she picks another.
- **The black lab** (the one from the games; his name is in the code) runs laps round the pool and every one or two laps
  runs up the board, dives, paddles to the ladder and climbs out. **When you arrive** (within a metre
  of the fence) he goes crazy for about 15 seconds: circles round you, a play-bow then a charge and a
  jump at you, zooming about and bouncing off whatever he hits. Then he sits, panting, and goes back
  to his laps. Go away (3 m off, or indoors, for a moment) and come back and he does it again.
  The ball gets knocked about if he runs into it.
- **The beach ball** is yours to kick: stand by it and look at it, and KICK appears (like any other
  thing you use). It goes away from you, bounces, rolls to a stop, floats on the water and drifts to
  the nearest edge so you can reach it (you can't go in). It never leaves the fence.

## How it's built
Everything is in `src/clubhouse/pool/`, one job a file:
- `layout.js`: where everything is, as numbers (the deck, the water, the board, what's solid), and
  the bumping rules. A new thing at the pool is a line here.
- `sim.js`, `ball.js`, `dog.js`, `marbles.js`: what goes on, as plain numbers with no drawing,
  so a headless check can run it (`tests/clubhouse/pool.mjs`).
- `pool.js`, `art.js`: the drawing (flat pictures that face you, like the birds) and the pictures.
- `sounds.js`: the sounds, played through the sound system's `outside` owner and only while you're
  outside.
- It only runs while the outside can be seen (you're out in it or looking out of an open door), so
  it costs nothing indoors. Marbles, the dog and the ball are a handful of flat pictures; the water's
  three pictures swap slowly. Light on phones.

## Sounds (`docs/clubhouse/RULEBOOK.md` section 4)
A soft splash (three a bit different), a soft boing for the ball and a little squirt. No water loop
and nothing that ticks. Claude's numbers, changeable: the same splash never twice within 5 seconds
(Marbles' scoop 3, the bucket 4), the boing at most every 1.2 s, the squirt every 1.6 s, Sadie's mew
once in two times and never twice within 8 seconds, all fading with distance.

## Claude's numbers (the owner can change any)
The deck is 16 m by 13 m, the pool 7 m by 4.5 m, one ball, crazy for about 15 seconds, Marbles rests
7 to 13 seconds between goes, the dog dives every one or two laps, the gate is 2.4 m wide. None is a
technical limit.

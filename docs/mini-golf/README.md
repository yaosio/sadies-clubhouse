# Sadie's Mini Golf

Three holes of mini golf out in the backyard behind Sadie's clubhouse (`src/activities/mini-golf/`).
The owner asked for it on 2026-10-01, and designed most of its rules. It's in the grounds' second
spot (`grounds` 1: `GROUNDS` in `src/clubhouse/outside.js`), the backyard. The holes are close to the
house with their tees by it (along the backyard's path and the patio), so you walk out the back and
play them facing the back fence (the owner's ask, after a first go that put them at the far end of
a bigger backyard, far apart).

**The holes**, on painted plywood plinths with low pink walls, all hills and drops:
1. **The Doughnut** (par 4), on the far left: a raised tee, a chute down into a round bowl
   with the hole in the middle and a banked rim round it, where a garden gnome rolls laps the other
   way and knocks the ball down towards the hole.
2. **The Bridge** (par 4), left of the bird bath: a wooden bridge up to a high terrace at the
   far end, over the hole, and a sprinkler that sweeps round and pushes the ball along.
3. **Sadie's Tail** (par 5), right of the patio, backing onto Sadie's bench: a lower lawn, two ramps up to a raised green, a cat
   flap tunnel through the bank between them, and Sadie's very long tail hanging off her bench and
   sweeping across the right-hand ramp, batting the ball up it.

**Playing**: walk up to a tee and press E (PLAY on a phone). The view drops in behind the ball.
Aim with A and D (or the arrows) and hold Space to pull back; let go to putt. Or drag back from the
ball (mouse or finger) like a slingshot and let go. The dots show where the ball will really go (round
the slopes, off the walls). The **aim line** has three settings (the owner's idea: it's not meant to
be brutally hard), gone round with the AIM LINE button on the screen, or Q: SHORT (the start, up to
the first bounce or two seconds of rolling), FULL (the ball's whole way, so you can line it up with
the pins and the hole) and OFF. It's kept for next time (`sadies-clubhouse.mini-golf.assist`), and
the trick shot award counts whichever it's on. How hard is Sadie's tail, bottom left, puffing
up the harder you pull. The club is something silly: a fish, a spoon, a stuffed sock. A big hit
goes BONK. Esc (STEP BACK on a phone) walks away.

**The rules** (the owner's): knock down all three pins, then sink it. A pin never changes where
the ball goes: it's BLASTED off the course. While any pin's up, the hole's tentacles grab a ball
that comes within their reach (the dashed pink ring) and fling it back to the tee, a stroke more.
Once the last pin's down the ring turns green and they pull it in.

**Sadie** is in it three ways: her tail is the power meter, her real tail is hole 3's obstacle, and
after every hole she shows off her **trick shot**: all three pins and in, in one shot (a hole in
one). You only see the ball, never how she aimed or how hard. Pull it off yourself and you get
TRICK SHOT!!! and a fanfare, and the score board remembers.

## Design pillars (these win over any feature idea)

- **Easy to play, hard to master.** The owner found the first version far too hard (they couldn't
  knock down all three pins on hole 2), so: big pins (a ball within 30 cm of one blasts it), a small
  grab ring, gentle hills, and the aim dots that follow the slopes. The trick shot stays hard.

- **The pins are round and past the hole, never just in front of it** (the owner's complaint about
  the first layouts): a hole where knocking the pins over is trivial and the hole's an afterthought
  is no fun. Each pin is in a different part of the hole, far from the others, and at least one is
  further from the tee than the hole is.
- **Every hole is beatable, and so is the trick shot**, and the checks prove it: the winning shots
  are recorded in each hole's file and replayed. The pins were put where the shots go, not the other
  way round (the owner's idea), so nobody has to search for a shot that might not exist.
- **The trick shot is possible but really hard** (the owner: the kind of 90s nonsense where you're
  sure it can't be done, but it can).
- **Verticality**: tees up high, bowls, ramps, a bridge, a tunnel.
- **It forgets you stepped away.** Stop playing and the hole starts over. Only the best scores are
  kept (each hole's fewest strokes, the total, and whether you've done a trick shot).
- **Kind to the ears** (the owner has misophonia): every sound is short and soft. No mouth sounds
  (the grab is a cartoon spring, not a slurp), nothing that drones (the sprinkler is silent).

## How it works

- `course.js`: the engine, plain numbers (the tests run it). A hole's plan is 100 across and 140
  long (one unit is 7.5 cm in the backyard); heights in units of 32 cm. The ball rolls on the
  ground (never flies), stepped 120 times a second, so the same shot always goes exactly the same
  way, in the game and the tests. Movers are worked out from the course's clock, so a shot's
  recorded clock puts them back where they were.
- `holes/`: one data file per hole: its shape (circles and rectangles), its hills (bumps, bowls,
  rims, slopes), tee, hole, how far the tentacles reach, what moves, the pins, the recorded shots
  (`normal`: one pin a shot, then in; `trick`: all three in one), and where it is in the backyard
  (`at`, `flipX`, `flipZ`: every hole is turned end to end so its tee's nearest the house, and
  hole 3 is also mirrored so the tail's on the bench side). A new hole is a new file.
- `tools/mini-golf/design.mjs`: works out a hole's trick shot and pins (from the shots), then the
  way round. It searches a fixed grid of aims, strengths and clocks, so it always finishes. Run it
  after changing a hole's shape or hills, and paste what it prints into the hole's file.
- `build.js`: a hole in 3D from its data. `art.js`: the pictures. `sounds.js`: the sounds.
- `room.js`: puts the course in the backyard and plays it. The course is part of the outside, built
  once and kept (`house`: the mansion hands it back when the room's built again); the room itself has
  no doors and is just a name. Each tee is a `play` in the outside's `uses`: the view follows the
  ball, the controls are its `key` and `touch`, and `over` steps you back once Sadie's replay is
  done. Sadie's replay hits her shot with `hit()`, the same as the checks (it sets the course's
  clock to the shot's, so the gnome, sprinkler and tail are where they were when it was recorded:
  the first version waited a moment first, so on hole 1 the gnome had moved and she missed a pin).
  The pause menu stops and restarts a hole without starting it over. The best scores are saved
  under `sadies-clubhouse.mini-golf.best`.

Checks: `tests/mini-golf/run.mjs` (every recorded route and trick shot, the pin rules, the
tentacles, that every shot ends, the sounds) and `tests/mini-golf/browser.mjs` (playing it in the
backyard as a phone and a desktop).

## Parked ideas

- More holes (there's room further back in the backyard).
- A full 18, a scorecard you can print, a windmill.

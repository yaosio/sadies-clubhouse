# Tuning and behavior reference

These numbers are what make the game feel the way it does. Change them on purpose, one at a time,
and re-run `npm test`. Units: 1 block = 30 world px, y points up in the simulation.

## World
Board 48 blocks wide, walls at both edges, ground at y = 0 (until the bedrock rises over it). The camera's default zoom fits about
13 blocks across the screen.

## Solver (`core/physics/solver.js`)
Verlet integration, 4 substeps per 1/60 s frame, 2 constraint iterations per substep. Each block is
a 3×3 lattice of points; per-block shape matching plus a weaker whole-piece match for bending.
Boundary points pushed out of other pieces toward the nearest edge, split by inverse mass. Friction
only on the last iteration. Speed cap 0.4 blocks per substep.

Finding pairs: sleeping pieces go into a grid of 2×2-block cells once per frame, and each awake
piece only checks sleepers in the cells around it (plus every other awake piece). Pairs are
handled in the same order as checking everything against everything, so results are identical;
it only skips pairs that are far apart.

Dev panel defaults (stiffness 0.6, bendiness 0.6, jiggle 0.6, grip 0.6, gravity 1):
- block stiffness = 0.03 + 0.62 × stiffness²
- bend stiffness = (1 − bendiness) × 0.12
- damping per substep = 0.985 + jiggle × 0.0145
- gravity 1400 px/s²
- friction = grip × 0.5, times √(gripA × gripB) for each pair, capped at 1

Sleeping: a piece sleeps after its average boundary speed stays under 0.07 px/substep for 1.2 s and
then acts as solid. A piece moving faster than 0.2 wakes sleepers within 0.3 blocks.

## Materials (`core/physics/pieceTypes.js`)

| Piece | Name | kMul | bendMul | invMass | bounce | drag | grip |
|---|---|---|---|---|---|---|---|
| I | Ice bar | 1.6 | 1.5 | 1 | 0 | 1 | 0.08 |
| O | Sponge | 0.45 | 1 | 1.4 | 0 | 1 | 1.6 |
| T | Grape gum | 1.3 | 1.5 | 1 | 0.45 | 0.5 | 1 |
| S | Lime grip | 1 | 1 | 1 | 0 | 1 | 3 |
| Z | Cherry brick | 1.8 | 2 | 0.5 | 0 | 1 | 1 |
| L | Wobbler | 0.7 | 0.7 | 1 | 0 | 0.25 | 1 |
| J | Marshmallow | 0.35 | 0.6 | 1.8 | 0 | 1 | 1.3 |
| 6×1 | Noodle | 0.9 | 0 | 1 | 0 | 1 | 1 |
| 2×2 | Boulder | 4 | 5 | 0.25 | 0 | 1 | 1 |
| round | Bouncy ball | 2.5 | 7 | 0.7 | 0.75 | 0.15 | 1 |

Bounce is whole-body: if a bouncy piece touched something this substep while approaching faster
than 0.4 px/substep, its outgoing speed along the contact is set to bounce × incoming.

## Supply (`core/dropper.js`) and the mole (`core/mole.js`)
Up to 5 pieces, one refills every 1.5 s. The mole only lets go with a full supply, so at most one
piece every 1.5 s (the same top speed as the old dropper). It hovers 2.5 blocks above the highest
point under it (±0.6 blocks), flies 6 blocks/s (slowing as it arrives; half speed when worn out),
and lets go within 0.5 blocks of where it's aiming. New pieces spawn at a random 90° rotation.
- Where: on the most restless creature once someone's at least 0.3 restless (want 1 + 2 × how
  restless; each piece lands within 0.5 blocks of them), otherwise on the barn (want 1; anywhere
  from 2.3 blocks left of its middle to 2.3 right). Sadie's restlessness is her `impatient`
  feeling: it fills in 12 s of waiting or pacing under hay, empties when she eats, and fades over
  25 s otherwise. Chooter's is how ignored he feels.
- Tired: the screen reports the share of each second the simulation takes (smoothed over about
  2 s; not counted while the dev sheet speeds the game up). Over 50%: tiredness rises, full in
  8 s. Under 35%: it falls, gone in 20 s. In between it stays put. The wait between pieces is
  1.5 s × (1 + 3 × tired). Full: it naps (no pieces) until tiredness is down to 40%.
- For a sense of scale (this cloud computer, in Node): once settled, 120 pieces take about 1.6 ms
  a step, 220 about 2.3 ms, 370 about 5 ms (30% of each second at 60 steps). The mole drops about
  37 pieces a minute on its own, so on a device like that it starts slowing down somewhere past
  10–15 minutes of building. Raining 400 pieces in a headless browser here wore it out in about
  17 s. With bedrock, a 60-minute test game stays around 150 pieces and 3 ms a step the whole way
  (before bedrock it was about 700 pieces and 7.3 ms by 30 minutes, and still climbing).

## Fossils (`core/fossil.js`)
A piece that has been at rest for 3 s and is buried at least 8 blocks under the pile's surface
(everywhere across its width) becomes a fossil: it stays asleep forever and still holds the pile up.
Checked every 0.5 s. Two more ways in, so nothing deep stays awake forever: a piece at least 8
blocks down that's been barely moving (under 0.12 px per substep) for 10 s without quite falling
asleep (jammed in, jiggling just too much to count as still), and anything at least 16 blocks down,
however it's moving. Both are stopped where they are. (A long test game found pieces like that
jiggling or creeping for 15 minutes or more, 12 to 35 blocks down, costing time every frame and
keeping the bedrock from forming above them.) This keeps a landing piece from waking a long chain of pieces deep in a tall
tower, so only the top 8 blocks or so can wobble and topple. First step toward an endless tower.

## Bedrock (`core/bedrock.js`)
Only there to keep the game smooth, so it waits until it's needed: nothing melts while the board has
400 pieces or fewer. Past 400, the deepest fossils melt (lowest first) until it's back down to 390,
so the board sits at about 390–400 pieces from then on. In normal play that's about 11 minutes in,
and the rock stays about 45 blocks under the top of the tower, out of sight unless you scroll down.
Why 400, and why one fixed number rather than one based on how fast the device is: sleeping buried
pieces cost very little, and time per physics step with nothing melting grew only slowly (about 2.4
ms at 270 pieces, 2.7 at 450, 3.2 at 630, 4.4 at 900), while playing with the mole always costs
about 3 ms. At 400 it's still in the flat part, with room to spare on a phone. A number based on
the device's speed would make the same save play differently on a phone and a computer, would
flicker with phones warming up or saving battery, would only kick in after the game had already
slowed down, and couldn't be tested the same way twice. (It started at melting anything 12 blocks
down right away, which kept about 150 pieces and put bedrock in view after a few minutes.)
A fossil buried at least 12 blocks under the pile's surface (everywhere across its width) melts
into the bedrock, as long as nothing that can still move (or the barn) reaches within half a block
under its top. Checked every 0.5 s. It stops being a piece: the bedrock's top rises to exactly its
upper outline (its height is kept every quarter block, plus each of its corner points), filling
any cave under it. So whatever was resting on it is resting on the rock now. Any fossil left
completely under the new top melts too.
(Tried and dropped: smoothing the rock so it's never steeper than 45°. Wherever one spot melted
later than its neighbors, the smoothing pulled the rock down into a big V around it, and the pieces
that had been resting on what melted were left frozen in the air over the gap: raining 600 pieces
left gaps averaging 27 blocks. It also kept caves in the pile from ever filling in.)
The rock can have steep steps (one piece melts before its neighbor). A point that ends up more than
a quarter block under the rock, or under a part steeper than 45°, has run into the side of a step:
it's pushed out sideways to the nearest open side within 1.5 blocks, like off a wall, instead of
being lifted on top (which flung pieces up into the air). Each piece leaves flecks of its
color in the rock (the newest 300 are kept) and a little glimmer.
- The bedrock is the floor: pieces, Sadie, Chooter, the ball and the barn all stand on it. Before
  anything has melted it's flat ground at 0, and the physics runs exactly as it did before.
- The camera never looks more than 2 blocks below its lowest point. The map strip starts a block
  under its lowest point. Heights (the ruler, bests) still count from the real ground.
- It's saved as its height every quarter block (193 numbers) plus the flecks, so a save stays small
  however tall the tower gets. Saves from before bedrock load with none.
- Why: however tall the tower gets, only the top 400 pieces stay pieces, so the game costs about
  the same after an hour as after 20 minutes (about 3–4 ms per step from then on; it was about 3
  with the old 150 pieces).

## Sadie's barn (`core/barn.js`, trips in `core/sadie/brain.js`)
4 blocks wide, walls 2.4 blocks tall, roof peak 3.9 blocks. Starts on the ground 4.5 blocks left of
the middle. It's a fixed piece: solid, never tips, never gets pushed, and pieces pile on it and bury
it. Sadie can stand on its roof. When nobody is dragging it, it drops onto whatever is under it
(gravity 1400, max 10 blocks/s), so it follows the pile down if the pile under it collapses.
Nothing above it becomes a fossil, so it can always be dragged out.

Trips home: after a trip she feels settled (`settled`, 1 falling to 0 over 60 s). Once that's gone
she goes when she's 6 blocks or more above the barn's floor, or when the pile covers its whole roof
by 1 block or more (then fetching the barn wants 3, more than hay's 1–2). Why she does it and how
the wants work: `docs/CHARACTERS.md`. She runs to its side, grabs the rope and
drags it toward the tallest point of the pile (not counting what's heaped on the barn itself), at
least 4 blocks. The barn follows 2.9 blocks behind her at up to 2.5 blocks/s, shoving pieces out
of its way; it rides over whatever is under its floor rather than being pulled down into the pile.
She walks at 70% speed while dragging and stops to heave whenever it falls more than 1.2 blocks
behind. A trip gives up after 60 s. While on a trip she ignores hay and isn't scared by pieces
shifting under her (falling still scares her).

## Chooter (`core/friends/chooter.js`)
Sadie meets him the first time she stands 15 blocks up (about 2 minutes into a fresh game, with the
mole doing the building). He comes running in from the far side of the board along the top of the pile. Once met,
he stays met (saved in the browser), even after clearing the tower.
- Trots 2.2 blocks/s, runs 4.2 when he has somewhere to be, 6.5 with the zoomies.
- Leaps up ledges up to 2.6 blocks tall (3.2 with the zoomies); anything taller stops him and he
  barks. Walks off drops and falls (gravity 1400). If a piece lands on him he wriggles out on top.
- Playing: picks a spot 1.4–3.6 blocks to one side of Sadie every 2–4.5 s and goes there; hops for
  joy or sends her a heart now and then.
- Feelings (see `docs/CHARACTERS.md`): `energy` winds up while he's out, `tired` builds while he's
  out, `missing` makes him greet a new friend.
- Zoomies: when his energy is full. It starts 20 s from full on a fresh board (30 s after meeting
  him), then takes 40–75 s to wind up again (chosen after each bout). His energy lasts 7–10 s. He dashes 7–14 blocks one way, then the other, hopping every 0.6–1.8 s. Any piece that
  isn't a fossil in the space just ahead of his body gets knocked forward 5 blocks/s and up 3.5
  (times its lightness, up to 1.5×; a boulder barely moves), at most once per 0.6 s per piece. In
  test runs each bout moves between 1 and about 25 pieces more than a block.
- Ball: he chases it unless he has the zoomies, grabs it once it's near his mouth and coming down,
  and carries it to Sadie (she's not impressed). Gives up if he can't get to it for 5 s (25 s in
  all), or can't reach Sadie within 18 s. The ball vanishes 1.5 s after he drops it (3 s if he gave
  up), or after 40 s regardless.
- Worn out after 70–120 s out (chosen each time he comes out; the zoomies tire him twice as fast,
  so outings with zoomies are shorter). Too tired for the zoomies then; he heads home once no toy
  is out: in through the cat flap if the side of the barn is
  clear, or he digs in from on top if it's buried (or if he can't get there in 30 s). Home for
  25–45 s (until rested), poking his head out of the hayloft window; a thrown ball gets him out
  straight away.

- Teasing Sadie: fed up after about 75 s of playing beside her (sooner if she's unimpressed with
  his ball: each "…" counts for about 19 s), he snatches the hay she's going for if it's within
  3.9 blocks of the pile, leaping up for it. Keep-away: when she comes within 3 blocks he picks a
  way to run and keeps going that way (4 blocks at a time, 3.1 blocks/s) until she's more than 4
  blocks behind, then bounces facing her. Backed into a wall, he's caught: he turns to her with
  the hay. Drops it after 20 s. Sadie runs after hay
  that's being carried, and eats it once it's within her reach.

## Toys (`core/toys.js`)
One out at a time. The mole throws it, taking 0.6–1.3 s to land near where you tapped.
Ball radius 0.26 blocks, gravity 1400, keeps 55% of its speed on each bounce, rolls downhill.

## What counts as ground (`core/surface.js`)
Asleep, or older than 0.4 s with a smoothed speed under 0.6. The smoothing stops a ball at the top
of its bounce from counting.

## Hay (`core/hay.js`)
Always 3 bundles out. They form a trail: each new bundle goes 10–18 blocks sideways from the last
one placed, carrying on the same way until it would hit a wall (keeps 1.5 blocks clear), then the
trail turns around. So Sadie grazes back and forth across the board. When she eats one, the next
is placed at the far end of the trail.
A new bundle appears 0.7 blocks above the pile surface under it, plus 1.5–4.5 blocks extra, so
2.2–5.2 blocks above the pile. She reaches 1.6 blocks up, so a new bundle is never in reach: she
needs 0.6–3.6 blocks built under it, and she gets impatient while she waits (which brings the mole
over to bury her, building the pile she needs). Because height is
measured from the pile, hay keeps up as the tower grows.
(Tried and set aside: 5–12 apart and 0–3 up, which the owner found too close and too easy. A
middle setting of 8–15 apart and 1–3.5 up made her impatient about 25% of the time instead of
about 45%.)
Covered by the pile for 0.5 s: float up to 0.7 blocks above the surface. Pile drops away for
0.5 s: sink back, never below where it appeared.

## Sadie (`core/sadie/brain.js`)
- Reach 1.6 blocks above her feet. Walk 1.7 blocks/s, climb 0.8 blocks/s.
- Steps up to 0.5 blocks; anything more than 0.55 blocks higher just ahead is a wall she climbs.
- Uses solid spans in a vertical slice (spans closer than 0.25 blocks merge), so overhangs above
  her head don't count as floor.
- Targets the nearest hay by |dx| + 1.5 × |dy|.
- Runs (2.5× speed) when her hay is more than 6 blocks away sideways; walks again under 2.5.
- Can't reach her hay: waits 1.5 s, then paces 1.5 blocks out, turning and going 1 block further
  each lap, up to 12.
- Moods: neutral, lookup (waiting), mad (pacing), happy (climbing), excited (ate hay or got her
  barn home), scared (falling or lurching ground), run, haul (dragging her barn).

## Debug tools (`core/debug.js`, the dev sheet's Debug tab)
For us, not players. Speed runs 1, 2, 4 or 8 simulation steps per normal step.
- Rain 25 here: 25 random pieces within 5 blocks of the mole. Rain 100 everywhere: across the
  whole board. About 12 a second, each 4 blocks above the pile; a piece waits if something is still
  falling where it would appear.
- Build a tall pile: 110 pieces within 1 block of the mole, one every 0.6 s, run at 8× (about 70 s
  of game time, roughly 9 s to watch), then 4 more seconds to settle before going back to the
  chosen speed. Makes a mound about 16–18 blocks tall.
- Put her on top: Sadie moves to the highest point. If her barn is now far below, she'll soon go
  back for it, as she normally would.
- Fetch the barn now, Meet Chooter now, Zoomies, Go home, Come out: start those right away (or as
  soon as Chooter finishes what he's doing).
- Wear the mole out: it naps right away (no pieces) and wakes about 12 s later, if the game isn't
  struggling.
- Clear tower also stops any rain.

## Saving (`core/save.js`)
Saved in the browser once a minute, and when the page is hidden or closed (those are the saves
that matter; the timed one only covers a crash, losing at most a minute). It was every 5 s, but a
full board's save takes a slow phone about 30 ms, a small hitch. Saved under the key
`sadies-dropper-world.save` (a name no other game on a shared site like itch.io will use). Each
browser and device keeps its own game. Piece positions are kept to 1/100 px; a 50-piece board is
about 24 KB. The bedrock keeps the board to about 400 pieces however tall the tower
gets (about 200 KB), far under the browser's ~5 MB limit.
What comes back exactly: every piece (squish, speed, asleep, fossil), the bedrock, the barn, the hay and the
hay trail, the mole's spot and the piece it holds, the supply, Sadie and Chooter. What starts over:
any trip home Sadie was on, the hay she was heading for, what the mole was doing (and how tired it
was), a thrown ball, particles, and the debug
speed and rain.
Clear tower: fresh board, keeps Chooter and bests. Start over: forgets the save, bests and friends
(keeps the dev sheet's physics settings). Both need a second tap within 3 s.

## What the tests expect (`tests/run.mjs`, seeded, so results repeat exactly)
(Numbers from the Chooter test onward moved a little when deep pieces that never quite fall asleep
started turning into fossils too, see Fossils: a longer game's pile settles a little differently,
and the tests share one stream of random numbers. Chooter now brings back 5 of 5 balls (was 7),
the debug pile peaks around 17.5 blocks (was 18), the save test's game is 39 pieces (was 41), the
teasing test has Sadie catch him both times (was: he dropped it both times), the mole test puts 32
pieces on Sadie and 14 on Chooter (was 27 and 17) and its slowest tired gap is about 4.6 s (was
3.7). The rules they check are the same. Bedrock itself moves nothing: with melting switched off
the results are identical.)
- 150-piece mixed pile: no broken numbers, deepest overlap about 0.6 px, about 140 asleep.
- Ball dropped from 6 blocks: bounces to 3.37, 2.13, 1.52 blocks.
- 70 pieces on one spot: a mound peaking around 12.5 blocks.
- Two minutes of play, nobody steering the mole: she never rises faster than about 4 blocks
  per second, never stays buried, hay never sinks below where it appeared, there are always 3
  bundles out, each new one 10–18 blocks from the last, new hay always starts out of her reach, she
  eats about 8 bundles (the check wants at least 4), and her longest wait between snacks is about
  25 s (the check allows up to 40). Time spent fetching her barn doesn't count as waiting. (With a
  pretend helpful player keeping the dropper near her, before the mole, it was 6 bundles and 39 s:
  the mole comes straight over once she's impatient, so she does better on her own now.)
- 110 pieces on one spot (peak about 15 blocks): 12 become fossils, all buried at least 8 blocks,
  and a boulder landing on top wakes none of them. (These numbers moved from 18 fossils and an
  18-block peak only because the tests share one stream of random numbers and the play test before
  it now uses a different amount of them. They moved again, from 15 and 16 blocks, when the mole
  took over the dropping, for the same reason.)
- The mole burying the barn (on its own now; it used to be a pretend player dropping on it): the
  pile gets about 3.4 blocks over its roof, Sadie fetches it once (about 31 s), and it ends up about
  8.5 blocks higher with nothing near it higher than its roof, inside the walls, with no piece sunk
  into it more than about 0.6 px. (Before the mole: about 5 blocks, 22 s, 8 blocks, 0.5 px. The
  mole spreads its pieces over the whole barn and wanders off to Sadie when she's impatient, so
  the heap is lower and the trip a bit longer.) (Moved from about 20 s, 6
  blocks and 0.3 px when her behavior moved onto feelings: "a minute since the last trip" became a
  feeling that wears off, which can land a frame differently, and in a pile one frame is enough to
  make a different trip. Everything before this test came out exactly the same.)
- Chooter: meets Sadie only once she's 15 blocks up. On a pile the mole grew for 90 s, over 4
  minutes he greets her (about 15 s, running in from the far side), has 3 bouts of zoomies knocking
  about 26 pieces, brings back all 5 balls thrown for him, moves into the barn and comes back out, and
  never gets stuck in the pile or leaves the board. This test runs after the others, so it doesn't
  change their numbers.
- Debug tools (runs after the play tests): raining 100 pieces drops them all in about 8 s with no
  piece sunk into another more than about 1 px; "Build a tall pile" peaks around 17.5 blocks and goes
  back to normal speed; "Put her on top" puts Sadie about 17.5 blocks up, standing; the Sadie and Chooter
  buttons each start what they say; clearing the tower stops any rain.
- Saving: a game saved after 70 s of play (39 pieces, 20 still moving, Chooter met) comes back the
  same after a JSON round trip, then plays on for 20 s with Sadie never stuck in the pile and no
  piece sunk into another more than about 0.6 px; a save from another version is
  refused; Clear tower keeps Chooter; Start over forgets him.
- The Chooter, debug and save numbers above moved a little when the characters moved onto
  feelings: Chooter now draws his random numbers at different moments, and the tests share one
  stream of random numbers. His behavior's rules are the same. (They moved again when he learned to
  tease Sadie, for the same reason plus the time he spends teasing. And again when the mole took
  over the dropping: it builds a different pile than the pretend player did.)
- Teasing: on a pile the mole grew for 90 s, over 4 minutes, Chooter snatches Sadie's hay twice
  (first after about 22 s), she runs after it most of the time and catches him both times (it can also
  end with him dropping it at 20 s),
  nobody turns back and forth more than about twice a second (21 turns in 23 s), there are always
  3 bundles out, and he never gets stuck in the pile. (Before the fix for sticking to one way to
  run this caught him twice; the fix changed when random numbers get used, so the run differs.)
- Cornered: Chooter carrying the hay near the right wall with Sadie 2.5 blocks behind
  on a flat board. Neither jitters (he turns twice, she doesn't turn), and she gets the hay in
  about 0.6 s. Before the fix they flipped back and forth over 800 times and she never got it.
- Thought bubbles: 4 minutes with Chooter just met, reading all three minds (Sadie, Chooter, the
  mole) every half second. They always have something to say (24 different "doing" lines come up), nobody has more than 4
  feeling bars, every feeling bar is between 0 and 1, and reading thoughts
  never uses a random number (so tapping a character can't change what happens next).
- The mole (runs last, so no earlier numbers moved): 3 minutes of a fresh game. Every piece lands
  either within 1.5 blocks of whoever it's burying (32 on Sadie, 14 on Chooter once she met him)
  or on the barn (64), none anywhere else, and whenever Sadie is at least half impatient the mole
  is burying someone. Never two pieces closer than 1.5 s. Then a pretend struggling game (the
  simulation taking 80% of each second): the gaps between pieces stretch to about 4.6 s, it's
  napping after 8 s and drops nothing while it naps, and 12 s after the game calms down it's back
  to work.
- Bedrock (runs last, so no earlier numbers moved): a fresh board has none. Raining 700 pieces over
  the whole board: nothing melts until there are more than 400 (the first melt comes at 406), then
  about 375 melt into bedrock (2–39 blocks up), leaving about 390 pieces (from about 520 at the
  most, since pieces rain in faster than deep ones become fossils). Where the bedrock rises it's
  always at least 12 blocks under the pile,
  every piece that melts ends up completely inside the rock (so nothing that rested on it is left
  hanging), no piece is left inside it, nothing that can move sinks into it, and the mole mentions
  it. A box sliding fast into the side of a 5-block step in the bedrock stops against it (it
  tumbles up to about 3.7 blocks high, never on top). It comes back exactly from a save (about
  209 KB), and a save from before bedrock loads with flat ground. (Was 420 pieces raining in with
  about 290 melting, 185 left, from 360 at most, a 92 KB save, before the 400-piece limit: raining
  420 would now barely melt anything, so it rains more.)

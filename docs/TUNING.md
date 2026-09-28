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

Finding pairs: sleeping pieces go into a grid of 2×2-block cells once per frame, awake pieces into
a second grid each iteration, and each awake piece only checks the pieces in the cells around it.
Pairs are handled in the same order as checking everything against everything, so results are
identical; it only skips pairs that are far apart. (`node tools/dropper-world/physics-load.mjs` prints a
fingerprint of the board after two minutes: a speed-up like this must leave it unchanged.)

Dev panel defaults (stiffness 0.6, bendiness 0.6, jiggle 0.6, grip 0.6, gravity 1):
- block stiffness = 0.03 + 0.62 × stiffness²
- bend stiffness = (1 − bendiness) × 0.12
- damping per substep = 0.985 + jiggle × 0.0145
- gravity 1400 px/s²
- friction = grip × 0.5, times √(gripA × gripB) for each pair, capped at 1

Sleeping: a piece sleeps after its average boundary speed stays under 0.07 px/substep for 1.2 s and
then acts as solid. Under 0.12 (trembling or creeping) counts as half as still, so it sleeps after
2.4 s of that. With more than 16 pieces awake, still pieces sleep sooner: after 1.2 × 16 / awake
seconds (never under 0.3 s). A piece moving faster than 0.2 wakes sleepers within 0.3 blocks.

Why: each step costs more with every piece awake (on a fast computer, about 1 ms with 8 awake, 2.5
with 25, 5 with 50), and each drop wakes 10 to 20 pieces. Before these rules, half the time pieces
spent awake they were already still and only waiting out the 1.2 s, and a full board spent about a
third of its time in a pile-up (40+ awake); now it's under a tenth, with the average awake down from
about 26 to 17. The first try (under 0.15 counting half, from 12 awake) froze pieces shoved aside
by the barn a bit early, leaving a steeper heap beside it (the barn test failed on 2 of 9 seeds).

Game loop (`loop.js`): up to 3 steps a frame to catch up after a slow one, but only while the
steps so far have taken under 12 ms, or 40% of a typical frame if that's more: past that, the time
owed is dropped and the game runs slower for a moment instead of stuttering, like an old console
with too much on screen. The perf overlay shows it as "Game speed". (A flat 12 ms let a phone whose
drawing is slow fall to a quarter speed; 30% of a frame wasn't smoother than 40%, just slower.)
On a phone 2x slower than Claude's machine, in a hidden browser, frames over 50 ms went from 147 to
about 10 in 40 s with these changes and the physics speed-ups, at 90% game speed. At 4x slower the
hidden browser's drawing (no graphics card) swamps everything, so it says little about real phones.

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
piece every 1.5 s. It hovers 2.5 blocks above the highest
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
  17 s. With bedrock, a long game stays around 400 pieces and 3–4 ms a step however long it runs.

## Fossils (`core/fossil.js`)
A piece that has been at rest for 3 s and is buried at least 8 blocks under the pile's surface
(everywhere across its width) becomes a fossil: it stays asleep forever and still holds the pile up.
Checked every 0.5 s. Two more ways in, so nothing deep stays awake forever: a piece at least 8
blocks down that's been barely moving (under 0.12 px per substep) for 10 s without quite falling
asleep (jammed in, jiggling just too much to count as still), and anything at least 16 blocks down,
however it's moving. Both are stopped where they are. (Without these, pieces like that can jiggle
or creep for 15 minutes or more deep in the pile, costing time every frame and keeping the bedrock
from forming above them.) This keeps a landing piece from waking a long chain of pieces deep in a tall
tower, so only the top 8 blocks or so can wobble and topple.

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
slowed down, and couldn't be tested the same way twice.
A fossil buried at least 12 blocks under the pile's surface (everywhere across its width) melts
into the bedrock, as long as nothing that can still move (or the barn) reaches within half a block
under its top. Checked every 0.5 s. It stops being a piece: the bedrock's top rises to exactly its
upper outline (its height is kept every quarter block, plus each of its corner points), filling
any cave under it. So whatever was resting on it is resting on the rock now. Any fossil left
completely under the new top melts too.
(Tried and dropped: smoothing the rock so it's never steeper than 45°. It pulled the rock down
into a V wherever one spot melted later than its neighbors, leaving pieces frozen in the air over
the gap, and kept caves in the pile from ever filling in.)
The rock can have steep steps (one piece melts before its neighbor). A point that ends up more than
a quarter block under the rock, or under a part steeper than 45°, has run into the side of a step:
it's pushed out sideways to the nearest open side within 1.5 blocks, like off a wall, instead of
being lifted on top (which flung pieces up into the air). Each piece leaves flecks of its
color in the rock (the newest 300 are kept) and a little glimmer.
- The bedrock is the floor: pieces, Sadie, Chooter, the ball and the barn all stand on it. Before
  anything has melted it's flat ground at 0.
- The camera never looks more than 2 blocks below its lowest point. Heights (the ruler, bests) still count from the real ground.
- It's saved as its height every quarter block (193 numbers) plus the flecks, so a save stays small
  however tall the tower gets. Saves from before bedrock load with none.
- Why: however tall the tower gets, only the top 400 pieces stay pieces, so the game costs about
  the same after an hour as after 20 minutes (about 3–4 ms per step from then on).

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
Before they meet he's next door, listening (`heard`, 0 to 1, saved with the board). Every tick,
each awake piece that slows down adds how much it slowed (in px per substep, divided by its
lightness, so heavy pieces thud louder), and the barn scraping along behind Sadie adds 60 a second.
3500 of that winds him all the way up; a new board makes about 850 a minute. What he hears rings in
his ears and winds him up at most 1/150 a second, so even a downpour takes at least 2.5 minutes.
At 60% he starts peeking in (his head, from behind whichever wall is nearer Sadie as the peek starts, at the top of the pile there),
every 22 s at first and every 8 s near the end; you can tap him while
his head is in. At 100% he bursts in over that
wall with a leap and a bark. With the mole building, `node tools/dropper-world/arrival.mjs` gives a first peek at
about 2:50–3:05 and an arrival at about 4:10–4:40 (between 160 and 175 pieces). A slow device whose
mole gets tired drops fewer pieces, so he takes longer. Once met, he stays met (saved in the
browser), even after clearing the tower; Start over sends him back next door, from quiet.
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
The mole digs it up. Whenever fewer than 3 bundles are about (counting one in its paws), the next
time it reaches for a piece it comes up with hay instead: it stares at it for 1.1 s ("?!", eyes wide,
"ew" mouth), then flings it once its supply is full, and that takes the place of a piece (so
pieces and hay together are still never faster than one every 1.5 s). After Sadie eats one, it
waits 3 s before it can dig up another. A new game starts with it digging up the first 3 (all out
after about 4 s); saved hay stays where it was.
It aims along a trail: each bundle 10–18 blocks sideways from the last aim, carrying on the same
way until it would hit a wall (keeps 1.5 blocks clear), then the trail turns around. So Sadie
grazes back and forth across the board. The throw takes 0.7–1.4 s. The bundle is a real thing:
it bounces off the pile (keeping 30% of its speed, floppy; about 3 bounces each) and the walls,
tumbles, rolls a little downhill and settles lying flat, without shoving any pieces (like the ball).
So it doesn't land exactly where the mole aimed, and while it's flying Sadie doesn't go for it.
Lying still for 0.4 s (or after 8 s anyway), the mole's mystery float gets hold of it (it's not
the hat): it glows, twinkles underneath, and floats up at up to 1.5 blocks a second to 0.7 blocks
above the pile under it, plus 1.5–4.5 blocks extra, so
2.2–5.2 blocks above the pile. If Sadie is right there when it lands, she can grab it before it
floats off: an easy snack now and then. She reaches 1.6 blocks up, so a floating bundle is never in reach: she
needs 0.6–3.6 blocks built under it, and she gets impatient while she waits (which brings the mole
over to bury her, building the pile she needs). Because height is
measured from the pile, hay keeps up as the tower grows.
(Tried and set aside: 5–12 apart and 0–3 up, which the owner found too close and too easy. A
middle setting of 8–15 apart and 1–3.5 up made her impatient about 25% of the time instead of
about 45%.)
Covered by the pile for 0.5 s: float up to 0.7 blocks above the surface. Pile drops away for
0.5 s: sink back, never below where it floated up to.

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
  chosen speed. Makes a mound about 17–19 blocks tall.
- Put her on top: Sadie moves to the highest point. If her barn is now far below, she'll soon go
  back for it, as she normally would.
- Peek in: Chooter is wound up just enough to start peeking in (the rest still takes the noise).
- Fetch the barn now, Meet Chooter now, Zoomies, Go home, Come out: start those right away (or as
  soon as Chooter finishes what he's doing).
- Wear the mole out: it naps right away (no pieces) and wakes about 12 s later, if the game isn't
  struggling.
- Clear tower also stops any rain.

## Saving (`core/save.js`)
Saved in the browser once a minute, and when the page is hidden or closed (those are the saves
that matter; the timed one only covers a crash, losing at most a minute). Not more often: a full
board's save takes a slow phone about 30 ms, a small hitch. Saved under the key
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

## What the tests expect (`tests/dropper-world/run.mjs`)
Each numbered section runs in its own process (several at once, about 3.5 minutes in all), starting
from a fresh game with its own seeded random numbers, so results repeat exactly and no section can
change another's numbers. When a change moves a number, update it here and say why in the commit.
- 150-piece mixed pile: no broken numbers, deepest overlap about 0.6 px, about 140 asleep.
- Ball dropped from 6 blocks: bounces to 3.37, 2.13, 1.52 blocks.
- 70 pieces on one spot: a mound peaking around 10.7 blocks (the check wants 8–17).
(When the mole started digging up the hay and flinging it, instead of hay just appearing, most of
these moved a little: the first few seconds of every game are now the mole throwing hay, so every
piece after that falls at a different moment, and the random numbers come out in a different
order. Nothing about how things behave changed apart from the hay.)
- Two minutes of play, nobody steering the mole: Sadie never rises faster than about 4 blocks per
  second, never stays buried, the mole has flung out the first 3 bundles after about 4.1 s, every
  bundle bounces (21 bounces for 7 bundles), floating hay never sinks below where it floated up to,
  there are never more than 3 about and never one short for more than about 4.3 s (the check allows
  20), the mole aims each one 10–18 blocks from the last, each floats up out of her reach, she eats
  4 bundles (the check wants at least 4), and her longest wait between snacks is about 30 s (the
  check allows up to 40). Time spent fetching her barn doesn't count as waiting.
- 110 pieces on one spot (peak about 14.6 blocks): 15 become fossils, all buried at least 8
  blocks, and a boulder landing on top wakes none of them.
- The mole burying the barn on its own: the pile gets about 0.9 blocks over its roof before Sadie,
  having climbed well above it, goes to fetch it (the check wants at least half a block: either
  reason sends her), once (about 14 s), and it ends up about 5.7 blocks higher with nothing near it
  higher than its roof, inside the walls, with no piece sunk into it more than about 0.2 px.
- Chooter arriving: on a fresh board with the mole building, he first peeks in at about 3:30, over
  the wall nearer Sadie, and can be tapped then; he bursts in at about 4:44 (the check wants
  between 3 and 7 minutes, with at least 30 s of peeking first). How wound up he is comes back
  from a save. A downpour of 300 pieces for a minute only gets him 40% of the way (at most 1/150 a
  second, so never under 2.5 minutes).
- Chooter: on a pile the mole grew for 90 s, over 4 minutes he greets her (about 15 s, leaping in
  over the wall), has 3 bouts of zoomies knocking about 44 pieces, brings back 6 of the 6 balls
  thrown for him, moves into the barn and comes back out, and never gets stuck in the pile or
  leaves the board.
- Debug tools: raining 100 pieces drops them all in about 8 s with no piece sunk into another more
  than about 1 px; "Build a tall pile" peaks around 20.3 blocks and goes back to normal speed; "Put
  her on top" puts Sadie about 18.6 blocks up, standing; the Sadie and Chooter buttons each start
  what they say; clearing the tower stops any rain.
- Saving: a game saved after 70 s of play (38 pieces, 21 still moving, Chooter met) comes back the
  same after a JSON round trip, then plays on for 20 s with Sadie never stuck in the pile and no
  piece sunk into another more than about 0.37 px (the check allows 2.5); hay still flying, and hay in the
  mole's paws, come back too; a save from another
  version is refused; Clear tower keeps Chooter; Start over forgets him.
- Teasing: on a pile the mole grew for 90 s, over 4 minutes, Chooter snatches Sadie's hay once
  (after about 94 s), she runs after it (all 20 s) and this time doesn't catch him, so he
  drops it at 20 s (it can also end with her catching him), nobody turns back and forth more than
  about twice a second (8 turns in 20 s), there are never more than 3 bundles about and never
  one short for more than about 5.4 s, and he never gets stuck in the pile.
- Cornered: Chooter carrying the hay near the right wall with Sadie 2.5 blocks behind on a flat
  board. Neither jitters (he turns once, she turns twice), and she gets the hay in about 1.3 s.
  (This guards against them flipping back and forth forever, with her never getting it.)
- Thoughts (what the dashboard shows): 4 minutes with Chooter just met, reading all three minds (Sadie, Chooter, the
  mole) every half second. They always have something to say (26 different "doing" lines come
  up), nobody has more than 4 feeling bars, every feeling bar is between 0 and 1, and reading
  thoughts never uses a random number (so tapping a character can't change what happens next).
- The mole: 3 minutes of a fresh game. Every piece lands either within 1.5 blocks of whoever it's
  burying (23 on Sadie; Chooter hasn't burst in yet) or on the barn (78), none anywhere else,
  and whenever Sadie is at least half impatient the mole is burying someone. Never two pieces
  closer than 1.5 s. Then a pretend struggling game (the simulation taking 80% of each second): the
  gaps between pieces (or the quiet stretch before its nap) stretch to about 3.8 s, it's napping
  after 8 s and drops nothing while it naps, and 12 s after the game calms down it's back to work.
- Bedrock: a fresh board has none. Raining 700 pieces over the whole board (the slowest section,
  about 3.5 minutes: a messy heap makes every step work hard): nothing melts until there are more
  than 400 (the first melt comes at 403), then about 367 melt into bedrock (2–39 blocks up),
  leaving about 396 pieces (from about 469 at the most, since pieces rain in faster than deep ones
  become fossils). Where the bedrock rises it's always at least 12 blocks under the pile, every
  piece that melts ends up completely inside the rock (so nothing that rested on it is left
  hanging), no piece is left inside it, nothing that can move sinks into it, and the mole mentions
  it. A box sliding fast into the side of a 5-block step in the bedrock stops against it (it
  tumbles up to about 3.7 blocks high, never on top). It comes back exactly from a save (about
  208 KB), and a save from before bedrock loads with flat ground.

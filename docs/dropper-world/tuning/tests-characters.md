# What Dropper World's character tests expect

The numbers `tests/dropper-world/run.mjs` expects for two minutes of play, the barn, Chooter,
saving, teasing, thoughts and the mole. Read when a change moves one of them. The physics, pile,
debug and bedrock tests (and how the sections run): `tests-world.md`. When a change moves a
number, update it here and say why in the commit.

- Two minutes of play, nobody steering the mole:
  - Sadie never rises faster than about 4 blocks per second and never stays buried.
  - The mole has flung out the first 3 bundles after about 4.1 s, every bundle bounces (18 bounces
    for 7 bundles), floating hay never sinks below where it floated up to.
  - There are never more than 3 about and never one short for more than about 4.2 s (the check
    allows 20), the mole aims each one 10–18 blocks from the last, each floats up out of her reach.
  - She eats 4 bundles (the check wants at least 4), and her longest wait between snacks is about
    33 s (the check allows up to 40). Time spent fetching her barn doesn't count as waiting.
- The mole burying the barn on its own: the pile gets about 2.8 blocks over its roof before Sadie,
  having climbed well above it, goes to fetch it (the check wants at least half a block: either
  reason sends her), once (about 26 s), and it ends up about 7.1 blocks higher with nothing near
  it higher than its roof, inside the walls, with no piece sunk into it more than about 0.2 px.
- Chooter arriving: on a fresh board with the mole building, he first peeks in at about 3:15, over
  the wall nearer Sadie, and can be tapped then; he bursts in at about 4:41 (the check wants
  between 3 and 7 minutes, with at least 30 s of peeking first). How wound up he is comes back
  from a save. A downpour of 300 pieces for a minute only gets him 40% of the way (at most 1/150 a
  second, so never under 2.5 minutes).
- Chooter: on a pile the mole grew for 90 s, over 4 minutes he greets her (about 2 s, leaping in
  over the wall), has 3 bouts of zoomies knocking about 30 pieces, brings back 8 of the 8 balls
  thrown for him, moves into the barn and comes back out, and never gets stuck in the pile or
  leaves the board.
- Saving: a game saved after 70 s of play (36 pieces, 15 still moving, Chooter met) comes back the
  same after a JSON round trip, then plays on for 20 s with Sadie never stuck in the pile and no
  piece sunk into another more than about 1.5 px (the check allows 2.5). Hay still flying, and hay
  in the mole's paws, come back too; a save from another version is refused; Clear tower keeps
  Chooter; Start over forgets him.
- Teasing: on a pile the mole grew for 90 s, over 4 minutes, Chooter snatches Sadie's hay once
  (after about 143 s), she runs after it (all 20 s) and this time doesn't catch him, so he drops
  it at 20 s (it can also end with her catching him). Nobody turns back and forth more than about
  twice a second (9 turns in 20 s), there are never more than 3 bundles about and never one short
  for more than about 6.7 s, and he never gets stuck in the pile.
- Cornered: Chooter carrying the hay near the right wall with Sadie 2.5 blocks behind on a flat
  board. Neither jitters (he turns once, she turns twice), and she gets the hay in about 1.3 s.
  (This guards against them flipping back and forth forever, with her never getting it.)
- Thoughts (what the dashboard shows): 4 minutes with Chooter just met, reading all three minds
  (Sadie, Chooter, the mole) every half second. They always have something to say (26 different
  "doing" lines come up), nobody has more than 4 feeling bars, every feeling bar is between 0 and
  1, and reading thoughts never uses a random number (so tapping a character can't change what
  happens next).
- The mole: 3 minutes of a fresh game. Every piece lands either within 1.5 blocks of whoever it's
  burying (18 on Sadie; Chooter hasn't burst in yet) or on the barn (84), none anywhere else, and
  whenever Sadie is at least half impatient the mole is burying someone. Never two pieces closer
  than 1.5 s. Then a pretend struggling game (the simulation taking 80% of each second): the gaps
  between pieces (or the quiet stretch before its nap) stretch to about 5.8 s, it's napping after
  8 s and drops nothing while it naps, and 12 s after the game calms down it's back to work.

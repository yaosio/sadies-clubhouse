# What Dropper World's physics, pile, debug and bedrock tests expect

The numbers `tests/dropper-world/run.mjs` expects for the physics, the pile, fossils, the debug
tools and the bedrock. Read when a change moves one of them. The play, barn, Chooter, saving,
thoughts and mole tests: `tests-characters.md`. When a change moves a number, update it here and
say why in the commit.

Each numbered section runs in its own process (several at once, about 60 s in all on Claude's
cloud machine), starting from a fresh game with its own seeded random numbers, so results repeat
exactly and no section can change another's numbers.

- 150-piece mixed pile: no broken numbers, deepest overlap about 0.75 px, about 148 asleep.
- Ball dropped from 6 blocks: bounces to 3.37, 2.13, 1.52 blocks.
- 70 pieces on one spot: a mound peaking around 12 blocks (the check wants 8–17).
- (When the mole started digging up the hay and flinging it, instead of hay just appearing, most
  of these moved a little: the first few seconds of every game are now the mole throwing hay, so
  every piece after that falls at a different moment, and the random numbers come out in a
  different order. Nothing about how things behave changed apart from the hay.)
- 110 pieces on one spot (peak about 17.4 blocks): 20 become fossils, all buried at least 8
  blocks, and a boulder landing on top wakes none of them.
- Debug tools: raining 100 pieces drops them all in about 8 s with no piece sunk into another more
  than about 1 px; "Build a tall pile" peaks around 21.6 blocks and goes back to normal speed;
  "Put her on top" puts Sadie about 21.3 blocks up, standing; the Sadie and Chooter buttons each
  start what they say; clearing the tower stops any rain.
- Bedrock: a fresh board has none.
  - Raining 700 pieces over the whole board (the slowest section, about 60 s: a messy heap makes
    every step work hard): nothing melts until there are more than 400 (the first melt comes at
    402), then about 369 melt into bedrock (2–46 blocks up), leaving about 394 pieces (from about
    497 at the most, since pieces rain in faster than deep ones become fossils).
  - Where the bedrock rises it's always at least 12 blocks under the pile, every piece that melts
    ends up completely inside the rock (so nothing that rested on it is left hanging), no piece is
    left inside it, nothing that can move sinks into it, and the mole mentions it.
  - A box sliding fast into the side of a 5-block step in the bedrock stops against it (it tumbles
    up to about 3.7 blocks high, never on top).
  - It comes back exactly from a save (about 206 KB), and a save from before bedrock loads with
    flat ground.

# The Hedge Maze

A block of clipped hedge in the grounds beside Sadie's clubhouse, on the right as you walk up
(`src/activities/hedge-maze/`), in the grounds' first spot (`grounds` 0: `GROUNDS` in
`src/clubhouse/outside.js`), which runs from the front garden back to the backyard. Inside it's a
maze much bigger than the block, made in front of you as you walk, that lets you out into the
backyard, where Sadie naps on the bench.

## Design pillars (these win over any feature idea)

- **It stays put.** What's been made is never changed while you could see it: walk back and the
  hedges you passed are all still there. Only new ground is made up, always two corners ahead of
  you, where you can't see.
- **The way through always works.** It heads on or sideways, never back, so it can't wall itself in;
  the turns that aren't the way through are short dead ends that never get in its way.
- **It's sneaky.** The end always lets you out into the backyard, even if you came in from the
  backyard (so the NO ENTRY gate brings you straight back out where you started). And after you
  leave, the gate still shows the bit of maze you just walked out of: turn round and walk back in,
  and it all looks the same until the first corner, but past it it's a new maze. Turns hide every
  change. (The owner's design.)
- **A new maze every visit**, from either gate.
- **Not a trap.** The backyard is also just round either side of the house: the maze is one way
  there, not the only one.
- **Kind to the ears** (the owner has misophonia): the music is a soft garden music box, composed
  as it plays, so it never loops; every note dies away by itself, and there's a quiet moment between
  pieces. No other sounds.

## Its pages

- `playing.md`: the block outside, the maze inside, the clubhouse over the hedges and Sadie, as the
  player sees them. Read before changing what the player meets.
- `how-built.md`: which file does what (card, drawing, block, art, music) and its checks. Read
  before changing any of its code.
- `growing.md`: how `grow.js` makes the maze, its doors, leaving and coming back. Read before
  changing how the maze grows.
- `parked.md`: parked ideas (don't start unless asked).
- `history.md`: when the owner asked for it and where. Only read before undoing a choice.

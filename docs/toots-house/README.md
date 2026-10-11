# Toots' House

The fourth building round the town square outside Sadie's front gate (`src/activities/toots-house/`),
on the plot beside Chooter's Paint Shop (`lot` 3), with the path out of the square between them.
An ordinary two-story house that's plainly a dog's. Toots was the owner's dog: a black pit mix with a
gray muzzle who loved everybody and loved tennis balls. She watches you from her upstairs window,
talks to you with her own real roo, and inside she plays fetch. Her real activity is still to come
(the owner has one in mind: looking out the big back window into the backyard).

## Design pillars (these win over any feature idea)

- **Her front left leg is never drawn.** Not in any picture, pose or animation. Her two side views are
  drawn separately on purpose and never made by flipping (flipping would move the missing leg). A
  check fails if a front left leg ever appears.
- **She loved everybody.** Warm and welcoming everywhere: she's always glad to see you, the doormat
  says so, and her friends' pictures are on her wall. Spoken of fondly, in the past tense, in words.
- **Only ever her real voice.** Her sounds are cut from the owner's videos of her, with no people in
  them, and never made up. Rare and soft (`docs/clubhouse/RULEBOOK.md` section 4): no loops.
- **A real two-story house.** Two floors inside, with stairs between them, and big inside.

## Its pages

- `playing.md`: the house from outside, Toots in her window, inside, fetch, and her sounds. Read
  before changing what she does or how the house looks.
- `how-built.md`: which file does what, her drawings, her sounds, its checks. Read before changing
  its code.
- `parked.md`: parked ideas (don't start unless asked).
- `history.md`: how the owner asked for it. Only read before undoing a choice.

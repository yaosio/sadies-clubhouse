# Dropper World's simulation files (core/)

Which file in `core/` does what, apart from the physics, the characters and saving (`physics.md`,
`minds.md`, `saving.md`). Read before changing the simulation. Its numbers: `docs/dropper-world/tuning/`
pages.

- `core/world.js`: the `world` object: every piece, the held piece, hay, supply, timers,
  particles, bests. Shared state lives here.
- `core/events.js`: tiny event bus (`on`, `emit`).
- `core/game.js`: `resetGame()` and `update(dt)`: the one place that decides what runs each tick,
  in order (`events.md`).
- `core/surface.js`: reading the pile.
  - Heightmap `surf` (hay, the mole's hover height) and `groundAt` (exact solid spans so Sadie can
    tell floor from overhang).
  - Also holds the bedrock's top (`rock`, `rockAt`, `rockTop`, `rockInfo`): the real floor under
    everything.
  - The sleeping pieces' part of `surf` is kept between steps and only redone when one wakes,
    falls asleep or goes, or the bedrock changes.
- `core/fossil.js`: turns pieces buried deep in the pile into fossils: permanent ground that never
  wakes.
- `core/bedrock.js`: once the board has more than 400 pieces, melts the deepest fossils (buried
  deeper still) into the bedrock, just enough to stay under. They stop being pieces and raise the
  floor to exactly their top (filling any cave under them, so nothing is left hanging), leaving
  flecks of their color. This is what lets the tower grow forever without getting slower.
- `core/toys.js`: toys the player throws for the friends (a ball so far): one out at a time,
  bounces off the pile without pushing it, vanishes once played with.
- `core/barn.js`: Sadie's barn: a fixed building in the pile (pieces land on it and bury it, Sadie
  can stand on it). Dragged behind Sadie on a trip home, otherwise drops onto whatever is under
  it.
- `core/hay.js`: Sadie's hay.
  - Bundles the mole flings (`throwHay`, aimed along a trail; up to 3 about, `hayWanted` says when
    another's due), flying and bouncing over the pile without pushing it.
  - Then floating up out of reach once settled, and riding the pile up/down (never below where it
    floated to). Offers `food` once landed.
  - Can be picked up (`pickUpHay`, it goes where the carrier puts it) and put down (`putDownHay`,
    drops onto the pile).
- `core/dropper.js`: the piece the mole carries and the supply: flying to a spot (`flyTo`), hover
  height, letting go (`dropHeld`, only with a full supply), the piece bag. No decisions: the mole
  makes those.
- `core/debug.js`: dev-sheet helpers (for us, not players): game speed, raining lots of pieces,
  building a tall pile fast, putting Sadie on top, and making Sadie, Chooter and the mole do
  things right now (wearing the mole out: `tireMoleNow`). Uses no random numbers unless a button
  was pressed.
- `core/effects.js`: particles and Sadie's floating emotes (notes, hearts, steam).

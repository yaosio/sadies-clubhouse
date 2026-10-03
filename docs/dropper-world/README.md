# Sadie's Dropper World

The clubhouse's first activity (`src/activities/dropper-world/`), on the computer in its room. A cozy
physics toy: a mole up in the sky drops squishy jelly pieces, Sadie climbs the piles to eat hay,
and friends turn up and move into her barn. The tower can grow forever. It's a toy, not a game to
win. Who's in it and what the player does: `playing.md`.

## Design pillars (these win over any feature idea)

- The satisfying part is watching pieces squish, pile up, and topple. Protect that above all.
- Unhurried: the mole drops at most one piece every 1.5 s (slower when it's tired), so every
  squish and topple can be watched.
- Physics feel is tuned by us, never by the player. Variety comes from piece types.
- The mole decides where pieces go, for its own reasons (everything belongs underground). It never
  means to help Sadie; when it does, it's by accident.
- Sadie is a character with moods, not a cursor.
- The player controls the camera. Once they've moved it, it never moves or zooms by itself.
- Believable, not accurate: the physics only has to look real, so cheat wherever nobody can tell
  (never on the squish itself). It's a lost 90s shareware toy pushing the hardware too hard, and
  sometimes the hardware pushes back: slowing down is fine, stuttering isn't.
- One feature at a time. Make sure it's fun before the next.

## Its pages

- `playing.md`: the game as the player sees it (read first if you're new to it).
- `parked.md`: ideas not to start unless the owner asks.
- `look.md`: its 90s look and how far it's got (read before changing how anything looks).
- `look-interface.md`: the frame, dashboard and keys, planned and as built.

**The code** (`how-built/`):
- `how-built/layers.md`: the three layers and the rule that keeps `core/` headless (read first).
- `how-built/frame.md`: card, page, boot, game loop, config (screen layout, start-up, the loop).
- `how-built/core.md`: the world, pile, fossils, bedrock, barn, hay, toys, debug.
- `how-built/physics.md`: piece types and the soft-body solver's files.
- `how-built/minds.md`: the files for feelings, offers, thinking, Sadie, Chooter and the mole.
- `how-built/render.md`: the camera, chunky pixels and drawing.
- `how-built/ui-input.md`: dashboard, help, toy box, dev sheet, touch and keys.
- `how-built/saving.md`: saving and loading (read before adding anything to the save).
- `how-built/events.md`: its events and the order of each tick.
- `how-built/common-changes.md`: recipes: new piece type, behavior, friend, debug button...
- `how-built/checks.md`: its tests and tools.

**The numbers** (`tuning/`, read before changing a number or when a test's numbers move):
- `tuning/world-solver.md`: board, solver, sleeping, game loop.
- `tuning/materials.md`: each piece type's material numbers.
- `tuning/supply-mole.md`: the supply, where the mole drops, how it tires.
- `tuning/fossils.md`: when buried pieces turn to fossils.
- `tuning/bedrock.md`: when and how fossils melt into bedrock.
- `tuning/barn.md`: the barn and Sadie's trips home.
- `tuning/hay.md`: digging, flinging and floating hay.
- `tuning/chooter.md`: Chooter's arrival, speeds, play, zoomies, ball, tiredness.
- `tuning/chooter-teasing.md`: Chooter stealing Sadie's hay.
- `tuning/sadie.md`: Sadie's reach, speeds, pacing and moods.
- `tuning/toys-surface.md`: the ball, and what counts as ground.
- `tuning/debug.md`: the dev sheet's Debug tab.
- `tuning/tests-world.md`: what the physics, pile, debug and bedrock tests expect.
- `tuning/tests-characters.md`: what the play, barn, Chooter, saving, thoughts, mole tests expect.

**The characters** (`characters/`, read before changing how anyone behaves):
- `characters/minds.md`: how feelings, offers and activities make behavior; adding an interaction.
- `characters/sadie.md`, `characters/chooter.md`, `characters/mole.md`: who they are and why they
  do things.

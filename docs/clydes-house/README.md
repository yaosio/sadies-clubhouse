# Clyde's House (The Overthinkery)

The first building outside Sadie's front gate (`src/activities/clydes-house/`), on the first plot
round the town square (`lot` 0); Chooter's Paint Shop is on `lot` 1, and more plots wait
for more buildings. Clyde, a little terracotta spark of a helper, lives in The Overthinkery. Indoors
is the Good Morning Machine, a ten-step machine to hand Sadie one treat; outside beside the house is
Clyde's Weather Machine, which changes the weather for the whole world.

## Design pillars (these win over any feature idea)

- **The joke is overthinking.** A helper who builds a ten-step machine to hand a cat one treat, and
  "improves" it by making it harder. Everything Clyde says is earnest, polite and a bit too much.
- **Short and satisfying.** A run takes about ten seconds and ends with Sadie eating her treat;
  the whole arc (four rounds and the finale) is a few minutes. No timer, no losing: a wrong part
  just gets a comment and waits for you to swap it.
- **It happens in the room, in the world**, like the music room: the machine is real 3D on the
  wall, and you play it right there.
- **Kind to the ears** (the owner has misophonia). Every sound is a single short, soft blip when
  something happens, and nothing loops, hums or rattles: no rolling marble, no whirring wheel or
  fan, no purring or crunching. The same sound can't play twice within a tenth of a second.
  Each group of sounds has its own file in `sounds/`.
- **Sadie wants the machine.** The finale's punchline: handed the treat directly, she turns her
  back on it and goes to sit by the machine.

## Its pages

- `playing.md`: Clyde, the house, Sadie, and how you play the Good Morning Machine (controls,
  sounds, what's saved). Read before changing what the player meets indoors.
- `machine.md`: the Good Morning Machine's parts, the junk and what each bit does, the rounds and
  the finale. Read before changing the machine or its puzzle.
- `weather-machine.md`: Clyde's Weather Machine outside: what it is, its levers, the weathers,
  Sadie's reactions, its sounds and save. Read before changing it.
- `how-built.md`: which file does what (the house, both machines, the sounds), being far off and
  put away. Read before changing its code.
- `checks.md`: its tests and the tools that take pictures of it. Read before changing a check or
  checking a change by eye.
- `parked.md`: parked ideas (don't start unless asked).
- `history.md`: when the owner asked for it, and Clyde's name. Only read before undoing a choice.

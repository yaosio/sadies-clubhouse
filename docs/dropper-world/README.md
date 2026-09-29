# Sadie's Dropper World

The clubhouse's first activity (`src/activities/dropper-world/`), on the computer in its room.

A cozy physics toy. A mole up in the sky (in a propeller beanie) drops squishy jelly pieces on
anything it thinks should be underground: the barn, and anyone who looks restless. Sadie (the
owner's late cat, drawn from a photo) climbs the piles to eat bundles of hay (she thought she was a
cow), and every so often drags her barn back up out of the pile. The hay comes from the mole: it
digs it up, flings it away in disgust, and the hay floats, just like the mole (it's not the hat).
Friends turn up because of what happens in the world, then move into the barn: the first is
Chooter, a black lab/pitbull mix next door who hears all the thudding, can't stand it, and bursts
in. He gets the zoomies and fetches the ball you throw him from the toy box. The player watches,
taps anyone to see what they're thinking, and throws Chooter his ball. The tower can grow forever:
once it's big, the weight of everything above melts the deepest pieces into candy bedrock. It's a
toy, not a game to win.

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

## Its other pages

- `ARCHITECTURE.md`: the map of its code (read before changing anything in it).
- `TUNING.md`: the numbers that make it feel right, and what its tests expect.
- `CHARACTERS.md`: who Sadie, Chooter and the mole are and why they do what they do, and how
  feelings, offers and activities turn that into behavior (read before changing how anyone behaves).
- `ART_STYLE.md`: its 90s look, going in step by step (read before changing how anything looks).

## Parked ideas (don't start unless asked)

Sadie batting pieces around, upgrading Sadie's barn, more friends after Chooter, friends building
things out of dropped pieces, sky zones with different physics, unlocking piece types, prestige by
melting the tower, a desktop-toy version, other ideas for the dashboard (it shows one
character's thoughts at a time, and only their strongest feeling).

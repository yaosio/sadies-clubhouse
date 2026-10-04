# Clyde's Weather Machine

The machine outside beside the house: what it is, its levers, the weathers, Sadie's reactions, its
sounds and save. Read before changing it (its code files are in `how-built.md`). What the weather itself does is the
world's code: `docs/clubhouse/outside/weather.md`.

## What it is

Clyde's, so it stands beside his house, and outdoors, since it changes the weather for the whole
world. On the grass beside the house, on the side away from the middle of the town square, with stepping
stones from the square: a mint-green enamel cabinet with far too much on top (a dish turning slowly, wind cups that
spin faster in bad weather, a funnel that puffs out a cloud each time you pull a lever), a sign
(CLYDE'S WEATHER MACHINE / MORE WEATHER IN THE FULL VERSION!), a green screen with the forecast
(TODAY: RAIN / FOR THE PLANTS), a note on a stake (PLEASE DO NOT PULL THE LEVERS. (THAT WAS A JOKE.
PLEASE DO.)), and four levers with brass plates: **RAIN**, **SNOW**, **2ND SUN** and **CATS**.

Walk up to a lever and press E (PULL on a phone): its weather comes over everywhere out of doors
(the garden, the town square, the Hedge Maze, and what you see of them through a door) in about three
seconds, and every other lever goes back up. Pull it again and the sky clears. One weather at a
time.

**The weather is the world's, not Clyde's** (since 2026-10-02: `src/clubhouse/weather/`). The
machine only says which (its kit's `weather.set`), and shows it: its levers, its forecast and its
wind cups follow the weather whoever changed it. What the weather does (below) is the world's code.

## The weathers

- **Rain:** a dark dome of cloud covers the sky (and hides the sun), the light goes dim, and
  pixelly streaks fall all round you (or round the door you're looking out of; while nobody can
  see outside, no rain or snow is worked out at all).
- **Snow:** pale lavender cloud, flakes drifting down, and the ground slowly goes white (it takes
  about forty seconds to settle, and melts in ten once it stops).
- **2nd sun:** a second sun comes up over the hills right beside the first (clear of the
  clubhouse, looking in from the gate), and everything's brighter.
- **Cats:** pink cloud, and cats (ginger, black or grey; a new one every moment or so, up to a
  dozen at once) fall tumbling from the sky, each one rights itself just before the ground (they
  always land on their feet), sits a moment, and poofs.

**Sadie** on the gatepost reacts (the world's weather does this, with her own mew and mrrp:
`src/clubhouse/weather/sounds.js`): a little pink umbrella in the rain, a heap of snow on her head,
sunglasses for the second sun, and a word bubble for a few seconds once it arrives (rain MEW!, snow
MRRP?, sun ..., cats MINE., clear MRRP.), with her mew or mrrp if you're outside (fading with how
far off she is; nothing beyond 30 m).

## Sounds

The lever's clunk and one soft music-box jingle for each weather as it arrives (three low notes
going down for rain, three high ones for snow, going up for the sun, a questioning little tune for
cats, two settling notes for clear). Nothing plays while it rains or snows: no hiss, no patter, no
dripping.

## Saving

The weather is saved by the world (`mansion.weather`), so it's still there after a reload, and the
pause menu's CLYDE'S HOUSE button leaves it alone (EVERYTHING clears it). A weather saved where it
used to be (`sadies-clubhouse.clydes-house.weather`) is brought in once, the first time the room is
built, and let go. The machine is built with the house, into the outside, so it stays when the room
inside is put away.

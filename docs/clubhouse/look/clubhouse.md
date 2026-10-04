# The clubhouse's look

What the owner has decided about how Sadie's house and the world round it look. Read before changing
how the house, the hall, the grounds or the town square look. Built in `src/clubhouse/`
(`docs/clubhouse/world/README.md`).

The clubhouse is Sadie's house and the world round it: activities behind doors in the house, and
buildings in her grounds and round the town square outside the gate. The owner okayed the look. The approved
mock-up: `art/clubhouse/` (`mockup.js` is the 3D scene, `page.js` the page around it;
`node art/clubhouse/build.mjs && node art/clubhouse/shots.mjs` builds it and takes the pictures),
published at https://claude.ai/artifact/VNmFkn6rgQdKq8aW2z3BgF.

## Crappy late-90s 3D
Grown from a real-3D test room the owner approved:
- Low resolution: at most 960 pixels across the long side of the screen, so desktop gets about as
  much detail as an upright phone and painted words stay readable (it used to be much blurrier on
  desktop).
- Corners that snap to the pixel grid; textures don't swim (they did at first, and the owner found
  it far too distracting).
- Few colors with dithering, lit per corner.
- Characters stay flat pixel sprites that turn to face you.
- Its textures are drawn when the page opens (`look.js`). Sadie's sprite and every activity's box
  and door are drawn by a script under `art/` (each activity's `door.js` header says which) (run it after changing a drawing).

## The house
- **A real, recognizable house a cat has clearly taken over.** The cat is in the details: turrets
  that lean out like ears, a cat weathervane, fish-scale slates, porch pillars wrapped in scratching
  rope, a cat flap in the front door, a FRIENDS ONLY mat, fish-bone and paw-print damask, portraits
  of Sadie, the shredded armchair, Sadie asleep in a box in a sunbeam, a cat door by every door.
  Sadie's own colours (white going lavender, grey, tan, pink), turned up loud.
- **A cat tree.** A tall round hall with a giant scratching post up the middle and a spiral
  staircase round it (a staircase, no elevator); each floor is a ring of doors. It grows up (the top
  is always being built) and out (branches: wings and side towers, for grouping rooms). Adding rooms
  never changes what's already built.
- **Rooms can be any size**, and bigger inside than the house could hold. Some games live in the
  world rather than on their own screen.
- **No loading screens or obvious transitions** unless they fit: a door just opens onto its room. It
  has to stay smooth. The inside doesn't have to match the outside (the owner's call): the front door
  leads to a separate place, so either can change without the other.

## Round the house
- **Outside the gate, a town square** (`docs/clubhouse/outside/square.md`), with plots round it for
  buildings of their own (the owner plans more). Everything outside the gate belongs to somebody
  else (the owner's rule): Sadie's things are in the house and her grounds. Each building's look is
  in its own docs. The next free plot has a NEW HOUSE COMING SOON!! stake.
- **The backyard**, behind the house, looks finished too (the owner asked, 2026-10-01): windows all
  round, a teal back door with a lion-sized cat flap (STAFF ONLY (CATS); it doesn't open), lamps,
  flower beds, a flagstone patio, a bird bath, trees, a fence round the grounds, and a bench in a
  patch of sun where Sadie naps, Zs drifting up. Beside the house (on your right as you walk up from
  the gate) is a hedge block in the grounds, with an arch and a garden gate at each end.
- **You start outside**, at the gate. The first time only, Sadie's letter invites you: she's decided
  to share her clubhouse with all her friends.

## On screen
- **Normal game controls** (WASD and mouse, a thumb stick on phones) and no big chunky frame: just a
  pause button and a small hint at a computer. An activity on a computer keeps its own 90s frame.
- The pause menu can start the whole game over, or single things (the invitation, a broken game, and
  so on), always asking "are you sure?" first.

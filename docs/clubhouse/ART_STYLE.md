# Art style: the misremembered 90s

The look every part of Sadie's Clubhouse shares. Each activity's own look is in its own docs
(`docs/dropper-world/ART_STYLE.md`, `docs/typefitter/README.md`).

## The idea
Everything here is lost software: 90s shareware that was never finished but always promised a full
version soon. It looks like the 90s as people *remember* them, not as they were. Anyone seeing it
should think "yeah, that's from the 90s", even though it does things no 90s PC could. Early DOS,
mid-90s multimedia and late-90s shine are mashed together into programs that never existed.

- **Colors:** bright and loud, like Kid Pix. Never drab.
- **True to the 90s:** chunky low-res pixels, a small palette, ordered dithering (checkerboard
  and crosshatch dots) instead of smooth gradients, tiny blocky text.
- **Impossible for the 90s ("strangely well made"):** smooth squishy physics with many pieces,
  shading that's too careful and soft for the era, expressive characters, glossy highlights,
  sparkles and lens flare, crisp on any screen.
- **Each activity is a DOS program that invented its own look** (no gray Windows look, no title
  bars or close boxes), in the candy-purple frame that started in Dropper World
  (`docs/dropper-world/ART_STYLE.md`). TypeFitter has its own copy of that look: moving it into
  the toolbox would mean retesting every activity, so it waits until the frame next changes in both.
- **The never-finished feeling** comes from the promises: "CHAPTER 2 COMING SOON 1996!", locked
  tools, save only in the full version. **No prices and no order buttons** (the owner said no).

## Sadie's mansion (built)
The clubhouse is Sadie's mansion, and each activity has its own room. The owner okayed the look.
Built in `src/clubhouse/` (how it works: `docs/clubhouse/ARCHITECTURE.md`). The approved mock-up:
`art/mansion/` (`mockup.js` is the 3D scene, `page.js` the page around it; `node
art/mansion/build.mjs && node art/mansion/shots.mjs` builds it and takes the pictures), published at
https://claude.ai/artifact/VNmFkn6rgQdKq8aW2z3BgF. What the owner has decided so far:
- **Crappy late-90s 3D**, grown from a real-3D test room the owner approved: low resolution,
  corners that snap to the pixel grid (textures swam too at first; the owner found it far too
  distracting, so they don't), few colors with dithering, lit per corner; characters stay flat
  pixel sprites that turn to face you. Its textures are drawn when the page opens (`look.js`);
  Sadie's sprite and every activity's box and door are drawn by `art/clubhouse/pictures.py` (run
  it after changing a drawing).
- **A cat tree.** A tall round hall with a giant scratching post up the middle and a spiral
  staircase round it (a staircase, no elevator); each floor is a ring of doors. It grows up (the top
  is always being built) and out (branches: wings and side towers, for grouping rooms). Adding
  rooms never changes what's already built.
- **Rooms can be any size**, and bigger inside than the house could hold. Some games live in the
  world rather than on their own screen, like Brickbuster '96 (being built: `docs/brickbuster/`), a
  Breakout whose ball of yarn escapes into the mansion and breaks the game (then Sadie puts up an
  OUT OF ORDER sign).
- **No loading screens or obvious transitions** unless they fit: a door just opens onto its room.
  It has to stay smooth. The inside doesn't have to match the outside (the owner's call): the front
  door leads to a separate place, so either can change without the other.
- **Resetting:** the pause menu (in the real game too) can start over everything or one thing at
  a time (the invitation, an activity's saves), always asking "are you sure?" first.
- **Outside the gate, a lane** runs along the fence, with plots either side of the path for
  buildings of their own (the owner plans more). The first is Claude's House, The Overthinkery: a
  crooked butter-yellow cottage with terracotta tiles (`docs/claudes-house/`). The next free plot
  has a NEW HOUSE COMING SOON!! stake.
- **You start outside**, at the gate. The first time only, Sadie's letter invites you: she's
  decided to share her clubhouse with all her friends. The pause menu can start the whole game
  over, or single things (the invitation, the broken Breakout, and so on).
- **Normal game controls** (WASD and mouse, a thumb stick on phones) and no big chunky frame: just
  a pause button and a small hint at a computer. Each activity keeps its own 90s frame: they're
  programs on a computer, in their rooms.
- **The look:** a real, recognizable mansion a cat has clearly taken over. The cat is in the details:
  turrets that lean out like ears, a cat weathervane, fish-scale slates, porch pillars wrapped in
  scratching rope, a cat flap in the front door, a FRIENDS ONLY mat, fish-bone and paw-print damask,
  portraits of Sadie, the shredded armchair, Sadie asleep in a box in a sunbeam, a cat door by every
  door. Sadie's own colours (white going lavender, grey, tan, pink), turned up loud.

## Before the mansion
The first idea was a flat 2D menu, back when this was called Sadie's Play Place (its mock-ups still
say so): a room with a cubby shelf, one software box per activity, Sadie on top, a LED board saying
what the chosen one is, and PLAY!. Mock-ups in `art/clubhouse/` (drawn by `clubhouse.py`, using
`kit.py`, the shared bits of `art/90s-style/mockup-2.py`): `clubhouse-wide.png` and
`clubhouse-phone.png`, the same menu in pseudo-3D (`clubhouse3d-wide.png`, `clubhouse3d-phone.png`,
drawn by `clubhouse3d.py`), and `activity-phone.png` (inside an activity, the frame shrinks to a
strip with ESC BACK, F1 HELP and the activity's own buttons). The shelf room was built, then
replaced by the mansion. The old real-3D test room's page
(https://claude.ai/artifact/Bh3FjRZvgZxr5padPtgK3J) is left as it was.

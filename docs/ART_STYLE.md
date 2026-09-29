# Art style: the misremembered 90s

**Status: approved, going in step by step.** Step 1 (on the working branch, not in the real game
yet): chunky pixels over everything, the new sky, sun, clouds, hills and ground, and the
gummy jelly pieces. Next: Sadie, then the mole, Chooter, hay and barn. The interface is done (see the end). The picture to match is
`art/90s-style/mockup-2.png` (drawn by `art/90s-style/mockup-2.py`). `mockup-1` is the first try,
kept for reference only.

**Sadie's Play Place** (approved), a 90s activity center with
several activities, the tower game ("Sadie's Dropper World") being the first. Mock-ups in
`art/play-place/` (drawn by `clubhouse.py`, using `kit.py`, the shared bits of `mockup-2.py`):
`clubhouse-wide.png` and `clubhouse-phone.png` (the menu: a room with a cubby shelf, one software
box per activity, Sadie on top, a LED board saying what the chosen one is (not whether it saves:
the owner doesn't want that shown) and PLAY!), the same menu in pseudo-3D (`clubhouse3d-wide.png`,
`clubhouse3d-phone.png`, drawn by `clubhouse3d.py`: a room in perspective worked out per pixel,
with flat sprites for Sadie and the cursor), and `activity-phone.png` (inside an
activity, the frame shrinks to a strip with ESC BACK, F1 HELP and the activity's own buttons).
**The clubhouse menu is now real** (`src/clubhouse/`), grown from the real-3D test room the owner
approved: crappy late-90s 3D, low resolution, corners that snap to the pixel
grid, textures that swim, few colors with dithering, lit per corner; characters stay flat pixel
sprites that turn to face you. Its textures and sprites are drawn with the same kit by
`art/play-place/pictures.py` (run it after changing a drawing). The old test room's page
(https://claude.ai/artifact/Bh3FjRZvgZxr5padPtgK3J) is left as it was.
Mock-up 2's dashboard (pieces, hunger) belongs to the tower game, not to the whole Play Place.

## The idea
Sadie's Dropper World is a lost software toy: early-90s shareware that was never finished but
always promised a full version soon. It looks like the 90s as people *remember* them, not as they
were. Anyone seeing it should think "yeah, that's from the 90s", even though it does things no
90s PC could. Early DOS, mid-90s multimedia and late-90s shine are mashed together into one
program that never existed.

- **Colors:** bright and loud, like Kid Pix. Never drab.
- **True to the 90s:** chunky low-res pixels, a small palette, ordered dithering (checkerboard
  and crosshatch dots) instead of smooth gradients, tiny blocky text.
- **Impossible for the 90s ("strangely well made"):** smooth squishy physics with many pieces,
  shading that's too careful and soft for the era, expressive characters, glossy highlights,
  sparkles and lens flare, crisp on any screen.

## Pixels and color
- Draw everything at a small size (the mock-up is 320x240) and scale it up with hard edges, so
  every pixel is a visible square. Pixels stay the same size on screen whatever the camera does.
  In the game a block is about 11 big pixels across at the usual zoom (`BLOCK_PX` in
  `render/view.js`).
- The dots are part of each drawing (`render/pixels.js`): flat colors, with dot patterns where one
  fades into the next. **Not a filter over the whole screen**: that was tried and made the game
  stutter on the owner's phone.
- Shading uses a 4x4 ordered dither (Bayer) between a few fixed tones per material, lit from the
  top left. Skies and gradients are dithered bands, never smooth.
- Characters and pieces get a thick 1-pixel dark outline, plus inner lines where one part overlaps
  another (Sadie's legs over her body, her head over her body).
- Late-90s touches are allowed on top: white glossy shines on jelly, 4-point sparkles, lens flare
  rings, a chrome glint on the logo.

## Sadie
Same cat as in the game (`src/activities/dropper-world/render/sadieView.js`): white dilute calico, gray cap and back
patch, gray patch over one eye, nose split gray and tan, a permanently unimpressed half-lidded
stare, gray tail. In pixels: white fur shades toward lavender (never plain gray), a heavy dark
upper lid over yellow-green eyes, a flat little "w" mouth, dithered pink blush on her cheeks, and
whiskers as single thin pixel lines outside the outline.

## Jelly pieces
One gummy shape per piece (not separate blocks stuck together): rounded corners, filleted inside
corners, a bright candy color with a darker rim and a lighter center, a white shine per block, a
bright rim light on the bottom right, and a darker outline in the piece's own color family. When
one lands it squishes wide, with dust puffs and little "boing" marks.

## The world
Dithered sky from deep blue through cyan to pink at the horizon; a chunky sun with rays; lumpy
outlined clouds; rolling far and near hills; a bright grass strip with tufts over brown dirt
speckled with pebbles and candy sprinkles (a nod to the candy bedrock).

## The interface: a DOS game that built its own
No gray Windows look. It's a DOS program that had no Windows to copy, so it invented its own and
tried way too hard:
- **Panels:** candy purple with a faint woven texture, raised and sunken edges in lavender and
  deep indigo, gold rivets in the corners.
- **Logo:** big blocky letters with a stripe of color per scanline (yellow, orange, pink, purple),
  a thick dark outline and a hard drop shadow.
- **Tag plaque:** "SHAREWARE V0.9 BETA / PLEASE COPY & SHARE!"
- **Stamp toolbar:** chunky rounded buttons with little pictures (mole in beanie, jelly, hay,
  paw). The selected one glows gold; "full version only" ones are dark with a padlock.
- **Dashboard** (like a 90s action game's status bar, but for a cat): Sadie's face drawn bigger
  on the left (her mood shows here), the piece supply as slots with a refill bar, her mood in
  words and a hunger meter, and a green LED message board.
- **F-key bar:** "F1 HELP, F2 SAVE (FULL VER.), F3 SOUND, F5 ABOUT, ESC QUIT" with little keycaps.
- **The never-finished feeling** comes from the promises: "CHAPTER 2 COMING SOON 1996!", locked
  tools, save only in the full version. **No prices and no order buttons** (the owner said no).

## The interface as built
**Built:** mock-up in `art/90s-style/interface-mockup.html` (published
  at https://claude.ai/artifact/JeTXaHsXxnPpSYe37qBbMY). Every modern bit left the board (the thought
  bubble, tip, pop-ups, round Toys and dev buttons, Sadie's "↑ 3.1" pill (gone altogether: the owner said how far she is from the hay doesn't matter), the light strip under
  the mole, the rounded font). The frame (top strip with ESC BACK and logo, a key bar with F1 HELP,
  F12 DEV and TOYS; no F3 SOUND, the owner said drop it) and in the middle Dropper World's own
  dashboard: stamps (who you're watching) and their face (drawn live by their own drawing code,
  so it shows their mood), name, mood word, what they're doing, their strongest feeling only (one
  LED meter; the owner's call) and why, plus an LED sign for news and hints. On a phone it's one
  slim strip (tap it for why), the stamps sit in the key bar, and the LED sign only shows over the
  strip for news; on a wide screen, sideways, it's a column down the right. Fonts: Silkscreen
  (blocky capitals, which the owner loves) for labels, VT323 (a DOS screen) for sentences. No
  next-piece display (the owner said no). Board pictures for mock-ups come from
  `tools/dropper-world/board-shot.mjs`. The frame lives in Dropper World; TypeFitter has
  its own copy of its look (moving it into the toolbox would mean retesting every activity, so it
  waits until the frame next changes in both).

## TypeFitter Deluxe 3.1 (approved mock-up: `art/typefitter/mockup.html`)
- **No windows.** It's a DOS program that invented its own look, like Dropper World: its parts sit
  straight in the Play Place's candy-purple frame (no title bars, menu bars or close boxes; the
  owner turned a Windows-style window down). Tool buttons are chunky candy stamps showing the key
  that works them, gold when on; the page is sunk into the frame; a green LED sign for the numbers
  and the bragging; pop-ups are candy panels with gold rivets.
- **The text shows off**: real fonts (a Times-ish serif, a Comic-ish one, gothic, a script, the DOS
  one, a loud billboard one, a ransom note of all of them), bold, italic, underline, outline,
  shadow, WarpArt (arch, wave, off into space, growing), spacing, color (red, rainbow, chrome) and
  secret symbols. Brand names are made up (TIMELY ROMAN, COMIC SANDS, WARPART).
- **Sadie is a flat picture**, not drawn like in Dropper World: her real photo (the loaf on the
  brown blanket), shrunk to 128x109, 16 colors with a dot pattern, traced over by mouse (wobbly
  lines on her eyes, nose patch, nose, mouth, whiskers, cap and inside her ears, a little off,
  some gone over twice; no outline round her, the owner took it off), then JPEG-crushed twice.
  It never moves; only her speech bubble changes. Shown at 2x on a wide screen, 1x on a phone.
- **Its box on the shelf**: a white page, a red dashed box, big letters spilling out of it, a gold
  band saying TYPEFITTER (drawn by `art/play-place/pictures.py`).


## Sadie's mansion (mock-up, waiting for the owner's okay)
The owner's next big idea: the clubhouse becomes Sadie's mansion, and each activity gets its own room.
Mock-up: `art/mansion/` (`mockup.js` is the 3D scene, `page.js` the page around it; `node
art/mansion/build.mjs && node art/mansion/shots.mjs` builds it and takes the pictures), published at
https://claude.ai/artifact/VNmFkn6rgQdKq8aW2z3BgF. What the owner has decided so far:
- **A cat tree.** A tall round hall with a giant scratching post up the middle and a spiral
  staircase round it (a staircase, no elevator); each floor is a ring of doors. It grows up (the top
  is always being built) and out (branches: wings and side towers, for grouping rooms). Adding
  rooms never changes what's already built.
- **Rooms can be any size**, and bigger inside than the house could hold. Some games will live in
  the world rather than on their own screen, like a Breakout whose ball escapes into the mansion
  and breaks the game (then Sadie puts up a sign saying you broke it).
- **No loading screens or obvious transitions** unless they fit: a door just opens onto its room.
  It has to stay smooth.
- **You start outside**, at the gate. The first time only, Sadie's letter invites you: she's
  decided to share her clubhouse with all her friends. There'll be a way to reset the whole game,
  and single events (the invitation, the broken Breakout, and so on).
- **Normal game controls** (WASD and mouse, a thumb stick on phones) and no big chunky frame: just
  a pause button and a small hint at a door. The shelf room goes. Dropper World and TypeFitter keep
  their own 90s frames: they're programs on a computer.
- **The look:** a real, recognizable mansion a cat has clearly taken over. The cat is in the details:
  turrets that lean out like ears, a cat weathervane, fish-scale slates, porch pillars wrapped in
  scratching rope, a cat flap in the front door, a FRIENDS ONLY mat, fish-bone and paw-print damask,
  portraits of Sadie, the shredded armchair, Sadie asleep in a box in a sunbeam, a cat door by every
  door. Sadie's own colours (white going lavender, grey, tan, pink), turned up loud.

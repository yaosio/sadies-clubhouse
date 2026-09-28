# Art style: the misremembered 90s

**Status: approved, going in step by step.** Step 1 (on the working branch, not in the real game
yet): chunky pixels over everything, the new sky, sun, clouds, hills and ground, and the
gummy jelly pieces. Next: Sadie, then the mole, Chooter, hay and barn, then the interface. The picture to match is
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

## Still to work out
- **The interface, proposed (not approved yet):** `art/90s-style/interface-mockup.html` (published
  at https://claude.ai/artifact/JeTXaHsXxnPpSYe37qBbMY). Every modern bit leaves the board (the thought
  bubble, tip, pop-ups, round Toys and dev buttons, Sadie's "↑ 3.1" pill, the rounded font). The
  Play Place frame (top strip with ESC BACK and logo, F-key bar) is the same in every activity; the
  middle is the activity's own: for Dropper World, a row of stamps (who you're watching) and a
  dashboard (their face, doing, why, up to 4 feelings as LED meters, and an LED sign for news and
  hints). Board pictures come from `tools/dropper-world/board-shot.mjs`.
- Phone (portrait) layout: the mock-up is landscape. On a tall screen the logo, toolbar,
  dashboard and F-key bar need rearranging (for example the toolbar as a row, the dashboard
  stacked), without crowding the board.
- The dashboard, toolbar and F-keys in the mock-up are for looks; which ones do something in the
  toy is a separate decision. Design pillars still win (no fast clicking, the player doesn't tune
  physics).

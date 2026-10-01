# Dropper World's look

**Status: approved, going in step by step.** Step 1 (in the game): chunky pixels over everything, the new sky, sun, clouds, hills and ground, and the
gummy jelly pieces. Next: Sadie, then the mole, Chooter, hay and barn. The interface is done (see the end). The picture to match is
`art/90s-style/mockup-2.png` (drawn by `art/90s-style/mockup-2.py`). `mockup-1` is the first try,
kept for reference only.

## The idea
Sadie's Dropper World is a lost software toy: early-90s shareware that was never finished but
always promised a full version soon. The misremembered-90s rules every activity shares (loud
colors, chunky pixels and dithering, and "strangely well made" touches no 90s PC could do) are in
`docs/clubhouse/ART_STYLE.md`; this page is how they look in Dropper World.

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
(The mock-up's plan. Some of it was dropped: what was built is in the next section.)
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
- **The never-finished feeling:** "CHAPTER 2 COMING SOON 1996!", locked tools, save only in the
  full version (no prices and no order buttons: `docs/clubhouse/ART_STYLE.md`).

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
  its own copy of its look.

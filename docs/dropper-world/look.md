# Dropper World's look

Its 90s look and how far it's got: pixels and color, Sadie, the jelly pieces, the world. Read before
changing how anything looks. The frame and dashboard: `look-interface.md`.

**Status: approved, going in step by step.** Step 1 (in the game): chunky pixels over everything,
the new sky, sun, clouds, hills and ground, and the gummy jelly pieces. Next: Sadie, then the mole,
Chooter, hay and barn. The interface is done (`look-interface.md`). The picture to match is
`art/90s-style/mockup-2.png` (drawn by `art/90s-style/mockup-2.py`). `mockup-1` is the first try,
kept for reference only.

## The idea

Sadie's Dropper World is a lost software toy: early-90s shareware that was never finished but
always promised a full version soon. The misremembered-90s rules every activity shares (loud
colors, chunky pixels and dithering, and "strangely well made" touches no 90s PC could do) are in
`docs/clubhouse/look/README.md`; this page is how they look in Dropper World.

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

Same cat as in the game (`src/activities/dropper-world/render/sadieView.js`): white dilute calico,
gray cap and back patch, gray patch over one eye, nose split gray and tan, a permanently
unimpressed half-lidded stare, gray tail. In pixels: white fur shades toward lavender (never plain
gray), a heavy dark upper lid over yellow-green eyes, a flat little "w" mouth, dithered pink blush
on her cheeks, and whiskers as single thin pixel lines outside the outline.

## Jelly pieces

One gummy shape per piece (not separate blocks stuck together): rounded corners, filleted inside
corners, a bright candy color with a darker rim and a lighter center, a white shine per block, a
bright rim light on the bottom right, and a darker outline in the piece's own color family. When
one lands it squishes wide, with dust puffs and little "boing" marks.

## The world

Dithered sky from deep blue through cyan to pink at the horizon; a chunky sun with rays; lumpy
outlined clouds; rolling far and near hills; a bright grass strip with tufts over brown dirt
speckled with pebbles and candy sprinkles (a nod to the candy bedrock).

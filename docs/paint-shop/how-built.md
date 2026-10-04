# How Chooter's Paint Shop is built

The code in `src/activities/paint-shop/`: which file does what, how it plugs into the clubhouse,
and its checks. Read before changing its code.

## Files

- `card.js`: its card: `lot` 1 (the plot across from Clyde's House), `room` (loads `room.js`),
  `keeps`.
- `room.js`: the room (10 x 9 m, 4 m tall): the paintable walls, floor and ceiling, the things to
  paint (plaster Sadie on her plinth in pieces, the wooden fish, the easel's canvas, the beach
  ball, the crate), the counter and its pots, the pegboard and its tools, the plunger, Chooter,
  Sadie's walk and prints, the dynamite's bits and BOOM. Hands the clubhouse its place with `brush`
  and `brushLook` (see below), the pots, tools and plunger as `act` uses, and `house`.
  `window.__paintShop` for the checks (`state()`, `hold(tool, paint)`, `sadie()`).
- `house.js`: the shop from outside, built into the outside's scene on its plot.
- `surfaces.js`: **paint on things in 3D**, knowing nothing about the shop: a surface is a layer of
  paint and the picture made from it (no canvas: nothing is ever read back from the graphics card);
  `paintOn(surface, mesh)`; `hit(scene, ray)` finds the first thing a line hits and, if it's
  paintable, the pixel; the tools (`dab`, `stroke`, `spray`, `fill`, `stamp`, `clear`) work there
  in metres; `save()` and `load()`. `boxGeometry` gives each side of a box its own part of one
  picture (paint stays on its side), `fitUv` fits a flat wall's picture to it. If another room ever
  wants paint, this file can move to `src/shared/` as it is.
- `layer.js`: the paint itself, as plain numbers (the tests run it): the paints, a layer of pixels,
  the brush, the line, the spray, the bucket's fill, stamps, and keeping it (runs of pixels, then
  base64).
- `stamps.js`: the four stamps and Sadie's paw print, as little pictures in letters.
- `tools.js`: the pots and the tools: what each is called and does, how big, what you start with.
- `art.js`: its pictures: the shop outside, the signs, the pegboard and every tool on it, the pots'
  labels, Chooter (made for each paint the first time it's needed), the TNT box, the BOOM.
- `sounds/`: 8-bit, 11 kHz, made in code: `shop.js` (plip, tok, pup, glug, fwump, eh, kaboom),
  `sadie.js` (mrrp), all made with the toolbox's kit (`src/shared/retro.js`), `index.js` (plays
  them on the sound system; Sadie's and Chooter's on VOICES). The one exception: `chooter.js` (his
  woo) is a recording, the owner's own, stored as text (`woo-data.js`, about 8 KB: 4-bit ADPCM,
  `adpcm.js` decodes it); `tools/paint-shop/make-woo.mjs` cuts it from the video (seconds 0.02 to
  1.10 of the owner's clip) and rewrites `woo-data.js`.

## The clubhouse's part (`brush`)

A place with a `brush(id, ray, 'down' | 'move' | 'up')` is painted as you walk about: the clubhouse
hands it every press as a line out into the place, every frame while it's held (so walking while
you hold it paints a stroke), and shows the buttons, the YOU'RE HOLDING box and the dot
(`brushLook()`: `{ color, tool, icon, paint, verb, drags, picks }`). See
`docs/clubhouse/rooms/controls.md`.

**Put away when you're far off.** `putAway()` saves the paint. The shop outside stays.

## Checks

- `tests/paint-shop/run.mjs`: the brush, the roller's square, the spray's dots, the bucket staying
  in its patch and on its side, a box taking paint on every side, stamps the right way up, keeping
  and getting back any paint exactly, the worst case fitting in the browser, the pots and tools,
  every sound soft and short, no sound for painting.
- `tests/paint-shop/browser.mjs`: fatal errors only: in through the door, dipping and taking with E
  or USE, PAINT turning painting on, a stroke, kept after a reload (the hints, the stamp, bucket,
  dynamite, Sadie's prints and the plunger are not played in the browser).
- Pictures: `node tools/paint-shop/shots.mjs [desktop|phone]` (after a build) saves the shop,
  inside, and a round of painting in `dist/shots/paint-shop/`; `node tools/paint-shop/details.mjs`
  saves close-ups of the little things (the signs, Chooter's cap, the easel's back, a crate painted
  on every side, the room's corners).

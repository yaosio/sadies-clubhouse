# Chooter's Paint Shop

The second building outside Sadie's front gate (`src/activities/paint-shop/`), on the plot across
the path from Clyde's House (`lot` 1). The owner asked for a Kid Pix-style paint program on
2026-10-01, with a twist: you paint the actual room, not a flat canvas. Everything outside the
clubhouse belongs to somebody else (the owner's rule), so the shop is Chooter's: the black
lab/pitbull mix from Dropper World.

**Chooter** sits by his counter, tail wagging nonstop, wearing a painter's cap and holding a
paintbrush in his mouth, both in whatever paint you last dipped in (stripes for RAINBOW): so you can
see your colour on him. (He used to be splotched in it, but red splotches looked like blood.) When the dynamite goes off, or Sadie comes in,
he jumps about (it's the best thing ever). He makes no sound. Drawn in his Dropper World colours:
black coat, white blaze, floppy ears, pink tongue, blue collar, gold tag.

**Sadie** is a customer: now and then (25 s after the room's built, then every minute or two, only
while you're in the room) she comes in through her cat flap in the back wall, says mrrp, walks across
the open floor, sits a moment and goes back out, leaving 16 paw prints in the paint she stepped in
(yours, or a random bright one if you're holding white or the rainbow). And there's a plaster Sadie
on a plinth to paint (SADIE).

**The shop from outside:** mint walls splattered in every colour, a pink and yellow striped awning,
the sign (CHOOTER'S PAINT SHOP), two windows full of paint cans, a blue door with an OPEN sign, a
sandwich board (TODAY: PAINT THE WALLS / ALSO FLOOR AND CAT?), and a giant paint can (1 TON)
up on a stand in the middle of the roof, high above the sign, tipping forward and pouring pink onto it.

## Design pillars (these win over any feature idea)

- **You paint the room itself.** Every wall, the floor, the ceiling and the things in the room are
  paint, and it's all kept. There's no canvas mode and no menu of tools: the tools hang on a
  pegboard and the paint is in pots, in the room.
- **A relaxed toy.** No goals, no score, nothing to get wrong. The only thing that undoes work is
  the dynamite (one surface at a time) and the plunger (asks first).
- **Kind to the ears** (the owner has misophonia). Painting makes no sound at all. Everything else
  is one short soft blip when it happens (dip, take, stamp, glug), the dynamite is a soft low fwump,
  not a bang, and nothing loops.
- **Kid Pix loud.** Fourteen loud paints and a rainbow, chunky pixels (about 4 cm on the walls), the
  BOOM starburst.

## Playing it

Walk out of the gate and across the path from Clyde's House, and in through the shop door.

- **Paint pots** on the counter (two rows: every paint, and RAINBOW at the end of the shelf): walk up,
  look at one and press E (DIP on a phone). The pot's colour is now on your brush.
- **Tools** on the pegboard on the left wall: E (TAKE) on one. The one you're holding isn't on its
  hook. BRUSH (thin), ROLLER (wide and square), SPRAY CAN (dots), PAINT BUCKET (fills the patch of
  one colour you press on, on that one surface or side), four STAMPS (fish, yarn ball, Clyde's face,
  paw print: their own colours, once per press), and DYNAMITE (press on anything: it shakes, its paint
  flies off in little bits, BOOM, and it's bare again).
- **Painting:** with the mouse locked (click first), hold the button and it paints where the dot in
  the middle of the view points, and keeps painting as you walk and look about. On a phone (or with
  the mouse free), the LOOK | PAINT switch (bottom right) says what pressing does: look around, or
  paint wherever you press; the thumb stick still walks. Picking up a tool or dipping in a pot flips
  it to PAINT, so your next press paints. The YOU'RE HOLDING box (top left) always shows the tool (its
  picture from the pegboard), the paint (none for a stamp or the dynamite), and in a line how to use
  it right now; it blinks gold when you pick something up. The switch, the dot and the mouse pointer
  are in your paint.
- **The plunger** (a TNT box by the door): push it once and it asks (SURE? PUSH AGAIN, for four
  seconds); again and every painted thing in the room blows up, one after another, back to bare.

It saves the paint on every surface (`sadies-clubhouse.paint-shop.paint`, a second and a half after
you stop, and when the room's put away or the page goes) and what you're holding
(`sadies-clubhouse.paint-shop.holding`). The pause menu's CHOOTER'S PAINT SHOP button starts it over.

**Limits, honestly:** the walls are 24 pixels a metre (the things in the room 40), so paint is chunky,
which suits the look and keeps the save small (a bare room is a few bytes, a very busy one a few
dozen KB, the whole room covered in dots under 200 KB). Paint on round things stretches near the
poles, as on any 90s 3D model. Signs, the counter, the pegboard and Chooter aren't paintable (they're
the shop's), and they stop paint going through them.

## How it's built

| File | What it does |
|---|---|
| `card.js` | Its card: `lot` 1 (the plot across from Clyde's House), `room` (loads `room.js`), `keeps`. |
| `room.js` | The room (10 x 9 m, 4 m tall): the paintable walls, floor and ceiling, the things to paint (plaster Sadie on her plinth in pieces, the wooden fish, the easel's canvas, the beach ball, the crate), the counter and its pots, the pegboard and its tools, the plunger, Chooter, Sadie's walk and prints, the dynamite's bits and BOOM. Hands the mansion its place with `brush` and `brushLook` (see below), the pots, tools and plunger as `act` uses, and `house`. `window.__paintShop` for the checks (`state()`, `hold(tool, paint)`, `sadie()`). |
| `house.js` | The shop from outside, built into the outside's scene on its plot. |
| `surfaces.js` | **Paint on things in 3D**, knowing nothing about the shop: a surface is a layer of paint and the picture made from it (no canvas: nothing is ever read back from the graphics card); `paintOn(surface, mesh)`; `hit(scene, ray)` finds the first thing a line hits and, if it's paintable, the pixel; the tools (`dab`, `stroke`, `spray`, `fill`, `stamp`, `clear`) work there in metres; `save()` and `load()`. `boxGeometry` gives each side of a box its own part of one picture (paint stays on its side), `fitUv` fits a flat wall's picture to it. If another room ever wants paint, this file can move to `src/shared/` as it is. |
| `layer.js` | The paint itself, as plain numbers (the tests run it): the paints, a layer of pixels, the brush, the line, the spray, the bucket's fill, stamps, and keeping it (runs of pixels, then base64). |
| `stamps.js` | The four stamps and Sadie's paw print, as little pictures in letters. |
| `tools.js` | The pots and the tools: what each is called and does, how big, what you start with. |
| `art.js` | Its pictures: the shop outside, the signs, the pegboard and every tool on it, the pots' labels, Chooter (made for each paint the first time it's needed), the TNT box, the BOOM. |
| `sounds/` | 8-bit, 11 kHz, made in code: `shop.js` (plip, tok, pup, glug, fwump, eh, kaboom), `sadie.js` (mrrp), `synth.js` (made on the toolbox's `retro.js`), `index.js` (plays them on the sound system; Sadie's on VOICES). |

**The mansion's part (`brush`):** a place with a `brush(id, ray, 'down' | 'move' | 'up')` is painted
as you walk about: the mansion hands it every press as a line out into the place, every frame while
it's held (so walking while you hold it paints a stroke), and shows the switch, the YOU'RE HOLDING
box and the dot (`brushLook()`: `{ color, tool, icon, paint, verb, drags, picks }`). See `docs/clubhouse/ROOMS.md`.

**Put away when you're far off.** `putAway()` saves the paint. The shop outside stays.

Checks: `tests/paint-shop/run.mjs` (the brush, the roller's square, the spray's dots, the bucket
staying in its patch and on its side, a box taking paint on every side, stamps the right way up, keeping and getting back any paint
exactly, the worst case fitting in the browser, the pots and tools, every sound soft and short, no
sound for painting) and `tests/paint-shop/browser.mjs` (in through the door, dipping and taking with E
or USE, the YOU'RE HOLDING box and the switch going to PAINT on its own, LOOK and back, a silent stroke, a stamp, the bucket, the dynamite, Sadie's prints, kept
after a reload, the plunger asking then blowing up everything). Pictures: `node tools/paint-shop/shots.mjs
[desktop|phone]` (after a build) saves the shop, inside, and a round of painting in
`dist/shots/paint-shop/`; `node tools/paint-shop/details.mjs` saves close-ups of the little things (the
signs, Chooter's cap, the easel's back, a crate painted on every side, the room's corners).

## Parked ideas

None yet.

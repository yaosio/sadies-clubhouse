# How Marbles' Cut & Curl is built

The code in `src/activities/barbershop/`: which file does what, how it plugs into the clubhouse, and
its checks. Read before changing its code.

## Files
- `card.js`: its card: `lot` 2 (the plot beside Clyde's House), `room`. No `keeps` (nothing saved).
- `room.js`: the room (10 x 8 m, 3.6 m tall): walls, floor, the mirror and chair, the stage and its
  curtain, the wig heads, ribbons and clothes (each one an `act` use), Marbles, Sadie in the chair,
  the speech bubble, and the runner that plays a show (a hop up, the show, a hop back, then
  `endShow` hides the props). Hands the clubhouse its place, with `house`. `window.__barbershop`
  for the checks (`state()`, `choose(kind, i)`, `show(name)`, `pickForMe()`).
- `house.js`: the shop from outside, built into the outside's scene on its plot (pole and scissors
  move every frame).
- `looks.js`: the lists of hairdos, taildos and outfits and how each is drawn: pixel by pixel on a
  see-through picture the size of Sadie's own (58 dots wide) with 24 rows above for tall hair and
  hats. No browser in it, so the tests read the lists.
- `shows.js`: each show is `run(c, t)`: a function of the seconds it's been running that puts Sadie,
  Marbles and the props where they are then, and starts each sound once (`c.once`). Nothing to undo.
- `props.js`: the show props, made once and kept hidden until a show uses them.
- `art.js`: its pictures: the shop outside, wallpaper, floor, mirror, curtain, signs, Marbles in
  three moods, the little pictures the shows use.
- `sounds/`: `sadie.js` (the meow song, the chirp, mrrp), `shop.js` (snip, tumble, poof, whoosh,
  thud), `waltz.js` (the music box), `index.js` (plays them through the sound system: voices on the
  voices bus, one sound at most every half second, snip every quarter).

## How a look is drawn
Sadie is the kit's flat Sadie picture (`m.sadie`). What she wears is a second see-through picture
laid over her as a child of her sprite (so it turns to face you with her), redrawn only when a pick
changes (and once a second for glitter). A tail colour works on the dots of her tail, found once by
reading her picture when the room is built (`willReadFrequently`). Hats use each hairdo's height.

## Being put away
Nothing is saved and the room has no outside state, so it needs no `putAway()`: everything it made
is handed back by the clubhouse, and built again it's plain Sadie in the chair. The shop outside
stays (the clubhouse hands it back as `house`). A show in progress is just gone.

## Checks and tools
- `tests/barbershop/run.mjs`: the card, the lists, every look draws inside the picture, every show
  runs from start to finish on stand-ins for the props, every sound makes numbers.
- `tests/barbershop/browser.mjs`: walk in, pick a wig head, ask Marbles, pull the rope for the pop
  star's show and wait for it to end, no page errors.
- `tools/barbershop/shots.mjs`: pictures of the shop, every look and frames of every show, into
  `dist/shots/barbershop/` (`npm run build` first).

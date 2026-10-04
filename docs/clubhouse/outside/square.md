# The town square

The paved square just outside the front gate, and what's round it. Read when changing the square,
its birds, or the paths that lead out of it. (`src/clubhouse/town/`; the outside, `outside.js`, builds it.)

- **The square** is round (`SQUARE` in `layout.js`), with a bird bath in the middle, four benches
  facing it, flower beds behind them and the gate's path coming in. The clubhouse, gate and fence
  stand where they always did (the owner's call, 2026-10-04).
- **The plots** stand round its far side in a curve, each turned to face the middle (`plots.md`).
- **Paths lead out** (`PATHS` in `layout.js`): straight on, between the right-hand buildings, and
  one off each end. They wind a little and stop in the grass. They're there so more buildings and
  areas can grow along them without anything being moved: a new plot goes beside one.
- **The birds** (`birds.js`): five little flat pictures, each its own colour. They fly round the
  square, land on the benches, the bird bath and the paving, then take off again. Five is Claude's
  choice, to keep it light (one picture each). They make no sound yet. The owner is fine with soft chirping
  (not loud, not constant: `docs/clubhouse/RULEBOOK.md` section 4), so it can be added (sounds go
  through `docs/clubhouse/sound/system.md`).
- **Sadie on the gatepost** watches them (the owner's choice, 2026-10-04): she keeps facing you and
  only glances. Her eyes go left, right or up after the bird she's watching, as you see it, and now
  and then her tail flicks. The glances are extra pictures made from her own (`sadiePoses` in
  `birds.js`), and her blinking is done on the same pictures. Future idea: more angles of Sadie, so she
  can really turn her head (the owner isn't sure yet).

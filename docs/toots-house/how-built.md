# Toots' House: how it's built

## Files (`src/activities/toots-house/`)
- `card.js`: its plot (`lot` 3) and colour.
- `house.js`: the house outside, built into the town (the clubhouse builds it at the start, like every
  building outside). Toots in her window is a flat picture swapped pose by pose.
- `window.js`: what she does in the window (watching, spotting you, thrilled, away), as plain numbers.
- `toots-art.js`: every picture of Toots, dot by dot (`windowPoses`, `roomPoses`): the window, her two
  side views (each drawn on its own, never flipped), front and back. `art.js`: the house's and the
  room's pictures (siding, shutters, her friends' portraits, the backyard).
- `plan.js`: the inside as numbers: the two floors, the stairs, what's solid. `ground` says where you
  and she can stand, `ballGround` where the ball lands.
- `fetch.js`: the ball and Toots inside, as numbers (no browser): throwing, bouncing, rolling down the
  stairs, chasing, bringing it back, following you between floors, hopping over things.
- `room.js`: the inside, built from those, and the uses (THROW, PICK UP, TAKE, PAT). It picks her
  picture each frame from the way she's going and where you are.
- `music.js`: her music inside (a composer in plain numbers, played through the toolbox's band).
- `sounds/`: her roos. `roo-data.js` holds the cuts as text (4-bit ADPCM, decoded by the toolbox's
  `src/shared/adpcm.js`), made by `tools/toots-house/make-roo.mjs` from the owner's video.
- `window.js` and the room share where she is (`house.shared.where`: 'window' or 'door'), so there's
  only ever one of her.
- `tools/toots-house/sprites.mjs`: every picture of her on one PNG, to look at without the game.
  `door.mjs` times every frame walking in at her door (looking for a hitch); `rush.mjs` walks in
  before she has left her window and prints where she is, to see she comes running down the stairs.

## The views out
`room.js` takes four pictures of the whole outside with the kit's `snapshot` (passing `null`: the
whole place bar its sky, and `without` her own house), from just behind her house looking front,
back, left and right, 120 degrees wide each so they overlap. They're hung as a box 60 m out all
round the room, drawn after the sky and under everything else, so every window shows the real town
in the right direction, and it shifts as you walk like a far view should. The inside grass only
covers the backyard. Drawn once, so they cost nothing each frame; a live doorway-style view would
draw the outside again every frame and take one of the three live doorway pictures.

## Adding her activity later
The room's file is the only one that changes: the backyard behind the big window is built already,
and everything Toots does inside is in `fetch.js`, separate from the drawing.

## Checks
- `tests/toots-house/run.mjs`: the card; no front left leg in any picture of her, and her side views
  never mirror copies; fetch in numbers (a throw comes back to your feet, on both floors); only one
  Toots (never at the window while you're inside); an hour of her music; the roos decode.
- `tests/toots-house/browser.mjs`: walks out to the house, sees her in the window, goes in, takes a
  ball, throws it, and waits for her to bring it back; she's left the window and waits by the door,
  and her music plays.

## Known limits
- Like every building outside, the house is built at the start (one more of them).
- Her friends' portraits are drawn here, not shared with their own rooms (rooms can't share files).

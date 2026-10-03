# How Space Adventure is built

The code in `src/activities/space-adventure/`: which file does what, its save, being put away, and
its checks. Read before changing any of its code.

## Files

- `card.js`: its card: `room`, `door`, `slot: 5`, and `keeps`
  (`sadies-clubhouse.space-adventure.`, for starting over). It saves through the kit's `m.saves` as
  `trip`: whether you've been.
- `trip.js`: the trip in numbers, with no screen (the tests read it): when everything happens (`T`),
  what Sadie says and when (`LINES`), how big the planet looks (`planetSize`), the glow and the
  clouds (`entry`: fully white at the swap), the way down through the clouds to the beach
  (`shipAt`), where Sadie is (`sadieAt`), and the land's shape (`heightAt`: the beach at 0, 0, the
  sea on your left, hills, mountains far ahead).
- `room.js`: puts it together as one place: one scene holding the cockpit, space, the land and the
  space room, showing only what you should see. Walking in past `LOCK_Z` sets the place's `watch`
  (with `at`, the seat), which the clubhouse uses to put you in the seat and keep your eyes ahead.
  Runs the trip's clock (stopped while paused), swaps space for the land at `T.swap`, and at the
  black saves the trip, shows the space room and puts you by the door. The button and the radio are
  its `uses`. `window.__space` for the checks (its state, `warp` to run the clock faster, `jump` to
  a moment).
- `cockpit.js`: the SADIE-1's cockpit: purple panelled walls, the windscreen (just holes: what's
  outside is drawn behind everything), the dashboard (screens, a radar, blinking lights), the
  control stick, the pilot's seat, side consoles, a SPACE CADET poster, Sadie's food bowl, and
  `weather`: a box round the cockpit drawn in dots, orange while the air glows, white in the clouds.
- `space.js`: stars (a sphere of dots), a pink gas cloud, a galaxy, the sun and its lens flare, and
  the planet with its clouds and its thin blue air, drawn at a fixed distance and made bigger as you
  get closer.
- `land.js`: the land: one big grid coloured by height (sand, grass, purple rock, snow), the sea with
  foam along the beach, alien plants and rocks, a purple-to-pink sky with a ringed planet and a
  moon, and clouds that turn to face you. `place(ship)` moves the whole land round the cockpit.
- `hangout.js`: Sadie's space room: starry wallpaper, glow-in-the-dark ceiling stars, a
  ringed-planet rug, a planet mobile, a round window onto space, a telescope and a toy rocket, the
  radio (notes float out while it plays), Sadie in her helmet on a cushion with her I LOVE SPACE!
  bubble, and the big red button under its sign.
- `talk.js`: Sadie's words at the bottom of the screen, typed out (silently), with her face; and
  the black.
- `pictures.js`: every little picture, drawn when the room is built.
- `music/`: the trip's song and the radio's, their instruments and their player (see `music.md`).
- `door.js`: its door on the landing: a spaceship's hatch with a SPACE sign, a rocket, a porthole
  with the planet in it, and hazard stripes. Drawn by `art/space-adventure/door.js`
  (`node tools/space-adventure/pictures.mjs`).

## Music and quiet

How its music plays, makes way for the main theme and asks for quiet: see `music.md`.

## Put away when you're far off

The clubhouse puts Space Adventure away when you've been three doors or more from it for a while (see
`docs/clubhouse/world/building-rooms.md`): `putAway()` closes its music for good, and Sadie's talk
box and the black go with its layer of the page (the kit's `overlay`). It's built again from its
save (whether you've been on the trip) as you come back.

## Checks

- `tests/space-adventure/run.mjs`: the card and door; all of the owner's lines, word for word and
  in order; she talks the whole way and every line is up long enough to read; the planet only grows;
  white at the swap; the way down never touches the ground or jumps, and lands on the beach with the
  sea beside it; Sadie's hops; the music builds to touchdown, has no long held notes or hi-hats, and
  every note is soft and click-free.
- `tests/space-adventure/browser.mjs`: the door, the cockpit through it, walking in and being
  strapped in, Sadie talking, the music, pausing, the swap, landing, the black, the space room with
  the radio, the button, and the door afterwards.
- `tools/space-adventure/trip.mjs [phone|desktop] [times...]` takes pictures along the trip.

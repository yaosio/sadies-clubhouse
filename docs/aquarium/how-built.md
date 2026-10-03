# How the aquarium is built

Which code file does what (in `src/activities/aquarium/`), its saves and being put away. Read
before changing the code. Its checks are in `checks.md`.

## Files

- **`card.js`**: its card: no page and no `start()`, just `room` (loads `room.js`), `door`,
  `slot: 4`, and `keeps` (`sadies-clubhouse.aquarium.`, for starting over). It saves through the
  kit's `m.saves` as `ocean`: what you've found, and where the boat is (kept every couple of seconds while sailing and as the page is hidden or closed, so a reload at sea keeps it; BACK TO AQUARIUM saves it too)
  (`docs/clubhouse/rooms/saves.md`).
- **`tank.js`**: the tank in numbers, with no screen (the tests read it): the room and the tank's
  size, the fish and their lanes, Sadie's lazy loop (`sadieAt`), the dive when you tap the glass
  (`dive`) and the way home (`surfaceHome`): the steps your view glides through, one of them
  marked `swap`, and the six finds.
- **`chart.js`**: the ocean in numbers, with no screen (the tests read it): the six spots (where,
  how close the boat gets, how near to pick a find up), where you start, the reef (`reefOpen`),
  where the boat can be (`sailable`), what you can pick up (`findHere`), the looming mountain
  (`loom(d)`: how much bigger to draw it from d metres away), and reading the save.
- **`ocean.js`**: the ocean's scene: the sky, the water (see-through dots) and the seabed, the copy
  of the tank's floor, the six spots and their finds, the reef and its buoys, the breadcrumbs and
  twinkles, the looming mountain and Sadie, and the boat round you (deck, mast, sail, and the
  dashboard with the LED sign, the radar and the button). It turns its own flat things to face you
  (the sea moves about under the clubhouse's feet each trip).
- **`sounds/`**: the ocean's sounds, one file per kind: `finds.js` (a sound for each find, and the
  reef sinking), `sea.js` (a small wave, the sail, and `seaPacing`: when they're allowed),
  `index.js` (every sound by name and how loud, and `LIST` for the sound tester), made with the
  toolbox's kit (`src/shared/retro.js`, shared with the other rooms); the clubhouse's sound system
  (`src/shared/sound.js`) plays them.
- **`pictures.js`**: the fish and Sadie in her diving suit (her own sprite with the helmet, tank
  and flippers drawn on), drawn when the room is built.
- **`room.js`**: the room (10 x 12 m, 4.2 m tall, sea-blue fish-bone wallpaper, a wave rug, a S.S.
  SADIE life ring and a porthole on the left wall), the tank (a painted sea inside, sand, a castle,
  a treasure chest, a bubbling diving helmet, weed and coral, dithered glass, an open top with the
  SADIE'S AQUARIUM rim and a light bar, a can of fish food), the sign, the OCEAN FINDS cabinet (a
  question mark, or the find), the fish, Sadie and the bubbles, and (test version only) the SOUND
  TEST box. Tapping: three spots along the glass (`uses`, each with `act`). The room and the ocean
  are one place to the clubhouse: the swap changes this place's `scene`, `faces`, `uses`, `floor`
  and `light`, and at sea its `speed` (the boat's) and `far` (how far you can see). The sea is
  moved each trip so the boat's spot lines up with the tank, and the copy of the tank's floor moved
  under the boat for the way home, lit just like the tank. `window.__aquarium` for the checks (and
  `hold`, which stops the dive at each swap so the pictures either side can be compared).
- **`door.js`**: its door on the landing: sea blue, its sign a little tank of its own with a
  goldfish in it, a porthole with a fish going past, water seeping out underneath. Drawn by
  `art/aquarium/door.js` (`node tools/aquarium/pictures.mjs`).

## Put away when you're far off

The clubhouse puts the aquarium away when you've been three doors or more from it for a while (see
`docs/clubhouse/world/building-rooms.md`). It has no `putAway()`: the clubhouse stops its sounds
(`closeSounds`), and both its scenes (`scenes`: the room and the ocean) go back to the graphics
card. It's built again from its save (the finds and where the boat was left) as you come back, so
it looks the same.

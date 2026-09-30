# The aquarium

The clubhouse's fourth activity (`src/activities/aquarium/`), behind the fifth door on the landing.
Like Brickbuster '96 it lives in the mansion itself, not on a computer: a room with a big fish tank
along the back wall. Sadie swims in it in a little diving suit (a fishbowl helmet, an orange air
tank, yellow flippers) among the fish. A cardboard sign taped to the glass says DON'T TAP ON THE
GLASS!!, and you can tap it anyway.

It's being built in steps (the owner's plan, 2026-09-30):

1. **The room (built).** The tank, Sadie and the fish, the sign, tapping the glass, and the OCEAN
   FINDS cabinet with its six empty spots. The approved mock-up is `art/aquarium/` (with its door
   picture fixed and its sign moved to the landing side, at the owner's request).
2. **The ocean (next, not started).** Tapping the glass takes you into a big ocean to explore, with
   several places to look round, and no loading screen: your view rises to the water's surface,
   looks up, and you're out at sea, with a 90s picture of a boat's cockpit round the screen. Each
   place has something to find; take it and it turns up in the aquarium room (the cabinet's spots).
   For now the dive ends at a COMING SOON sign floating in the water, and you come back out.

## Design pillars (the owner's rules; these win over any feature idea)

- Sadie's in the tank, in a diving suit, with the fish.
- The sign says not to tap on the glass, and tapping it is how you get to the ocean.
- On a phone you look round by swiping, so a swipe must never tap the glass by accident: tapping
  only happens through a prompt (E, or the TAP GLASS button on a phone), and the prompt only shows
  when you're standing at the glass and looking at it.
- No loading screen: going to the ocean is one smooth move of the camera.
- Things you find in the ocean show up in the aquarium room.
- Quiet (the owner has misophonia): it makes no sound yet. Any idle sound added later (bubbles, the
  fish) must be rare and gentle, never constant or repeating.

## How it's built

| File | What it does |
|---|---|
| `card.js` | Its card: no page and no `start()`, just `room` (loads `room.js`), `door`, and `slot: 4`. It saves nothing yet. |
| `tank.js` | The tank in numbers, with no screen (the tests read it): the room and the tank's size, the fish and their lanes, Sadie's lazy loop (`sadieAt`), the dive when you tap the glass (`dive`: the steps your view glides through), and the six finds. |
| `pictures.js` | The fish and Sadie in her diving suit (her own sprite with the helmet, tank and flippers drawn on), drawn when the room is built. |
| `room.js` | The room (10 x 12 m, 4.2 m tall, sea-blue fish-bone wallpaper, a wave rug, a S.S. SADIE life ring and a porthole on the left wall), the tank (a painted sea inside, sand, a castle, a treasure chest, a bubbling diving helmet, weed and coral, dithered glass, an open top with the SADIE'S AQUARIUM rim and a light bar, a can of fish food), the sign, the COMING SOON sign in the water, the OCEAN FINDS cabinet, the fish, Sadie and the bubbles. Tapping: three spots along the glass (`uses`, each with `act`), so wherever you stand at it you can tap it. `window.__aquarium` for the checks. |
| `door.js` | Its door on the landing: sea blue, its sign a little tank of its own with a goldfish in it, a porthole with a fish going past, water seeping out underneath. Drawn by `art/aquarium/door.js` (`node tools/aquarium/pictures.mjs`). |

Its checks: `tests/aquarium/run.mjs` (the card and door, the fish and Sadie stay in the water, the
dive never passes through the glass or the rim and comes back where you stood) and
`tests/aquarium/browser.mjs` (the door on the landing, into the room, the prompt at the glass and not
elsewhere, tapping it: the glare, the dip, the sign, back where you stood and walking again).

## Parked ideas

- Soft, rare bubble sounds (only if the owner wants them).
- A gentle "tok tok" when you tap the glass.

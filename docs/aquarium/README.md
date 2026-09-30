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
2. **The ocean (built).** Planned with the owner on 2026-09-30, from the approved sea chart
   (https://claude.ai/artifact/TBpQYmZUAqKcFqyk3gRfk3). It's kept small, so the owner can play all
   of it and check it quickly: a full trip takes a few minutes.
   - **Getting there, invisibly.** Tapping the glass: your view rises over the rim and sinks straight
     down to the sand. Looking at nothing but the sand, the room is swapped for the ocean, which has
     an exact copy of the tank's floor right there (put under wherever the boat was left). You rise
     up through the sea, break the surface, look up, and you're in a little sailboat.
   - **Getting back:** the BACK TO AQUARIUM button on the boat's dashboard (E, or GO HOME on a
     phone) does the same the other way, and you come out of the tank where you stood. What you've
     found, and where you left the boat, are saved: the next trip comes up in the same spot.
   - **Six spots, one find each**, which go in the OCEAN FINDS cabinet: a message in a bottle (the
     bottle), a shipwreck seen through the water (a captain's hat), a giant rubber duck (a normal
     one), a lighthouse (a floppy disk, LIGHTHOUSE.EXE), a palm tree island (a coconut with a face),
     and the looming mountain (the mountain itself).
   - **The looming mountain** fills the sky from anywhere in the sea: it's drawn scaled up in step
     with how far away it is, so it always looks the same size (the size trick from the owner's
     Looming artifact, pushed to the extreme, on the mountain alone). Over the last stretch it
     shrinks right down to its real size: a rock the size of a sandcastle, with Sadie sitting on top.
   - **The reef** round the mountain keeps you out until you've found the other five. Each find
     lights one of its five buoys; after the fifth the reef sinks, the dashboard's LED sign says GO
     TO THE MOUNTAIN!, and a trail of lit buoys leads in. Bump the reef early and the sign says how
     many more things to find.
   - **Breadcrumbs:** each spot drifts a trail of its own little things out across the sea towards
     where you start (baby ducks, planks, coconuts, corks, glowing floats), a twinkle hangs over each
     spot you haven't found yet (seen from anywhere), and the dashboard's radar has a blip for each.
   - **The end:** with all six, Sadie waves from her sandbar holding up a cardboard sign over her
     head: ALL 6 FOUND! MORE IN THE FULL GAME, RELEASING 1996! (it's lost shareware: there is no full
     game). The dashboard just says ALL 6 FOUND! The sea stays open to sail round.

## Design pillars (the owner's rules; these win over any feature idea)

- Sadie's in the tank, in a diving suit, with the fish.
- The sign says not to tap on the glass, and tapping it is how you get to the ocean.
- On a phone you look round by swiping, so a swipe must never tap the glass by accident: tapping
  only happens through a prompt (E, or the TAP GLASS button on a phone), and the prompt only shows
  when you're standing at the glass and looking at it.
- No loading screen: going to the ocean is one smooth move of the camera.
- Things you find in the ocean show up in the aquarium room.
- Quiet (the owner has misophonia). The room itself makes no sound. Out at sea: one soft sound when
  you pick a find up, a gentle swell when the reef sinks, and now and then a single small wave or
  the sail when you turn hard (never two sounds within 8 s, a wave at most every 40 s, never the same
  wave twice running, and no loops at all). The test version has a SOUND TEST box on the room's left
  wall that plays every sound one at a time, so the owner can hear each one on its own first.
- The ocean is small enough for the owner to play right through and check: every spot is marked
  (a trail, a twinkle, a blip), the boat is quick, and nothing needs grinding.

## How it's built

| File | What it does |
|---|---|
| `card.js` | Its card: no page and no `start()`, just `room` (loads `room.js`), `door`, `slot: 4`, and `keeps` (the ocean's save, `sadies-clubhouse.aquarium.ocean`: what you've found, and where the boat is). |
| `tank.js` | The tank in numbers, with no screen (the tests read it): the room and the tank's size, the fish and their lanes, Sadie's lazy loop (`sadieAt`), the dive when you tap the glass (`dive`) and the way home (`surfaceHome`): the steps your view glides through, one of them marked `swap`, and the six finds. |
| `chart.js` | The ocean in numbers, with no screen (the tests read it): the six spots (where, how close the boat gets, how near to pick a find up), where you start, the reef (`reefOpen`), where the boat can be (`sailable`), what you can pick up (`findHere`), the looming mountain (`loom(d)`: how much bigger to draw it from d metres away), and reading the save. |
| `ocean.js` | The ocean's scene: the sky, the water (see-through dots) and the seabed, the copy of the tank's floor, the six spots and their finds, the reef and its buoys, the breadcrumbs and twinkles, the looming mountain and Sadie, and the boat round you (deck, mast, sail, and the dashboard with the LED sign, the radar and the button). It turns its own flat things to face you (the sea moves about under the mansion's feet each trip). |
| `sounds/` | The ocean's sounds, one file per kind: `finds.js` (a sound for each find, and the reef sinking), `sea.js` (a small wave, the sail, and `seaPacing`: when they're allowed), `index.js` (every sound by name and how loud, and `LIST` for the sound tester), with `retro.js` and `player.js` copied from the music room's and Brickbuster's (activities never share files). |
| `pictures.js` | The fish and Sadie in her diving suit (her own sprite with the helmet, tank and flippers drawn on), drawn when the room is built. |
| `room.js` | The room (10 x 12 m, 4.2 m tall, sea-blue fish-bone wallpaper, a wave rug, a S.S. SADIE life ring and a porthole on the left wall), the tank (a painted sea inside, sand, a castle, a treasure chest, a bubbling diving helmet, weed and coral, dithered glass, an open top with the SADIE'S AQUARIUM rim and a light bar, a can of fish food), the sign, the OCEAN FINDS cabinet (a question mark, or the find), the fish, Sadie and the bubbles, and (test version only) the SOUND TEST box. Tapping: three spots along the glass (`uses`, each with `act`), so wherever you stand at it you can tap it. The room and the ocean are one place to the mansion: the swap changes this place's `scene`, `faces`, `uses`, `floor` and `light`, and at sea its `speed` (the boat's) and `far` (how far you can see). The sea is moved each trip so the boat's spot lines up with the tank, and the copy of the tank's floor moved under the boat for the way home, lit just like the tank. `window.__aquarium` for the checks (and `hold`, which stops the dive at each swap so the pictures either side can be compared). |
| `door.js` | Its door on the landing: sea blue, its sign a little tank of its own with a goldfish in it, a porthole with a fish going past, water seeping out underneath. Drawn by `art/aquarium/door.js` (`node tools/aquarium/pictures.mjs`). |

Its checks: `tests/aquarium/run.mjs` (the card and door, the fish and Sadie stay in the water, the
dive and the way home never pass through the glass or the rim, and the swaps happen down at the sand
looking straight down; the spots are apart and reachable, a boat steering at the nearest thing picks
up all six in about a minute of sailing, the mountain last; the reef keeps you out until five are
found; the mountain looks exactly the same height from 30 m to 400 m off and shrinks to its real
size close in; the save; the sounds are short and soft, and in half an hour at sea stay rare) and
`tests/aquarium/browser.mjs` (the door, the room, the prompt at the glass; tapping it; the picture
just before the swap and just after are the same; up in the boat with the sign and the button home;
sailing; picking up the duck, with its sound; the reef; going home, comparing that swap too, back
where you stood; the duck in the cabinet; the next trip coming up where the boat was left).
`tools/aquarium/sail.mjs` takes pictures of a whole trip (every spot, the mountain from further and
further off, the cabinet) for looking at it by eye.

## Parked ideas

- Soft, rare bubble sounds in the room (only if the owner wants them).
- A gentle "tok tok" when you tap the glass.
- More of the ocean: diving down to the shipwreck, the finds doing something in the cabinet.

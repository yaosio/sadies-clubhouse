# The aquarium

The clubhouse's fifth activity (`src/activities/aquarium/`), behind the fifth door on the first
landing. Like Brickbuster '96 it lives in the clubhouse itself, not on a computer: a room with a big
fish tank along the back wall. Sadie swims in it in a little diving suit among the fish. A
cardboard sign taped to the glass says DON'T TAP ON THE GLASS!!, and you can tap it anyway: that
takes you down through the tank to a small ocean, sailing a little boat to six finds.

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
  the sail when you turn hard (never two sounds within 8 s, a wave at most every 40 s, never the
  same wave twice running, and no loops at all). The test version has a SOUND TEST box on the
  room's left wall that plays every sound one at a time, so the owner can hear each one on its own
  first.
- The ocean is small enough for the owner to play right through and check: every spot is marked
  (a trail, a twinkle, a blip), the boat is quick, and nothing needs grinding.

## Its pages

- `playing.md`: the room, the tank, tapping the glass and the OCEAN FINDS cabinet; read before
  changing the room.
- `ocean.md`: getting to the ocean and back, the six finds, the looming mountain, the reef, the
  breadcrumbs and the end; read before changing anything at sea.
- `how-built.md`: which code file does what, its saves and being put away; read before changing
  the code.
- `checks.md`: its tests and its trip-pictures tool; read before changing what's checked.
- `history.md`: the two steps it was built in. Only read before undoing a choice.
- `parked.md`: parked ideas.

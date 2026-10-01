# Space Adventure

The clubhouse's sixth activity (`src/activities/space-adventure/`), behind the sixth door on the
landing (the last one on the first floor). Like the aquarium it lives in the mansion itself, not on a
computer. The owner described it on 2026-09-30:

- **The door opens straight onto a spaceship's cockpit.** Out of the windscreen there are stars and a
  small planet. Walk in and you're strapped into the pilot's seat: you can't get up or look away
  (the pause menu still works, and stops everything where it is).
- **Sadie hops up from behind the dashboard** and sits on it, and the ship slowly flies to the planet
  (about a minute and a half). She talks the whole way, in a box at the bottom of the screen, about
  space, how big and lonely it is, and how small everything is: "See all that? That's space,
  everything lives there. You live there."
- **The music**: a contemplative, sad synthwave song, which builds as you get closer.
- **The planet grows until it fills the windscreen.** "We're almost there, a new planet, new life, new
  discoveries." The air glows round the ship, you go into the clouds, and you come out under them over
  the land, with no cut: a beach by the sea, tall snowy mountains behind. The song peaks as you touch
  down, and you see the landscape "in all its 90's graphics glory".
- **Then**: "But you've seen this already. It's just land and water." She comes closer. "Disappointing
  isn't it?" Closer still. "Almost as disappointing as when you didn't give me the treats I wanted."
  She flies at you and the screen goes black.
- **When the black clears** you're standing just inside the same door, but now it's a generic space
  room. Sadie sits in it in a space helmet saying "I love space!", and a radio plays a happy version of
  the song. A big red button under a FUN SPACE ADVENTURE sign takes you on the trip again.

After the first trip the door always opens onto the space room. Starting Space Adventure over (the
pause menu) gives you the first trip again.

## Design pillars (the owner's rules; these win over any feature idea)

- It's a trip you watch, not a game: once you're in the seat, nothing you do changes it.
- Sadie talks the entire time. Never just a few lines.
- No loading screens and no cuts: space becomes the land while there's nothing but cloud out of the
  window (the same trick as the aquarium's dive).
- The music is requested, but the owner has misophonia: no droning or humming layers, no hi-hats
  ticking away, every note fades to nothing. Sadie's words make no sound as they type out. The radio
  gets quieter as you walk away from it, and E (RADIO on a phone) turns it off.
- Smooth on a phone: everything is drawn with the mansion's own materials (no new kinds), the land is
  one low-detail grid, and the music's notes are made a few at a time, ahead of when they're needed.

## How it's built

| File | What it does |
|---|---|
| `card.js` | Its card: `room`, `door`, `slot: 5`, and `keeps` (`sadies-clubhouse.space-adventure.trip`: whether you've been). |
| `trip.js` | The trip in numbers, with no screen (the tests read it): when everything happens (`T`), what Sadie says and when (`LINES`), how big the planet looks (`planetSize`), the glow and the clouds (`entry`: fully white at the swap), the way down through the clouds to the beach (`shipAt`), where Sadie is (`sadieAt`), and the land's shape (`heightAt`: the beach at 0, 0, the sea on your left, hills, mountains far ahead). |
| `room.js` | Puts it together as one place: one scene holding the cockpit, space, the land and the space room, showing only what you should see. Walking in past `LOCK_Z` sets the place's `watch` (with `at`, the seat), which the mansion uses to put you in the seat and keep your eyes ahead. Runs the trip's clock (stopped while paused), swaps space for the land at `T.swap`, and at the black saves the trip, shows the space room and puts you by the door. The button and the radio are its `uses`. `window.__space` for the checks (its state, `warp` to run the clock faster, `jump` to a moment). |
| `cockpit.js` | The SADIE-1's cockpit: purple panelled walls, the windscreen (just holes: what's outside is drawn behind everything), the dashboard (screens, a radar, blinking lights), the control stick, the pilot's seat, side consoles, a SPACE CADET poster, Sadie's food bowl, and `weather`: a box round the cockpit drawn in dots, orange while the air glows, white in the clouds. |
| `space.js` | Stars (a sphere of dots), a pink gas cloud, a galaxy, the sun and its lens flare, and the planet with its clouds and its thin blue air, drawn at a fixed distance and made bigger as you get closer. |
| `land.js` | The land: one big grid coloured by height (sand, grass, purple rock, snow), the sea with foam along the beach, alien plants and rocks, a purple-to-pink sky with a ringed planet and a moon, and clouds that turn to face you. `place(ship)` moves the whole land round the cockpit. |
| `hangout.js` | Sadie's space room: starry wallpaper, glow-in-the-dark ceiling stars, a ringed-planet rug, a planet mobile, a round window onto space, a telescope and a toy rocket, the radio (notes float out while it plays), Sadie in her helmet on a cushion with her I LOVE SPACE! bubble, and the big red button under its sign. |
| `talk.js` | Sadie's words at the bottom of the screen, typed out (silently), with her face; and the black. |
| `pictures.js` | Every little picture, drawn when the room is built. |
| `music/` | `song.js` (the notes: the trip's song in A minor, 29 bars that land exactly at touchdown and build a layer at a time; the radio's, the same tune happy in C major, going round), `synth.js` (the instruments, as plain numbers at 22 kHz: pads, plucks, bass, a lead, a bell, a soft kick and snare), `player.js` (plays the notes on time in the browser, through a soft echo; the radio's loudness follows how near you are). |
| `door.js` | Its door on the landing: a spaceship's hatch with a SPACE sign, a rocket, a porthole with the planet in it, and hazard stripes. Drawn by `art/space-adventure/door.js` (`node tools/space-adventure/pictures.mjs`). |

Its music goes through a music line of the clubhouse's sound system (`src/shared/sound.js`), so the clubhouse's main theme makes way for the trip's song and the radio by itself. The room also asks for quiet (its place's `hush`) from the moment you step into the cockpit, through the whole trip (the song lands at touchdown, and the quiet after it is the ship's, not the theme's), and in the space room while the radio's on, so the theme never plays over the start or sneaks back before the radio; with the radio turned off it comes back; the pause menu's MUSIC button (ON, SOFT, OFF) turns them down too, and they're only heard in the room. Pausing stops the song where it is (and starts it again from there) and quiets the radio.

The mansion changes it needed (`docs/clubhouse/ROOMS.md`): a place's `watch` can say `at`
(where you're put while watching), the kit has `paused()`, and the thumb stick hides while you're
made to watch something.

Its checks: `tests/space-adventure/run.mjs` (the card and door; all of the owner's lines, word for
word and in order; she talks the whole way and every line is up long enough to read; the planet only
grows; white at the swap; the way down never touches the ground or jumps, and lands on the beach
with the sea beside it; Sadie's hops; the music builds to touchdown, has no long held notes or
hi-hats, and every note is soft and click-free) and `tests/space-adventure/browser.mjs` (the door,
the cockpit through it, walking in and being strapped in, Sadie talking, the music, pausing, the
swap, landing, the black, the space room with the radio, the button, and the door afterwards).
`tools/space-adventure/trip.mjs [phone|desktop] [times...]` takes pictures along the trip.

**Put away when you're far off.** The mansion puts Space Adventure away when you've been three doors or more from it for a while (see the clubhouse's `MANSION.md`): `putAway()` closes its music for good and takes Sadie's talk box and the black off the page. It's built again from its save (whether you've been on the trip) as you come back.

## Parked ideas

- None yet.

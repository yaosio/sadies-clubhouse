# Sound and music

Every sound in the game goes through one sound system, and the mansion plays a main theme of its
own. The short overview is `ARCHITECTURE.md`; read this page when you're changing how anything
sounds. The owner has misophonia: nothing droning, constant or repetitive.

- **The main theme** (`src/clubhouse/music/`): soft music that plays while you're anywhere in the
  mansion or outside, composed as it plays so it never repeats (the owner asked for that, and has
  misophonia: no drums, no held pads or drones, every note dies away by itself, a quiet moment
  between pieces). `compose.js` writes it with no browser (the tests run it): a piece at a time, a
  minute or two long, each with its own key, mode (major, lydian, dorian, mixolydian, aeolian),
  speed, 4 or 3 beats a bar and instruments, a form (intro, a tune it comes back to, a middle bit,
  an ending), chord progressions for each part, and a motif each phrase plays a variation of, with
  phrases of rest and soft echoes between. `voices.js` plays each note live on the browser's own
  oscillators (an FM electric piano, a music box, a flute, a marimba, vibes, a harp, a bass: no
  stored sounds, so it costs nothing to keep) through a soft echo; `theme.js` hands the notes over
  a moment ahead, and fades. **It never plays over other music, by itself:** the sound system
  (`src/shared/sound.js`, below) hears when any other music is actually playing (Space
  Adventure's song and radio, Brickbuster's arcade music, the Hedge Maze's music box, and whatever a
  new room plays), and the
  theme fades out (about two seconds), staying away until that music has been quiet for 6 seconds,
  then fades back in (about four), carrying on, or with a new piece after a long quiet. No room has
  to do anything about it. A place can also ask for quiet with `hush` (`true`, or a function), and
  the theme then fades quicker (about one second): the Music Room does, since its instruments are
  sounds, not music, and Space Adventure does from the moment you step into the cockpit, for the whole trip, and while
  its radio's on (its song has quiet stretches the theme mustn't slip into). It stops when an activity on a
  computer starts (the mansion leaves the page).

- **The sound kit** (`src/shared/retro.js`): what the rooms' sounds are made with (plain numbers: 8-bit 11 kHz samples, `rng`, `hz`, `blank`, `ring`, `ping`, `pluck`, `swell`, a sliding `tone`, a soft `hush`, `resonance`, Sadie's `mrrp` (each room its own pitch), and three endings, the gentle `finish`, the same with no echo `dry`, and Brickbuster's `crunch`). The rooms share it: never a copy of it in a room.
- **The band** (`src/shared/band.js`): what a room's own music plays through (Brickbuster's, Space Adventure's, the Hedge Maze's): a music line, an echo, and parts that fade in and out with their share of the echo. The room keeps its notes and when they're due; a new room's music starts here.
- **The sound system** (`src/shared/sound.js`): every sound in
  the game is played through it, on one audio engine for the whole page. A room gets a handle with
  `soundsFor(owner)` (its place's name, `room:<id>`) and plays by name, `handle.play(key, make,
  { loud, bus, rate, hold, gap, at })` (the samples made the first time, then kept), or asks for a
  `handle.line(bus)` (`{ ctx, out }`) for music it streams note by note (or a held note: the
  theremin). Three buses, each with its volume on the pause menu (ON, SOFT, OFF, kept as
  `mansion.music`, `mansion.sounds`, `mansion.voices`): `music`, `sounds` (effects, instruments you
  play) and `voices` (Sadie, Clyde). **The rules live here, once** (the owner has misophonia): the
  same sound never again within its `gap` (0.08 s unless it says), a voice never the same thing
  twice running (within 10 s: a room with only one meow still meows later), nothing but music
  behind the pause menu (the mansion says when it's up: `paused()`, so no room needs pause code for
  its sounds), `at` (where the sound is, `{x, z}` or `{x, y, z}`) fading it the further it is from you (`nearness`; `dist` if a room works it out itself), never more than 14 sounds at once
  (more are dropped). A room's music is only heard while you're in that room (a line made with `{ everywhere: true }` is heard everywhere: the main theme's) (the mansion tells it
  where you are, `youAreIn`), and any music playing (a meter on every music line) makes the main
  theme fade out (`otherMusic()`). When the mansion puts a room away it stops everything that room
  started (`closeSounds`), whatever the room forgot, and every sound when it leaves the page (`closeSounds()`). Sounds that
  belong to a building's house rather than its room (they carry on while the room's put away) use an
  owner of their own, `house:<name>` (Clyde's weather machine). A room wraps its handle (`Object.create(handle)`, its sounds by name on top), never changes it: the handle can't be added to or have its own `play` replaced (trying is an error, which the checks catch). So a new room just plays through its handle
  (music on a music line) and keeps every rule for free. The clubhouse's headless test fails if
  anything else makes an AudioContext or plays straight to the speakers, and its browser test
  visits every room and fails if any of its music is still heard after you've left, or anything
  of it is left once it's put away.


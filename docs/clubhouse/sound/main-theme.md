# The main theme

The clubhouse's own music (`src/clubhouse/music/`). Read when changing it, or when a room's music or
quiet needs to work with it.

## What it is
Soft music that plays while you're anywhere in the clubhouse or outside, composed as it plays so it
never repeats (Claude's design, from the owner's early ask for no looping). Because the owner
dislikes droning and ticking (`docs/clubhouse/RULEBOOK.md` section 4): no drums, no held pads or
drones, every note dies away by itself, a quiet moment between pieces.
- `compose.js` writes it with no browser (the tests run it): a piece at a time, a minute or two long,
  each with its own key, mode (major, lydian, dorian, mixolydian, aeolian), speed, 4 or 3 beats a bar
  and instruments, a form (intro, a tune it comes back to, a middle bit, an ending), chord
  progressions for each part, and a motif each phrase plays a variation of, with phrases of rest and
  soft echoes between.
- `voices.js` plays each note live on the browser's own oscillators (an FM electric piano, a music
  box, a flute, a marimba, vibes, a harp, a bass: no stored sounds, so it costs nothing to keep)
  through a soft echo.
- `theme.js` hands the notes over a moment ahead, and fades.

## It never plays over other music, by itself
- The sound system hears when any other music is actually playing (whatever a room plays), and the
  theme fades out (about two seconds), staying away until that music has been quiet for 6 seconds,
  then fades back in (about four), carrying on, or with a new piece after a long quiet. No room has
  to do anything about it.
- A place can also ask for quiet with `hush` (`true`, or a function), and the theme then fades
  quicker (about one second): a room whose instruments are sounds, not music, or one whose own music
  has quiet stretches the theme mustn't slip into.
- It stops when an activity on a computer starts (the clubhouse leaves the page).

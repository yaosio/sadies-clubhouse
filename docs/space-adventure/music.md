# Space Adventure's music

The trip's song and the radio's: the files that make them, and how they play through the
clubhouse's sound system and ask for quiet. Read before changing the music or the radio.

## Files in `music/`

- `song.js`: the notes: the trip's song in A minor, 29 bars that land exactly at touchdown and
  build a layer at a time; the radio's, the same tune happy in C major, going round.
- `synth.js`: the instruments, as plain numbers at 22 kHz: pads, plucks, bass, a lead, a bell, a
  soft kick and snare.
- `player.js`: plays the notes on time in the browser, through the toolbox's band,
  `src/shared/band.js`, with a soft echo; the radio's loudness follows how near you are.

## Playing through the sound system

Its music goes through a music line of the clubhouse's sound system (`src/shared/sound.js`), so the
clubhouse's main theme makes way for the trip's song and the radio by itself. The room also asks for
quiet (its place's `hush`) from the moment you step into the cockpit, through the whole trip (the
song lands at touchdown, and the quiet after it is the ship's, not the theme's), and in the space
room while the radio's on, so the theme never plays over the start or sneaks back before the radio;
with the radio turned off it comes back. The pause menu's MUSIC button (ON, SOFT, OFF) turns them
down too, and they're only heard in the room. Pausing stops the song where it is (and starts it
again from there) and quiets the radio.

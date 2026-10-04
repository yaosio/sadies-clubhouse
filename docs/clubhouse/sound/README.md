# Sound and music

Every sound in the game goes through one sound system, and the clubhouse plays a main theme of its
own. The kind-to-the-ears rule (no droning, no ticking, nothing loud or constant) is written once, in `docs/clubhouse/RULEBOOK.md` section 4.
Read only the page your change touches.

- `system.md`: the sound system (`src/shared/sound.js`): how a room plays sounds and music, the
  buses, the kind-to-the-ears rules, and the checks. Read before adding or changing any sound.
- `making-sounds.md`: what sounds are made with: the sound kit (`src/shared/retro.js`) and the band
  for a room's own music (`src/shared/band.js`).
- `main-theme.md`: the clubhouse's own music, and how it makes way for other music.

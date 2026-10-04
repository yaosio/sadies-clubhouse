# Space Adventure

The clubhouse's sixth activity (`src/activities/space-adventure/`), behind the sixth door on the
first landing. Like the aquarium it lives in the clubhouse itself, not on a computer. The door opens
onto a spaceship's cockpit: you're strapped into the pilot's seat while Sadie talks the whole way to
a planet, then you land in her space room, where a radio plays and a big red button takes you on the
trip again.

## Design pillars (the owner's rules; these win over any feature idea)

- It's a trip you watch, not a game: once you're in the seat, nothing you do changes it, and there's no way out until it's over. That
  is on purpose (the owner, 2026-10-04: people are meant to be trapped in the spaceship scene).
- Sadie talks the entire time. Never just a few lines.
- No loading screens and no cuts: space becomes the land while there's nothing but cloud out of the
  window (the same trick as the aquarium's dive).
- The music is requested, but the owner dislikes droning and ticking (`docs/clubhouse/RULEBOOK.md` section 4): no droning or humming layers, no hi-hats
  ticking away, every note fades to nothing. Sadie's words make no sound as they type out. The radio
  gets quieter as you walk away from it, and E (RADIO on a phone) turns it off.
- The radio plays its song (a 34 s piece) on a loop for as long as it's on and you're in the room.
  The owner decided on 2026-10-02 to keep it that way: a loop you choose to switch on, and can
  switch off (`docs/clubhouse/RULEBOOK.md` section 4).
- Smooth on a phone: everything is drawn with the clubhouse's own materials (no new kinds), the land is
  one low-detail grid, and the music's notes are made a few at a time, ahead of when they're needed.

## Its pages

- `playing.md`: the trip and the space room as the player sees them, what Sadie says and does, the
  controls. Read before changing what happens on the trip or in the space room.
- `how-built.md`: which file does what, its save, being put away, its checks. Read before changing
  any of its code.
- `music.md`: the trip's song and the radio's, and how they play and ask for quiet. Read before
  changing the music or the radio.
- `parked.md`: parked ideas (don't start unless asked).
- `history.md`: when the owner described it and the clubhouse changes it needed. Only read before
  undoing a choice.

// Cats Only's card for the clubhouse: a closet of a room behind a door on the first landing, straight
// above the front door, with a red DO NOT PRESS button beside it. It lives in the clubhouse itself
// (no page, no start()): just `room`, which the clubhouse calls with its building kit (room.js).
import door from './door.js';

export default {
  id: 'cats-only',
  name: 'Cats Only',
  door,
  slot: 6,   // the seventh door on the landing (they never move): the first landing, over the front door
  box: { side: 0xd8782a },   // its colour
  keeps: ['sadies-clubhouse.cats-only.'],   // whether the button has been pressed (the pause menu can start it over)
  room: () => import('./room.js'),
};

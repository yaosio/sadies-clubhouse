// The aquarium's card for the clubhouse. Like Brickbuster '96 it lives in the clubhouse itself, not
// on a computer: no page and no start(), just `room`, which the clubhouse calls with its building kit
// when it opens (see room.js). Its door on the landing is `door`. It saves what you've found in the
// ocean and where you left the boat (`keeps`, for the pause menu's start-over buttons).
import door from './door.js';

export default {
  id: 'aquarium',
  name: 'Aquarium',
  door,
  slot: 4,   // the fifth door on the landing (they never move)
  box: { side: 0x2a8ad0 },   // its colour
  keeps: ['sadies-clubhouse.aquarium.'],   // (the ocean: what you've found, and where you left the boat)
  room: () => import('./room.js'),
};

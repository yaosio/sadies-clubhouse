// Space Adventure's card for the clubhouse. Like the aquarium it lives in the clubhouse itself, not on a
// computer: no page and no start(), just `room`, which the clubhouse calls with its building kit when it
// opens (see room.js). Its door on the landing is `door`. It remembers whether you've been on the trip
// (`keeps`, for the pause menu's start-over buttons: starting it over gives you the first trip again).
import door from './door.js';

export default {
  id: 'space-adventure',
  name: 'Space Adventure',
  door,
  slot: 5,   // the sixth door on the landing (they never move)
  box: { side: 0x3a2a8c },   // its colour
  keeps: ['sadies-clubhouse.space-adventure.'],
  room: () => import('./room.js'),
};

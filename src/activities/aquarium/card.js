// The aquarium's card for the clubhouse. Like Brickbuster '96 it lives in the mansion itself, not
// on a computer: no page and no start(), just `room`, which the mansion calls with its building kit
// when it opens (see room.js). Its door on the landing is `door`. It saves nothing yet (the ocean,
// and the things you'll find there, come later).
import door from './door.js';

export default {
  id: 'aquarium',
  name: 'Aquarium',
  door,
  slot: 4,   // the fifth door on the landing (they never move)
  box: { side: 0x2a8ad0 },   // its colour
  room: () => import('./room.js'),
};

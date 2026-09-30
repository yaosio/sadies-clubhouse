// The music room's card for the clubhouse. Like Brickbuster '96, it lives in the mansion itself
// rather than on a computer: no page of its own and no start(), just `room`, which the mansion calls
// with its building kit when it opens (see room.js). Its door on the landing is `door`.
import door from './door.js';

export default {
  id: 'music-room',
  name: 'The Music Room',
  door,
  slot: 3,   // which door on the landing is its (the fourth; they never move)
  box: { side: 0x38b0c8 },   // its colour
  keeps: ['sadies-clubhouse.music-room.'],   // what it saves in the browser (the pause menu can start it over)
  room: () => import('./room.js'),
};

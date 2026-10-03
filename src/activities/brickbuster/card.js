// Brickbuster '96's card for the clubhouse. It's the first game that lives in the clubhouse itself
// rather than on a computer: no page of its own and no start(), just `room`, which the clubhouse calls
// with its building kit when it opens (see room.js). Its door on the landing is `door`.
import door from './door.js';

export default {
  id: 'brickbuster',
  name: "Brickbuster '96",
  door,
  slot: 0,   // which door on the landing is its (the first one up the stairs; they never move)
  box: { side: 0x3a2a8e },   // its colour
  keeps: ['sadies-clubhouse.brickbuster.'],   // what it saves in the browser (the pause menu can start it over)
  room: () => import('./room.js'),
};

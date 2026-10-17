// Chooter's Paint Shop's card for the clubhouse. It isn't behind a door in the clubhouse:
// it's Chooter's shop (everything outside the gate belongs to somebody else), on the lowest landing of Dog City's giant
// hydrant out past the town square (`lot` 1, moved there from across the path from Clyde's House, at the owner's word). Like Clyde's House it has no page and no start(),
// just `room`, whose module builds the shop outside and the room inside, where you paint the room.
export default {
  id: 'paint-shop',
  name: "Chooter's Paint Shop",
  lot: 1,   // the lowest landing of Dog City's hydrant
  box: { side: 0x9af0d0 },   // its colour (mint, like its walls)
  keeps: ['sadies-clubhouse.paint-shop.'],   // the paint on everything, and what you're holding
  room: () => import('./room.js'),
};

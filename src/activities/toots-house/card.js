// Toots' House's card for the clubhouse. It isn't behind a door in the clubhouse: it's Toots' house
// (everything outside the gate belongs to somebody else), on the fourth plot round the town square
// (`lot` 3, beside Chooter's Paint Shop, where the COMING SOON stake stood; plots never move). Like the
// other buildings outside it has no page and no start(), just `room`, whose module builds the house
// outside (Toots watching from her upstairs window) and the two floors inside, where she plays fetch.
// Nothing is saved.
export default {
  id: 'toots-house',
  name: "Toots' House",
  lot: 3,   // the fourth plot round the town square: beside Chooter's Paint Shop, the path between them
  box: { side: 0x9ccaf4 },   // its colour (sky blue, like its siding)
  room: () => import('./room.js'),
};

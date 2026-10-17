// Toots' House's card for the clubhouse. It isn't behind a door in the clubhouse: it's Toots' house
// (everything outside the gate belongs to somebody else), on the middle landing of Dog City's giant
// hydrant out past the town square (`lot` 3, moved there from beside the paint shop, at the owner's word). Like the
// other buildings outside it has no page and no start(), just `room`, whose module builds the house
// outside (Toots watching from her upstairs window) and the two floors inside, where she plays fetch.
// Nothing is saved.
export default {
  id: 'toots-house',
  name: "Toots' House",
  lot: 3,   // the middle landing of Dog City's hydrant, between Chooter's Paint Shop and Lily's ledge
  box: { side: 0x9ccaf4 },   // its colour (sky blue, like its siding)
  room: () => import('./room.js'),
};

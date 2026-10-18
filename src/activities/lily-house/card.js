// Lily's House's card for the clubhouse. It isn't behind a door in the clubhouse: it's Lily's house
// (everything outside the gate belongs to somebody else), on the top ledge of Dog City's giant
// hydrant (`lot` 5, the ledge that waited for her with a COMING SOON sign). Like the other buildings
// outside it has no page and no start(), just `room`, whose module builds the house outside (Lily
// bouncing on her porch) and the living room and game room inside, where Lily's Big Climb is on the
// back wall. Nothing is saved (the game's best score lasts until the page closes).
export default {
  id: 'lily-house',
  name: "Lily's House",
  lot: 5,   // the top ledge of Dog City's hydrant, above Toots' House
  box: { side: 0xffc89e },   // its colour (apricot, like Lily and her siding)
  room: () => import('./room.js'),
};

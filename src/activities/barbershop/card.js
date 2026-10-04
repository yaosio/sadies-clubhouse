// Marbles' Cut & Curl's card for the clubhouse. It isn't behind a door in the clubhouse: it's
// Marbles' barbershop (everything outside the gate belongs to somebody else), on the third plot
// along the lane outside the front gate (`lot` 2, next to Clyde's House; plots never move). Like the
// other buildings outside it has no page and no start(), just `room`, whose module builds the shop
// outside and the room inside, where Sadie gets her hair, tail and outfit done. Nothing is saved.
export default {
  id: 'barbershop',
  name: "Marbles' Cut & Curl",
  lot: 2,   // the third plot along the lane: beside Clyde's House, where the COMING SOON stake stood
  box: { side: 0xff8ec8 },   // its colour (pink, like its awning)
  room: () => import('./room.js'),
};

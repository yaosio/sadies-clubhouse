// Clyde's house's card for the clubhouse. It isn't behind a door on the landing: it's a house of its
// own on a plot outside the front gate (`lot`, 0 the first plot along the lane; they never move).
// Like the music room it has no page and no start(), just `room`, whose module builds the house
// outside (buildHouse's part of buildRoom) and the room inside, where the Good Morning Machine is.
export default {
  id: 'clydes-house',
  name: "Clyde's House",
  lot: 0,   // the first plot along the lane outside the gate
  box: { side: 0xd97757 },   // its colour
  keeps: ['sadies-clubhouse.clydes-house.'],   // how far you've got with the machine, the treats delivered, and the weather
  room: () => import('./room.js'),
};

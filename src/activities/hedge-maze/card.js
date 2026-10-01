// The hedge maze's card for the clubhouse. It isn't behind a door on the landing, or on a plot along
// the lane: it's a block of hedge in the grounds beside the house (`grounds`, 0 the first spot in the
// grounds, left of the house; they never move), with an arch at the front and one into the backyard.
// Like Clyde's house it has no page and no start(), just `room`, whose module builds the hedge block
// outside (block.js) and the maze inside, which is much bigger than the block.
export default {
  id: 'hedge-maze',
  name: 'The Hedge Maze',
  grounds: 0,   // the first spot in the grounds round the house: beside it, on the left
  box: { side: 0x3fa34d },   // its colour
  room: () => import('./room.js'),
};

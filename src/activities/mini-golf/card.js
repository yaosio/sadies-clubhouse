// Sadie's Mini Golf's card for the clubhouse. It isn't behind a door on the landing, or on a plot
// along the lane: it's three holes out in the backyard (`grounds`, 1 the second spot in the grounds:
// the backyard; they never move). It has no doors at all: you walk up to a tee and play. Like the
// hedge maze it has no page and no start(), just `room`, whose module builds the course outside.
export default {
  id: 'mini-golf',
  name: "Sadie's Mini Golf",
  grounds: 1,   // the second spot in the grounds round the house: the backyard
  box: { side: 0x2a78e8 },   // its colour
  keeps: ['sadies-clubhouse.mini-golf.'],   // the best scores (nothing else is kept: a hole starts over when you step away)
  room: () => import('./room.js'),
};

// Where the town square is, and what stands round it: the plots, and the paths that lead on
// outward. Only numbers, so a new plot or path is a line here (docs/clubhouse/outside/plots.md).
//
// The square is a round paved space just outside the front gate. The plots stand round its far side
// in a curve, each turned to face the middle, so every front door looks onto the square. Paths leave
// the square between them and run on out into the grass: a new building goes beside one of those, so
// nothing already built has to move.
export const SQUARE = { x: 0, z: -32, r: 11.1 };   // the middle, and how far the paving goes
const RING = 16;                                      // how far from the middle the front doors stand

// An angle round the square is in degrees: 0 straight on from the gate, - to the left going out, + to the right
const at = deg => ({ x: SQUARE.x + RING * Math.sin(deg * Math.PI / 180), z: SQUARE.z - RING * Math.cos(deg * Math.PI / 180) });
const round = (n, to) => Math.round(n * to) / to;
const plot = deg => ({ x: round(at(deg).x, 100), y: 0, z: round(at(deg).z, 100), yaw: round(-deg * Math.PI / 180, 10000) });

// The plots: the same numbers, in the same order, as the cards' `lot` (never reordered: a new one goes on
// the end). Each is the middle of a front door's threshold, with `yaw`: the way the door faces
// (towards the middle of the square).
// 0 Clyde's House (and his weather machine, out to its left), 1 Chooter's Paint Shop, 2 the barbershop, 3 the next free one.
export const LOTS = [plot(-23), plot(23), plot(-66), plot(62)];

// The paths out of the square, between the buildings: `at` the angle they leave in, `bend` how far they
// turn half way along (so they wind a little), and `to` how far from the middle they go before they
// stop in the grass. A building that grows along one of these takes a new plot beside it.
export const PATHS = [{ at: -90, bend: 0, to: 26 }, { at: 0, bend: 7, to: 25 }, { at: 43, bend: -8, to: 25 }, { at: 90, bend: 0, to: 26 }];

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

// Dog City: a giant red fire hydrant out past the square, on the way the 43 degree path points. A ramp
// winds up round it (a few turns, gentle all the way, with a landing wherever a dog lives), and the dog
// houses stand on the landings' ledges: the ramp's `turn` (radians round from the way back to the square)
// where each landing is, `y` how high, and `door` how far out from the middle its house's front door
// stands. The top is a lookout deck round the cap. Everything walkable and solid about it comes from
// these numbers (hydrant-walk.js), and so does what's drawn (hydrant.js).
export const HYDRANT = {
  x: 31, z: -66,
  barrel: 10,            // how wide the barrel is (radius)
  lane: [10, 13.5],      // the ramp's lane: from the barrel out to here
  ledge: 29,             // how far out a landing's ledge goes
  deck: [8, 19],         // the lookout deck round the cap: in to out
  top: 30,               // how high the deck is
  half: 0.5,             // a landing's half width, in radians of turn
  end: 28.4,             // where the ramp meets the deck (turn)
  stops: [
    { who: 'chooter', turn: 7.3, y: 8, door: 22.5 },
    { who: 'toots', turn: 15.7, y: 15, door: 25.5 },
    { who: 'lily', turn: 24.1, y: 22, door: 22.5 },   // (her ledge is waiting for her house: lot 5)
  ],
};
HYDRANT.th0 = Math.atan2(SQUARE.z - HYDRANT.z, SQUARE.x - HYDRANT.x);   // the way from the hydrant to the square: where the ramp starts
const polar = (r, th) => ({ x: HYDRANT.x + r * Math.cos(th), z: HYDRANT.z + r * Math.sin(th) });
// a landing's front door as a plot: where its threshold is, how high, and the way it faces (straight out from the hydrant)
const ledge = i => {
  const s = HYDRANT.stops[i], th = HYDRANT.th0 + s.turn, p = polar(s.door, th);
  return { x: round(p.x, 100), y: s.y, z: round(p.z, 100), yaw: round(Math.atan2(Math.sin(Math.PI / 2 - th), Math.cos(Math.PI / 2 - th)), 10000) };
};

// The plots: the same numbers, in the same order, as the cards' `lot` (never reordered: a new one goes on
// the end). Each is the middle of a front door's threshold, with `yaw`: the way the door faces
// (towards the middle of the square, or out from the hydrant).
// 0 Clyde's House (and his weather machine, out to its left), 1 Chooter's Paint Shop (Dog City, the
// lowest landing), 2 the barbershop, 3 Toots' House (Dog City, the middle landing), 4 the next free
// one (past the path on the right), 5 Lily's House (Dog City, the top landing).
export const LOTS = [plot(-23), ledge(0), plot(-66), ledge(1), plot(105), ledge(2)];
export const LILY_LOT = 5;   // (held for Lily's house: its ledge has its own sign, so it never gets the generic COMING SOON stake)

// The doors that just get you about Dog City (no room behind them: a door at the bottom and its
// other half by a house or on the lookout, both real doorways, each leading to the other). `base`:
// how far round from the foot of the ramp the one at the bottom is (radians; negative: the way the
// ramp doesn't go); `stop`: which landing the other one is on (the lookout: -1, up on the deck);
// `up`: its place round the hydrant (the lookout's faces the clubhouse), as a turn from the foot.
const toward = (x, z) => Math.atan2(z - HYDRANT.z, x - HYDRANT.x);
export const HYDRANT_DOORS = [
  { id: 'chooter', label: "CHOOTER'S PAINT SHOP", color: 0xff8ec8, base: -0.35, stop: 0, up: 6.9 },
  { id: 'toots', label: "TOOTS' HOUSE", color: 0x7ab8f0, base: -0.7, stop: 1, up: 15.3 },
  { id: 'lily', label: "LILY'S HOUSE", color: 0xffb0d0, base: -1.05, stop: 2, up: 23.7 },
  { id: 'lookout', label: 'THE LOOKOUT', color: 0xffd23a, base: -1.4, stop: -1, up: toward(0, 5) - HYDRANT.th0 },   // (looking at the clubhouse, over the town)
];

// The paths out of the square, between the buildings: `at` the angle they leave in, `bend` how far they
// turn half way along (so they wind a little), and `to` how far from the middle they go before they
// stop in the grass. A building that grows along one of these takes a new plot beside it.
export const PATHS = [{ at: -90, bend: 0, to: 26 }, { at: 0, bend: 7, to: 25 }, { at: 43, bend: -8, to: 25 }, { at: 90, bend: 0, to: 26 }];

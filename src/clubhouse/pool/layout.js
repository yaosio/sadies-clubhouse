// The pool behind the clubhouse: where everything is, as plain numbers (x across, z out from the
// front; the backyard runs from z 10 to the fence at z 30). Nothing here draws anything: the
// pictures are pool.js, the goings-on are sim.js. A new thing at the pool is a line here.
// Every number is Claude's choice (the owner asked for "a nicely sized pool, not too big").

export const DECK = { x0: -8, x1: 8, z0: 16.5, z1: 29.6 };   // inside the low fence: the ball never leaves it
export const GATE = 1.2;                                      // the gap in the front fence is this far each side of x 0
export const POOL = { x0: -3.5, x1: 3.5, z0: 20.5, z1: 25 };  // the water
export const RIM = 0.4;                                       // the edge round the water you can't step over
export const COPING = { x0: POOL.x0 - RIM, x1: POOL.x1 + RIM, z0: POOL.z0 - RIM, z1: POOL.z1 + RIM };
export const WATER_Y = 0.03;                                  // the water's surface (the grass is 0)
export const BOARD = { x: 0, base: 26.8, tip: 24.0, y: 0.75 };   // the diving board, over the far end
export const LADDER = { x: POOL.x0, z: 22.7 };                // where you climb out, on the left
export const SADIE = { x: -6.8, z: 21.3, y: 0.55 };           // Sadie's lounger
export const BALL = { r: 0.3, start: [4.6, 19.4] };           // the beach ball

// What's solid on the deck, [x0, x1, z0, z1], standing from the ground up. The first few are what
// the ball, Chooter and Marbles bump into too; PLAYER_ONLY is what only you can't walk through.
export const SOLID = [
  [-7.25, -6.35, 20.2, 22.4],     // Sadie's lounger
  [-6.6, -5.9, 22.85, 23.55],     // the table with the tuna drink
  [6.2, 7.0, 20.4, 22.6],         // the other lounger
  [6.4, 7.6, 17.2, 18.2],         // the toy box
  [-2.1, -1.7, 16.8, 17.2],       // the flamingos
  [1.7, 2.1, 16.8, 17.2],
  [2.3, 3.7, 17.1, 17.3],         // the POOL RULES sign
  [-0.5, 0.5, 26.4, 27.3],        // the diving board's stand
];
export const FENCE = [            // the low fence round it, with a gap at the front
  [DECK.x0 - 0.05, DECK.x0 + 0.05, DECK.z0, 30],
  [DECK.x1 - 0.05, DECK.x1 + 0.05, DECK.z0, 30],
  [DECK.x0, -GATE, DECK.z0 - 0.05, DECK.z0 + 0.05],
  [GATE, DECK.x1, DECK.z0 - 0.05, DECK.z0 + 0.05],
];
export const PLAYER_ONLY = [
  [COPING.x0, COPING.x1, COPING.z0, COPING.z1],   // the water and its edge
  [-0.5, 0.5, 24.0, 27.3],                        // the board and under it
];
export const RECTS = [...SOLID, ...FENCE, ...PLAYER_ONLY];

// Chooter's laps round the pool (and the way up the board is off the back one, at x 0)
export const LAP = [[-5.2, 18.6], [5.2, 18.6], [5.2, 28.2], [0, 28.2], [-5.2, 28.2]];
export const DIVE_AT = 3;     // the index in LAP where he may turn up the board

// ---- bumping into things (a round thing of radius r at p) ----
export const inRect = (x, z, [x0, x1, z0, z1], m = 0) => x > x0 - m && x < x1 + m && z > z0 - m && z < z1 + m;
export const inWater = (x, z, m = 0) => inRect(x, z, [POOL.x0, POOL.x1, POOL.z0, POOL.z1], m);

// push p out of a rectangle if it's inside by more than nothing; returns true if it moved
function pushRect(p, r, [x0, x1, z0, z1]) {
  const cx = Math.max(x0, Math.min(x1, p.x)), cz = Math.max(z0, Math.min(z1, p.z));
  let dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz);
  if (d >= r) return false;
  if (d > 1e-6) { p.x = cx + dx / d * r; p.z = cz + dz / d * r; return true; }
  // dead inside: out through the nearest side
  const out = [[p.x - x0, -1, 0], [x1 - p.x, 1, 0], [p.z - z0, 0, -1], [z1 - p.z, 0, 1]].sort((a, b) => a[0] - b[0])[0];
  p.x += out[1] * (out[0] + r); p.z += out[2] * (out[0] + r);
  return true;
}
// keep p (radius r) in the deck and out of what's solid (and out of the water, unless `swim`); the
// way it was pushed (a unit direction) if it was, so a runner can bounce off, else null
export function keepOn(p, r, swim = false) {
  const was = { x: p.x, z: p.z };
  p.x = Math.max(DECK.x0 + r, Math.min(DECK.x1 - r, p.x)); p.z = Math.max(DECK.z0 + r, Math.min(DECK.z1 - r, p.z));
  for (const s of SOLID) pushRect(p, r, s);
  if (!swim) pushRect(p, r, [COPING.x0, COPING.x1, COPING.z0, COPING.z1]);
  const dx = p.x - was.x, dz = p.z - was.z, d = Math.hypot(dx, dz);
  return d > 1e-6 ? { x: dx / d, z: dz / d } : null;
}

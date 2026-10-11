// The inside of Toots' house as plain numbers: its size, its two floors, the stairs between them, and
// what's solid. Where you can stand, where Toots can walk and where her ball lands all come from here
// (no browser in it, so the checks can walk about it too).
//
// Downstairs: a big living room. The front door in the middle of the front wall (z = RD), the whole
// back wall a big window onto the backyard, the stairs up the left wall, the fireplace and her friends'
// pictures on the right. Upstairs, the same size: her window seat at the front window (the one you see
// her in from outside), her bed, Sadie's bed with Sadie on it watching birds on TV, a second couch.
// (Bigger inside than outside, as rooms can be.)

export const RW = 8, RD = 6;        // half the width and half the depth
export const L2 = 3.6, TOP = 6.8;   // the upstairs floor, and the upstairs ceiling
export const DW = 1.3, DH = 2.4;    // the front door
// the stairs, against the left wall: from the foot (z0, at the bottom) up to the top (z1)
export const STAIRS = { x0: -RW, x1: -6.3, z0: 3.5, z1: -2.5 };
export const stairY = z => Math.min(1, Math.max(0, (STAIRS.z0 - z) / (STAIRS.z0 - STAIRS.z1))) * L2;
// where you step onto them, downstairs and up
export const FOOT = { x: -7.1, y: 0, z: 4.2 }, HEAD = { x: -7.1, y: L2, z: -3.2 };
export const WINDOW = { x: 0, w: 2.1, y0: L2 + 0.55, y1: L2 + 2.15 };   // her window upstairs, in the front wall
export const BACK = { x0: -6, x1: 6, y0: 0.5, y1: 3.1 };                // the big back window downstairs

// What's solid, on each floor (level 0 downstairs, 1 up): a box, and how tall it is. The ball can land
// on top of one; you and Toots go round.
export const SOLIDS = [
  { name: 'couch', level: 0, x0: -1.9, x1: 1.9, z0: 0.1, z1: 1.0, h: 0.9 },
  { name: 'fireplace', level: 0, x0: 7.25, x1: RW, z0: -1.2, z1: 1.2, h: 1.4 },
  { name: 'basket', level: 0, x0: 2.3, x1: 3.0, z0: 4.9, z1: 5.6, h: 0.45 },
  { name: 'lamp', level: 0, x0: 2.3, x1: 2.7, z0: 0.3, z1: 0.7, h: 1.8 },
  { name: 'seat', level: 1, x0: -1.4, x1: 1.4, z0: 5.3, z1: RD, h: 0.5 },
  { name: 'sadiesBed', level: 1, x0: 6.5, x1: RW, z0: -RD, z1: -3.8, h: 0.6 },
  { name: 'nightstand', level: 1, x0: 5.8, x1: 6.5, z0: -RD, z1: -5.35, h: 0.6 },
  { name: 'toybox', level: 1, x0: -3.05, x1: -2.15, z0: 5.2, z1: RD, h: 0.55 },
  { name: 'tv', level: 1, x0: 4.05, x1: 5.25, z0: -RD, z1: -4.95, h: 1.2 },
  { name: 'loveseat', level: 1, x0: 7.1, x1: RW, z0: 0.15, z1: 2.45, h: 0.8 },
  { name: 'lampUp', level: 1, x0: 7.3, x1: 7.7, z0: -0.5, z1: -0.1, h: 1.8 },
  { name: 'bookshelf', level: 1, x0: -RW, x1: -7.55, z0: 4.1, z1: 5.8, h: 1.9 },
  { name: 'plantFront', level: 1, x0: 7.15, x1: 7.75, z0: 5.15, z1: 5.75, h: 0.6 },
  { name: 'plantBack', level: 1, x0: -5.85, x1: -5.25, z0: -5.8, z1: -5.2, h: 0.6 },
  { name: 'dresser', level: 1, x0: -3.2, x1: -1.6, z0: -RD, z1: -5.4, h: 1.1 },
];

const inStairs = (x, z, r) => x < STAIRS.x1 + r && z < STAIRS.z0 && z > STAIRS.z1;
export const levelOf = y => (y > L2 / 2 ? 1 : 0);

// Where you (or Toots) can stand at x, z, coming from height y, keeping r round you: the floor's height,
// or null where you can't. On the stairs you're on their slope; under them, over the hole they come up
// through, or into a railing, you can't.
export function ground(x, z, y, r = 0) {
  if (Math.abs(x) > RW - r || Math.abs(z) > RD - r) return null;
  if (inStairs(x, z, r)) {
    const sy = stairY(z);
    return Math.abs(y - sy) < 0.9 && x < STAIRS.x1 - r ? sy : null;
  }
  const level = levelOf(y), base = level ? L2 : 0;
  for (const s of SOLIDS) if (s.level === level && x > s.x0 - r && x < s.x1 + r && z > s.z0 - r && z < s.z1 + r) return null;
  return base;
}

// Where the ball lands at x, z, falling from y: the floor, the stairs, or the top of something solid
// (null: it's run into the side of something, or a wall).
export function ballGround(x, z, y, r = 0.07) {
  if (Math.abs(x) > RW - r || Math.abs(z) > RD - r) return null;
  if (inStairs(x, z, 0)) { const sy = stairY(z); return y >= sy - 0.3 ? sy : null; }
  const level = y > L2 - 0.3 ? 1 : 0, base = level ? L2 : 0;
  for (const s of SOLIDS) if (s.level === level && x > s.x0 - r && x < s.x1 + r && z > s.z0 - r && z < s.z1 + r) return y >= base + s.h - 0.08 ? base + s.h : null;
  return base;
}
// how high the ball can go at x, z: the ceiling over it (over the stairs, the upstairs one)
export const ceiling = (x, z, y) => (y > L2 - 0.3 || inStairs(x, z, 0) ? TOP : L2);
export const onStairs = (x, z) => inStairs(x, z, 0);

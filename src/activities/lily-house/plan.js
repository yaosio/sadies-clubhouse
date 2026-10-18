// The inside of Lily's house as plain numbers: the living room, the big doorway, the game room behind
// it, and what's solid. Where you can stand and where Lily can run come from here (no browser in it).
//
// The living room (like her real home: pale gray walls, white baseboards, beige tile): the front door
// in the middle of the front wall (z = LR.d), her two round windows either side of it, and in the
// middle of the back wall the big doorway to the game room. The game room is far bigger and very tall:
// its whole back wall (z = GR.z1) is her climbing game's screen, and it's deep enough to step back
// and see all of it.

export const LR = { w: 7, d: 5, h: 3.4 };                     // the living room: half wide, half deep, high
export const ARCH = { w: 3.2, h: 3.0 };                        // the doorway between the two
export const GR = { w: 5, z0: -LR.d, z1: -LR.d - 19, h: 17 };  // the game room: half wide, from, to, high (its back wall taller than wide, like an arcade screen stood on end)
export const DW = 1.3, DH = 2.4;                               // the front door
export const PLAY = { x: 0, z: GR.z1 + 11 };                   // the middle of the game room (a circle on the carpet)
export const BASKET = { x: 5.4, z: -3.7, r: 0.5 };
export const BED = { x: -4.8, z: -3.2, r: 1.0 };
export const SOLIDS = [
  { x0: -LR.w, x1: -6.0, z0: -1.6, z1: 1.6 },                 // the couch, along the left wall
];
const ROUND = [BASKET, BED];
const P = 0.35;   // how close you get to things

// can someone stand here? (dog: Lily, who can lie on her own bed)
export function free(x, z, dog = false) {
  const inLR = Math.abs(x) < LR.w - P && z < LR.d - P && z > -LR.d + P;
  const inArch = Math.abs(x) < ARCH.w / 2 - P && z <= -LR.d + P + 0.01 && z >= -LR.d - P - 0.01;
  const inGR = Math.abs(x) < GR.w - P && z < GR.z0 - P && z > GR.z1 + P;
  if (!inLR && !inArch && !inGR) return false;
  for (const s of SOLIDS) if (x > s.x0 - P && x < s.x1 + P && z > s.z0 - P && z < s.z1 + P) return false;
  for (const r of ROUND) if ((!dog || r !== BED) && Math.hypot(x - r.x, z - r.z) < r.r + P) return false;
  return true;
}
// where you can stand: the floor, or null
export const ground = (x, z) => free(x, z) ? 0 : null;
// in the game room (its PLAY button is for there)
export const inGameRoom = z => z < GR.z0 - 0.3;

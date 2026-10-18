// Dog City, the walking side: how high the ramp is at every angle, and what you can stand on. Only
// numbers (layout.js says where everything is) and no drawing, so the picture (hydrant.js) and the
// walking come from the same list and a check can walk it without a browser.
//
// The ramp winds up round the barrel: its `turn` (radians) counts from the foot, which is on the side
// facing the square, and goes round and round as it climbs. At each landing it levels off for a stretch
// (a ledge out from the barrel, where a dog's house stands). It never has an edge you can walk off:
// the floor simply stops there (the rails are only to look at).
import { HYDRANT as H, HYDRANT_DOORS } from './layout.js';

const TAU = Math.PI * 2;

// Draw orders of the flat pictures (no depth test) on each landing. Everything on the ground below is -1
// to -0.4 (the square, the paths, the pool's water, the snow), so a ledge's floor is drawn after all of
// that; and each landing higher up is a step later still, so a path on a low landing is never painted
// over a higher one's floor (it would show through, seen from above).
export const ledgeTop = i => -0.35 + 0.04 * i;
export const onLedge = i => ledgeTop(i) + 0.02;   // (what stands on landing i: a house's path, a pad)

export const TURNS = Math.ceil(H.end / TAU);   // how many times round it goes (the most heights at one spot)

// the ramp's height at a turn: climbing between the landings, level on them
const KEYS = [[0, 0]];
for (const s of H.stops) KEYS.push([s.turn - H.half, s.y], [s.turn + H.half, s.y]);
KEYS.push([H.end, H.top]);
export function rampHeight(turn) {
  if (turn <= 0) return 0;
  if (turn >= H.end) return H.top;
  for (let i = 1; i < KEYS.length; i++) if (turn <= KEYS[i][0]) {
    const [a, ha] = KEYS[i - 1], [b, hb] = KEYS[i];
    return ha + (hb - ha) * (turn - a) / (b - a);
  }
  return H.top;
}

// a place round the hydrant: `r` out from the middle at compass angle `th` (radians), as x and z
export const around = (r, th) => ({ x: H.x + r * Math.cos(th), z: H.z + r * Math.sin(th) });
// the turn that goes with a compass angle, the first time round (0 to 2 pi)
export const turnOf = th => ((th - H.th0) % TAU + TAU) % TAU;

// The ramp begins on the ground. Where its first stretch runs (the lane, up to FOOT of a turn on), the
// ground isn't a floor of its own: there you're on the ramp from its very first step (or you'd stay on
// the ground, which is nearer your feet, and never climb).
const FOOT = 0.7;
export const onTheFoot = (x, z) => {
  const r = Math.hypot(x - H.x, z - H.z);
  return r >= H.lane[0] && r <= H.lane[1] - 0.35 && turnOf(Math.atan2(z - H.z, x - H.x)) <= FOOT;
};

// Everything you could stand on at (x, z), one function each (the outside takes the lot, and you
// stand on whichever is within a step of your feet): each gives its height there or null.
export function surfaces() {
  let lx = NaN, lz = NaN, r = 0, base = 0;   // (the last place asked: the functions are all asked about the same place in a row)
  const look = (x, z) => { if (x !== lx || z !== lz) { lx = x; lz = z; r = Math.hypot(x - H.x, z - H.z); base = turnOf(Math.atan2(z - H.z, x - H.x)); } };
  const list = [];
  // the ramp, one function per time round
  for (let k = 0; k < TURNS; k++) list.push((x, z) => {
    look(x, z);
    const t = base + TAU * k;
    return r >= H.lane[0] && r <= H.lane[1] - 0.35 && t <= H.end ? rampHeight(t) : null;
  });
  // each landing's ledge: a wedge out from the barrel, kept off its rails
  for (const s of H.stops) list.push((x, z) => {
    look(x, z);
    let d = (base - s.turn) % TAU; d = d > Math.PI ? d - TAU : d < -Math.PI ? d + TAU : d;
    return r >= H.lane[0] && r <= H.ledge - 0.4 && Math.abs(d) <= H.half - 0.4 / r ? s.y : null;
  });
  // the lookout deck
  list.push((x, z) => { look(x, z); return r >= H.deck[0] && r <= H.deck[1] - 0.4 ? H.top : null; });
  return list;
}

// Each door's place: the bottom one on the ground at the barrel, and the other on its landing (or the
// deck). `th`: the way it faces (straight out from the middle), `r0`: where its housing meets the
// hydrant, `y`: how high.
export const DOOR_SIDES = [];
for (const d of HYDRANT_DOORS) {
  const stop = d.stop >= 0 ? H.stops[d.stop] : null;
  const down = { id: d.id + '.down', of: d, th: H.th0 + d.base, r0: H.barrel, y: 0 };
  const up = { id: d.id + '.up', of: d, th: H.th0 + d.up, r0: stop ? H.barrel : H.deck[0], y: stop ? stop.y : H.top };
  down.other = up; up.other = down;
  DOOR_SIDES.push(down, up);
}

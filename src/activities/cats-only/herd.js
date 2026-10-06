// The Cats Only stampede, in plain numbers (the tests run it in Node; room.js draws it): a herd of
// Sadies pours out of the little room's door on the landing, runs down the staircase (or leaps the
// railing and tears round the post), across the ground floor and out of the front door, then on down
// the garden path. Nothing here knows about drawing, the DOM or the player: the herd never pushes
// anyone, it only has places to be at each moment.
//
// Everything is worked out from the hall's solid shape (hall.js `shape`) and where the two doors
// are, so it follows the hall if the hall ever changes. The numbers marked (Claude's choice) are
// tuning, not rules: docs/cats-only/numbers.md.
import { rng } from '../../shared/retro.js';

export const COUNT = 180;                // how many Sadies (Claude's choice: a pile to the ceiling; drawn as just two instanced pictures, so still light)
export const SPAWN = 3.0;                // they all pour out within this many seconds, the front of the pile first
export const RUN = [4.2, 6.0];           // each one reaches the front door this many seconds after setting off
export const PORCH = [2.3, 3.8];         // out of the front door, the porch steps go down between these distances (m): the garden's ground is lower
export const OUTSIDE_MAX = 40;           // how far down the garden path one runs before it's gone (m)
export const MEOWS = 90;                 // at most this many meows in the whole stampede (a caterwaul), and never closer than...
export const MEOW_GAP = 0.04;            // ...this many seconds apart
export const AFTER = 0.3;                // the front door is let go this long after the last one is through it
export const POP = 0.45;                 // a Sadie that vanishes puffs away over this many seconds, not just blinks out
export const LONGEST = SPAWN + RUN[1] + AFTER + 1.2 + POP;   // the whole thing, door opening to the last puff, never takes longer (1.2 s: the front door swinging shut)
export const MEOW_TYPES = 8;            // kinds of meow (meow, mew, yowl, mrow, squeal, whine, yeow, chirp)
export const MEOW_PITCHES = 6;           // and how high each is played: a kitten's squeak to a tom's yowl

const TAU = Math.PI * 2;
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const at = (r, th) => [Math.sin(th) * r, Math.cos(th) * r];
const lerp = (a, b, k) => a + (b - a) * k;

// Where a spot in one doorway's own terms (x across, z out into its place) comes out in another
// doorway's place: what the clubhouse does when you walk through a doorway.
export function across(from, to, x, z) {
  const dx = x - from.x, dz = z - from.z, c = Math.cos(from.yaw), s = Math.sin(from.yaw);
  const bx = -(dx * c - dz * s), bz = -(dx * s + dz * c), ct = Math.cos(to.yaw), st = Math.sin(to.yaw);
  return [to.x + bx * ct + bz * st, to.z - bx * st + bz * ct];
}

// One runner's way: points [x, y, z, grounded], from inside the little room to the front door's
// threshold. `kind`: 'stairs' or 'jump' (over the landing's railing, then a lap of the post);
// u, v, w: three numbers from 0 to 1 that vary the lane.
export function route(geo, kind, u, v, w) {
  const { shape: s, door: d, front: f } = geo, A = s.wall, IN = s.landing.inner, L1 = s.landing.y;
  const n = [d.nx, d.nz], side = [d.nz, -d.nx];                       // into the hall, and along the wall
  const pts = [];
  const put = (x, y, z, g = 1) => pts.push([x, y, z, g]);
  const lat = (v - 0.5) * 1.0;                                         // across the doorway (it's 1.5 m wide)
  // inside the little room (behind the doorway), then out onto the landing
  const back = 0.15 + w * 1.0;
  put(d.x - n[0] * back + side[0] * lat, L1, d.z - n[1] * back + side[1] * lat);
  put(d.x + n[0] * 0.9 + side[0] * lat, L1, d.z + n[1] * 0.9 + side[1] * lat);
  const th0 = Math.atan2(d.x, d.z);                                    // the angle round the post the door is at
  if (kind === 'stairs') {
    const top = s.stairs.th0 + (s.stairs.treads / 2 - 1) * s.stairs.turn;   // where the bridge to the stairs leaves the landing
    const rl = IN + 0.45 + u * (A - IN - 0.9), dth = wrap(top - th0);
    const steps = Math.max(2, Math.ceil(Math.abs(dth) / 0.12));
    for (let i = 1; i <= steps; i++) { const [x, z] = at(lerp(A - 0.9, rl, Math.min(1, i / 3)), th0 + dth * i / steps); put(x, L1, z); }
    // along the bridge (1.3 m wide) and down the treads
    const tan = [Math.cos(top), -Math.sin(top)], off = (v - 0.5) * 0.7;
    for (const r of [IN, 3.05]) { const [x, z] = at(r, top); put(x + tan[0] * off, L1, z + tan[1] * off); }
    const rs = 2.1 + (u - 0.5) * 0.8, per = s.stairs.treads / 2;
    for (let i = per - 1; i >= 0; i--) { const th = s.stairs.th0 + i * s.stairs.turn, [x, z] = at(rs, th); put(x, (i + 1) * s.stairs.rise, z); }
    const [fx, fz] = at(rs + 0.3, s.stairs.th0 - 0.45); put(fx, 0, fz);
  } else {
    // leap the railing: up and over, down to the ground floor, then once round the post
    const [x0, z0] = at(IN + 0.3, th0 + (v - 0.5) * 0.5); put(x0, L1, z0);
    const land = IN - 1.7 - u * 0.8, jth = th0 + (v - 0.5) * 0.5;
    for (let i = 1; i <= 8; i++) { const k = i / 8, [x, z] = at(lerp(IN + 0.3, land, k), jth); put(x, L1 * (1 - k * k) + 4 * 1.1 * k * (1 - k), z, 0); }
    const dir = w < 0.5 ? 1 : -1, rg = 3.5 + u * 1.2, sweep = dir * (TAU * (0.8 + v * 0.25));
    const steps = Math.ceil(Math.abs(sweep) / 0.15);
    for (let i = 1; i <= steps; i++) { const [x, z] = at(lerp(land, rg, Math.min(1, i / 4)), jth + sweep * i / steps); put(x, 0, z); }
  }
  // across the ground floor to the front door
  const th1 = Math.atan2(f.x, f.z), last = pts[pts.length - 1], lastTh = Math.atan2(last[0], last[2]);
  const mid = at(A - 2.4, th1 + wrap(lastTh - th1) * 0.25 + (u - 0.5) * 0.3);
  put(mid[0], 0, mid[1]);
  const fl = (v - 0.5) * 1.2, fs = [Math.cos(f.yaw), -Math.sin(f.yaw)];
  const inDoor = at(A - 1.2, th1); put(inDoor[0] + fs[0] * fl * 0.6, 0, inDoor[1] + fs[1] * fl * 0.6);
  put(f.x + fs[0] * fl, 0, f.z + fs[1] * fl);   // (the threshold itself, in its lane)
  return pts;
}

// the length of a route, and where along it a distance is: [x, y, z, grounded]
export function lengths(pts) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
  return cum;
}
export function along(pts, cum, s) {
  if (s <= 0) return pts[0];
  if (s >= cum[cum.length - 1]) return pts[pts.length - 1];
  let i = 1; while (cum[i] < s) i++;
  const k = (s - cum[i - 1]) / (cum[i] - cum[i - 1]), a = pts[i - 1], b = pts[i];
  return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k), k < 0.5 ? a[3] : b[3]];
}

// The whole stampede. `geo`: { shape: the hall's `shape`, door: { x, y, z, nx, nz } the little
// room's door on the landing (n: the way it faces), front: { x, y, z, yaw } the front door seen from
// the hall, out: the same seen from the garden }. Every runner is a plain object the room draws:
// { on, where: 'hall' | 'garden', x, y, z, size, bounce, from }.
export function makeStampede(geo, seed = 1) {
  const r = rng(seed), runners = [];
  const d = geo.door, side = [d.nz, -d.nx];
  for (let i = 0; i < COUNT; i++) {
    // where it sits in the pile in the closet: right up to the ceiling (behind the doorway, in the doorway's own terms)
    const depth = 0.62 + r() * 0.65, lat = (r() - 0.5) * 0.8, high = r() * 1.95;   // (kept off the door and the walls: a Sadie is up to 0.9 m wide and turns to face you)
    const pile = [d.x - d.nx * depth + side[0] * lat, d.y + high, d.z - d.nz * depth + side[1] * lat];
    // the front of the pile goes first: an avalanche, the back of the pile tumbling out after
    const delay = SPAWN * Math.pow(Math.min(1, ((depth - 0.62) / 0.65) * 0.85 + r() * 0.15), 1.5);   // (a hard rush at first, the back of the pile trailing)
    const pts = route(geo, r() < 0.65 ? 'stairs' : 'jump', r(), r(), r());
    pts.unshift([pile[0], pile[1], pile[2], 0]);   // (it tumbles down from where it was sitting)
    const cum = lengths(pts), len = cum[cum.length - 1];
    const time = Math.min(RUN[1], Math.max(RUN[0], len / (5.5 + r() * 3)));
    runners.push({ delay, pts, cum, len, time, speed: len / time, lane: (r() - 0.5) * 1.6, size: 0.55 + r() * 0.32, beat: r() * TAU, tilt: r(), pile,
      on: false, where: 'hall', x: 0, y: 0, z: 0, bounce: 0, pop: 0, dying: 0, from: [0, 0], at: -1, crossed: false });
  }
  // who meows, and when: lots of them, all different, in every pitch, crowding on top of each other
  // (but never the same kind at the same pitch twice running: the sound system won't say it twice)
  const meows = [];
  const pick = runners.map((u, i) => i).sort(() => r() - 0.5);
  const tries = pick.slice(0, MEOWS + 20).map(i => ({ who: i, t: runners[i].delay + runners[i].time * (0.05 + r() * 0.8) })).sort((a, b) => a.t - b.t);
  let lastKey = -1;
  for (const m of tries) {
    if (meows.length >= MEOWS || (meows.length && m.t - meows[meows.length - 1].t < MEOW_GAP)) continue;
    let key; do { key = Math.floor(r() * MEOW_TYPES * MEOW_PITCHES); } while (key === lastKey);
    lastKey = key; meows.push({ ...m, variant: Math.floor(key / MEOW_PITCHES), pitch: key % MEOW_PITCHES });
  }
  const crossAt = Math.max(...runners.map(u => u.delay + u.time));
  let t = 0, heard = 0, wob = 0, started = false;
  // out of the front door and down the garden path, in the doorway's own terms (x across, z out)
  function outside(u, s) {
    const run = s - u.len, f = geo.front, a = u.pts[u.pts.length - 1];
    const lx = Math.max(-1.1, Math.min(1.1, (a[0] - f.x) * Math.cos(f.yaw) - (a[2] - f.z) * Math.sin(f.yaw) + u.lane * Math.min(1, run / 6)));
    const lz = -run, c = Math.cos(f.yaw), sn = Math.sin(f.yaw);
    // (the hall's way of putting it, which `across` turns into the garden's)
    const [gx, gz] = across(f, geo.out, f.x + lx * c + lz * sn, f.z - lx * sn + lz * c);
    u.where = 'garden'; u.x = gx; u.z = gz; u.crossed = true;
    u.y = geo.out.y * (1 - Math.min(1, Math.max(0, (run - PORCH[0]) / (PORCH[1] - PORCH[0]))));
    return run;
  }
  const S = {
    runners, meows, crossAt,
    get t() { return t; },
    get started() { return started; },
    // how long the front door needs holding open: until the last one is through it
    get holdFor() { return crossAt + AFTER; },
    // The whole herd sitting in the closet, piled to the ceiling, waiting (and fidgeting) behind the shut door
    showPile(dt = 0) {
      wob += dt;
      for (const u of runners) { u.on = true; u.where = 'hall'; u.x = u.pile[0]; u.y = u.pile[1]; u.z = u.pile[2]; u.bounce = Math.max(0, Math.sin(wob * 5 + u.beat * 3)) * 0.03; }
    },
    // let them go
    start() { started = true; },
    // move everything on `dt` seconds. Returns the meows that fall in it: [{ who, variant, pitch }]
    step(dt) {
      if (!started) { this.showPile(dt); return []; }
      t += dt; wob += dt;
      for (const u of runners) {
        if (u.dying) { u.dying += dt / POP; if (u.dying >= 1) { u.on = false; u.dying = 0; u.gone = true; } u.pop = u.dying; continue; }
        if (u.gone) continue;
        const s = (t - u.delay) * u.speed;
        if (s < 0) { u.on = true; u.where = 'hall'; u.x = u.pile[0]; u.y = u.pile[1]; u.z = u.pile[2]; u.bounce = Math.max(0, Math.sin(wob * 7 + u.beat * 3)) * 0.04; continue; }   // (still in the pile)
        u.on = true;
        if (s <= u.len) {
          const p = along(u.pts, u.cum, s);
          u.where = 'hall'; u.x = p[0]; u.y = p[1]; u.z = p[2];
          u.bounce = p[3] ? Math.abs(Math.sin(u.beat + s * 2.2)) * 0.16 : 0;
        } else {
          const run = outside(u, s);
          u.bounce = Math.abs(Math.sin(u.beat + s * 2.2)) * 0.16;
          if (run > OUTSIDE_MAX) u.dying = 1e-6;   // far down the path: it puffs away
        }
      }
      const said = [];
      while (heard < meows.length && meows[heard].t <= t) said.push(meows[heard++]);
      return said;
    },
    get over() { return t > crossAt + AFTER + 0.2; },
    // the front door has shut: every Sadie still about puffs away (and none is left once they've all finished)
    vanishAll() { for (const u of runners) if (u.on && !u.dying) u.dying = 1e-6; },
    get left() { return runners.some(u => u.on); },
    hide() { for (const u of runners) { u.on = false; u.dying = 0; u.pop = 0; } },
  };
  return S;
}

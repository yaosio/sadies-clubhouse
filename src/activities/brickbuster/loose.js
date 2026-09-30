// The yarn ball loose in the hall, once it's got out of Brickbuster '96, and Sadie chasing it. Plain
// numbers (the tests run it in Node); room.js draws them in the hall.
//
// The ball bounces round the hall for ever, silently: off the walls (and the doors in them: it can
// never get into a room), the scratching post, the furniture, the stairs, the landing and its
// railing (bounce high enough and it goes over and drops to the ground floor). It goes straight
// through you. Whenever it slows down and stops, Sadie pounces over (in cat leaps, up onto the
// landing if she has to) and whacks it off again. If it ever wedged itself somewhere odd, it
// quietly pops back into the middle of the hall.
//
// shape: the hall's solid shape (hall.js `shape`): wall, post, landing { inner, y, thick, rail },
// top, stairs { r0, r1, th0, turn, rise, treads }, blocks [{ x, z, r, h }]. Positions are the hall's.

export const R = 0.16, GRAVITY = 9.8;
const BOUNCE = 0.72, WALL = 0.85, ROLL = 0.9;   // how much speed a bounce keeps, off a wall, and rolling friction (per second)
const SETTLE = 0.35;                            // slower than this, sitting on something, and it's stopped
// Sadie: her leaps (how far, how fast chasing and trotting), how far off she keeps while it's
// going, her pause between trotting leaps, how slow it has to be for her to pounce, her whacks (how
// hard, how far up), and how often a whack from below is a mighty one
const CAT = { leap: 2.2, speed: 6.5, trot: 4, keep: 1.6, pause: 0.12, pounce: 1.2, whack: [5, 8], up: [2.5, 5], mighty: 0.3 };

const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

export function makeLoose(shape, seed = 1) {
  return { shape, r: rng(seed), ball: null, cat: null, stopped: 0, stuck: 0, whacks: 0, pops: 0, t: 0 };
}

// let the ball go (x, y, z where its middle is, and how fast), with Sadie `after` seconds behind it
// at (cx, cy, cz)
export function release(L, [x, y, z], [vx, vy, vz], [cx, cy, cz], after = 0.8) {
  L.ball = { x, y, z, vx, vy, vz, spin: 0, on: false };
  L.cat = { x: cx, y: cy, z: cz, mode: 'coming', t: -after, leap: null };
}

// the floors under a spot, highest first: the landing, a stair tread, the ground
function floorsAt(s, x, z) {
  const r = Math.hypot(x, z), out = [];
  if (r >= s.landing.inner && r <= s.wall) out.push(s.landing.y);
  if (r >= s.stairs.r0 && r <= s.stairs.r1) {
    const st = s.stairs, k = wrap(Math.atan2(x, z) - st.th0) / st.turn;
    for (let n = -1; n <= 3; n++) {
      const i = Math.round(k + n * 2 * Math.PI / st.turn);
      if (i >= 0 && i < st.treads && Math.abs(k + n * 2 * Math.PI / st.turn - i) <= 0.5) out.push((i + 1) * st.rise);
    }
  }
  for (const b of s.blocks) if (Math.hypot(x - b.x, z - b.z) < b.r) out.push(b.h);
  out.push(0);
  return out.sort((a, b) => b - a);
}
// the floor something at height y would land on
export function floorBelow(s, x, z, y) { return floorsAt(s, x, z).find(h => h <= y + 1e-6) ?? 0; }

// Runs it on by dt seconds. Returns what happened: 'pounce' (Sadie's going for it), 'whack', 'mighty'
// (a mighty whack, from below towards the landing), 'pop'.
export function stepLoose(L, dt) {
  const out = [];
  if (!L.ball) return out;
  L.t += dt;
  const n = Math.max(1, Math.ceil(dt * 240));
  for (let i = 0; i < n; i++) sub(L, dt / n);
  const b = L.ball, sp = Math.hypot(b.vx, b.vy, b.vz), s = L.shape;
  // wedged somewhere odd (or gone somewhere impossible): back into the middle of the hall
  L.stuck = sp < SETTLE && !b.on ? L.stuck + dt : 0;
  if (!isFinite(b.x + b.y + b.z) || Math.hypot(b.x, b.z) > s.wall || b.y < 0 || b.y > s.top || L.stuck > 3) {
    const a = L.r() * Math.PI * 2, rr = 3.6 + L.r() * 1.5;
    Object.assign(b, { x: Math.sin(a) * rr, y: 1.2, z: Math.cos(a) * rr, vx: 0, vy: 0, vz: 0, on: false });
    L.stuck = 0; L.pops++; out.push('pop');
  }
  L.stopped = sp < SETTLE && b.on ? L.stopped + dt : 0;
  cat(L, dt, out);
  return out;
}

function sub(L, h) {
  const b = L.ball, s = L.shape, py = b.y, pr = Math.hypot(b.x, b.z);
  b.vy -= GRAVITY * h;
  b.x += b.vx * h; b.y += b.vy * h; b.z += b.vz * h;
  b.spin += Math.hypot(b.vx, b.vz) * h / R;
  b.on = false;
  for (const k of s.blocks) {                                   // the furniture
    const dx = b.x - k.x, dz = b.z - k.z, d = Math.hypot(dx, dz) || 1e-6;
    if (d < k.r + R && b.y - R < k.h && py - R < k.h - 0.02) {
      const ux = dx / d, uz = dz / d, v = b.vx * ux + b.vz * uz;
      b.x = k.x + ux * (k.r + R); b.z = k.z + uz * (k.r + R);
      if (v < 0) { b.vx -= (1 + WALL) * v * ux; b.vz -= (1 + WALL) * v * uz; }
    }
  }
  // the landing's edge and its railing: a wall round the inside of the landing, from its underside
  // up to the top of the railing (over that, the ball flies over)
  const Ld = s.landing, low = Ld.y - Ld.thick, high = Ld.y + Ld.rail;
  if (b.y + R > low && b.y - R < high) {
    const r2 = Math.hypot(b.x, b.z);
    if (pr <= Ld.inner && r2 > Ld.inner - R) radialAt(b, Ld.inner - R, false);
    else if (pr >= Ld.inner && r2 < Ld.inner + R) radialAt(b, Ld.inner + R, true);
  }
  // the walls (and every door in them) and the scratching post, last: nothing pushes it past them
  const r = Math.hypot(b.x, b.z);
  if (r > s.wall - R) radialAt(b, s.wall - R, false);
  if (r < s.post + R) radialAt(b, s.post + R, true);
  // the landing's underside
  const r3 = Math.hypot(b.x, b.z);
  if (r3 > Ld.inner && py + R <= low + 1e-6 && b.y + R > low) { b.y = low - R; b.vy = -Math.abs(b.vy) * BOUNCE; }
  // the ceiling (the second landing: nothing goes above it)
  if (b.y > s.top - R) { b.y = s.top - R; b.vy = -Math.abs(b.vy) * BOUNCE; }
  // floors: the ground, the landing, the stair treads, the tops of things (only from above)
  const f = floorBelow(s, b.x, b.z, py - R + 0.03);
  if (b.y - R < f) {
    b.y = f + R; b.on = true;
    b.vy = Math.abs(b.vy) * BOUNCE; if (b.vy < 0.5) b.vy = 0;
    const k = Math.max(0, 1 - ROLL * h); b.vx *= k; b.vz *= k;
  }
}
// stop at radius `to` from the middle, bouncing back off it (inward: it's the outside of something)
function radialAt(b, to, inward) {
  const r = Math.hypot(b.x, b.z) || 1e-6, nx = b.x / r, nz = b.z / r;
  b.x = nx * to; b.z = nz * to;
  const v = b.vx * nx + b.vz * nz;
  if (inward ? v < 0 : v > 0) { b.vx -= (1 + WALL) * v * nx; b.vz -= (1 + WALL) * v * nz; }
}

// Sadie: comes out after the ball and trots after it while it's going; the moment it's stopped (or
// all but), she pounces over and whacks it off again, towards the middle of the hall. She gets
// about in cat leaps, and never through a floor: down off the landing she hops over the railing and
// drops; up onto it she jumps from just below its edge, up and over the railing.
function cat(L, dt, out) {
  const c = L.cat, b = L.ball, s = L.shape;
  c.t += dt;
  if (c.mode === 'coming') { if (c.t >= 0) { c.mode = 'watch'; c.t = 0; } return; }
  if (c.leap) { leapOn(c, dt); return; }
  const speed = Math.hypot(b.vx, b.vy, b.vz), feet = floorBelow(s, b.x, b.z, b.y - R + 0.05);
  const d = Math.hypot(b.x - c.x, b.z - c.z);
  if (c.mode === 'watch') {
    if (L.stopped > 0.15 || (b.on && speed < CAT.pounce)) { c.mode = 'chase'; c.t = 0; out.push('pounce'); }
    else if (d > CAT.keep + 1 || Math.abs(feet - c.y) > 0.3) {   // trot after it, keeping a little way off
      if (c.t > CAT.pause) { c.t = 0; plan(L, feet, CAT.keep, CAT.trot); }
      return;
    } else return;
  }
  if (c.mode === 'chase') {
    if (d < 0.6 && Math.abs(feet - c.y) < 1.2) { c.mode = 'whack'; c.t = 0; return; }   // (she can swat up at it, on a chair, say)
    plan(L, feet, 0.45, CAT.speed);
    if (c.t > 20) { c.mode = 'watch'; c.t = 0; c.leap = null; }   // (never gets stuck chasing)
    return;
  }
  if (c.mode === 'whack' && c.t > 0.25) {
    // off it goes, away from her and towards the middle of the hall, and up. Up on the landing, hard
    // enough now and then to go over the railing; down below, now and then a mighty one, up and out
    // towards the walls, that can land it back up on the landing
    const away = Math.atan2(b.x - c.x, b.z - c.z), mid = Math.atan2(-b.x, -b.z), up = c.y > s.landing.y - 0.1;
    let a = mid + wrap(away - mid) * 0.5 + (L.r() - 0.5) * 0.8;
    let mighty = false, v = CAT.whack[0] + L.r() * (CAT.whack[1] - CAT.whack[0]), vy = (up ? CAT.up[1] : CAT.up[0]) + L.r() * (CAT.up[1] - CAT.up[0]);
    if (!up && L.r() < CAT.mighty) {   // (timed to be over the landing at the top of its flight)
      mighty = true;
      a = mid + Math.PI + (L.r() - 0.5) * 0.3; vy = 10.5 + L.r(); v = Math.max(0.6, (s.landing.inner + 0.6 + L.r() * 0.8 - Math.hypot(b.x, b.z)) / (vy / GRAVITY * 1.15));
    }
    b.vx = Math.sin(a) * v; b.vz = Math.cos(a) * v; b.vy = vy; b.on = false;
    L.stopped = 0; L.whacks++; c.mode = 'watch'; c.t = 0;
    out.push(mighty ? 'mighty' : 'whack');
  }
}

// Her next leap towards the ball (landing `short` of it), never through a floor.
function plan(L, feet, short, speed) {
  const c = L.cat, b = L.ball, s = L.shape, Ld = s.landing;
  const up = c.y > Ld.y - 0.1, ballUp = feet > Ld.y - 0.1;
  const r = Math.hypot(c.x, c.z) || 1, a = Math.atan2(c.x, c.z), ab = Math.atan2(b.x, b.z);
  const at = (rr, aa) => [Math.sin(aa) * rr, Math.cos(aa) * rr];
  let tx, tz, ty, h;
  if (up && !ballUp) {
    if (r > Ld.inner + 0.5) { [tx, tz] = at(Ld.inner + 0.35, a); ty = c.y; h = 0.3; }                     // to the landing's edge
    else { [tx, tz] = at(Ld.inner - 0.8, a + wrap(ab - a) * 0.1); ty = floorBelow(s, tx, tz, c.y - 0.5); h = 3.2; }   // over the railing and down
  } else if (!up && ballUp) {
    const close = Math.abs(wrap(ab - a)) < 0.35 && r > Ld.inner - 1.3 && r < Ld.inner - 0.3;
    if (close) { [tx, tz] = at(Ld.inner + 0.5, a); ty = Ld.y; h = 3.4; }                                    // up and over the railing
    else {                                                                                               // to just below the edge, under the ball
      const [gx, gz] = at(Ld.inner - 0.8, ab), dx = gx - c.x, dz = gz - c.z, dd = Math.hypot(dx, dz), go = Math.min(dd, CAT.leap);
      tx = c.x + dx / (dd || 1) * go; tz = c.z + dz / (dd || 1) * go; ty = floorBelow(s, tx, tz, c.y + 0.3); h = 0.35;
    }
  } else {
    const dx = b.x - c.x, dz = b.z - c.z, d = Math.hypot(dx, dz), go = Math.min(Math.max(0, d - short), CAT.leap);
    if (go < 0.05) return;
    tx = c.x + dx / (d || 1) * go; tz = c.z + dz / (d || 1) * go;
    const rt = Math.hypot(tx, tz) || 1;
    if (up && rt < Ld.inner + 0.35) { tx = tx / rt * (Ld.inner + 0.35); tz = tz / rt * (Ld.inner + 0.35); }   // (along the landing, not across the gap)
    ty = floorBelow(s, tx, tz, (go >= d - short - 0.01 ? feet : c.y) + 0.3); h = 0.3 + Math.max(0, ty - c.y) * 0.5;
  }
  const len = Math.hypot(tx - c.x, tz - c.z, ty - c.y);
  c.leap = { fx: c.x, fy: c.y, fz: c.z, tx, ty, tz, t: 0, dur: 0.2 + len / speed + (h > 2 ? 0.4 : 0), h };
}
function leapOn(c, dt) {
  const l = c.leap; l.t += dt;
  const k = Math.min(1, l.t / l.dur);
  c.x = l.fx + (l.tx - l.fx) * k; c.z = l.fz + (l.tz - l.fz) * k;
  c.y = l.fy + (l.ty - l.fy) * k + 4 * l.h * k * (1 - k);
  if (k >= 1) { c.y = l.ty; c.leap = null; }
}

// The mini golf's engine: plain numbers, no browser (the tests run it, and so does the design tool).
// Every hole is a data file (holes/): its shape, its hills, where the tee, the hole and the pins are,
// what moves, and its recorded winning shots. This works out how a ball rolls on any of them.
//
// Distances are in the plan's units (a hole's plan is 100 across and 140 long; one unit is S metres
// in the backyard), heights in the plan's height units (HS metres each). The ball rolls on the
// ground (it never flies): down the slopes, round the bowls, off the low walls. It's stepped in fixed
// steps (DT), so the same shot always goes exactly the same way, in the game and in the tests.
//
// The rules (the owner's): a pin never changes where the ball goes, it gets BLASTED off the course.
// While any pin's still standing, the hole's tentacles grab a ball that comes within reach, and spit
// it back to the tee (a stroke more). Once the last pin's gone they're friendly, and pull it in.

export const S = 0.075;    // metres per plan unit
export const HS = 0.32;    // metres per height unit
export const DT = 1 / 120; // one step of the ball (s)
export const R = 1.0;      // the ball's radius (plan units)
export const PIN_R = 1.6;  // a pin's (plan units)
export const VMIN = 10, VMAX = 125;   // how fast a putt sends the ball, softest to hardest (units a second)
const G = 7 / S;           // gravity on a rolling ball, in plan units (5/7 of 9.8 m/s²)
const H2U = HS / S;        // a height unit, in plan units
const ROLL = 13;           // rolling friction (units/s²)
const STICK = 15;          // a slope gentler than this (as a pull, units/s²) can't start a still ball rolling
const DRAG = 0.25;         // a little air and grass (per second)
const BOUNCE = 0.62;       // how much a wall gives back
const MAX_SECS = 30;       // a shot always ends: after this long the ball's stopped where it is

const sm = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
const hyp = Math.hypot;

// ---------- the shape: where the green is (a distance to its edge: negative inside) ----------
function sdPiece(p, x, y) {
  if (p[0] === 'circle') return hyp(x - p[1], y - p[2]) - p[3];
  // 'rect' or 'rrect': x0, y0, x1, y1 (and a corner radius)
  const r = p[0] === 'rrect' ? p[5] : 0;
  const cx = (p[1] + p[3]) / 2, cy = (p[2] + p[4]) / 2, hx = (p[3] - p[1]) / 2 - r, hy = (p[4] - p[2]) / 2 - r;
  const qx = Math.abs(x - cx) - hx, qy = Math.abs(y - cy) - hy;
  return hyp(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}
export function edge(hole, x, y) {
  let d = Infinity;
  for (const p of hole.shape) d = Math.min(d, sdPiece(p, x, y));
  return d;
}
export const inside = (hole, x, y) => edge(hole, x, y) <= 0;

// ---------- the hills: the ground's height anywhere on the green ----------
function term(t, x, y) {
  switch (t[0]) {
    case 'bump': { const [, cx, cy, r, a] = t; return a * Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * r * r)); }
    case 'bowl': { const [, cx, cy, r, a] = t; return a * (1 - sm(hyp(x - cx, y - cy) / r)); }
    case 'rim': { const [, cx, cy, r0, r1, a] = t; return a * sm((hyp(x - cx, y - cy) - r0) / (r1 - r0)); }
    case 'slopeY': { const [, y0, y1, h0, h1] = t; return h0 + (h1 - h0) * sm((y - y0) / (y1 - y0)); }
    default: return 0;
  }
}
export function height(hole, x, y) {
  let h = 0;
  for (const t of hole.height) h += term(t, x, y);
  return h;
}
// the slope (height units per plan unit), across and along
export function slope(hole, x, y) {
  const e = 0.05;
  return [(height(hole, x + e, y) - height(hole, x - e, y)) / (2 * e), (height(hole, x, y + e) - height(hole, x, y - e)) / (2 * e)];
}
// the lowest and highest the ground goes (for the plinth the green sits on)
export function heightRange(hole) {
  let lo = Infinity, hi = -Infinity;
  for (let y = 0; y <= 140; y += 1) for (let x = 0; x <= 100; x += 1) if (inside(hole, x, y)) { const h = height(hole, x, y); lo = Math.min(lo, h); hi = Math.max(hi, h); }
  return [lo, hi];
}

// ---------- the bridge (hole 2): a deck with rails, from its low end to its high end ----------
// { x0, x1, yLow, hLow, yHigh, hHigh, under: [y0, y1] the bit too low to roll under }
const deckH = (b, y) => b.hLow + (b.hHigh - b.hLow) * (y - b.yLow) / (b.yHigh - b.yLow);
export const bridgeHeight = deckH;

// ---------- what moves ----------
// Each kind is worked out from the course's clock, so the same clock always puts it in the same place.
export function moverAt(m, clock) {
  if (m.kind === 'gnome') { const a = m.a0 + m.speed * clock; return { x: m.cx + Math.cos(a) * m.r, y: m.cy + Math.sin(a) * m.r, a }; }
  if (m.kind === 'sprinkler') { const a = m.a0 + m.speed * clock; return { x: m.x, y: m.y, a, dx: Math.cos(a), dy: Math.sin(a) }; }
  if (m.kind === 'tail') { const a = m.a0 + m.amp * Math.sin(m.speed * clock); return { x: m.x, y: m.y, a, tx: m.x + Math.cos(a) * m.len, ty: m.y + Math.sin(a) * m.len, w: m.amp * m.speed * Math.cos(m.speed * clock) }; }
  return null;
}
// how far p is from the segment a-b, and how far along it (0-1)
function toSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
  return [hyp(px - ax - dx * t, py - ay - dy * t), t];
}

// ---------- a hole being played ----------
// The ball: where it is, how fast it's going, and whether it's on the bridge or in the tunnel.
export function newPlay(hole) {
  return {
    hole, clock: 0, strokes: 0, pins: hole.pins.map(() => true), sunk: false,
    ball: { x: hole.tee[0], y: hole.tee[1], vx: 0, vy: 0, moving: false, deck: false, tunnel: null },
  };
}
export const pinsLeft = pl => pl.pins.filter(Boolean).length;
// the height the ball's at (on the ground, or on the bridge)
export function ballHeight(pl) {
  const b = pl.ball;
  if (b.tunnel) return b.tunnel.h;
  return b.deck ? deckH(pl.hole.bridge, b.y) : height(pl.hole, b.x, b.y);
}

// Putt: `angle` (radians, in the plan: 0 is +x, PI/2 is +y, towards the tee end), `power` 0-1.
export function putt(pl, angle, power) {
  const v = VMIN + (VMAX - VMIN) * Math.max(0, Math.min(1, power));
  Object.assign(pl.ball, { vx: Math.cos(angle) * v, vy: Math.sin(angle) * v, moving: true });
  pl.strokes++;
  pl.shotTime = 0; pl.blasted = 0;
  return [{ type: 'putt', power, big: power > 0.72 }];
}

// One step of the ball (DT seconds). Hands back what happened: 'wall', 'blast' (a pin), 'grab' (the
// tentacles: it's back on the tee, a stroke more), 'pull' (friendly tentacles), 'sunk', 'bump',
// 'bat', 'tunnel', 'out' (out of the tunnel), 'stop'.
export function step(pl) {
  const hole = pl.hole, b = pl.ball, ev = [];
  pl.clock += DT;
  if (!b.moving || pl.sunk) return ev;
  pl.shotTime += DT;

  // in the tunnel: out the other end after a while (or back out the way it went in)
  if (b.tunnel) {
    const t = b.tunnel;
    t.left -= DT; t.h = t.h0 + (t.h1 - t.h0) * (1 - Math.max(0, t.left) / t.time);
    if (t.left <= 0) {
      Object.assign(b, { x: t.to[0], y: t.to[1], vx: t.vx, vy: t.vy, tunnel: null });
      ev.push({ type: 'out', back: t.back });
    }
    return ev;
  }

  // gravity down the slope, rolling friction, a little drag
  let ax = 0, ay = 0;
  let sx, sy;
  if (b.deck) { sx = 0; sy = (hole.bridge.hHigh - hole.bridge.hLow) / (hole.bridge.yHigh - hole.bridge.yLow); }
  else [sx, sy] = slope(hole, b.x, b.y);
  const gx = sx * H2U, gy = sy * H2U, gm = hyp(gx, gy);
  if (gm > 0) { const k = G / Math.sqrt(1 + gm * gm); ax -= gx * k; ay -= gy * k; }
  const sp = hyp(b.vx, b.vy);
  // (friendly tentacles pull a ball in)
  const cdx = hole.cup[0] - b.x, cdy = hole.cup[1] - b.y, cd = hyp(cdx, cdy);
  const friendly = !pinsLeft(pl);
  if (friendly && cd < hole.reach && !b.deck) {
    ax += cdx / cd * 70; ay += cdy / cd * 70;
    b.vx *= 1 - 2.5 * DT; b.vy *= 1 - 2.5 * DT;
    if (!b.pulled) { b.pulled = true; ev.push({ type: 'pull' }); }
  }
  // what moves gives it a push
  for (const m of hole.movers || []) {
    const at = moverAt(m, pl.clock);
    if (m.kind === 'sprinkler') {
      const [d, t] = toSegment(b.x, b.y, at.x, at.y, at.x + at.dx * m.len, at.y + at.dy * m.len);
      if (d < 2.6 && t > 0.05 && !b.deck) { ax += at.dx * m.push; ay += at.dy * m.push; }
    }
  }
  if (sp > 1e-6) {
    const f = ROLL + DRAG * sp;
    const fx = -b.vx / sp * f, fy = -b.vy / sp * f;
    // (friction can stop it, never turn it round)
    const nvx = b.vx + (ax + fx) * DT, nvy = b.vy + (ay + fy) * DT;
    if (sp < ROLL * DT * 1.5 && hyp(ax, ay) < STICK) { b.vx = 0; b.vy = 0; }
    else { b.vx = nvx; b.vy = nvy; }
  } else if (hyp(ax, ay) > STICK) { b.vx += ax * DT; b.vy += ay * DT; }
  b.x += b.vx * DT; b.y += b.vy * DT;

  // the bridge: rolling on from either end, along it between its rails, and off either end
  const br = hole.bridge;
  if (br) {
    const mid = (br.x0 + br.x1) / 2, half = (br.x1 - br.x0) / 2 - R - 0.2;
    if (b.deck) {
      if (Math.abs(b.x - mid) > half) { b.x = mid + Math.sign(b.x - mid) * half; b.vx = -b.vx * BOUNCE; ev.push({ type: 'wall', speed: Math.abs(b.vx) }); }
      if (b.y > br.yLow || b.y < br.yHigh) b.deck = false;
    } else if (Math.abs(b.x - mid) < half) {
      const py = b.y - b.vy * DT;
      const onLow = py > br.yLow && b.y <= br.yLow, onHigh = py < br.yHigh && b.y >= br.yHigh && height(hole, b.x, b.y) > br.hHigh - 0.6;
      if (onLow || onHigh) b.deck = true;
    }
  }

  // the low walls (and, for a ball on the ground, the bridge's low end and what's solid)
  const hit = n => {
    const vn = b.vx * n[0] + b.vy * n[1];
    if (vn > 0) { b.vx -= (1 + BOUNCE) * vn * n[0]; b.vy -= (1 + BOUNCE) * vn * n[1]; if (vn > 6) ev.push({ type: 'wall', speed: vn }); }
  };
  if (!b.deck) {
    for (let k = 0; k < 2; k++) {
      const d = solid(hole, b.x, b.y) + R;
      if (d <= 0) break;
      const e = 0.05, n = [solid(hole, b.x + e, b.y) - solid(hole, b.x - e, b.y), solid(hole, b.x, b.y + e) - solid(hole, b.x, b.y - e)];
      const nm = hyp(n[0], n[1]) || 1; n[0] /= nm; n[1] /= nm;
      // (into the tunnel's mouth instead, going the right way)
      const tn = hole.tunnel;
      if (tn && Math.abs(b.x - tn.mouth[0]) < tn.w && Math.abs(b.y - tn.mouth[1]) < 3 && b.vy * tn.dir < 0) { enterTunnel(pl, ev); return ev; }
      b.x -= n[0] * d; b.y -= n[1] * d;
      hit(n);
    }
  }

  // things that move bump it
  for (const m of hole.movers || []) {
    if (b.deck) break;
    const at = moverAt(m, pl.clock);
    if (m.kind === 'gnome') {
      const dx = b.x - at.x, dy = b.y - at.y, d = hyp(dx, dy);
      if (d < m.size + R && d > 1e-6) {
        const n = [dx / d, dy / d];
        b.x = at.x + n[0] * (m.size + R); b.y = at.y + n[1] * (m.size + R);
        hit([-n[0], -n[1]]);
        // he knocks it down towards the hole
        const tc = [hole.cup[0] - b.x, hole.cup[1] - b.y], tl = hyp(...tc) || 1;
        b.vx += tc[0] / tl * m.push; b.vy += tc[1] / tl * m.push;
        ev.push({ type: 'bump' });
      }
    } else if (m.kind === 'tail') {
      const [d, t] = toSegment(b.x, b.y, at.x, at.y, at.tx, at.ty);
      if (d < m.thick + R && t > 0.25) {
        // batted the way the tail's sweeping (and at least m.push hard)
        const nx = -Math.sin(at.a), ny = Math.cos(at.a), s = Math.sign(at.w) || 1;
        const v = Math.max(m.push, Math.abs(at.w) * t * m.len * 1.4);
        const vn = b.vx * nx * s + b.vy * ny * s;
        if (vn < v) { b.vx += nx * s * (v - vn); b.vy += ny * s * (v - vn); ev.push({ type: 'bat' }); }
        b.x += nx * s * (m.thick + R - d); b.y += ny * s * (m.thick + R - d);
      }
    }
  }

  // pins: blasted away, and the ball rolls on as if they weren't there
  const bh = ballHeight(pl);
  hole.pins.forEach((p, i) => {
    if (!pl.pins[i]) return;
    if (hyp(b.x - p[0], b.y - p[1]) < R + PIN_R && Math.abs(bh - height(hole, p[0], p[1])) < 1.2) {
      pl.pins[i] = false; pl.blasted++;
      ev.push({ type: 'blast', pin: i, vx: b.vx, vy: b.vy, last: !pinsLeft(pl), trick: pl.blasted === hole.pins.length });
    }
  });

  // the hole: grabbed while a pin's standing (back to the tee, a stroke more); in, once they're all gone
  const cd2 = hyp(hole.cup[0] - b.x, hole.cup[1] - b.y);
  if (!b.deck && cd2 < hole.reach) {
    if (pinsLeft(pl)) {
      ev.push({ type: 'grab', x: b.x, y: b.y });
      Object.assign(b, { x: hole.tee[0], y: hole.tee[1], vx: 0, vy: 0, moving: false, pulled: false });
      pl.strokes++;
      return ev;
    }
    if (cd2 < 1.4 || (cd2 < 2.6 && hyp(b.vx, b.vy) < 30)) {
      Object.assign(b, { x: hole.cup[0], y: hole.cup[1], vx: 0, vy: 0, moving: false });
      pl.sunk = true; ev.push({ type: 'sunk' });
      return ev;
    }
  }

  // stopped (barely moving for a moment, maybe leaning on a wall; or it's been going too long)
  b.slow = hyp(b.vx, b.vy) < 1.2 && !(friendly && cd2 < hole.reach) ? (b.slow || 0) + DT : 0;
  if (b.slow > 0.3 || pl.shotTime > MAX_SECS) {
    b.vx = b.vy = 0; b.moving = false; b.pulled = false; b.slow = 0;
    ev.push({ type: 'stop' });
  }
  return ev;
}

// what's solid for a ball on the ground: off the green, and the bridge's low end (no room under it)
function solid(hole, x, y) {
  let d = edge(hole, x, y);
  const br = hole.bridge;
  if (br) d = Math.max(d, -sdPiece(['rect', br.x0 - 0.5, br.under[0], br.x1 + 0.5, br.under[1]], x, y));
  return d;
}

// into the tunnel (hole 3): it climbs inside the bank, and comes out the far end if it was going fast
// enough (or rolls back out of the mouth)
function enterTunnel(pl, ev) {
  const hole = pl.hole, b = pl.ball, tn = hole.tunnel, v = hyp(b.vx, b.vy);
  const h0 = height(hole, tn.mouth[0], tn.mouth[1] + tn.dir * 2), h1 = height(hole, tn.out[0], tn.out[1]);
  const climb = (h1 - h0) * H2U, len = hyp(tn.out[0] - tn.mouth[0], tn.out[1] - tn.mouth[1]);
  const v2 = v * v - 2 * G * climb - 2 * ROLL * len;
  if (v2 > 16) {
    const vo = Math.sqrt(v2);
    b.tunnel = { time: len / ((v + vo) / 2), left: len / ((v + vo) / 2), h0, h1, h: h0, to: tn.out, vx: 0, vy: -tn.dir * vo, back: false };
  } else {
    // up the slope inside and back down: out of the mouth again, a bit slower
    const t = Math.min(3, 2 * v / (G * climb / len + ROLL));
    b.tunnel = { time: t, left: t, h0, h1: h0, h: h0, to: [tn.mouth[0], tn.mouth[1] + tn.dir * (R + 1.5)], vx: 0, vy: tn.dir * v * 0.45, back: true };
  }
  b.x = tn.mouth[0]; b.y = tn.mouth[1];
  ev.push({ type: 'tunnel' });
}

// A whole shot from where the ball is: putt, and step until it's done. Hands back everything that
// happened, and the ball's path (every few steps).
export function playShot(pl, [angle, power, clock]) {
  if (clock !== undefined) pl.clock = clock;
  const events = [...putt(pl, angle, power)], path = [[pl.ball.x, pl.ball.y]];
  let n = 0;
  while (pl.ball.moving && !pl.sunk) {
    for (const e of step(pl)) events.push({ ...e, t: pl.shotTime });
    if (++n % 6 === 0) path.push([pl.ball.x, pl.ball.y]);
  }
  path.push([pl.ball.x, pl.ball.y]);
  return { events, path };
}

// A recorded way round a hole, from the tee: every shot, in order. What happened.
export function playRoute(hole, shots) {
  const pl = newPlay(hole), log = [];
  for (const s of shots) { if (pl.sunk) break; log.push(playShot(pl, s)); }
  return { pl, log };
}

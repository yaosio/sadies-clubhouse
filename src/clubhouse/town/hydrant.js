// Dog City, the picture side: a giant red fire hydrant out past the town square, a ramp winding up
// round it with a landing for each dog's house, a lookout deck on the cap, and the doors that get you
// about (a door in the hydrant's base for each house, and one by the house to come back down).
// Where everything stands and what you can walk on is hydrant-walk.js; the numbers are layout.js.
//
// Built into the outside's own scene. What it hands back for the outside to keep: what you can stand
// on (`surfaces`), what's solid (`circles`, `turned`), and the pairs of doors (`links`: each a real
// doorway like every door in the clubhouse, only both sides of it are out here).
import { Mesh, Group, BufferGeometry, Float32BufferAttribute, LatheGeometry, Vector2, CylinderGeometry, SphereGeometry, TorusGeometry, RingGeometry, ShapeGeometry, Shape, DoubleSide } from 'three';
import { psx, keep } from '../look.js';
import { kit, doorway, wallGeometry } from '../build.js';
import { HYDRANT as H, HYDRANT_DOORS, LOTS, LILY_LOT, SQUARE, PATHS } from './layout.js';
import { rampHeight, around, surfaces, DOOR_SIDES } from './hydrant-walk.js';
import { hydrantArt, signboard, doorLeaf } from './hydrant-art.js';

const TAU = Math.PI * 2;
const [R0, R1] = H.lane, RL = H.ledge;
const DOOR = { w: 1.7, h: 2.8 };                    // a door in the hydrant
const HOUSING = { w: 3.0, h: 3.4, deep: 1.9 };      // the red box a door sits in, sticking out of the wall
const LEDGE = -0.5;                                 // draw order of a ledge's top: after the ground's flat pictures (-1), before the ones on the ledge (outside.raise)
const SLOT = 1.9;                                   // how many radians of the ramp's last stretch the deck leaves open above it
const P = (r, turn, y) => { const th = H.th0 + turn; return [H.x + r * Math.cos(th), y, H.z + r * Math.sin(th)]; };
const out = turn => { const th = H.th0 + turn; return [Math.cos(th), 0, Math.sin(th)]; };   // straight out from the barrel there
const side = turn => { const th = H.th0 + turn; return [-Math.sin(th), 0, Math.cos(th)]; };  // along the ramp there

// ---------- flat-shaded pieces gathered into one mesh per look ----------
class Soup {
  constructor() { this.p = []; this.uv = []; this.n = []; }
  // four corners in order; `up` says roughly which way the front faces (it's drawn from both sides, lit from the front)
  quad(a, b, c, d, up, scale = 4, uv = null) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    if (up && nx * up[0] + ny * up[1] + nz * up[2] < 0) { nx = -nx; ny = -ny; nz = -nz; }
    const at = (q, i) => uv ? uv[i] : Math.abs(ny) > 0.6 ? [q[0] / scale, q[2] / scale] : Math.abs(nx) > Math.abs(nz) ? [q[2] / scale, q[1] / scale] : [q[0] / scale, q[1] / scale];
    for (const [q, i] of [[a, 0], [b, 1], [c, 2], [a, 0], [c, 2], [d, 3]]) { this.p.push(...q); this.uv.push(...at(q, i)); this.n.push(nx, ny, nz); }
  }
  // a thin square rod from a to b
  rod(a, b, w) {
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], len = Math.hypot(...d) || 1;
    const ref = Math.abs(d[1]) < 0.9 * len ? [0, 1, 0] : [1, 0, 0];
    const cr = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
    const unit = (v, k) => { const m = Math.hypot(...v) || 1; return v.map(c => c / m * k); };
    const s = unit(cr(d, ref), w / 2), u = unit(cr(s, d), w / 2);
    const c = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([i, j]) => [[0, 1, 2].map(k => a[k] + s[k] * i + u[k] * j), [0, 1, 2].map(k => b[k] + s[k] * i + u[k] * j)]);
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; this.quad(c[i][0], c[j][0], c[j][1], c[i][1], null, 1); }
  }
  mesh(mat) {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(this.p, 3)); g.setAttribute('uv', new Float32BufferAttribute(this.uv, 2)); g.setAttribute('normal', new Float32BufferAttribute(this.n, 3));
    return new Mesh(keep(g), mat);
  }
}
// a railing along a run of points: a post at each and two rails between
function rail(S, pts, tall = 1.1) {
  for (const p of pts) S.rod(p, [p[0], p[1] + tall, p[2]], 0.16);
  for (const h of [tall, tall * 0.5]) for (let i = 0; i < pts.length - 1; i++) S.rod([pts[i][0], pts[i][1] + h, pts[i][2]], [pts[i + 1][0], pts[i + 1][1] + h, pts[i + 1][2]], 0.1);
}

export function buildHydrant(T, scene, { taken = new Set() } = {}) {
  const A = hydrantArt();
  const { plane, cyl } = kit(scene);
  const solid = { surfaces: surfaces(), circles: [], turned: [], links: [] };
  const lit = psx(T.lantern, { unlit: 1 }), iron = psx(null, { tint: 0x221a44 });
  const put = (m, order) => { if (order !== undefined) m.renderOrder = order; scene.add(m); return m; };

  // ---------- the barrel, the cap and the lookout deck ----------
  const red = psx(A.red, { rx: 14, ry: 6, side: DoubleSide }), redDark = psx(A.redDark, { rx: 8, ry: 2, side: DoubleSide });
  const lathe = (pts, mat, seg = 32) => { const m = new Mesh(keep(new LatheGeometry(pts.map(([r, y]) => new Vector2(r, y)), seg)), mat); m.position.set(H.x, 0, H.z); return put(m); };
  const B = H.barrel, TOP = H.top;
  lathe([[0.01, 0.02], [B + 0.35, 0.02], [B + 0.35, 0.3], [B, 0.8], [B, TOP - 0.05], [H.deck[0], TOP - 0.05]], red);   // the barrel, with a low flare at its foot
  // the cap: a rotunda with DOG CITY round it, a rim, the dome and the nut on top
  const rotunda = new Mesh(keep(new CylinderGeometry(8, 8, 4, 32, 1, true)), psx(A.capBand, { rx: 4, side: DoubleSide })); rotunda.position.set(H.x, TOP + 2, H.z); put(rotunda);
  lathe([[8, TOP + 4], [9.3, TOP + 4], [9.3, TOP + 5.3], [8, TOP + 5.3]], redDark);
  const dome = new Mesh(keep(new SphereGeometry(8, 20, 10, 0, TAU, 0, Math.PI / 2)), red); dome.position.set(H.x, TOP + 5.3, H.z); put(dome);
  cyl(2.0, 2.4, 2.2, 5, psx(A.chrome, { rx: 2 }), [H.x, TOP + 14.4, H.z]);
  solid.circles.push([H.x, H.z, B, undefined, TOP - 0.05]);            // the barrel (you can still walk on the deck over it)
  solid.circles.push([H.x, H.z, H.deck[0], TOP - 0.1, TOP + 6]);      // the cap's wall, on the deck

  // ---------- the pieces of concrete ----------
  const tops = new Soup(), ledgeTops = new Soup(), under = new Soup(), rails = new Soup(), paws = new Soup();
  const UP = [0, 1, 0], DOWN = [0, -1, 0];
  const inLanding = t => H.stops.some(s => Math.abs(t - s.turn) < H.half - 1e-6);
  // the ramp: a lane round the barrel, level on each landing (with its face, and its underside)
  const STEP = 0.06;
  for (let t = 0; t < H.end - 1e-6; t += STEP) {
    const q = Math.min(H.end, t + STEP), ha = rampHeight(t) + 0.02, hb = rampHeight(q) + 0.02;
    tops.quad(P(R0, t, ha), P(R1, t, ha), P(R1, q, hb), P(R0, q, hb), UP);
    under.quad(P(R0, t, ha - 0.5), P(R1, t, ha - 0.5), P(R1, q, hb - 0.5), P(R0, q, hb - 0.5), DOWN);
    if (!inLanding(t + STEP / 2)) under.quad(P(R1, t, ha - 0.5), P(R1, q, hb - 0.5), P(R1, q, hb), P(R1, t, ha), out(t + STEP / 2));
  }
  // each landing's ledge, out past the lane: flat on top, held up from below by a bracket
  for (const s of H.stops) {
    const n = 20, y = s.y + 0.02;
    for (let i = 0; i < n; i++) {
      const a = s.turn - H.half + 2 * H.half * i / n, b = s.turn - H.half + 2 * H.half * (i + 1) / n;
      ledgeTops.quad(P(R1, a, y), P(RL, a, y), P(RL, b, y), P(R1, b, y), UP);
      under.quad(P(R1, a, y - 4.5), P(RL, a, y - 0.8), P(RL, b, y - 0.8), P(R1, b, y - 4.5), DOWN);
      under.quad(P(RL, a, y - 0.8), P(RL, b, y - 0.8), P(RL, b, y), P(RL, a, y), out((a + b) / 2));
    }
    for (const e of [-1, 1]) { const a = s.turn + e * H.half; under.quad(P(R1, a, y - 4.5), P(RL, a, y - 0.8), P(RL, a, y), P(R1, a, y), side(a).map(c => c * e)); }
    const arc = []; for (let i = 0; i <= 12; i++) arc.push(P(RL - 0.12, s.turn - H.half + 2 * H.half * i / 12, y));
    rail(rails, arc);
    for (const e of [-1, 1]) { const a = s.turn + e * (H.half - 0.01), run = []; for (let i = 0; i <= 5; i++) run.push(P(R1 + (RL - R1) * i / 5, a, y)); rail(rails, run); }
  }
  // the lookout deck: a ring round the cap, left open over the ramp's last stretch (so you climb up
  // into the open, not under a ceiling that you then come up through)
  const deckY = TOP, thick = 1.0;
  const from = H.end - TAU, slotFrom = H.end - SLOT;       // (turns, going round once, the last stretch being the slot)
  const stops = [];
  for (let t = from; t < slotFrom - 1e-6; t += TAU / 48) stops.push(t);
  stops.push(slotFrom);
  for (let t = slotFrom; t < H.end - 1e-6; t += 0.12) stops.push(t);
  stops.push(H.end);
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i], b = stops[i + 1], mid = (a + b) / 2, slotted = mid > slotFrom;
    const bands = slotted ? [[H.deck[0], R0], [R1, H.deck[1]]] : [[H.deck[0], H.deck[1]]];
    for (const [r0, r1] of bands) {
      tops.quad(P(r0, a, deckY), P(r1, a, deckY), P(r1, b, deckY), P(r0, b, deckY), UP);
      under.quad(P(r0, a, deckY - thick), P(r1, a, deckY - thick), P(r1, b, deckY - thick), P(r0, b, deckY - thick), DOWN);
    }
    under.quad(P(H.deck[1], a, deckY - thick), P(H.deck[1], b, deckY - thick), P(H.deck[1], b, deckY), P(H.deck[1], a, deckY), out(mid));
    if (slotted) for (const r of [R0, R1]) under.quad(P(r, a, deckY - thick), P(r, b, deckY - thick), P(r, b, deckY), P(r, a, deckY), out(mid).map(c => c * (r === R0 ? 1 : -1)));
  }
  // (where the slot starts, the deck ends in a wall facing up the ramp; where it ends, the lane meets the deck's top)
  under.quad(P(R0, slotFrom, deckY - thick), P(R1, slotFrom, deckY - thick), P(R1, slotFrom, deckY), P(R0, slotFrom, deckY), side(slotFrom));
  { const ring = []; for (let i = 0; i <= 48; i++) ring.push(P(H.deck[1] - 0.15, from + TAU * i / 48, deckY)); rail(rails, ring); }
  for (const r of [R0 - 0.1, R1 + 0.1]) { const run = []; for (let t = slotFrom; t <= H.end + 1e-6; t += 0.12) run.push(P(r, Math.min(t, H.end), deckY)); rail(rails, run); }
  // the rail along the ramp's outer edge (not over a landing, and stopping where the deck's wall takes over)
  { let run = []; const flush = () => { if (run.length > 1) rail(rails, run); run = []; };
    for (let t = 0.1; t < slotFrom - 0.2; t += 0.13) { if (H.stops.some(s => Math.abs(t - s.turn) < H.half + 0.05)) flush(); else run.push(P(R1 - 0.12, t, rampHeight(t) + 0.02)); }
    flush(); }
  // posts under the ramp (a few, and solid)
  const near = (t, u, gap) => Math.abs(Math.atan2(Math.sin(t - u), Math.cos(t - u))) < gap;   // (turn t is within gap of turn u, going round)
  for (let t = 0.3; t < slotFrom - 0.3; t += 1.5) {
    if (H.stops.some(s => Math.abs(t - s.turn) < H.half + 0.2)) continue;
    if (HYDRANT_DOORS.some(d => near(t, d.base, 0.45)) || near(t, 0.32, 0.3)) continue;   // (not in front of a door, or the sign)
    const q = P(R1 - 0.45, t, 0), h = rampHeight(t) - 0.5, top = P(R1 - 0.45, t, h);
    under.rod([q[0], 0, q[2]], top, 0.55);
    solid.circles.push([q[0], q[2], 0.3, undefined, h]);
  }
  // pawprints down the middle of the lane
  { let k = 0;
    for (let t = 0.5; t < slotFrom - 0.2; t += 0.34) {
      if (H.stops.some(s => Math.abs(t - s.turn) < H.half + 0.05)) continue;
      k++;
      const r = (R0 + R1) / 2 + (k % 2 ? -0.7 : 0.7), c = P(r, t, rampHeight(t) + 0.06), n = P(r, t + 0.03, rampHeight(t + 0.03) + 0.06);
      const fwd = [n[0] - c[0], n[1] - c[1], n[2] - c[2]], f = Math.hypot(...fwd), tn = fwd.map(v => v / f), lat = side(t);
      const corner = (a, b) => [0, 1, 2].map(i => c[i] + tn[i] * 0.45 * a + lat[i] * 0.45 * b);
      paws.quad(corner(-1, -1), corner(-1, 1), corner(1, 1), corner(1, -1), UP, 1, [[0, 0], [1, 0], [1, 1], [0, 1]]);
    }
  }
  const concrete = psx(A.concrete, { rx: 1, ry: 1, side: DoubleSide }), concreteSide = psx(A.concreteSide, { side: DoubleSide });
  // (a ledge's top is drawn after the ground's flat pictures (paths, the puddle), so they can't show through it)
  put(tops.mesh(concrete)); put(ledgeTops.mesh(psx(A.concrete, { side: DoubleSide })), LEDGE);
  put(under.mesh(concreteSide));
  put(rails.mesh(psx(null, { tint: 0xf4f0ff, side: DoubleSide })));
  put(paws.mesh(psx(A.paw, { decal: true, unlit: 0.6, side: DoubleSide })));

  // ---------- nozzles, the chain, the puddle ----------
  const nozzle = (turn, y, len, rad, cap) => {
    const g = new Group(); g.position.set(H.x, y, H.z); g.rotation.y = -(H.th0 + turn); scene.add(g);   // (local +x runs out along the nozzle)
    const k = kit(g), mat = red, ring = redDark, chrome = psx(A.chrome, { rx: 2 });
    k.cyl(rad, rad * 1.1, len, 14, mat, [B - 1 + len / 2, 0, 0], [0, 0, Math.PI / 2]);
    k.cyl(rad * 1.25, rad * 1.25, 0.5, 14, ring, [B + len - 1.9, 0, 0], [0, 0, Math.PI / 2]);
    k.cyl(rad * 1.2, rad * 1.2, cap, 14, chrome, [B + len - 1 + cap / 2, 0, 0], [0, 0, Math.PI / 2]);
    k.cyl(rad * 0.45, rad * 0.45, 0.5, 5, chrome, [B + len - 1 + cap + 0.2, 0, 0], [0, 0, Math.PI / 2]);
    return g;
  };
  // the lowest gap between the ramp's turns at a turn angle (where a nozzle fits under the ramp)
  const gap = (turn, lo, hi) => {
    const base = ((turn % TAU) + TAU) % TAU, hs = [0];
    for (let k = 0; k < 5; k++) if (base + TAU * k <= H.end) hs.push(rampHeight(base + TAU * k));
    hs.push(TOP);
    for (let i = 0; i < hs.length - 1; i++) { const a = Math.max(hs[i], lo), b = Math.min(hs[i + 1], hi); if (b - a > 3) return (a + b) / 2; }
    return (lo + hi) / 2;
  };
  const chainTurn = 2.1, chainY = gap(chainTurn, 0, 27), chainLen = 8;   // (above the puddle, which is just past its tip)
  nozzle(chainTurn, chainY, chainLen, 0.95, 0.5);
  nozzle(4.2, gap(4.2, 6, 27) + 1.2, 5.6, 0.95, 0.5);
  const lily = H.stops[2];
  nozzle(lily.turn, 27, 8.2, 1.0, 0.7);   // the big one, above Lily's ledge
  // the chain: giant links from a lug on the barrel along the nozzle to its cap, hung with a sag
  { const th = H.th0 + chainTurn, tx = -Math.sin(th), tz = Math.cos(th), off = 1.5, tip = B - 1 + chainLen;
    const pa = [H.x + (B + 0.1) * Math.cos(th), 0, H.z + (B + 0.1) * Math.sin(th)], pb = [H.x + (tip + 0.3) * Math.cos(th), 0, H.z + (tip + 0.3) * Math.sin(th)];
    const geo = keep(new TorusGeometry(0.34, 0.09, 5, 10)), link = psx(A.chrome, { rx: 2, side: DoubleSide }), N = 14;
    for (let i = 0; i <= N; i++) {
      const f = i / N, m = new Mesh(geo, link);
      m.position.set(pa[0] + (pb[0] - pa[0]) * f + tx * off, chainY + 0.3 - Math.sin(f * Math.PI) * 1.4, pa[2] + (pb[2] - pa[2]) * f + tz * off);
      m.scale.set(1, 1.5, 1); m.rotation.set(0, -th + (i % 2 ? Math.PI / 2 : 0), Math.PI / 2 * (i % 2)); scene.add(m);
    }
    for (const p of [pa, pb]) cyl(0.4, 0.4, 0.5, 8, psx(A.chrome, { rx: 2 }), [p[0] + tx * off, chainY + 0.3, p[2] + tz * off], [0, -th, Math.PI / 2]);
  }
  // a puddle at the base, with a ripple (out where no landing is over it)
  const puddleTurn = 2.1, pp = P(18, puddleTurn, 0);
  { const sh = new Shape(), n = 30;
    for (let i = 0; i <= n; i++) { const a = i / n * TAU, r = 3.6 * (1 + 0.18 * Math.sin(3 * a) + 0.1 * Math.sin(5 * a + 1)); (i ? sh.lineTo : sh.moveTo).call(sh, Math.cos(a) * r, Math.sin(a) * r); }
    const m = new Mesh(keep(new ShapeGeometry(sh)), psx(A.water, { rx: 0.4, ry: 0.4, unlit: 0.6, onFloor: true, side: DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.set(pp[0], 0, pp[2]); put(m, -0.9); }
  const rippleMat = psx(null, { tint: 0xffffff, unlit: 1, onFloor: true, side: DoubleSide });
  const ripple = new Mesh(keep(new RingGeometry(0.85, 1, 24)), rippleMat); ripple.rotation.x = -Math.PI / 2; ripple.position.set(pp[0] + 0.4, 0, pp[2] + 0.3); put(ripple, -0.85);

  // ---------- signs ----------
  // a signboard standing on two posts (or on a housing's roof): its face, and a plain back
  const board = (parent, tex, pos, yaw) => {
    const g = new Group(); g.position.set(...pos); g.rotation.y = yaw; parent.add(g);
    const k = kit(g), ppm = 40, W = tex.image.width / ppm, Hh = tex.image.height / ppm;
    k.plane(W, Hh, psx(tex, { unlit: 0.55 }), [0, Hh / 2, 0.04], null, 1);
    k.plane(W, Hh, psx(null, { tint: 0x5a3a20, unlit: 0.3 }), [0, Hh / 2, -0.04], [0, Math.PI, 0], 1);
    return { g, W, Hh };
  };
  // the way up, beside the foot of the ramp
  { const bp = P(16, 0.32, 0), yaw = Math.PI / 2 - H.th0 - 0.3, g = new Group(); g.position.set(bp[0], 0, bp[2]); g.rotation.y = yaw; scene.add(g);
    const b = board(g, signboard(['DOG CITY', 'THIS WAY UP'], { color: 0xd8261e, s: 3 }), [0, 1.9, 0], 0);
    for (const e of [-1, 1]) kit(g).box(0.22, 2.2, 0.22, psx(A.stake), [e * (b.W / 2 - 0.5), 1.1, -0.05]);
    solid.circles.push([bp[0] + Math.cos(yaw) * (b.W / 2 - 0.5), bp[2] - Math.sin(yaw) * (b.W / 2 - 0.5), 0.3, undefined, 2.5]);
    solid.circles.push([bp[0] - Math.cos(yaw) * (b.W / 2 - 0.5), bp[2] + Math.sin(yaw) * (b.W / 2 - 0.5), 0.3, undefined, 2.5]);
  }

  // ---------- the doors ----------
  const frame = s => { const th = s.th, p = around(s.r0 + HOUSING.deep, th); return { x: p.x, y: s.y, z: p.z, yaw: Math.PI / 2 - th }; };
  const doors = new Map();
  const leaves = new Map(HYDRANT_DOORS.map(d => [d.id, doorLeaf(d.color)]));
  const iconOf = d => d.id.endsWith('.up');
  for (const s of DOOR_SIDES) {
    const f = frame(s), d = s.of, g = new Group(); g.position.set(f.x, f.y, f.z); g.rotation.y = f.yaw; scene.add(g);
    const k = kit(g), w = HOUSING.w, h = HOUSING.h, deep = HOUSING.deep + 0.15;
    // the box the door sits in: a front wall with the doorway in it, two sides, a roof
    k.add(new Mesh(wallGeometry(w, h, DOOR.w, DOOR.h), psx(A.red, { rx: 0.6, ry: 0.6, side: DoubleSide })), [0, 0, 0]);
    for (const e of [-1, 1]) k.plane(deep, h, psx(A.red, { rx: 0.6, ry: 0.6, side: DoubleSide }), [e * w / 2, h / 2, -deep / 2], [0, e * Math.PI / 2, 0], 2);
    k.box(w + 0.3, 0.3, deep + 0.35, redDark, [0, h + 0.15, -deep / 2 + 0.17]);
    for (const e of [-1, 1]) { k.box(0.08, 0.3, 0.2, iron, [e * (DOOR.w / 2 + 0.45), 2.2, 0.1]); k.box(0.26, 0.34, 0.26, lit, [e * (DOOR.w / 2 + 0.45), 2.45, 0.25]); }   // a lantern each side
    const sign = signboard(iconOf(s) ? ['BACK DOWN'] : d.label.split(' ').reduce((ls, wd) => { const l = ls[ls.length - 1]; if (l && (l + ' ' + wd).length <= 11) ls[ls.length - 1] = l + ' ' + wd; else ls.push(wd); return ls; }, []),
      { color: d.color, s: 3, mark: iconOf(s) ? 'down' : 'paw', light: d.color === 0xffd23a });
    board(g, sign, [0, h + 0.3, -0.5], 0);
    const door = doorway(scene, { pos: [f.x, f.y, f.z], yaw: f.yaw, w: DOOR.w, h: DOOR.h, leaves: [leaves.get(d.id)], hinge: -1, trim: 0xfff4e4 });
    door.see.position.y += 0.03;
    doors.set(s.id, door);
    const c = Math.cos(f.yaw), sn = Math.sin(f.yaw);
    solid.turned.push({ x0: -w / 2 - 0.05, x1: w / 2 + 0.05, z0: -deep, z1: 0, y0: f.y - 0.1, y1: f.y + h, X: f.x, Z: f.z, c, s: sn });
  }
  for (const d of HYDRANT_DOORS) solid.links.push({ id: d.id, label: d.label, a: doors.get(d.id + '.down'), b: doors.get(d.id + '.up') });

  // ---------- Lily's ledge, waiting for her house ----------
  if (!taken.has(LILY_LOT)) {
    const f = LOTS[LILY_LOT], g = new Group(); g.position.set(f.x, f.y, f.z); g.rotation.y = f.yaw; scene.add(g);
    const k = kit(g);
    k.plane(8, 6.5, psx(T.stone, { rx: 5, ry: 4, onFloor: true }), [0, 0.03, -2.6], [-Math.PI / 2, 0, 0], 2).renderOrder = LEDGE + 0.25;
    for (const [x, z] of [[-4, 0.6], [4, 0.6], [-4, -5.8], [4, -5.8]]) { k.box(0.12, 1.1, 0.12, psx(A.stake), [x, 0.55, z]); k.box(0.7, 0.35, 0.04, psx(A.pennant, { unlit: 0.6 }), [x + 0.4, 0.8, z]); }
    board(g, signboard(["LILY'S HOUSE", 'COMING SOON'], { color: 0xffb0d0, s: 3, light: true }), [0, 0.9, 1.9], 0);
    for (const e of [-1, 1]) k.box(0.2, 1.4, 0.2, psx(A.stake), [e * 2.6, 0.7, 1.85]);
    // her banner, hung from the big nozzle above (it's the first thing you see from the foot of the ramp)
    const th = H.th0 + lily.turn, bp = around(B + 7, th), ban = signboard(["LILY'S HOUSE", 'COMING SOON'], { color: 0xffb0d0, s: 3, light: true });
    const bg = new Group(); bg.position.set(bp.x, 25, bp.z); bg.rotation.y = Math.PI / 2 - th; scene.add(bg);
    const bk = kit(bg), bw = ban.image.width / 40, bh = ban.image.height / 40;
    bk.plane(bw, bh, psx(ban, { unlit: 0.55, side: DoubleSide }), [0, 0, 0], null, 1);
    for (const e of [-1, 1]) bk.box(0.08, 1.4, 0.08, iron, [e * (bw / 2 - 0.3), bh / 2 + 0.7, 0]);
  }

  // ---------- the path from the square to the foot ----------
  { const p = PATHS.find(q => q.at === 43), r0 = SQUARE.r - 0.6, half = (p.to - r0) / 2, a1 = p.at * Math.PI / 180, a2 = (p.at + p.bend) * Math.PI / 180;
    const x0 = SQUARE.x + r0 * Math.sin(a1), z0 = SQUARE.z - r0 * Math.cos(a1), x1 = x0 + Math.sin(a1) * half, z1 = z0 - Math.cos(a1) * half;
    const ex = x1 + Math.sin(a2) * half, ez = z1 - Math.cos(a2) * half, f = around(R1, H.th0);
    const dx = f.x - ex, dz = f.z - ez, len = Math.hypot(dx, dz), a = Math.atan2(dx, -dz);
    plane(2, len + 0.5, psx(T.path, { rx: 1.3, ry: len * 0.67, onFloor: true }), [(ex + f.x) / 2, 0, (ez + f.z) / 2], [-Math.PI / 2, 0, -a], 4).renderOrder = -0.95;
  }

  solid.update = t => {
    const k = (t % 2.4) / 2.4;
    ripple.scale.setScalar(0.4 + k * 2.2); rippleMat.uniforms.uFade.value = k * 0.95;
  };
  return solid;
}

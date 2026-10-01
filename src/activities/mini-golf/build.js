// The mini golf in 3D: each hole built into the backyard from its data file (holes/), the same way
// round as course.js works it out. The green is a field of little squares following the hills, with
// a low pink wall round its edge and the ground under it built up like a plinth, so a hole that dips
// below the backyard's grass still sits on top of it. Then everything on it: the tee, the hole and its
// tentacles, the ring they reach to, the pins, the bridge, the cat flap, and what moves.
import { Mesh, Group, BufferGeometry, Float32BufferAttribute, BoxGeometry, CylinderGeometry, SphereGeometry, ConeGeometry, CircleGeometry, PlaneGeometry, DoubleSide } from 'three';
import { S, HS, R, PIN_R, edge, height, heightRange, bridgeHeight } from './course.js';

const ST = 1.25;   // the green's squares (plan units)

// where a spot on a hole's plan is in the backyard
export function placer(hole) {
  const at = hole.at, f = at.flipX ? -1 : 1, fz = at.flipZ ? -1 : 1, [lo] = heightRange(hole);
  const lift = 0.1 + Math.max(0, -lo * HS);
  return {
    f, fz, lift,
    x: u => at.x + f * u * S, z: v => at.z + fz * v * S, y: h => lift + h * HS,
    // the ground at a spot, in the backyard
    at: (u, v, up = 0) => [at.x + f * u * S, lift + height(hole, u, v) * HS + up, at.z + fz * v * S],
    // a way in the plan (radians) as a direction in the backyard, and back again
    dir: a => [f * Math.cos(a), fz * Math.sin(a)],
    angle: (dx, dz) => Math.atan2(fz * dz, f * dx),
  };
}

export function buildHole(m, hole, A, n) {
  const { psx, keep } = m, P = placer(hole), g = new Group();
  const mat = {
    grass: psx(m.T.grass, { rx: 1, ry: 1, side: DoubleSide }), mown: psx(m.T.grass, { rx: 1, ry: 1, tint: 0xc8ffb8, side: DoubleSide }),
    wall: psx(null, { tint: 0xff5fa2, side: DoubleSide }), plinth: psx(A.plinth, { rx: 1, ry: 1, side: DoubleSide }),
    wood: psx(m.T.wood, { rx: 1, ry: 1 }), dark: psx(null, { tint: 0x120a1a }), white: psx(null, { tint: 0xffffff }),
    red: psx(null, { tint: 0xff2d55 }), ink: psx(null, { tint: 0x241238 }), mat: psx(A.teeMat), flap: psx(null, { tint: 0xff9ad0 }),
  };
  // ---------- the green: squares where all four corners are on it, and walls where they stop ----------
  const nx = Math.ceil(100 / ST), ny = Math.ceil(140 / ST);
  const on = (i, j) => i >= 0 && j >= 0 && i < nx && j < ny && [[0, 0], [1, 0], [0, 1], [1, 1]].every(([a, b]) => edge(hole, (i + a) * ST, (j + b) * ST) <= 0);
  const turf = [[], []], turfUv = [[], []], walls = [], wallUv = [], base = [], baseUv = [];
  // (flipped one way, every triangle's corners go round the other way: swapped back)
  const tri = (out, uv, a, b, c) => { for (const p of P.f * P.fz < 0 ? [a, c, b] : [a, b, c]) { out.push(p[0], p[1], p[2]); uv.push(p[3], p[4]); } };
  const top = (u, v) => { const p = P.at(u, v); return [...p, p[0] / 1.2, p[2] / 1.2]; };
  function side(u0, v0, u1, v1) {
    const a = P.at(u0, v0), b = P.at(u1, v1), len = Math.hypot(b[0] - a[0], b[2] - a[2]);
    const q = (p, y, s) => [p[0], y, p[2], s, y];
    // the low wall, just above the green
    tri(walls, wallUv, q(a, a[1] - 0.02, 0), q(b, b[1] - 0.02, len), q(b, b[1] + 0.13, len));
    tri(walls, wallUv, q(a, a[1] - 0.02, 0), q(b, b[1] + 0.13, len), q(a, a[1] + 0.13, 0));
    // and the plinth below, down to the backyard's grass
    tri(base, baseUv, q(a, 0, 0), q(b, 0, len), q(b, b[1] - 0.02, len));
    tri(base, baseUv, q(a, 0, 0), q(b, b[1] - 0.02, len), q(a, a[1] - 0.02, 0));
  }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    if (!on(i, j)) continue;
    const u0 = i * ST, v0 = j * ST, u1 = u0 + ST, v1 = v0 + ST, k = Math.floor(j / 4) % 2;   // (mown in stripes)
    const a = top(u0, v0), b = top(u1, v0), c = top(u1, v1), d = top(u0, v1);
    tri(turf[k], turfUv[k], a, d, c); tri(turf[k], turfUv[k], a, c, b);
    if (!on(i, j - 1)) side(u1, v0, u0, v0);
    if (!on(i, j + 1)) side(u0, v1, u1, v1);
    if (!on(i - 1, j)) side(u0, v0, u0, v1);
    if (!on(i + 1, j)) side(u1, v1, u1, v0);
  }
  const mesh = (pos, uv, mt) => {
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new Float32BufferAttribute(uv, 2));
    geo.computeVertexNormals();
    const o = new Mesh(keep(geo), mt); g.add(o); return o;
  };
  mesh(turf[0], turfUv[0], mat.grass); mesh(turf[1], turfUv[1], mat.mown);
  mesh(walls, wallUv, mat.wall); mesh(base, baseUv, mat.plinth);
  const box = (w, h, d, mt, [x, y, z], ry = 0) => { const o = new Mesh(keep(new BoxGeometry(w, h, d)), mt); o.position.set(x, y, z); o.rotation.y = ry; g.add(o); return o; };

  // ---------- the bank between hole 3's ramps, and its cat flap ----------
  const tn = hole.tunnel;
  if (tn) {
    const x0 = P.x(26), x1 = P.x(62), z0 = P.z(50), z1 = P.z(92), top3 = P.y(height(hole, 44, 49));
    const bank = box(Math.abs(x1 - x0), top3, Math.abs(z1 - z0), mat.plinth, [(x0 + x1) / 2, top3 / 2, (z0 + z1) / 2]);
    bank.material = mat.plinth;
    const lid = new Mesh(keep(new PlaneGeometry(Math.abs(x1 - x0), Math.abs(z1 - z0))), mat.grass); lid.rotation.x = -Math.PI / 2; lid.position.set((x0 + x1) / 2, top3 + 0.005, (z0 + z1) / 2); g.add(lid);
    const [mx, my, mz] = P.at(tn.mouth[0], tn.mouth[1] + 1.5);
    box(0.5, 0.36, 0.06, mat.ink, [mx, my + 0.16, P.z(92) + P.fz * 0.02]);
    box(0.42, 0.3, 0.07, mat.dark, [mx, my + 0.15, P.z(92) + P.fz * 0.025]);
    box(0.42, 0.14, 0.08, mat.flap, [mx, my + 0.24, P.z(92) + P.fz * 0.03]);
    const out = new Mesh(keep(new CircleGeometry(0.2, 10)), mat.dark); out.rotation.x = -Math.PI / 2;
    out.position.set(...P.at(tn.out[0], tn.out[1] - 1, 0.012)); g.add(out);
  }

  // ---------- hole 2's bridge, over the hole ----------
  const br = hole.bridge;
  if (br) {
    const xm = P.x((br.x0 + br.x1) / 2), w = (br.x1 - br.x0) * S;
    const a = [P.z(br.yLow), P.y(br.hLow)], b = [P.z(br.yHigh), P.y(br.hHigh)];
    // (along its length from the high end to the low, tipped down that way; turned round if the hole is)
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), tilt = Math.atan2(b[1] - a[1], Math.abs(a[0] - b[0]));
    const deck = new Group(); deck.position.set(xm, (a[1] + b[1]) / 2, (a[0] + b[0]) / 2); deck.rotation.order = 'YXZ';
    deck.rotation.set(tilt, a[0] < b[0] ? Math.PI : 0, 0); g.add(deck);
    const plank = (ww, hh, dd, mt, x, y) => { const o = new Mesh(keep(new BoxGeometry(ww, hh, dd)), mt); o.position.set(x, y, 0); deck.add(o); };
    plank(w, 0.05, len, mat.wood, 0, -0.025);
    for (const s of [-1, 1]) { plank(0.05, 0.05, len, mat.wood, s * (w / 2 - 0.03), 0.22); plank(0.04, 0.04, len, mat.ink, s * (w / 2 - 0.03), 0.1); }
    for (let k = 0.1; k < 0.96; k += 0.12) {
      const v = br.yLow + (br.yHigh - br.yLow) * k, top = P.y(bridgeHeight(br, v));
      for (const s of [-1, 1]) box(0.05, top + 0.22, 0.05, mat.wood, [xm + s * (w / 2 - 0.03), (top + 0.22) / 2, P.z(v)]);
    }
  }

  // ---------- the tee: a mat, and a sign with the hole's name and par ----------
  const [tx, ty, tz] = P.at(...hole.tee);
  box(0.6, 0.02, 0.4, mat.mat, [tx, ty + 0.01, tz]);
  // (the sign stands on the backyard's grass beside the tee, off the green, its board above the tee)
  const out = hole.tee[0] < 50 ? -1 : 1;
  let su = hole.tee[0];
  while (edge(hole, su, hole.tee[1]) < 7 && Math.abs(su - hole.tee[0]) < 60) su += out;
  const sx = P.x(su), sz = P.z(hole.tee[1]), up = Math.max(1.05, ty + 0.55);
  box(0.05, up - 0.2, 0.05, mat.wood, [sx, (up - 0.2) / 2, sz]);
  const board = new Mesh(keep(new PlaneGeometry(1, 0.5)), psx(A.teeSign(hole, n), { unlit: 0.35, side: DoubleSide })); board.position.set(sx, up, sz); g.add(board);

  // ---------- the hole, its tentacles, and the ring they reach to ----------
  const [cx, cy, cz] = P.at(...hole.cup);
  const cup = new Mesh(keep(new CircleGeometry(0.17, 12)), mat.dark); cup.rotation.x = -Math.PI / 2; cup.position.set(cx, cy + 0.012, cz); g.add(cup);
  const tentMat = psx(null, { tint: 0xc04ad8 }), tipMat = psx(null, { tint: 0xff9af0 });
  const bead = [0.045, 0.04, 0.035, 0.03, 0.026, 0.022].map(r => keep(new SphereGeometry(r, 6, 4)));
  const tentacles = [...Array(6)].map(() => bead.map((geo, n) => { const o = new Mesh(geo, n > 3 ? tipMat : tentMat); g.add(o); return o; }));
  // (the ring: a ribbon on the ground, round the hole, as far as the tentacles reach)
  const ring = [], ringUv = [];
  for (let n = 0; n < 72; n++) {
    const pt = k => { const a = k / 72 * Math.PI * 2, u = hole.cup[0] + Math.cos(a) * hole.reach, v = hole.cup[1] + Math.sin(a) * hole.reach; return [u, v, a]; };
    const [u0, v0] = pt(n), [u1, v1] = pt(n + 1);
    if (n % 2) continue;   // (dashed)
    const r0 = (u, v, o) => { const s = (o * 0.03) / (hole.reach * S); const uu = hole.cup[0] + (u - hole.cup[0]) * (1 + s), vv = hole.cup[1] + (v - hole.cup[1]) * (1 + s); return [...P.at(uu, vv, 0.015), 0, 0]; };
    tri(ring, ringUv, r0(u0, v0, -1), r0(u1, v1, -1), r0(u1, v1, 1));
    tri(ring, ringUv, r0(u0, v0, -1), r0(u1, v1, 1), r0(u0, v0, 1));
  }
  const ringMat = psx(null, { tint: 0xff3fd0, unlit: 0.6, side: DoubleSide });
  const ringMesh = mesh(ring, ringUv, ringMat);

  // ---------- the pins ----------
  const pinGeo = { body: keep(new CylinderGeometry(0.05, 0.075, 0.2, 8)), head: keep(new SphereGeometry(0.05, 8, 6)), band: keep(new CylinderGeometry(0.058, 0.062, 0.035, 8)), ear: keep(new ConeGeometry(0.018, 0.04, 4)) };
  const pins = hole.pins.map(p => {
    const o = new Group();
    const part = (geo, mt, y, x = 0) => { const q = new Mesh(geo, mt); q.position.set(x, y, 0); o.add(q); };
    part(pinGeo.body, mat.white, 0.1); part(pinGeo.head, mat.white, 0.24); part(pinGeo.band, mat.red, 0.16);
    part(pinGeo.ear, mat.ink, 0.295, -0.025); part(pinGeo.ear, mat.ink, 0.295, 0.025);
    o.scale.setScalar(1.7);   // (chunky: easy to hit)
    o.position.set(...P.at(...p)); o.userData.home = o.position.clone(); g.add(o);
    return o;
  });

  // ---------- what moves ----------
  const movers = (hole.movers || []).map(mv => {
    if (mv.kind === 'gnome') {
      const o = new Group();
      const part = (geo, mt, y) => { const q = new Mesh(keep(geo), mt); q.position.y = y; o.add(q); };
      part(new CylinderGeometry(0.1, 0.13, 0.22, 8), psx(null, { tint: 0x2a6bff }), 0.11);
      part(new SphereGeometry(0.09, 8, 6), mat.white, 0.24);
      part(new SphereGeometry(0.06, 8, 6), psx(null, { tint: 0xffb8a0 }), 0.32);
      part(new ConeGeometry(0.08, 0.24, 8), psx(null, { tint: 0xe8202a }), 0.47);
      g.add(o); return { mv, o };
    }
    if (mv.kind === 'sprinkler') {
      const o = box(0.12, 0.12, 0.12, psx(null, { tint: 0x9aa0b8 }), P.at(mv.x, mv.y, 0.06));
      const drops = [...Array(10)].map((_, n) => { const q = new Mesh(keep(new SphereGeometry(0.025 + n * 0.002, 6, 4)), psx(null, { tint: n % 2 ? 0x8fe3ff : 0xd8f7ff, unlit: 0.6 })); g.add(q); return q; });
      return { mv, o, drops };
    }
    if (mv.kind === 'tail') {
      const geo = [...Array(18)].map((_, n) => keep(new SphereGeometry(0.06 + 0.035 * Math.sin(n / 17 * Math.PI), 6, 4)));
      const mats = [psx(null, { tint: 0x9a94a8 }), psx(null, { tint: 0xc8a070 }), psx(null, { tint: 0xf4ecff })];
      const bits = geo.map((gg, n) => { const q = new Mesh(gg, n > 15 ? mats[2] : mats[n % 3 === 0 ? 1 : 0]); g.add(q); return q; });
      return { mv, bits };
    }
    return { mv };
  });

  // ---------- the ball, the club, and the aim ----------
  const ball = new Mesh(keep(new SphereGeometry(R * S, 10, 8)), mat.white); g.add(ball);
  const club = new Mesh(keep(new PlaneGeometry(0.34, 0.17)), psx(A.club(hole.club), { side: DoubleSide })); club.visible = false; g.add(club);
  const dotGeo = keep(new PlaneGeometry(0.05, 0.05)), dotMat = psx(null, { tint: 0xffffff, unlit: 0.8, side: DoubleSide });
  const dots = [...Array(14)].map(() => { const q = new Mesh(dotGeo, dotMat); q.rotation.x = -Math.PI / 2; q.visible = false; g.add(q); return q; });
  // a ball flying back to the tee (grabbed), and a ball rising out of the tunnel: just the ball
  return { g, P, ball, club, dots, pins, tentacles, ringMat, ringMesh, movers, cup: [cx, cy, cz], tee: [tx, ty, tz] };
}

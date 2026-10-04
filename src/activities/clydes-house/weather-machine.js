// Clyde's Weather Machine: on the grass beside Clyde's house, a mint-green cabinet with far too much
// on top (a dish pointed at the sky, a spinning wind cup, a funnel that puffs out a cloud), a screen
// with the forecast, and four levers: rain, snow, a second sun, and cats. Pulling one changes the
// weather for everywhere out of doors; pulling it again clears the sky. The rules are in weather.js.
//
// The weather itself is the world's (its kit's `weather`: the clouds, the light, what falls,
// Sadie on the gatepost, and the save): the machine just says which, and shows it (its levers, its
// forecast, its wind cups). Only one soft jingle plays when you pull a lever (no drone or tick:
// RULEBOOK.md section 4).
//
// Built into the outside's scene with the house, so it stays when the room inside is put away.
import { Mesh, Group, Vector3, PlaneGeometry, ConeGeometry, CylinderGeometry, SphereGeometry, DoubleSide } from 'three';
import { OLD, KINDS, NAMES, pull as next, loaded } from './weather.js';
import { drawWeatherArt, KNOB } from './weather-art.js';
import { makeSounds } from './sounds/index.js';
import { soundsFor } from '../../shared/sound.js';

export function buildWeather(m, group) {
  const { T, psx, keep, kit, outside, lot, weather } = m;
  const A = drawWeatherArt(m);
  const { box, plane, cyl } = kit(group);
  const mesh = (geo, mat, pos, rot, parent = group) => { const o = new Mesh(keep(geo), mat); if (pos) o.position.set(...pos); if (rot) o.rotation.set(...rot); parent.add(o); return o; };
  const tint = (c, o = {}) => psx(null, { tint: c, ...o });

  // ---------- the machine, beside the house (on the side away from the path out of the gate) ----------
  // (on the side of the house away from the middle of the square, in the house's own terms: x across, z out from the door)
  const right = lot.at(1, 0)[0] > lot.at(0, 0)[0] ? 1 : -1, side = lot.x < 0 ? -right : right, MX = side * 6, MZ = -0.6, FRONT = MZ + 0.5;
  const enamel = (w, h) => psx(A.enamel, { rx: w / 0.8, ry: h / 0.8, unlit: 0.3 });
  const brass = tint(0xffd23a, { unlit: 0.3 }), iron = tint(0x221a44);
  box(2.8, 1.5, 1.0, enamel(2.8, 1.5), [MX, 0.75, MZ]);
  box(2.95, 0.12, 1.12, brass, [MX, 1.56, MZ]);
  box(1.7, 0.8, 0.8, enamel(1.7, 0.8), [MX, 2.02, MZ - 0.05]);
  plane(1.36, 0.32, psx(A.screen, { unlit: 0.9 }), [MX, 2.1, MZ + 0.37], null, 1);
  // the sign on top, on two brass posts
  for (const s of [-1, 1]) cyl(0.04, 0.04, 0.9, 4, brass, [MX + s * 1.0, 2.8, MZ - 0.2]);
  plane(2.3, 0.74, psx(A.title, { unlit: 0.5, side: DoubleSide }), [MX, 3.2, MZ - 0.17], null, 1);
  // the dish, turning slowly, on a mast at the back
  cyl(0.05, 0.05, 1.6, 4, iron, [MX + side * 0.9, 3.2, MZ - 0.35]);
  const dish = new Group(); dish.position.set(MX + side * 0.9, 4.05, MZ - 0.35); group.add(dish);
  mesh(new ConeGeometry(0.5, 0.25, 8, 1, true), psx(null, { tint: 0xe8f0ff, side: DoubleSide, unlit: 0.3 }), [0, 0.1, 0], [Math.PI + 0.6, 0, 0], dish);
  mesh(new ConeGeometry(0.03, 0.4, 4), brass, [0, 0.22, 0.12], [0.6, 0, 0], dish);
  // the wind cups, spinning (quietly) on the other side
  cyl(0.03, 0.03, 0.8, 4, iron, [MX - side * 1.15, 1.95, MZ]);
  const cups = new Group(); cups.position.set(MX - side * 1.15, 2.35, MZ); group.add(cups);
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI * 2 / 3;
    mesh(new PlaneGeometry(0.4, 0.03), iron, [Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2], [0, -a, 0], cups);
    mesh(new ConeGeometry(0.07, 0.12, 6), psx(null, { tint: 0xd97757, unlit: 0.3 }), [Math.cos(a) * 0.4, 0, Math.sin(a) * 0.4], [0, 0, Math.PI / 2], cups);
  }
  // the funnel the clouds come out of
  mesh(new ConeGeometry(0.3, 0.5, 8, 1, true), psx(null, { tint: 0xc89018, side: DoubleSide, unlit: 0.3 }), [MX + side * 1.1, 1.95, MZ + 0.2], [Math.PI, 0, 0]);
  const puff = mesh(new PlaneGeometry(0.8, 0.6), psx(A.puff, { unlit: 0.8 }), [MX, -9, MZ]);
  // the note by it, on a stake
  const post = psx(T.wood, { tint: 0xffe0c0 });
  box(0.08, 1.2, 0.08, post, [MX - side * 1.9, 0.6, FRONT + 0.5]);
  plane(1.1, 0.52, psx(A.note, { unlit: 0.5, side: DoubleSide }), [MX - side * 1.9, 1.2, FRONT + 0.55], null, 1);
  // stepping stones from the lane
  plane(1.1, 5.6 - FRONT, psx(T.path, { rx: 1, ry: 4, onFloor: true }), [MX, 0, (FRONT + 5.6) / 2], [-Math.PI / 2, 0, 0], 4).renderOrder = -1;
  lot.block(MX - 1.45, MX + 1.45, MZ - 0.55, FRONT + 0.05);
  lot.blockRound(MX - side * 1.9, FRONT + 0.5, 0.1);

  // the levers: a knob on a stick, up when off, pulled down towards you when on (each turns round
  // its pivot, in a group of its own), with a plate under it saying what it does
  const levers = {};
  const stickGeo = keep(new CylinderGeometry(0.03, 0.03, 0.5, 4).translate(0, 0.25, 0)), knobGeo = keep(new SphereGeometry(0.08, 8, 6));
  KINDS.forEach((k, i) => {
    const x = MX + (i - 1.5) * 0.62;
    plane(0.5, 0.31, psx(A.plate[k], { unlit: 0.5 }), [x, 0.52, FRONT + 0.04], null, 1);
    box(0.12, 0.34, 0.06, iron, [x, 1.05, FRONT + 0.02]);
    const g = new Group(); g.position.set(x, 1.05, FRONT + 0.05); group.add(g);
    g.add(new Mesh(stickGeo, iron));
    const knob = new Mesh(knobGeo, psx(null, { tint: KNOB[k], unlit: 0.35 })); knob.position.y = 0.5; g.add(knob);
    levers[k] = { g, x, at: 0 };
  });

  // ---------- how it's going ----------
  // (the weather used to be saved here, before it was the world's: brought in once, then let go)
  const old = loaded(m.saves.get(OLD, null));
  if (old) { weather.set(old, { snap: true }); m.saves.remove(OLD); }
  let shown = null, sounds = null, puffT = 9, wind = 0;

  const uses = KINDS.map(k => ({ pos: (([x, z]) => new Vector3(x, 1.3, z))(lot.at(levers[k].x, FRONT + 0.1)), reach: 2.4, label: '', button: 'PULL', kind: k, act: () => pull(k) }));
  // (the labels and the forecast follow the weather, whoever changed it)
  function show() {
    shown = weather.now();
    for (const u of uses) u.label = shown === u.kind ? `PUT THE ${NAMES[u.kind]} LEVER BACK UP` : `PULL THE ${NAMES[u.kind]} LEVER`;
    A.forecast(shown);
  }
  show();
  outside.use(...uses);

  function pull(k) {
    const now = weather.set(next(weather.now(), k));
    show();
    puffT = 0;
    // (its own handle: the machine stays outside when the room's put away)
    try { sounds ||= makeSounds(soundsFor('house:weather-machine'), 0.4); sounds.wake(); } catch {}
    sounds?.clunk(); sounds?.[now + 'In']();
    return now;
  }

  function update(t, dt) {
    const now = weather.now();
    if (now !== shown) show();
    // the machine: its levers, the dish and the cups (faster in bad weather), the puff
    for (const k of KINDS) { const L = levers[k]; L.at += ((k === now ? 1 : 0) - L.at) * Math.min(1, dt * 12); L.g.rotation.x = 0.25 + L.at * 1.9; }
    dish.rotation.y = t * 0.3;
    wind += ((now === 'rain' ? 3 : now === 'snow' ? 1 : 0) - wind) * Math.min(1, dt / 3);
    cups.rotation.y += dt * (1.5 + wind);
    puffT += dt;
    puff.position.set(MX + side * 1.1, puffT < 2.5 ? 2.3 + puffT * 1.2 : -9, MZ + 0.2);
    puff.scale.setScalar(0.6 + puffT * 0.8); puff.material.uniforms.uFade.value = Math.max(0, puffT / 2.5 - 0.3);
  }

  // for the checks (tests/clydes-house/browser.mjs)
  m.checks('__weather', {
    state: () => ({
      now: weather.now(), levers: Object.fromEntries(KINDS.map(k => [k, +levers[k].at.toFixed(2)])),
      sounds: sounds ? sounds.log.slice() : [], labels: uses.map(u => u.label),
    }),
    pull,
    // (on the outside, not in the house's own terms; `out`: the way its front faces)
    machine: { x: lot.at(MX, FRONT)[0], z: lot.at(MX, FRONT)[1], out: [lot.at(0, 1)[0] - lot.at(0, 0)[0], lot.at(0, 1)[1] - lot.at(0, 0)[1]], levers: Object.fromEntries(KINDS.map(k => [k, lot.at(levers[k].x, FRONT)[0]])) },
  });
  return { update, pull, uses };
}

// Clyde's Weather Machine: on the grass beside Clyde's house, a mint-green cabinet with far too much
// on top (a dish pointed at the sky, a spinning wind cup, a funnel that puffs out a cloud), a screen
// with the forecast, and four levers: rain, snow, a second sun, and cats. Pulling one changes the
// weather for the whole of outside (the garden, the lane, and what you see of them through a door);
// pulling it again clears the sky. The rules are in weather.js.
//
// The weather: cloud cover rolls over the sky (and hides the sun), the sunlight dims or brightens,
// and rain, snow or cats come down around wherever you are. Snow settles on the ground bit by bit.
// Cats fall tumbling, right themselves (they always land on their feet), sit a moment and are gone.
// Sadie on the gatepost reacts: an umbrella, a heap of snow on her head, sunglasses, and a word.
// Only one soft jingle plays when it changes, and nothing while it rains or snows (the owner can't
// stand droning or repetitive noise).
//
// Built into the outside's scene with the house, so it stays when the room inside is put away, and
// it's the same after a reload (the weather is saved).
import { Mesh, Group, Color, Vector3, BufferGeometry, BufferAttribute, PlaneGeometry, ConeGeometry, CylinderGeometry, SphereGeometry, DoubleSide } from 'three';
import { KEY, KINDS, NAMES, LOOK, SADIE, pull as next, loaded } from './weather.js';
import { drawWeatherArt, KNOB } from './weather-art.js';
import { makeSounds } from './sounds/index.js';
import { store } from '../../shared/storage.js';

const EASE = 1 / 3;          // the weather takes about three seconds to change
const SNOW_SETTLES = 40;     // seconds for the snow to lie (it melts in a quarter of that)
const RAIN = 520, SNOW = 380, CATS = 12;
const FIELD = 30, TOP = 16;  // what falls, falls in a box this wide and tall round you

export function buildWeather(m, group) {
  const { T, psx, keep, kit, outside, lot } = m;
  const A = drawWeatherArt(m);
  const { box, plane, cyl } = kit(group);
  const mesh = (geo, mat, pos, rot, parent = group) => { const o = new Mesh(keep(geo), mat); if (pos) o.position.set(...pos); if (rot) o.rotation.set(...rot); parent.add(o); return o; };
  const tint = (c, o = {}) => psx(null, { tint: c, ...o });

  // ---------- the machine, beside the house (on the side away from the path out of the gate) ----------
  const side = lot.x < 0 ? -1 : 1, MX = lot.x + side * 6, MZ = lot.z - 0.6, FRONT = MZ + 0.5;
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
  plane(1.1, lot.z + 5.6 - FRONT, psx(T.path, { rx: 1, ry: 4, onFloor: true }), [MX, 0, (FRONT + lot.z + 5.6) / 2], [-Math.PI / 2, 0, 0], 4).renderOrder = -1;
  outside.block(MX - 1.45, MX + 1.45, MZ - 0.55, FRONT + 0.05);
  outside.blockRound(MX - side * 1.9, FRONT + 0.5, 0.1);

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

  // ---------- the weather ----------
  // (all of it is out in the open, not in the house's group: it doesn't go when the house is far off)
  const sky = outside.scene;
  // (a dome of cloud, just inside the sun and just outside the hills, so it hides the sun and its
  // edge is behind the hills; the little clouds are nearer, so they drift about under it)
  const cover = new Mesh(keep(new SphereGeometry(130, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2 - 0.05)), psx(A.cover, { unlit: 1, rx: 28, ry: 5, side: DoubleSide, fade: 1 }));
  sky.add(cover);
  const coverTint = cover.material.uniforms.tint.value;
  const sun2 = new Mesh(keep(new PlaneGeometry(12, 12)), psx(T.sun, { unlit: 1 }));
  const SUN2 = { x: -82, z: 99 };   // (it comes up over the hills just left of the first, clear of the mansion)
  sun2.rotation.y = Math.atan2(SUN2.x, SUN2.z) + Math.PI; sky.add(sun2);
  const lying = new Mesh(keep(new PlaneGeometry(260, 260, 24, 24)), psx(A.snow, { rx: 130, ry: 130, onFloor: true, unlit: 0.3, fade: 1 }));
  lying.rotation.x = -Math.PI / 2; lying.renderOrder = -0.5; sky.add(lying);
  const rain = falling(RAIN, 0.035, 0.75, 0xa8d8ff, 0.35), snow = falling(SNOW, 0.11, 0.11, 0xffffff, 0);
  for (const d of rain.drops) d.v = 13 + d.r * 4;
  for (const d of snow.drops) d.v = 0.9 + d.r * 0.7;

  // the cats: a few at a time, tumbling down, landing on their feet
  const catGeo = keep(new PlaneGeometry(0.55, 0.48).translate(0, 0.24, 0));
  const catMats = A.cats.map(c => ({ sit: psx(c.sit, { unlit: 0.4 }), fall: psx(c.fall, { unlit: 0.4 }) }));
  const cats = Array.from({ length: CATS }, (_, i) => {
    const o = new Mesh(catGeo, catMats[i % 3].fall); o.visible = false; sky.add(o); outside.faces.push(o);
    return { o, coat: i % 3, phase: 'idle', t: 0, spin: 0 };
  });

  // Sadie on the gatepost: what she wears and says (drawn in front of her, turning with her)
  const sadie = outside.sadie;
  const on = (t, w, h, x, y, z = 0.03) => { const o = new Mesh(keep(new PlaneGeometry(w, h)), psx(t, { unlit: 0.5 })); o.position.set(x, y, z); o.visible = false; sadie.add(o); return o; };
  const wear = { rain: on(A.umbrella, 0.8, 0.56, 0.12, 0.98), snow: on(A.heap, 0.36, 0.16, 0.18, 0.66), sun: on(A.shades, 0.3, 0.1, 0.19, 0.5, 0.04) };
  const says = {};
  for (const [k, t] of Object.entries(A.says)) says[k] = on(t, t.image.width * 0.03, 0.36, -0.22, 1.0, 0.05);

  // ---------- how it's going ----------
  let now = loaded(store.get(KEY)), sounds = null, speed = 1, clock = 0, saying = null, sayUntil = 0, meowAt = 0, puffT = 9;
  const amount = Object.fromEntries(KINDS.map(k => [k, k === now ? 1 : 0]));
  let settled = now === 'snow' ? 1 : 0, catT = 0;
  const lastClouds = new Color(LOOK[now].clouds ?? 0x5e5c80);
  A.forecast(now);

  const uses = KINDS.map(k => ({ pos: new Vector3(levers[k].x, 1.3, FRONT + 0.1), reach: 2.4, label: '', button: 'PULL', kind: k, act: () => pull(k) }));
  const labels = () => { for (const u of uses) u.label = now === u.kind ? `PUT THE ${NAMES[u.kind]} LEVER BACK UP` : `PULL THE ${NAMES[u.kind]} LEVER`; };
  labels();
  outside.uses.push(...uses);

  function pull(k) {
    now = next(now, k);
    store.set(KEY, now);
    labels(); A.forecast(now);
    puffT = 0;
    try { sounds ||= makeSounds(0.4); sounds.wake(); } catch {}
    sounds?.clunk(); sounds?.[now + 'In']();
    saying = null; meowAt = clock + 1.2 / speed;
    return now;
  }

  function update(t, dt, ears) {
    clock = t; dt *= speed;
    for (const k of KINDS) amount[k] += ((k === now ? 1 : 0) - amount[k]) * Math.min(1, dt * EASE * 3);
    // the sunlight, and the cloud cover (in the colour of the last weather that had clouds)
    outside.light.sun = LOOK.clear.sun + KINDS.reduce((s, k) => s + amount[k] * (LOOK[k].sun - LOOK.clear.sun), 0);
    if (LOOK[now].clouds != null) lastClouds.lerp(tmpColor.setHex(LOOK[now].clouds), Math.min(1, dt * 2));
    const clouds = KINDS.reduce((s, k) => s + (LOOK[k].clouds != null ? amount[k] : 0), 0);
    coverTint.copy(lastClouds);
    cover.material.uniforms.uFade.value = 1 - Math.min(1, clouds * 1.05);
    cover.visible = clouds > 0.01;
    // the second sun rises over the hills
    const s2 = amount.sun;
    sun2.visible = s2 > 0.01; sun2.position.set(SUN2.x, 14 + s2 * 48, SUN2.z); sun2.scale.setScalar(1.3);
    // the snow on the ground: settles slowly, melts faster
    settled = now === 'snow' ? Math.min(1, settled + dt / SNOW_SETTLES) : Math.max(0, settled - dt * 4 / SNOW_SETTLES);
    lying.visible = settled > 0.01; lying.material.uniforms.uFade.value = 1 - settled * 0.75;
    // what falls, round you (or round the front garden, when you're looking out from inside)
    const c = ears && ears.place === outside ? ears : { x: 0, z: -12 };
    rain.fall(dt, c, amount.rain, t);
    snow.fall(dt, c, amount.snow, t, 0.5);
    catsFall(dt, c);
    // the machine: its levers, the dish and the cups, the puff
    for (const k of KINDS) { const L = levers[k]; L.at += ((k === now ? 1 : 0) - L.at) * Math.min(1, dt * 12); L.g.rotation.x = 0.25 + L.at * 1.9; }
    dish.rotation.y = t * 0.3;
    cups.rotation.y = t * (1.5 + amount.rain * 3 + amount.snow);
    puffT += dt;
    puff.position.set(MX + side * 1.1, puffT < 2.5 ? 2.3 + puffT * 1.2 : -9, MZ + 0.2);
    puff.scale.setScalar(0.6 + puffT * 0.8); puff.material.uniforms.uFade.value = Math.max(0, puffT / 2.5 - 0.3);
    // Sadie: dressed for it, and a word (and a little sound) once it's here
    for (const [k, o] of Object.entries(wear)) o.visible = amount[k] > 0.5;
    if (meowAt && clock > meowAt) {
      meowAt = 0; saying = now; sayUntil = clock + 4 / speed;
      const near = ears && ears.place === outside && Math.hypot(ears.x - sadie.position.x, ears.z - sadie.position.z) < 30;
      if (near) (now === 'rain' ? sounds?.mew : sounds?.mrrp)?.();
    }
    if (saying && clock > sayUntil) saying = null;
    for (const [k, o] of Object.entries(says)) o.visible = saying === k;
  }

  // Rain or snow: `n` little crossed quads (w x h) in a box round you, falling, wrapped round as you
  // walk, their positions written straight into one mesh each frame (one draw for all of them)
  function falling(n, w, h, color, fade) {
    const pos = new Float32Array(n * 12 * 3), geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(pos, 3));
    geo.setAttribute('normal', new BufferAttribute(new Float32Array(n * 12 * 3).fill(0.5), 3));
    geo.setAttribute('uv', new BufferAttribute(new Float32Array(n * 12 * 2).fill(0.5), 2));
    keep(geo);
    const o = new Mesh(geo, psx(null, { tint: color, unlit: 1, fade, side: DoubleSide }));
    o.frustumCulled = false; o.visible = false; sky.add(o);
    let seed = 11;
    const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const drops = Array.from({ length: n }, () => ({ x: (r() - 0.5) * FIELD, y: r() * TOP, z: (r() - 0.5) * FIELD, r: r(), v: 1 }));
    const hw = w / 2, QUAD = [[-1, 0], [1, 0], [1, 1], [-1, 0], [1, 1], [-1, 1]];
    return {
      drops, mesh: o, count: 0,
      fall(dt, c, amt, t, sway = 0) {
        const count = Math.round(n * Math.min(1, amt * 1.2));
        this.count = count; o.visible = count > 0;
        if (!count) return;
        for (let i = 0; i < count; i++) {
          const d = drops[i];
          d.y -= d.v * dt;
          if (d.y < 0) d.y += TOP;
          if (sway) d.x += Math.sin(t * 1.3 + d.r * 20) * sway * dt;
          // (kept within the box round you)
          while (d.x - c.x > FIELD / 2) d.x -= FIELD; while (d.x - c.x < -FIELD / 2) d.x += FIELD;
          while (d.z - c.z > FIELD / 2) d.z -= FIELD; while (d.z - c.z < -FIELD / 2) d.z += FIELD;
          let j = i * 36;
          for (const across of [0, 1]) for (const [u, v] of QUAD) {
            pos[j++] = d.x + (across ? 0 : u * hw); pos[j++] = d.y + v * h; pos[j++] = d.z + (across ? u * hw : 0);
          }
        }
        geo.setDrawRange(0, count * 12);
        geo.attributes.position.needsUpdate = true;
      },
    };
  }

  function catsFall(dt, c) {
    catT += dt;
    const wanted = amount.cats > 0.6 && now === 'cats';
    if (wanted && catT > 0.7) {
      catT = 0;
      const k = cats.find(q => q.phase === 'idle');
      if (k) for (let tries = 0; tries < 6; tries++) {
        const a = Math.random() * Math.PI * 2, d = 2 + Math.random() * 11, x = c.x + Math.cos(a) * d, z = c.z + Math.sin(a) * d;
        if (outside.floor(x, z) === null) continue;
        k.phase = 'fall'; k.t = 0; k.spin = (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 2);
        k.o.position.set(x, 16 + Math.random() * 4, z); k.o.material = catMats[k.coat].fall; k.o.scale.setScalar(1); k.o.visible = true;
        break;
      }
    }
    for (const k of cats) {
      if (k.phase === 'idle') continue;
      k.t += dt;
      if (k.phase === 'fall') {
        k.o.position.y -= dt * 3.2;
        // tumbling, then righting itself for the landing
        const y = k.o.position.y;
        k.o.rotation.z = y > 2.5 ? Math.sin(k.t * k.spin) * 1.2 : k.o.rotation.z * Math.max(0, 1 - dt * 10);
        if (y <= 0) { k.o.position.y = 0; k.o.rotation.z = 0; k.phase = 'sit'; k.t = 0; k.o.material = catMats[k.coat].sit; }
      } else if (k.phase === 'sit' && k.t > 2.5) { k.phase = 'poof'; k.t = 0; }
      else if (k.phase === 'poof') {
        k.o.scale.setScalar(Math.max(0.01, 1 - k.t / 0.3));
        if (k.t > 0.3) { k.phase = 'idle'; k.o.visible = false; }
      }
    }
  }

  // for the checks (tests/clydes-house/browser.mjs)
  globalThis.__weather = {
    state: () => ({
      now, sun: +outside.light.sun.toFixed(2), clouds: +(1 - cover.material.uniforms.uFade.value).toFixed(2), sun2: sun2.visible, settled: +settled.toFixed(2),
      rain: rain.count, snow: snow.count, cats: cats.filter(k => k.phase !== 'idle').length, landed: cats.filter(k => k.phase === 'sit').length,
      wearing: Object.keys(wear).filter(k => wear[k].visible), saying, levers: Object.fromEntries(KINDS.map(k => [k, +levers[k].at.toFixed(2)])),
      sounds: sounds ? sounds.log.slice() : [], labels: uses.map(u => u.label),
    }),
    pull, speed(k) { speed = k; },
    machine: { x: MX, z: FRONT, levers: Object.fromEntries(KINDS.map(k => [k, levers[k].x])) },
  };
  return { update, pull, uses };
}

const tmpColor = new Color();

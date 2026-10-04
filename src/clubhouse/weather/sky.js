// The weather: the whole world's (not any one building's), over every place out of doors (the outside, and any room that's out
// in the open, like the hedge maze: a place with a `sky`). Whoever makes the weather (Clyde's
// Weather Machine, through its kit's `weather`) just says which; this does the rest, and saves it.
//
// When it changes, over about three seconds: cloud cover rolls over the sky (and hides the sun), the
// sunlight of every place out of doors dims or brightens, and rain, snow or cats come down round
// wherever out of doors is seen from (you, out there, or the door you're looking out of; nothing's
// worked out while nobody can see out). Snow settles on the ground bit by bit. Cats fall tumbling,
// right themselves (they always land on their feet), sit a moment and are gone. Sadie on the
// gatepost reacts: an umbrella, a heap of snow on her head, sunglasses, and a word (and a mew or
// mrrp if you're out there). The rules are in rules.js.
//
// A place out of doors says `sky`: `dome` (how far off the cloud cover is: inside its sun, outside
// its hills), `follow` (the cloud cover goes round you, for a sky that follows you), and `sun2`
// ({ x, z }: where a second sun comes up over its hills; none for a place with no sun).
import { Mesh, Color, BufferGeometry, BufferAttribute, PlaneGeometry, SphereGeometry, DoubleSide } from 'three';
import { psx, keep } from '../look.js';
import { KEY, KINDS, LOOK, loaded } from './rules.js';
import { drawWeatherArt } from './art.js';
import { ALL as VOICE, RATE } from './sounds.js';
import { soundsFor, wrap } from '../../shared/sound.js';
import { store } from '../../shared/storage.js';

const EASE = 1 / 3;          // the weather takes about three seconds to change
const SNOW_SETTLES = 40;     // seconds for the snow to lie (it melts in a quarter of that)
const RAIN = 520, SNOW = 380, CATS = 12;
const SEEN = 4;              // places out of doors seen at once, at most (you, and the doorways drawn: three)
const FIELD = 30, TOP = 16;  // what falls, falls in a box this wide and tall round you
const LIE = 260, TILE = 2;   // the snow on the ground: this wide, round where it's seen from (a tile at a time)

export function makeWeather(T, outside) {
  const A = drawWeatherArt();
  const cloudMat = psx(A.cover, { unlit: 1, rx: 28, ry: 5, side: DoubleSide, fade: 1 });
  const coverTint = cloudMat.uniforms.tint.value;
  const domeGeo = keep(new SphereGeometry(1, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2 - 0.05));
  const sunMat = psx(T.sun, { unlit: 1 }), sunGeo = keep(new PlaneGeometry(12, 12));
  const lyingMat = psx(A.snow, { rx: LIE / TILE, ry: LIE / TILE, onFloor: true, unlit: 0.3, fade: 1 });
  const lyingGeo = keep(new PlaneGeometry(LIE, LIE, 24, 24));
  // each place out of doors gets its own cloud cover, second sun and snow on the ground (made the
  // first time it's seen; their shapes and pictures are the weather's, shared), and its own sunlight
  const dressed = new WeakMap();
  function dress(place) {
    let d = dressed.get(place);
    if (d) return d;
    const sky = place.sky, scene = place.scene;
    const cover = new Mesh(domeGeo, cloudMat); cover.scale.setScalar(sky.dome); cover.visible = false; scene.add(cover);
    // (drawn straight after the sky, before anything else: a place's far-off pictures drawn on top of
    // everything, like the clubhouse hung over the maze's hedges, stay in front of it)
    cover.renderOrder = -2.5;
    let sun2 = null;
    if (sky.sun2) { sun2 = new Mesh(sunGeo, sunMat); sun2.rotation.y = Math.atan2(sky.sun2.x, sky.sun2.z) + Math.PI; sun2.visible = false; scene.add(sun2); }
    const lying = new Mesh(lyingGeo, lyingMat); lying.rotation.x = -Math.PI / 2; lying.renderOrder = -0.5; lying.visible = false; scene.add(lying);
    d = { cover, sun2, lying, scene, sun: place.light.sun };   // (`sun`: its own sunlight on a clear day)
    dressed.set(place, d);
    return d;
  }

  // what falls: a lot for each place out of doors being seen at once (the one you're in, and each
  // one through an open doorway), made up front and handed to whichever places are seen
  const catGeo = keep(new PlaneGeometry(0.55, 0.48).translate(0, 0.24, 0));
  const catMats = A.cats.map(c => ({ sit: psx(c.sit, { unlit: 0.4 }), fall: psx(c.fall, { unlit: 0.4 }) }));
  const lots = Array.from({ length: SEEN }, () => {
    const rain = falling(RAIN, 0.035, 0.75, 0xa8d8ff, 0.35), snow = falling(SNOW, 0.11, 0.11, 0xffffff, 0);
    for (const d of rain.drops) d.v = 13 + d.r * 4;
    for (const d of snow.drops) d.v = 0.9 + d.r * 0.7;
    const cats = Array.from({ length: CATS }, (_, i) => {
      const o = new Mesh(catGeo, catMats[i % 3].fall); o.visible = false;
      return { o, coat: i % 3, phase: 'idle', t: 0, spin: 0, ground: 0 };
    });
    return { rain, snow, cats, place: null, catT: 0 };
  });

  // Sadie on the gatepost: what she wears and says (drawn in front of her, turning with her)
  const sadie = outside.sadie;
  const on = (t, w, h, x, y, z = 0.03) => { const o = new Mesh(keep(new PlaneGeometry(w, h)), psx(t, { unlit: 0.5 })); o.position.set(x, y, z); o.visible = false; sadie.add(o); return o; };
  const wear = { rain: on(A.umbrella, 0.8, 0.56, 0.12, 0.98), snow: on(A.heap, 0.36, 0.16, 0.18, 0.66), sun: on(A.shades, 0.3, 0.1, 0.19, 0.5, 0.04) };
  const says = {};
  for (const [k, t] of Object.entries(A.says)) says[k] = on(t, t.image.width * 0.03, 0.36, -0.22, 1.0, 0.05);
  // (when she turns to face the other way, as she does to watch the town square's birds, what she wears turns with her and what she says moves to the side behind her: town/birds.js)
  for (const o of Object.values(wear)) o.userData.flips = true;
  for (const o of Object.values(says)) o.userData.slides = true;

  // ---------- how it's going ----------
  let now = loaded(store.get(KEY, 'clear')), speed = 1, clock = 0, saying = null, sayUntil = 0, meowAt = 0, sounds = null, sun = LOOK[now].sun, clouds = 0;
  const amount = Object.fromEntries(KINDS.map(k => [k, k === now ? 1 : 0]));
  let settled = now === 'snow' ? 1 : 0, seenNames = [];
  const lastClouds = new Color(LOOK[now].clouds ?? 0x5e5c80);

  // a new weather (`snap`: there at once, not coming over: an old save brought in)
  function set(kind, { snap = false } = {}) {
    const k = loaded(kind);
    if (k === now) return now;
    now = k; store.set(KEY, now);
    if (snap) { for (const q of KINDS) amount[q] = q === now ? 1 : 0; settled = now === 'snow' ? 1 : 0; if (LOOK[now].clouds != null) lastClouds.setHex(LOOK[now].clouds); }
    else { saying = null; meowAt = clock + 1.2 / speed; }
    return now;
  }

  // Every frame, before the places update: `places`, every place there is now; `seen`, each place
  // out of doors that can be seen and where from ([{ place, x, z }]: you, or the doorway you're
  // looking through; nearest first); `ears`, where you are.
  function update(t, dt, places, seen, ears) {
    clock = t; dt *= speed;
    for (const k of KINDS) amount[k] += ((k === now ? 1 : 0) - amount[k]) * Math.min(1, dt * EASE * 3);
    // the sunlight (clear is 0.5), and the cloud cover (in the colour of the last weather that had clouds)
    sun = LOOK.clear.sun + KINDS.reduce((s, k) => s + amount[k] * (LOOK[k].sun - LOOK.clear.sun), 0);
    if (LOOK[now].clouds != null) lastClouds.lerp(tmpColor.setHex(LOOK[now].clouds), Math.min(1, dt * 2));
    clouds = Math.min(1, KINDS.reduce((s, k) => s + (LOOK[k].clouds != null ? amount[k] : 0), 0) * 1.05);
    coverTint.copy(lastClouds);
    cloudMat.uniforms.uFade.value = 1 - clouds;
    settled = now === 'snow' ? Math.min(1, settled + dt / SNOW_SETTLES) : Math.max(0, settled - dt * 4 / SNOW_SETTLES);
    lyingMat.uniforms.uFade.value = 1 - settled * 0.75;
    const s2 = amount.sun;
    for (const p of places) {
      if (!p.sky) continue;
      const d = dress(p);
      p.light.sun = d.sun * sun / LOOK.clear.sun;
      const at = seen.find(q => q.place === p);
      d.cover.visible = clouds > 0.01;
      if (p.sky.follow && at) d.cover.position.set(at.x, 0, at.z);
      if (d.sun2) { d.sun2.visible = s2 > 0.01; d.sun2.position.set(p.sky.sun2.x, 14 + s2 * 48, p.sky.sun2.z); d.sun2.scale.setScalar(1.3); }
      d.lying.visible = settled > 0.01;
      if (at) d.lying.position.set(Math.round(at.x / TILE) * TILE, 0, Math.round(at.z / TILE) * TILE);
    }
    // what falls, round where each place out of doors is seen from. Nothing's worked out in a place
    // nobody can see.
    const looking = seen.slice(0, SEEN);
    for (const lot of lots) if (lot.place && !looking.some(q => q.place === lot.place)) { lot.place = null; for (const k of lot.cats) { k.phase = 'idle'; k.o.visible = false; } }
    for (const q of looking) {
      let lot = lots.find(l => l.place === q.place);
      if (!lot) { lot = lots.find(l => !l.place); lot.place = q.place; for (const o of [lot.rain.mesh, lot.snow.mesh, ...lot.cats.map(k => k.o)]) q.place.scene.add(o); }
      lot.rain.fall(dt, q, amount.rain, t);
      lot.snow.fall(dt, q, amount.snow, t, 0.5);
      catsFall(lot, dt, q, ears);
    }
    for (const lot of lots) if (!lot.place) { lot.rain.fall(dt, null, 0, t); lot.snow.fall(dt, null, 0, t); }
    seenNames = looking.map(q => q.place.name);
    // Sadie: dressed for it, and a word (and a little sound) once it's here
    for (const [k, o] of Object.entries(wear)) o.visible = amount[k] > 0.5;
    if (meowAt && clock > meowAt) {
      meowAt = 0; saying = now; sayUntil = clock + 4 / speed;
      // (heard only out there, fading with how far off she is)
      if (ears?.place === outside) {
        try { sounds ||= voice(); (now === 'rain' ? sounds.mew : sounds.mrrp)({ dist: Math.hypot(ears.x - sadie.position.x, ears.z - sadie.position.z), near: 8, far: 30 }); } catch (e) { console.warn('the gatepost Sadie couldn\'t make her sound:', e); }
      }
    }
    if (saying && clock > sayUntil) saying = null;
    for (const [k, o] of Object.entries(says)) o.visible = saying === k;
  }
  function voice() {
    const h = soundsFor('outside');   // (a handle can't be added to: wrap it, with her sounds by name on top)
    return wrap(h, Object.fromEntries(Object.entries(VOICE).map(([k, make]) => [k, (o = {}) => h.play(k, make, { loud: 0.4, rate: RATE, hold: 4, gap: 0.1, bus: 'voices', ...o })])));
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
    o.frustumCulled = false; o.visible = false;
    let seed = 11;
    const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const drops = Array.from({ length: n }, () => ({ x: (r() - 0.5) * FIELD, y: r() * TOP, z: (r() - 0.5) * FIELD, r: r(), v: 1 }));
    const hw = w / 2, QUAD = [-1, 0, 1, 0, 1, 1, -1, 0, 1, 1, -1, 1];
    return {
      drops, mesh: o, count: 0,
      fall(dt, c, amt, t, sway = 0) {
        const count = c ? Math.round(n * Math.min(1, amt * 1.2)) : 0;
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
          for (let q = 0; q < 12; q++) {   // (two quads crossed: along x, then along z)
            const u = QUAD[q % 6 * 2], v = QUAD[q % 6 * 2 + 1], across = q >= 6;
            pos[j++] = d.x + (across ? 0 : u * hw); pos[j++] = d.y + v * h; pos[j++] = d.z + (across ? u * hw : 0);
          }
        }
        geo.setDrawRange(0, count * 12);
        geo.attributes.position.needsUpdate = true;
      },
    };
  }

  function catsFall(lot, dt, c, ears) {
    const cats = lot.cats;
    lot.catT += dt;
    const wanted = amount.cats > 0.6 && now === 'cats';
    if (wanted && lot.catT > 0.7) {
      lot.catT = 0;
      const k = cats.find(q => q.phase === 'idle');
      if (k) for (let tries = 0; tries < 6; tries++) {
        const a = Math.random() * Math.PI * 2, d = 2 + Math.random() * 11, x = c.x + Math.cos(a) * d, z = c.z + Math.sin(a) * d;
        const g = c.place.floor(x, z, 0);
        if (g === null || g === undefined) continue;
        k.phase = 'fall'; k.t = 0; k.ground = g; k.spin = (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 2);
        k.o.position.set(x, g + 16 + Math.random() * 4, z); k.o.material = catMats[k.coat].fall; k.o.scale.setScalar(1); k.o.visible = true;
        break;
      }
    }
    // (each turns to face whoever's watching: you, or the doorway you're looking out of)
    const eye = ears?.place === c.place ? ears : c;
    for (const k of cats) {
      if (k.phase === 'idle') continue;
      k.t += dt;
      k.o.rotation.y = Math.atan2(eye.x - k.o.position.x, eye.z - k.o.position.z);
      if (k.phase === 'fall') {
        k.o.position.y -= dt * 3.2;
        // tumbling, then righting itself for the landing
        const y = k.o.position.y - k.ground;
        k.o.rotation.z = y > 2.5 ? Math.sin(k.t * k.spin) * 1.2 : k.o.rotation.z * Math.max(0, 1 - dt * 10);
        if (y <= 0) { k.o.position.y = k.ground; k.o.rotation.z = 0; k.phase = 'sit'; k.t = 0; k.o.material = catMats[k.coat].sit; }
      } else if (k.phase === 'sit' && k.t > 2.5) { k.phase = 'poof'; k.t = 0; }
      else if (k.phase === 'poof') {
        k.o.scale.setScalar(Math.max(0.01, 1 - k.t / 0.3));
        if (k.t > 0.3) { k.phase = 'idle'; k.o.visible = false; }
      }
    }
  }

  return {
    now: () => now, set, update,
    // what the kit hands a room: what the weather is, and a way to change it
    kit: { now: () => now, set: (kind, o) => set(kind, o), kinds: KINDS },
    // for the checks: how it's going
    state: () => ({
      now, sun: +sun.toFixed(2), clouds: +clouds.toFixed(2), sun2: amount.sun > 0.01, settled: +settled.toFixed(2),
      // (what falls, in the place seen first: the one you're in, or the nearest doorway's)
      ...falls(lots.find(l => l.place?.name === seenNames[0])),
      // and in each place seen
      each: Object.fromEntries(lots.filter(l => l.place).map(l => [l.place.name, falls(l)])),
      wearing: Object.keys(wear).filter(k => wear[k].visible), saying, seen: seenNames[0] ?? null, seenAll: seenNames.slice(),
      sounds: sounds ? sounds.log.slice() : [],
    }),
    speed(k) { speed = k; },
  };
}
const falls = l => ({ rain: l?.rain.count ?? 0, snow: l?.snow.count ?? 0, cats: l ? l.cats.filter(k => k.phase !== 'idle').length : 0, landed: l ? l.cats.filter(k => k.phase === 'sit').length : 0 });

const tmpColor = new Color();

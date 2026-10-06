// The tornado, far off in the sky of every place out of doors (the weather's, like the clouds: it
// shows wherever a place has a `sky`). A tall funnel standing on the far ground, wandering slowly
// all round the edge of the sky under the cloud cover (a lap every few minutes), bits of leaf,
// paper and plank circling it, and Sadie riding a tuna round and round it, bobbing up and down.
// It's only a picture in the distance: nothing to reach, and no sound of its own (a wind like that would drone: RULEBOOK.md section 4).
//
// A place's `sky.twister` ({ x, z }) says where in the sky it starts; it wanders from there, round
// the edge of the sky, behind the hills (or round you, for a sky that `follow`s you, like the cloud cover).
import { Mesh, Group, CylinderGeometry, PlaneGeometry, DoubleSide } from 'three';
import { psx, keep } from '../look.js';

const RINGS = 8;      // the funnel is this many rings stacked up, each a little off the one below
// (it all fits inside the cloud dome, which is a half-ball of radius `dome`: at FAR of the way out the
// dome is 0.53 `dome` high, the funnel 0.3, and Sadie's loop and the bits fit under it too)
const FAR = 0.85;
const RIDER = 80 / 54;   // (the rider picture's shape: Sadie on her tuna)
const BITS = 26;      // leaves, papers and planks circling it
const SHAPE = (dome) => ({ h: dome * 0.3, top: dome * 0.05, bottom: dome * 0.006 });

export function makeTwister(A) {
  const funnelMat = psx(A.funnel, { tint: 0xc8d4cc, unlit: 1, side: DoubleSide, rx: 6, ry: 1 });
  const bitMats = A.bits.map(b => psx(b, { unlit: 0.8, side: DoubleSide }));
  const riderMat = psx(A.rider, { unlit: 0.9, side: DoubleSide });
  const bitGeo = keep(new PlaneGeometry(1, 1)), riderGeo = keep(new PlaneGeometry(RIDER, 1));
  const ringGeos = new Map();   // (one set of rings for each size of sky)
  const rings = dome => {
    if (!ringGeos.has(dome)) {
      const s = SHAPE(dome), at = k => s.bottom + (s.top - s.bottom) * Math.pow(k, 1.6);
      ringGeos.set(dome, Array.from({ length: RINGS }, (_, i) => keep(new CylinderGeometry(at((i + 1) / RINGS), at(i / RINGS), s.h / RINGS * 1.05, 12, 1, true).translate(0, s.h / RINGS * (i + 0.5), 0))));
    }
    return ringGeos.get(dome);
  };

  // what a place out of doors gets (made the first time it's seen)
  function dress(place) {
    const sky = place.sky, s = SHAPE(sky.dome), root = new Group(), body = new Group();
    root.visible = false; root.scale.setScalar(0.01); root.add(body);
    const ring = rings(sky.dome).map(g => { const m = new Mesh(g, funnelMat); body.add(m); return m; });
    const bits = Array.from({ length: BITS }, (_, i) => {
      const m = new Mesh(bitGeo, bitMats[i % bitMats.length]); const k = (i * 0.618) % 1;
      m.scale.setScalar(s.h * (0.014 + 0.012 * ((i * 7) % 5) / 4)); body.add(m);
      return { m, k, a: i * 2.4, sp: 0.5 + ((i * 3) % 7) / 7 * 0.6 };
    });
    const rider = new Mesh(riderGeo, riderMat); rider.scale.setScalar(s.h * 0.26); body.add(rider);
    root.renderOrder = -2.4; for (const o of [...ring, ...bits.map(b => b.m), rider]) o.renderOrder = -2.4;
    place.scene.add(root);
    return { root, body, ring, bits, rider, s, a0: sky.twister ? Math.atan2(sky.twister.z, sky.twister.x) : 1, last: { x: 0, z: 0 } };
  }

  // each frame: `amt` (0 to 1: how much tornado), `at` where the place is seen from (or null)
  function update(d, place, t, amt, at) {
    const on = amt > 0.01;
    d.root.visible = on;
    if (!on) return;
    const sky = place.sky, s = d.s;
    if (at) d.last = at;
    const eye = d.last;
    // where it stands: right out at the edge of the sky, behind the hills and under the cloud
    // cover, wandering slowly all the way round from where the place says it starts (never over
    // the town: only its top shows above the hills)
    const ox = sky.follow ? eye.x : 0, oz = sky.follow ? eye.z : 0;
    const lap = d.a0 + t * 0.015 + Math.sin(t * 0.11) * 0.2, far = sky.dome * FAR;
    const x = ox + Math.cos(lap) * far, z = oz + Math.sin(lap) * far;
    d.root.position.set(x, 0, z);
    d.root.scale.setScalar(Math.max(0.01, amt));
    // the funnel: each ring turning, and leaning a little off the ring below
    d.ring.forEach((m, i) => { m.rotation.y = t * (1.2 + i * 0.1); m.position.x = Math.sin(t * 0.7 + i * 0.6) * i * s.h * 0.006; m.position.z = Math.cos(t * 0.5 + i * 0.5) * i * s.h * 0.004; });
    const wide = k => s.bottom + (s.top - s.bottom) * Math.pow(k, 1.6);
    // the bits circling it, at their own heights and speeds, turned to show their faces
    for (const b of d.bits) {
      const y = ((b.k + t * 0.02 * b.sp) % 1), r = wide(y) * 1.15, a = b.a + t * (1.4 * b.sp + 0.4);
      b.m.position.set(Math.cos(a) * r, y * s.h, Math.sin(a) * r);
      b.m.rotation.set(t * b.sp * 2, a, t * b.sp * 1.5);
    }
    // Sadie on her tuna: round and round, up and down, always facing the way she's going
    const k = 0.45 + 0.3 * Math.sin(t * 0.25), a = t * 0.9, r = wide(k) * 1.2;
    const px = Math.cos(a) * r, pz = Math.sin(a) * r;
    d.rider.position.set(px, k * s.h + Math.sin(t * 2.2) * s.h * 0.015, pz);
    // (billboard: face whoever's looking; flipped when she's going to the left from where they stand)
    const wx = d.root.position.x + px, wz = d.root.position.z + pz;
    const face = Math.atan2(eye.x - wx, eye.z - wz);
    d.rider.rotation.set(0, face, Math.sin(t * 2.2) * 0.12);
    const vx = -Math.sin(a), vz = Math.cos(a);                           // (which way she's going)
    const right = Math.cos(face) * vx - Math.sin(face) * vz;             // (...across what they see)
    d.rider.scale.x = Math.abs(d.rider.scale.x) * (right >= 0 ? 1 : -1);
  }

  return { dress, update };
}

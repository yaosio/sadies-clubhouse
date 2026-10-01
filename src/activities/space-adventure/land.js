// The planet's land, where you come down: a beach by the sea, green hills, and tall snowy mountains
// in the distance, under a purple-to-pink sky with a ringed planet and a little moon in it, and big
// flat 90s clouds you come down through. All of it in its own metres (trip.js's heightAt: the beach
// you land on is at 0, 0); the room moves the whole land round the cockpit as you come in (`place`).
import { Group, Mesh, PlaneGeometry, SphereGeometry, BufferGeometry, Float32BufferAttribute, BackSide, DoubleSide, Matrix4, Vector3, Color } from 'three';
import { LAND, heightAt, shore, EYE, SEAT } from './trip.js';

export function buildLand(m, P) {
  const { psx, keep } = m;
  const land = new Group(); land.matrixAutoUpdate = false;   // (placed by `place`, every frame)
  const add = (mesh, pos, rot) => { if (pos) mesh.position.set(...pos); if (rot) mesh.rotation.set(...rot); land.add(mesh); return mesh; };

  // the sky: a dome that goes where you go, drawn behind everything
  const sky = add(new Mesh(keep(new SphereGeometry(1500, 16, 12)), psx(P.sky, { unlit: 1, side: BackSide })));
  sky.material.depthTest = false; sky.material.depthWrite = false; sky.renderOrder = -30;
  const skyThing = (pic, w, h, x, y, z) => {
    const s = add(new Mesh(keep(new PlaneGeometry(w, h)), psx(pic, { unlit: 1 })), [x, y, z]);
    s.material.depthTest = false; s.material.depthWrite = false; s.renderOrder = -29; s.lookAt(0, 0, 0); return s;
  };
  const skyThings = [skyThing(P.ringed, 360, 180, 500, 620, 1100), skyThing(P.moon, 60, 60, -420, 380, 1200)];

  // the ground: one big grid, coloured by height (the texture's height is the land's)
  const { x0, x1, z0, z1, nx, nz } = LAND, pos = [], uv = [], idx = [];
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const x = x0 + (x1 - x0) * i / nx, z = z0 + (z1 - z0) * j / nz, h = heightAt(x, z);
    pos.push(x, h, z); uv.push(x / 60, Math.min(0.99, Math.max(0.01, 1 - Math.sqrt(Math.max(0, h - 0.6) / 420))));
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = keep(new BufferGeometry());
  g.setAttribute('position', new Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  add(new Mesh(g, psx(P.ground, { unlit: 0.15 })));
  // the sea, and a line of foam along the beach near where you land
  const water = add(new Mesh(keep(new PlaneGeometry(6000, 6000, 30, 30)), psx(P.water, { rx: 900, ry: 900, unlit: 0.35 })), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  const foam = [];
  for (let z = -120; z <= 300; z += 8) {
    const f = add(new Mesh(keep(new PlaneGeometry(8.4, 1.2)), psx(P.foam, { rx: 1, unlit: 0.5 })), [shore(z) + 0.3, 0.05, z], [-Math.PI / 2, 0, Math.atan(0.04)]);
    foam.push([f, z]);
  }

  // things on the beach: alien plants, shrubs and rocks, facing the spot you land on
  let s = 5; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const thing = (pic, w, h, x, z) => {
    const mesh = add(new Mesh(keep(new PlaneGeometry(w, h).translate(0, h / 2, 0)), psx(pic, { side: DoubleSide, unlit: 0.2 })), [x, heightAt(x, z) - 0.1, z]);
    mesh.rotation.y = Math.atan2(-x, -z); return mesh;
  };
  for (let i = 0; i < 70; i++) {
    const z = -60 + r() * 360, x = shore(z) - 8 - r() * 120;
    if (Math.hypot(x, z) < 14) continue;   // (nothing right under the ship)
    const k = r();
    if (k < 0.45) thing(P.plant, 3 + r() * 2.5, 6 + r() * 5, x, z); else if (k < 0.75) thing(P.shrub, 3 + r() * 2, 2.2, x, z); else thing(P.rock, 2 + r() * 3, 1.5 + r(), x, z);
  }
  // three close by, so there's something next to you when you land
  thing(P.plant, 3.2, 6.5, -9, 16); thing(P.rock, 2.5, 1.8, 3, 11); thing(P.shrub, 3, 2, -6, 9);

  // clouds: a layer of them you come down through, and some high over the land. Drawn facing you
  // wherever they are (placed each frame, see `place`), so they're kept in their own group.
  const clouds = new Group(), cloudAt = [];
  const cloudMat = psx(P.cloud, { unlit: 1 });
  const cloud = (x, y, z, w) => { const c = new Mesh(keep(new PlaneGeometry(w, w / 2)), cloudMat); clouds.add(c); cloudAt.push([c, new Vector3(x, y, z)]); };
  for (let i = 0; i < 40; i++) cloud(-500 + r() * 1000, 190 + r() * 120, -1000 + r() * 1000, 70 + r() * 70);
  for (const [x, y, z, w] of [[-12, 262, -660, 60], [25, 255, -620, 70], [-30, 245, -560, 80], [8, 236, -520, 60], [-6, 225, -470, 90]]) cloud(x, y, z, w);   // (right in your path)
  for (let i = 0; i < 18; i++) cloud(-700 + r() * 1300, 220 + r() * 160, 300 + r() * 900, 120 + r() * 100);

  // Put the land round the cockpit: the ship at `ship` ({x, y, z} of the cockpit's floor, and its
  // nose's `pitch`) over the land. Everything is turned about your eye, so as the nose comes up the
  // view turns just as if the ship had tilted. Returns the matrix (land to room).
  const M = new Matrix4(), S = new Matrix4(), tmp = new Matrix4(), eye = new Vector3(SEAT.x, EYE, SEAT.z), cam = new Vector3(), w = new Vector3();
  function place(ship, shake = [0, 0, 0]) {
    // the ship in the land: at its spot, pitched about your eye
    S.makeTranslation(ship.x, ship.y, ship.z).multiply(tmp.makeTranslation(eye.x, eye.y, eye.z)).multiply(tmp.makeRotationX(-ship.pitch)).multiply(tmp.makeTranslation(-eye.x, -eye.y, -eye.z));
    M.copy(S).invert().premultiply(tmp.makeTranslation(...shake));
    land.matrix.copy(M); land.matrixWorldNeedsUpdate = true;
    // the sky goes where you go
    cam.copy(eye).applyMatrix4(S); sky.position.copy(cam); sky.updateMatrix();
    for (const t of skyThings) t.updateMatrix();
    // the clouds, turned to face you
    for (const [c, p] of cloudAt) { c.position.copy(w.copy(p).applyMatrix4(M)); c.lookAt(eye); }
    return M;
  }
  function update(t) {
    water.material.uniforms.map.value.offset.set(t * 0.01, t * 0.006);
    for (const [f, z] of foam) f.position.x = shore(z) + 0.3 + Math.sin(t * 0.7 + z * 0.05) * 0.8;
  }
  return { group: land, clouds, place, update, background: new Color(0x2a60e0) };
}

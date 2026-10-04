// The things the outfit shows bring on stage: a microphone and a spotlight, music notes, the cat tower's
// blocks, the magician's hat stand, cape and puff of smoke, the superhero's box, the detective's
// magnifying glass and exclamation mark, Marbles' tuna can, a few Zs and sparkles. All made once when the
// room's built and kept out of sight (`visible = false`) until a show (shows.js) puts them where they go.
import { Mesh, Group, PlaneGeometry, BoxGeometry, CylinderGeometry, SphereGeometry, ConeGeometry, DoubleSide } from 'three';

export function makeProps(m, A, scene) {
  const { psx, keep } = m;
  const P = { faces: [], all: [] };
  const hide = o => { o.visible = false; P.all.push(o); scene.add(o); return o; };
  const mesh = (geo, mat, parent, pos, rot) => { const o = new Mesh(keep(geo), mat); if (pos) o.position.set(...pos); if (rot) o.rotation.set(...rot); parent.add(o); return o; };
  const tint = (c, o = {}) => psx(null, { tint: c, unlit: 0.35, ...o });
  // a little picture that turns to face you (`w` by `h` metres), the bottom edge level with its position
  const sprite = (tx, w, h, o = {}) => { const s = hide(new Mesh(keep(new PlaneGeometry(w, h).translate(0, h / 2, 0)), psx(tx, { unlit: 1, ...o }))); P.faces.push(s); return s; };

  // the pop star's microphone on its stand, and the spotlight from the ceiling
  P.mic = hide(new Group());
  mesh(new CylinderGeometry(0.13, 0.15, 0.04, 8), tint(0x333344), P.mic, [0, 0.02, 0]);
  mesh(new CylinderGeometry(0.014, 0.014, 1.0, 5), tint(0x8a88a8), P.mic, [0, 0.52, 0]);
  mesh(new SphereGeometry(0.06, 7, 5), tint(0x222233), P.mic, [0, 1.08, 0]);
  P.beam = hide(new Mesh(keep(new ConeGeometry(1.1, 3.3, 12, 1, true)), psx(null, { tint: 0xfff6b0, unlit: 1, fade: 0.85, side: DoubleSide })));
  P.notes = Array.from({ length: 8 }, (_, i) => sprite(A.note[i % 3], 0.13, 0.16));

  // the cat tower: five blocks to stack
  const woods = [0xc08050, 0xe0a070, 0xc08050, 0xe0a070, 0xc08050];
  P.blocks = woods.map(c => hide(new Mesh(keep(new BoxGeometry(0.9, 0.26, 0.45)), tint(c))));

  // the magician's top hat on a stand, his cape, and a puff of smoke
  P.hat = hide(new Group());
  mesh(new CylinderGeometry(0.03, 0.05, 0.62, 5), tint(0x8a88a8), P.hat, [0, 0.31, 0]);
  mesh(new CylinderGeometry(0.25, 0.25, 0.04, 10), tint(0x1a1a1a), P.hat, [0, 0.64, 0]);
  mesh(new CylinderGeometry(0.15, 0.15, 0.34, 10), tint(0x1a1a1a), P.hat, [0, 0.83, 0]);
  mesh(new CylinderGeometry(0.155, 0.155, 0.06, 10), tint(0xe8202a), P.hat, [0, 0.7, 0]);
  P.cape = hide(new Mesh(keep(new PlaneGeometry(0.95, 0.85).translate(0, 0.425, 0)), psx(null, { tint: 0x1a1a2a, unlit: 0.4, side: DoubleSide })));
  P.faces.push(P.cape);
  P.puff = sprite(A.puff, 0.8, 0.8);

  // the superhero's cardboard box (open at the top)
  P.box = hide(new Group());
  const card = tint(0xc89a5a, { side: DoubleSide });
  for (const [w, pos, ry] of [[0.9, [0, 0.21, 0.35], 0], [0.9, [0, 0.21, -0.35], 0], [0.7, [0.45, 0.21, 0], Math.PI / 2], [0.7, [-0.45, 0.21, 0], Math.PI / 2]])
    mesh(new PlaneGeometry(w, 0.42), card, P.box, pos, [0, ry, 0]);
  mesh(new PlaneGeometry(0.9, 0.7), card, P.box, [0, 0.01, 0], [-Math.PI / 2, 0, 0]);

  // the detective's magnifying glass, exclamation mark and (Marbles') tuna can
  P.glass = sprite(A.glass, 0.34, 0.4);
  P.bang = sprite(A.bang, 0.12, 0.24);
  P.tuna = hide(new Group());
  mesh(new CylinderGeometry(0.1, 0.1, 0.09, 8), tint(0xc8c8d8), P.tuna, [0, 0.045, 0]);
  mesh(new CylinderGeometry(0.103, 0.103, 0.05, 8), tint(0x2a78e8), P.tuna, [0, 0.045, 0]);

  // Zs for the sleeper, sparkles for the dancer
  P.zs = Array.from({ length: 3 }, () => sprite(A.zzz, 0.3, 0.3));
  P.sparks = Array.from({ length: 6 }, () => sprite(A.star, 0.14, 0.14));
  return P;
}

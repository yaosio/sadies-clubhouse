// Building bits shared by every place in the mansion: quick shapes, walls with a hole for a door,
// and doorways (a door's frame, its two leaves that swing open, and the see-through box behind the
// hole where the place on the other side shows).
import {
  Mesh, Group, Shape, Path, ShapeGeometry, PlaneGeometry, BoxGeometry, CylinderGeometry, SphereGeometry, ConeGeometry,
  Vector3,
} from 'three';
import { psx, keep, doorwayMat } from './look.js';

export function kit(scene) {
  const add = (m, pos, rot) => { if (pos) m.position.set(...pos); if (rot) m.rotation.set(...rot); scene.add(m); return m; };
  const g = x => keep(x);
  return {
    add,
    box: (w, h, d, mat, pos, rot) => add(new Mesh(g(new BoxGeometry(w, h, d, 2, 2, 2)), mat), pos, rot),
    plane: (w, h, mat, pos, rot, seg = 4) => add(new Mesh(g(new PlaneGeometry(w, h, seg, seg)), mat), pos, rot),
    cyl: (r1, r2, h, n, mat, pos, rot, open) => add(new Mesh(g(new CylinderGeometry(r1, r2, h, n, 2, open)), mat), pos, rot),
    ball: (r, mat, pos, sy = 1) => { const m = add(new Mesh(g(new SphereGeometry(r, 8, 6)), mat), pos); m.scale.y = sy; return m; },
    cone: (r, h, n, mat, pos, rot) => add(new Mesh(g(new ConeGeometry(r, h, n, 2)), mat), pos, rot),
  };
}

// A flat wall w wide and h tall (its bottom middle at the origin, facing +z), with a hole of
// hw x hh in its bottom middle if asked. Texture coordinates are in metres.
export function wallGeometry(w, h, hw = 0, hh = 0) {
  const s = new Shape();
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.lineTo(-w / 2, 0);
  if (hw) {
    // the hole's bottom is a hair above the wall's, so the shape stays one piece
    const p = new Path();
    p.moveTo(-hw / 2, 0.001); p.lineTo(-hw / 2, hh); p.lineTo(hw / 2, hh); p.lineTo(hw / 2, 0.001); p.lineTo(-hw / 2, 0.001);
    s.holes.push(p);
  }
  return keep(new ShapeGeometry(s));
}

// One side of a doorway, put into a place's scene: at `pos` (the middle of its threshold), facing
// `yaw` (the way you face walking out of it into this place is yaw + PI), w x h.
// leaves: [left, right] for double doors, or [one] for one door hinged on the `hinge` side (-1 left,
// 1 right, as you face it); each a texture, or { front, back } when its two faces differ. Returns what the mansion needs to draw it and walk
// through it. Both sides of a doorway show the same real door: it swings into one of the two places,
// so on one side it swings away from you (`swing` 1, the default) and on the other towards you (-1).
export function doorway(scene, { pos, yaw, w, h, leaves, hinge = -1, trim = 0xffd23a }) {
  const group = new Group(); group.position.set(...pos); group.rotation.y = yaw; scene.add(group);
  const D = Math.max(1.3, leaves.length === 1 ? w : w / 2) + 0.1;   // deep enough to hold the leaves when they swing open
  const see = new Mesh(keep(new BoxGeometry(w, h, D)), doorwayMat(null));
  see.position.set(0, h / 2, -D / 2); group.add(see);
  const trimMat = psx(null, { tint: trim });
  for (const [bw, bh, x, y] of [[0.12, h + 0.12, -w / 2 - 0.06, h / 2], [0.12, h + 0.12, w / 2 + 0.06, h / 2], [w + 0.24, 0.12, 0, h + 0.06]]) {
    const b = new Mesh(keep(new BoxGeometry(bw, bh, 0.1)), trimMat); b.position.set(x, y, 0.02); group.add(b);
  }
  const hinges = [];
  const lw = leaves.length === 1 ? w : w / 2;
  for (const [side, t] of leaves.length === 1 ? [[hinge, leaves[0]]] : [[-1, leaves[0]], [1, leaves[1]]]) {
    const pivot = new Group(); pivot.position.set(side * w / 2, 0, 0); group.add(pivot);
    const geo = keep(new PlaneGeometry(lw, h, 2, 4));
    const face = new Mesh(geo, psx(t.front || t)), back = new Mesh(geo, psx(t.back || t));
    face.position.set(-side * lw / 2, h / 2, 0); back.position.copy(face.position); back.rotation.y = Math.PI;
    pivot.add(face, back);
    hinges.push([pivot, -side]);
  }
  const normal = new Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  return {
    group, see, w, h, yaw, pos: new Vector3(...pos), normal, swing: 1,
    setOpen(k) {           // 0 shut, 1 open (not quite flat, so the door stays in sight as you go through)
      for (const [pivot, s] of hinges) pivot.rotation.y = s * this.swing * k * 1.4;
      see.material.uniforms.uOn.value = 0;
    },
    // a point in this doorway's own terms: x across, z out into the place (negative: through the door)
    local(x, z) { const dx = x - pos[0], dz = z - pos[2], c = Math.cos(yaw), s = Math.sin(yaw); return [dx * c - dz * s, dx * s + dz * c]; },
  };
}

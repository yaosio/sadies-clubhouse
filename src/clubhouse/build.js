// Building bits shared by every place in the mansion: quick shapes, walls with a hole for a door,
// and doorways (a door's frame, its two leaves that swing open, and the see-through box behind the
// hole where the place on the other side shows).
import {
  Mesh, Group, Shape, Path, ShapeGeometry, PlaneGeometry, BoxGeometry, CylinderGeometry, SphereGeometry, ConeGeometry,
  Vector3, DoubleSide,
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
// leaves: [left texture, right texture]. Returns what the mansion needs to draw it and walk through it.
export function doorway(scene, { pos, yaw, w, h, leaves, trim = 0xffd23a }) {
  const group = new Group(); group.position.set(...pos); group.rotation.y = yaw; scene.add(group);
  const D = Math.max(1.3, w * 0.75);   // deep enough that the leaves stay inside it when they swing open
  const see = new Mesh(keep(new BoxGeometry(w, h, D)), doorwayMat(null));
  see.position.set(0, h / 2, -D / 2); group.add(see);
  const trimMat = psx(null, { tint: trim });
  for (const [bw, bh, x, y] of [[0.12, h + 0.12, -w / 2 - 0.06, h / 2], [0.12, h + 0.12, w / 2 + 0.06, h / 2], [w + 0.24, 0.12, 0, h + 0.06]]) {
    const b = new Mesh(keep(new BoxGeometry(bw, bh, 0.1)), trimMat); b.position.set(x, y, 0.02); group.add(b);
  }
  const hinges = [];
  for (const [side, t] of [[-1, leaves[0]], [1, leaves[1]]]) {
    const hinge = new Group(); hinge.position.set(side * w / 2, 0, 0); group.add(hinge);
    const leaf = new Mesh(keep(new PlaneGeometry(w / 2, h, 2, 4)), psx(t, { side: DoubleSide }));
    leaf.position.set(-side * w / 4, h / 2, 0); hinge.add(leaf);
    hinges.push([hinge, -side]);
  }
  const normal = new Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  return {
    group, see, w, h, yaw, pos: new Vector3(...pos), normal,
    setOpen(k) {           // 0 shut, 1 wide open (the leaves swing away from you, into the doorway)
      for (const [hinge, s] of hinges) hinge.rotation.y = s * k * 1.4;   // not quite flat, so they stay in sight
      see.material.uniforms.uOn.value = 0;
    },
    // a point in this doorway's own terms: x across, z out into the place (negative: through the door)
    local(x, z) { const dx = x - pos[0], dz = z - pos[2], c = Math.cos(yaw), s = Math.sin(yaw); return [dx * c - dz * s, dx * s + dz * c]; },
  };
}

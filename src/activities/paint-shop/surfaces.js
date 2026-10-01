// Paint on things in 3D: any mesh can be made paintable, and then a line from your eye (or your
// finger) finds the spot on it and the tool paints a layer of pixels there (layer.js), which is the
// mesh's picture. The paint shop's walls, floor, ceiling and the things in it are all paintable.
//
// It knows nothing about the paint shop: a room hands it the kit's `psx` and `keep`, says which
// meshes are paintable (and how many pixels a metre each gets), and passes it lines to paint along.
// So if another room ever wants paint, this file can move into the toolbox (src/shared/) as it is.
//
// Each surface's picture is a little grid of colours made straight from its layer (no canvas: nothing
// is ever read back from the graphics card), sent to the graphics card again only when it's changed.
import { DataTexture, RGBAFormat, NearestFilter, Raycaster, BoxGeometry } from 'three';
import { makeLayer, dab, stroke, spray, fill, stamp, clear, painted, encode, decode, PAINTS } from './layer.js';

const rgb = hex => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
const COLOURS = PAINTS.map(p => p && rgb(p.hex));

export function makeSurfaces({ psx, keep }) {
  const list = [], byName = new Map();
  const caster = new Raycaster(); caster.far = 30;

  // A paintable surface w x h pixels, `density` pixels a metre (so a brush is the same size in metres
  // everywhere), whose bare look is bare(i, j) (a colour, [r, g, b]). o: unlit (0-1), cells (the six
  // sides of a box, so paint stays on the side it's put on).
  function surface(name, w, h, density, bare, o = {}) {
    const L = makeLayer(w, h), base = new Uint8Array(w * h * 3), data = new Uint8Array(w * h * 4);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const c = bare(i, j), k = (j * w + i) * 3; base[k] = c[0]; base[k + 1] = c[1]; base[k + 2] = c[2]; }
    const tex = keep(new DataTexture(data, w, h, RGBAFormat));
    tex.magFilter = tex.minFilter = NearestFilter; tex.generateMipmaps = false;
    const s = { name, L, base, data, tex, density, cells: o.cells || null, material: psx(tex, { unlit: o.unlit ?? 0.3 }), meshes: [], dirty: true, changed: false };
    list.push(s); byName.set(name, s);
    draw(s);
    return s;
  }
  // (its picture, from its layer: each pixel its paint, or bare)
  function draw(s) {
    const { L, base, data } = s;
    for (let k = 0; k < L.px.length; k++) {
      const v = L.px[k], c = v ? COLOURS[v] : null, d = k * 4, b = k * 3;
      data[d] = c ? c[0] : base[b]; data[d + 1] = c ? c[1] : base[b + 1]; data[d + 2] = c ? c[2] : base[b + 2]; data[d + 3] = 255;
    }
    s.tex.needsUpdate = true; s.dirty = false;
  }
  function paintOn(s, mesh) { mesh.material = s.material; mesh.userData.surface = s; s.meshes.push(mesh); return mesh; }

  // What a line out into the room hits first, if it's paintable: the surface, which part of it (a
  // box's side), the pixel, and the spot in the room. Things that aren't solid (the paint flying off
  // after the dynamite, the BOOM) are skipped; anything else in the way stops the paint.
  function hit(scene, ray) {
    caster.set(ray.origin, ray.dir);
    for (const h of caster.intersectObject(scene, true)) {
      if (!seen(h.object) || h.object.userData.ghost || !h.uv) continue;
      const s = h.object.userData.surface;
      if (!s) return null;
      const part = h.face?.materialIndex ?? 0;
      return { s, part, x: h.uv.x * s.L.w, y: h.uv.y * s.L.h, point: h.point.clone(), clip: s.cells ? s.cells[part] : undefined };
    }
    return null;
  }
  const seen = o => { for (let x = o; x; x = x.parent) if (!x.visible) return false; return true; };

  // the tools, on a spot that `hit` found (r in metres); each says how many pixels it changed
  const changed = (s, n) => { if (n) { s.dirty = true; s.changed = true; } return n; };
  const px = (s, m) => m * s.density;
  const tools = {
    dab: (h, r, c, square) => changed(h.s, dab(h.s.L, h.x, h.y, px(h.s, r), c, { square, clip: h.clip })),
    stroke: (h, from, r, c, square) => changed(h.s, stroke(h.s.L, from.x, from.y, h.x, h.y, px(h.s, r), c, { square, clip: h.clip })),
    spray: (h, r, c, dots, rnd) => changed(h.s, spray(h.s.L, h.x, h.y, px(h.s, r), c, dots, rnd, { clip: h.clip })),
    fill: (h, c) => changed(h.s, fill(h.s.L, h.x, h.y, c, { clip: h.clip })),
    stamp: (h, st, o = {}) => changed(h.s, stamp(h.s.L, h.x, h.y, st.pic, st.key, 1, { clip: h.clip, tint: o.tint })),
    clear: s => changed(s, clear(s.L)),
  };

  // every frame: what's changed goes to the graphics card
  function upload() { for (const s of list) if (s.dirty) draw(s); }

  // keeping it: each surface with any paint on it, as runs of pixels (layer.js)
  function save() {
    const out = {};
    for (const s of list) if (painted(s.L)) out[s.name] = encode(s.L);
    for (const s of list) s.changed = false;
    return out;
  }
  function load(saved) {
    for (const s of list) { if (saved?.[s.name] && !decode(s.L, saved[s.name])) s.L.px.fill(0); s.dirty = true; }
    upload();
  }
  const changedSinceSave = () => list.some(s => s.changed);

  return { list, byName, surface, paintOn, hit, tools, upload, save, load, changedSinceSave, painted: s => painted(s.L) };
}

// A box whose six sides each get their own part of one picture (three across, two down), so paint
// on one side stays there. The sides' cells, in pixels, for the surface (`cells`).
export function boxGeometry(w, h, d, cell) {
  const g = new BoxGeometry(w, h, d, 2, 2, 2), uv = g.attributes.uv;
  for (const [i, gr] of g.groups.entries()) {
    const cx = i % 3, cy = Math.floor(i / 3);
    // (BoxGeometry keeps each side's corners together: the corners of side i are its own)
    const first = Math.min(...Array.from({ length: gr.count }, (_, n) => g.index.getX(gr.start + n)));
    const last = Math.max(...Array.from({ length: gr.count }, (_, n) => g.index.getX(gr.start + n)));
    for (let k = first; k <= last; k++) uv.setXY(k, (cx + uv.getX(k)) / 3, (cy + uv.getY(k)) / 2);
  }
  uv.needsUpdate = true;
  const cells = [0, 1, 2, 3, 4, 5].map(i => ({ x0: (i % 3) * cell, y0: Math.floor(i / 3) * cell, x1: (i % 3 + 1) * cell, y1: (Math.floor(i / 3) + 1) * cell }));
  return { geometry: g, cells, w: 3 * cell, h: 2 * cell };
}

// A flat wall's (or anything flat's) texture coordinates, 0 to 1 across its w x h metres, from
// its corners' own positions (the clubhouse's walls have them in metres; x from -w/2, y from 0)
export function fitUv(geometry, w, h, x0 = -w / 2, y0 = 0) {
  const p = geometry.attributes.position, uv = geometry.attributes.uv;
  for (let k = 0; k < p.count; k++) uv.setXY(k, (p.getX(k) - x0) / w, (p.getY(k) - y0) / h);
  uv.needsUpdate = true;
  return geometry;
}

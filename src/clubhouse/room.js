// The clubhouse room in (crappy, late-90s) 3D: the walls, the window, the rug, the ceiling fan, two
// cubby shelves with a software box per activity, and Sadie as a flat sprite on top.
//
// The PS1 look is all in the one material, psx(): corners snap to the pixel grid (the jitter),
// textures are mapped without perspective correction (they swim), lighting is worked out per
// corner, and colours are cut down to a few levels with an ordered dither between them.
import {
  Scene, Mesh, Group, Color, Vector2, Vector3, PlaneGeometry, BoxGeometry, CylinderGeometry, SphereGeometry,
  ShaderMaterial, TextureLoader, DataTexture, NearestFilter, RepeatWrapping, RGBAFormat, FrontSide, ColorManagement,
} from 'three';
import P from './pictures.js';

ColorManagement.enabled = false;   // colours go on screen exactly as picked, like 1996

// metres: y up; the back wall (with shelf 1) is +z
export const RW = 1.6, RH = 2.4, ZB = 3.3, ZF = -1.4, DEP = 0.4;
export const LAMP = new Vector3(0, 2.2, 1.3);

const VS = `
uniform vec2 uRes; uniform vec2 uRep; uniform vec3 uLamp; uniform float uUnlit;
varying vec2 vUvW; varying float vW; varying float vLight;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vec4 p = projectionMatrix * viewMatrix * wp;
  vec2 g = uRes * 0.5;
  p.xy = floor(p.xy / p.w * g + 0.5) / g * p.w;           // corners snap to the pixel grid: the jitter
  gl_Position = p;
  vec3 n = normalize(mat3(modelMatrix) * normal);
  float sun = max(dot(n, normalize(vec3(-0.45, 0.8, 0.35))), 0.0);
  vec3 toL = uLamp - wp.xyz; float d = length(toL);
  float bulb = max(dot(n, toL / d), 0.0) * clamp(1.4 - d * 0.32, 0.0, 1.0);
  vLight = mix(0.42 + 0.3 * sun + 0.55 * bulb, 1.0, uUnlit);  // lit per corner
  vUvW = uv * uRep * p.w; vW = p.w;                        // with the divide below: affine, so textures swim
}`;
const FS = `
uniform sampler2D map; uniform vec3 tint; uniform float uGlow; uniform float uLevels;
varying vec2 vUvW; varying float vW; varying float vLight;
float b2(vec2 a){ a = floor(a); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
float bayer(vec2 a){ return b2(0.5 * a) * 0.25 + b2(a); }
void main(){
  vec4 c = texture2D(map, vUvW / vW);
  if (c.a < 0.5) discard;
  vec3 col = c.rgb * tint * vLight * 1.12 + uGlow * vec3(1.0, 0.8, 0.25);
  float d = bayer(gl_FragCoord.xy);
  col = floor(col * uLevels + d) / uLevels;              // few colours, ordered dither between them
  gl_FragColor = vec4(col, 1.0);
}`;

// Builds the room. shelves: the two shelves' slots, 6 each (3 across, 2 down, top row first), each
// { kind: 'activity', card } or { kind: 'locked' } or { kind: 'card' } (the "coming soon" card) or null.
export function buildRoom(shelves) {
  const res = new Vector2(320, 240);   // the drawing size in pixels, kept up to date by the menu
  const scene = new Scene();
  scene.background = new Color(0x0a0628);
  const owned = [];                    // everything to hand back to the graphics card on the way out
  const keep = x => (owned.push(x), x);

  const loader = new TextureLoader(), tex = {};
  function T(src) {
    if (tex[src]) return tex[src];
    const t = keep(loader.load(src));
    t.magFilter = t.minFilter = NearestFilter; t.generateMipmaps = false;
    t.wrapS = t.wrapT = RepeatWrapping;
    return tex[src] = t;
  }
  const white = keep(new DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1, RGBAFormat)); white.needsUpdate = true;
  function psx(map, o = {}) {
    return keep(new ShaderMaterial({
      uniforms: { map: { value: map || white }, uRes: { value: res }, uRep: { value: new Vector2(o.rx || 1, o.ry || 1) },
        tint: { value: new Color(o.tint ?? 0xffffff) }, uGlow: { value: 0 }, uLamp: { value: LAMP }, uUnlit: { value: o.unlit || 0 },
        uLevels: { value: 14 } },
      vertexShader: VS, fragmentShader: FS, side: o.side ?? FrontSide,
      // things stuck flat on something else (posters, trim, tape, the rug) win the depth test outright, so they never flicker
      polygonOffset: !!o.decal, polygonOffsetFactor: -2, polygonOffsetUnits: -8 }));
  }
  const geo = g => keep(g);
  function plane(w, h, mat, pos, rotY = 0, rotX = 0, seg = 6) {
    const m = new Mesh(geo(new PlaneGeometry(w, h, seg, seg)), mat);
    m.position.set(...pos); m.rotation.order = 'YXZ'; m.rotation.y = rotY; m.rotation.x = rotX;
    scene.add(m); return m;
  }

  // ---------- walls, floor, ceiling and what's on them ----------
  const D = ZB - ZF;
  const floor = plane(RW * 2, D, psx(T(P.floor), { rx: RW * 2 / 0.72, ry: D / 0.72 }), [0, 0, (ZB + ZF) / 2], 0, -Math.PI / 2, 10);
  plane(RW * 2, D, psx(null, { tint: 0xfff3ea }), [0, RH, (ZB + ZF) / 2], 0, Math.PI / 2, 8);
  const wallMat = w => psx(T(P.wall), { rx: w / 0.6, ry: RH / 0.6 });
  plane(RW * 2, RH, wallMat(RW * 2), [0, RH / 2, ZB], Math.PI);
  plane(RW * 2, RH, wallMat(RW * 2), [0, RH / 2, ZF], 0);
  plane(D, RH, wallMat(D), [-RW, RH / 2, (ZB + ZF) / 2], Math.PI / 2);
  plane(D, RH, wallMat(D), [RW, RH / 2, (ZB + ZF) / 2], -Math.PI / 2);
  // the zigzag border under the ceiling and the baseboards, round all four walls
  for (const [w, pos, ry, inX, inZ] of [[RW * 2, [0, 0, ZB], Math.PI, 0, -1], [RW * 2, [0, 0, ZF], 0, 0, 1], [D, [-RW, 0, (ZB + ZF) / 2], Math.PI / 2, 1, 0], [D, [RW, 0, (ZB + ZF) / 2], -Math.PI / 2, -1, 0]]) {
    const e = 0.004;
    plane(w, 0.12, psx(T(P.zigzag), { rx: w / 0.12, ry: 1, unlit: 0.3, decal: true }), [pos[0] + inX * e, RH - 0.08, pos[2] + inZ * e], ry, 0, 1);
    plane(w, 0.1, psx(null, { tint: 0xe8e0ff, decal: true }), [pos[0] + inX * e, 0.05, pos[2] + inZ * e], ry, 0, 1);
  }
  // window with curtains (right wall), poster (back wall), door (front wall), rug (floor)
  plane(1.2, 0.98, psx(T(P.window), { unlit: 0.55, decal: true }), [RW - 0.006, 1.35, 1.7], -Math.PI / 2, 0, 3);
  plane(0.26, 1.15, psx(T(P.curtain), { decal: true }), [RW - 0.02, 1.3, 1.7 - 0.72], -Math.PI / 2, 0, 2);
  plane(0.26, 1.15, psx(T(P.curtain), { decal: true }), [RW - 0.02, 1.3, 1.7 + 0.72], -Math.PI / 2, 0, 2);
  plane(1.75, 0.04, psx(null, { tint: 0xffd23a, decal: true }), [RW - 0.025, 1.9, 1.7], -Math.PI / 2, 0, 1);
  plane(0.55, 0.55, psx(T(P.poster), { decal: true }), [1.08, 1.4, ZB - 0.006], Math.PI, 0, 2);
  plane(0.85, 1.9, psx(T(P.door), { decal: true }), [-0.55, 0.95, ZF + 0.006], 0, 0, 3);
  const rug = plane(1.7, 1.2, psx(T(P.rug), { decal: true }), [0.35, 0.004, 1.2], 0, -Math.PI / 2, 4);

  // ---------- the ceiling fan and its bulb ----------
  const fan = new Group(); fan.position.set(LAMP.x, RH, LAMP.z); scene.add(fan);
  const brass = psx(null, { tint: 0xffd23a }), fanWood = psx(T(P.wood), { rx: 2, ry: 0.4 });
  const rod = new Mesh(geo(new CylinderGeometry(0.02, 0.02, 0.22, 6)), brass); rod.position.y = -0.11; fan.add(rod);
  const hub = new Mesh(geo(new CylinderGeometry(0.09, 0.07, 0.07, 8)), brass); hub.position.y = -0.24; fan.add(hub);
  const bulb = new Mesh(geo(new SphereGeometry(0.07, 8, 6)), psx(null, { tint: 0xfff6b0, unlit: 1 })); bulb.position.y = -0.3; fan.add(bulb);
  const blades = new Group(); blades.position.y = -0.24; fan.add(blades);
  const bladeGeo = geo(new BoxGeometry(0.62, 0.015, 0.13));
  for (let i = 0; i < 4; i++) {
    const b = new Mesh(bladeGeo, fanWood);
    b.position.set(Math.cos(i * Math.PI / 2) * 0.38, 0, Math.sin(i * Math.PI / 2) * 0.38); b.rotation.y = -i * Math.PI / 2;
    blades.add(b);
  }

  // ---------- cubby shelves: one box per activity ----------
  const CW = 0.58, CH = 0.46, TH = 0.05, KICK = 0.07;
  const pickable = [];
  const woodMat = psx(T(P.wood), { rx: 1.5, ry: 1.5 }), innerMat = psx(T(P.wood), { tint: 0x8a6a70 });
  function shelf(slots, place) {
    const cols = 3, rows = 2;
    const g = new Group(); scene.add(g);
    const W = cols * CW + (cols + 1) * TH, Hs = KICK + rows * CH + (rows + 1) * TH;
    const block = (w, h, d, x, y, z, mat) => { const m = new Mesh(geo(new BoxGeometry(w, h, d, 2, 2, 1)), mat); m.position.set(x, y, z); g.add(m); return m; };
    // sides run full height; boards fit between them; dividers fit between boards; the back fits inside
    const IW = W - 2 * TH;
    for (const s of [-1, 1]) block(TH, Hs, DEP, s * (W - TH) / 2, Hs / 2, -DEP / 2, woodMat);
    block(IW, KICK + TH, DEP, 0, (KICK + TH) / 2, -DEP / 2, woodMat);
    block(IW, TH, DEP, 0, Hs - TH / 2, -DEP / 2, woodMat);
    for (let r = 1; r < rows; r++) block(IW, TH, DEP, 0, KICK + r * (CH + TH) + TH / 2, -DEP / 2, woodMat);
    for (let r = 0; r < rows; r++) {
      const y0 = KICK + TH + r * (CH + TH);
      for (let c = 1; c < cols; c++) block(TH, CH, DEP - 0.03, -W / 2 + c * (CW + TH) + TH / 2, y0 + CH / 2, -(DEP - 0.03) / 2, woodMat);
      block(IW, CH, 0.03, 0, y0 + CH / 2, -DEP + 0.015, innerMat);
    }
    slots.forEach((slot, i) => {
      if (!slot) return;
      const r = Math.floor(i / cols), c = i % cols;
      const cx = -W / 2 + TH + c * (CW + TH) + CW / 2, cy = KICK + TH + (rows - 1 - r) * (CH + TH);
      if (slot.kind === 'activity' || slot.kind === 'locked') {
        const w = CW - 0.12, h = CH - 0.07, d = DEP - 0.16, box = slot.card?.box;
        const front = psx(T(box ? box.front : P.locked)), side = psx(null, { tint: box ? box.side : 0x1e1458 }), top = psx(null, { tint: box ? box.top : 0x2c2070 });
        const mats = [side, side, top, side, front, side];
        const m = new Mesh(geo(new BoxGeometry(w, h, d, 2, 2, 1)), mats);
        m.position.set(cx - 0.02, cy + h / 2, -d / 2 - 0.1); g.add(m);
        m.userData = { ...slot, home: m.position.z, out: 0, mats, slide: box ? 0.1 : 0 };
        pickable.push(m);
        if (slot.kind === 'locked') {  // taped shut, with a padlock
          for (const s of [-1, 1]) {
            const t = new Mesh(geo(new PlaneGeometry(CW * 1.05, 0.055, 4, 1)), psx(T(P.tape), { rx: 3.5, unlit: 0.2, decal: true }));
            t.position.set(cx, cy + CH / 2 + s * 0.02, 0.006 + (s + 1) * 0.002); t.rotation.z = s * 0.42; g.add(t);
          }
          const l = new Mesh(geo(new PlaneGeometry(0.07, 0.08)), psx(T(P.padlock), { unlit: 0.3, decal: true }));
          l.position.set(cx, cy + 0.08, 0.012); g.add(l);
        }
      } else if (slot.kind === 'card') {
        const m = new Mesh(geo(new PlaneGeometry(CW - 0.14, CH - 0.2, 2, 2)), psx(T(P.card), { unlit: 0.25, decal: true }));
        m.position.set(cx, cy + CH / 2, -DEP + 0.04); m.userData = { ...slot, mats: [m.material] }; g.add(m); pickable.push(m);
      }
    });
    place(g);
    g.updateMatrixWorld(true);
    const normal = new Vector3(0, 0, 1).applyQuaternion(g.quaternion);
    for (const m of g.children) if (m.userData.kind) m.userData.normal = normal;
    return { W, Hs, normal };
  }
  const s1 = shelf(shelves[0], g => { g.position.set(-0.2, 0, ZB - DEP); g.rotation.y = Math.PI; });
  shelf(shelves[1], g => { g.position.set(-RW + DEP, 0, 1.2); g.rotation.y = Math.PI / 2; });

  // ---------- Sadie: a flat sprite in the 3D room, turned to face you by the menu ----------
  const sadieMat = psx(T(P.sadie), { unlit: 0.35 });
  const sadie = new Mesh(geo(new PlaneGeometry(0.62, 0.5, 1, 1).translate(0, 0.25, 0)), sadieMat);
  sadie.position.set(-0.2 - s1.W / 2 + 0.42, s1.Hs, ZB - DEP / 2);
  sadie.userData = { kind: 'sadie', mats: [sadieMat], normal: s1.normal }; scene.add(sadie); pickable.push(sadie);
  const shadow = new Mesh(geo(new PlaneGeometry(0.5, 0.18)), psx(T(P.blob), { unlit: 1, decal: true }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.set(sadie.position.x, s1.Hs + 0.003, sadie.position.z); scene.add(shadow);
  const blink = on => { sadieMat.uniforms.map.value = T(on ? P.sadieBlink : P.sadie); };
  T(P.sadieBlink);

  return {
    scene, res, pickable, walkable: [floor, rug], blades, sadie, blink,
    dispose() { for (const x of owned) x.dispose(); },
  };
}

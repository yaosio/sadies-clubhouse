// Mock-up of Sadie's clubhouse (not the game): the outside, Sadie's invitation, the entrance hall
// (the bottom of the cat-tree trunk) and the first landing, in the clubhouse's crappy late-90s 3D.
// Textures are drawn right here on little canvases; Sadie's sprite is the clubhouse's.
// Built into one page by art/clubhouse/build.mjs; pictures taken by art/clubhouse/shots.mjs.
import {
  Scene, Mesh, Group, Color, Vector2, Vector3, PlaneGeometry, BoxGeometry, CylinderGeometry, SphereGeometry,
  ConeGeometry, CircleGeometry, RingGeometry, TorusGeometry, TubeGeometry, CatmullRomCurve3, Shape, ShapeGeometry,
  ShaderMaterial, CanvasTexture, NearestFilter, RepeatWrapping, FrontSide, DoubleSide, ColorManagement,
  WebGLRenderer, PerspectiveCamera, LinearSRGBColorSpace,
} from 'three';
import P from '../../src/clubhouse/pictures.js';

ColorManagement.enabled = false;

// ---------- the PS1 material (the clubhouse's, plus a sun/bulb mix and see-through dots) ----------
const VS = `
uniform vec2 uRes; uniform vec2 uRep; uniform vec3 uLamp; uniform float uUnlit; uniform float uBulb; uniform float uSun;
varying vec2 vUvW; varying float vW; varying float vLight;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vec4 p = projectionMatrix * viewMatrix * wp;
  vec2 g = uRes * 0.5;
  p.xy = floor(p.xy / p.w * g + 0.5) / g * p.w;
  gl_Position = p;
  vec3 n = normalize(mat3(modelMatrix) * normal);
  float sun = max(dot(n, normalize(vec3(-0.45, 0.8, -0.5))), 0.0);
  vec3 toL = uLamp - wp.xyz; float d = length(toL);
  float bulb = max(dot(n, toL / d), 0.0) * clamp(1.5 - d * 0.09, 0.0, 1.0);
  vLight = mix(0.45 + uSun * sun + uBulb * bulb, 1.0, uUnlit);
  vUvW = uv * uRep * p.w; vW = p.w;
}`;
const FS = `
uniform sampler2D map; uniform vec3 tint; uniform float uLevels; uniform float uFade;
varying vec2 vUvW; varying float vW; varying float vLight;
float b2(vec2 a){ a = floor(a); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
float bayer(vec2 a){ return b2(0.5 * a) * 0.25 + b2(a); }
void main(){
  vec4 c = texture2D(map, vUvW / vW);
  if (c.a < 0.5) discard;
  float d = bayer(gl_FragCoord.xy);
  if (d < uFade) discard;                                  // see-through the 90s way: every other dot
  vec3 col = c.rgb * tint * vLight * 1.12;
  col = floor(col * uLevels + d) / uLevels;
  gl_FragColor = vec4(col, 1.0);
}`;

const res = new Vector2(320, 240);
const lamp = new Vector3(0, 5, 0);
const env = { bulb: { value: 0 }, sun: { value: 0.45 } };
function psx(map, o = {}) {
  return new ShaderMaterial({
    uniforms: {
      map: { value: map || WHITE }, uRes: { value: res }, uRep: { value: new Vector2(o.rx || 1, o.ry || 1) },
      tint: { value: new Color(o.tint ?? 0xffffff) }, uLamp: { value: lamp }, uUnlit: { value: o.unlit || 0 },
      uBulb: env.bulb, uSun: env.sun, uLevels: { value: 14 }, uFade: { value: o.fade || 0 },
    },
    vertexShader: VS, fragmentShader: FS, side: o.side ?? FrontSide,
    polygonOffset: !!o.decal, polygonOffsetFactor: -2, polygonOffsetUnits: -8,
  });
}

// ---------- little canvas drawings ----------
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function tex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  draw(g, w, h);
  const t = new CanvasTexture(c);
  t.magFilter = t.minFilter = NearestFilter; t.generateMipmaps = false; t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}
const rect = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
// b's dots over a, `amt` of the way (0-1), in the ordered pattern
function dith(g, a, b, x, y, w, h, amt) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++)
    rect(g, BAYER[((y + j) % 4) * 4 + ((x + i) % 4)] / 16 < amt ? b : a, x + i, y + j, 1, 1);
}
// a vertical run of bands, dithered from one to the next
function bands(g, cols, x, y, w, h) {
  const n = cols.length - 1;
  for (let j = 0; j < h; j++) {
    const f = j / (h - 1) * n, k = Math.min(n - 1, Math.floor(f));
    dith(g, cols[k], cols[k + 1], x, y + j, w, 1, f - k);
  }
}
function speckle(g, c, x, y, w, h, n, seed = 1) {
  let s = seed;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) rect(g, c, x + Math.floor(r() * w), y + Math.floor(r() * h), 1, 1);
}
// words in hard pixels: drawn with the font, then every half-covered pixel made solid
function words(g, text, x, y, px, color, o = {}) {
  const c = document.createElement('canvas'); c.width = g.canvas.width; c.height = g.canvas.height;
  const t = c.getContext('2d');
  t.font = `${o.bold ? 'bold ' : ''}${px}px ${o.font || 'Silkscreen, monospace'}`;
  t.textAlign = o.align || 'left'; t.textBaseline = 'top'; t.fillStyle = '#000';
  t.fillText(text, x, y);
  const d = t.getImageData(0, 0, c.width, c.height), a = d.data;
  const [r, gg, b] = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16));
  for (let i = 0; i < a.length; i += 4) { const on = a[i + 3] > (o.cut ?? 110); a[i] = r; a[i + 1] = gg; a[i + 2] = b; a[i + 3] = on ? 255 : 0; }
  t.putImageData(d, 0, 0);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  if (o.shadow) g.drawImage(recolor(c, o.shadow), 1, 1);
  g.drawImage(c, 0, 0); g.restore();
}
function recolor(c, col) {
  const k = document.createElement('canvas'); k.width = c.width; k.height = c.height;
  const t = k.getContext('2d'); t.drawImage(c, 0, 0); t.globalCompositeOperation = 'source-in'; t.fillStyle = col; t.fillRect(0, 0, c.width, c.height);
  return k;
}
const img = src => new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.src = src; });

// the palette: Sadie's own colours (white going lavender, grey, tan, pink) turned up loud
const C = {
  ink: '#1c1238', cream: '#fff4e4', lav: '#e8dcff', lav2: '#c9b6f2', lav3: '#9c86d6', plum: '#5a2a78', plum2: '#3a1858',
  grey: '#8a88a8', grey2: '#5e5c80', slate: '#4a4a78', slate2: '#34305c', tan: '#e8b070', tan2: '#b87848', tan3: '#7a4a2a',
  pink: '#ff8ec8', pink2: '#e0509a', pink3: '#a02a70', gold: '#ffd23a', gold2: '#c89018', gold3: '#8a5a10',
  green: '#58d04a', green2: '#2a9a3a', green3: '#16602a', sky1: '#1a1a80', sky2: '#2a60e0', sky3: '#40c0f0', sky4: '#ffb0d8',
  tarp: '#2a78e8', tarp2: '#1a4ab0', red: '#e83a3a', white: '#ffffff', black: '#120a24', yellow: '#fff08a',
};

let WHITE;
function drawAll(sadie, sadieNap) {
  WHITE = tex(1, 1, g => rect(g, '#fff', 0, 0, 1, 1));
  const T = {};
  T.hills = tex(128, 32, g => {
    for (let x = 0; x < 128; x++) {
      const far = 14 + Math.round(5 * Math.sin(x / 9) + 3 * Math.sin(x / 4.3));
      const near = 22 + Math.round(4 * Math.sin(x / 13 + 2) + 2 * Math.sin(x / 5));
      for (let y = far; y < 32; y++) rect(g, y < near ? (y < far + 2 ? '#7fd0a0' : '#5ab88a') : (y < near + 2 ? C.green : C.green2), x, y, 1, 1);
    }
  });
  T.grass = tex(16, 16, g => { rect(g, C.green, 0, 0, 16, 16); speckle(g, C.green2, 0, 0, 16, 16, 40, 3); speckle(g, '#8af070', 0, 0, 16, 16, 14, 9); });
  T.path = tex(16, 16, g => {
    rect(g, C.lav3, 0, 0, 16, 16);
    for (const [x, y, w, h] of [[1, 1, 6, 5], [8, 1, 7, 6], [1, 7, 4, 7], [6, 8, 9, 5], [8, 14, 6, 2], [0, 14, 7, 2]]) {
      rect(g, C.lav2, x, y, w, h); rect(g, C.lav, x, y, w - 1, 1); rect(g, C.grey, x, y + h - 1, w, 1);
    }
  });
  T.stone = tex(16, 16, g => {
    rect(g, C.lav, 0, 0, 16, 16);
    for (let y = 0; y < 16; y += 4) { rect(g, C.lav2, 0, y + 3, 16, 1); for (let x = (y % 8 ? 4 : 0); x < 16; x += 8) rect(g, C.lav2, x, y, 1, 3); }
  });
  T.stucco = tex(16, 16, g => { rect(g, C.cream, 0, 0, 16, 16); dith(g, C.cream, C.lav, 0, 0, 16, 16, 0.3); speckle(g, C.lav2, 0, 0, 16, 16, 6, 5); });
  // fish-scale slates (Victorian roofs really have them, and they're fish)
  T.roof = tex(16, 16, g => {
    rect(g, C.slate, 0, 0, 16, 16);
    for (let row = 0; row < 4; row++) for (let i = -1; i < 3; i++) {
      const cx = i * 8 + (row % 2) * 4 + 4, cy = row * 4;
      for (let y = 0; y < 4; y++) for (let x = -4; x < 4; x++) {
        const px = cx + x, py = cy + y;
        if (px < 0 || px > 15) continue;
        const r = Math.hypot(x + 0.5, y - 0.2);
        if (r > 3.6 && r < 4.6 && y > 0) rect(g, C.slate2, px, py, 1, 1);
        else if (r < 2.2 && y < 2) rect(g, C.grey2, px, py, 1, 1);
      }
    }
  });
  T.window = tex(16, 24, g => {
    rect(g, C.tan3, 0, 0, 16, 24); rect(g, C.cream, 1, 1, 14, 22);
    bands(g, [C.yellow, C.gold, '#ffb040'], 2, 2, 12, 20);
    rect(g, C.cream, 7, 2, 2, 20); rect(g, C.cream, 2, 10, 12, 2);
    rect(g, C.pink2, 2, 2, 2, 20); rect(g, C.pink2, 12, 2, 2, 20); rect(g, C.pink, 2, 2, 12, 2);
    rect(g, C.tan, 0, 22, 16, 2);
  });
  T.round = tex(16, 16, g => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const r = Math.hypot(x - 7.5, y - 7.5);
      if (r < 6) rect(g, (x + y) % 5 ? C.yellow : C.gold, x, y, 1, 1); else if (r < 8) rect(g, C.tan2, x, y, 1, 1);
    }
    rect(g, C.tan2, 7, 2, 2, 12); rect(g, C.tan2, 2, 7, 12, 2);
  });
  // the front door: tall plum double doors with gold studs, a fanlight, and a cat flap
  T.door = tex(32, 48, g => {
    rect(g, C.ink, 0, 0, 32, 48);
    for (let y = 0; y < 12; y++) for (let x = 0; x < 32; x++) { const r = Math.hypot(x - 15.5, y - 12); if (r < 15 && r > 1) rect(g, r > 13 ? C.tan2 : (Math.floor(Math.atan2(y - 12, x - 15.5) * 3) % 2 ? C.gold : C.yellow), x, y, 1, 1); }
    for (const x of [2, 17]) {
      rect(g, C.plum, x, 12, 13, 36); rect(g, C.pink3, x, 12, 1, 36); rect(g, C.plum2, x + 12, 12, 1, 36);
      for (const [y, h] of [[15, 12], [30, 14]]) { rect(g, C.plum2, x + 2, y, 9, h); rect(g, C.pink3, x + 3, y + 1, 7, h - 2); rect(g, C.plum, x + 4, y + 2, 5, h - 4); }
    }
    rect(g, C.gold, 13, 28, 2, 3); rect(g, C.gold, 17, 28, 2, 3);
    // cat flap, right across the middle seam
    rect(g, C.tan3, 11, 38, 10, 10); rect(g, C.gold2, 12, 39, 8, 9); rect(g, '#d8b0e8', 13, 40, 6, 8); rect(g, C.lav3, 13, 40, 6, 1);
    rect(g, C.tan2, 0, 46, 32, 2);
  });
  T.mat = tex(32, 16, g => {
    rect(g, C.tan2, 0, 0, 32, 16); rect(g, C.tan, 1, 1, 30, 14); dith(g, C.tan, C.tan2, 2, 2, 28, 12, 0.25);
    words(g, 'FRIENDS', 16, 2, 8, C.tan3, { align: 'center' }); words(g, 'ONLY', 16, 8, 8, C.tan3, { align: 'center' });
  });
  T.leaf = tex(16, 16, g => { rect(g, C.green2, 0, 0, 16, 16); speckle(g, C.green, 0, 0, 16, 16, 60, 7); speckle(g, C.green3, 0, 0, 16, 16, 40, 11); });
  T.bark = tex(8, 16, g => { rect(g, C.tan3, 0, 0, 8, 16); for (let x = 1; x < 8; x += 3) rect(g, '#5a3018', x, 0, 1, 16); });
  // scratching rope, and the bottom of it, clawed up
  T.rope = tex(16, 16, g => {
    rect(g, C.tan, 0, 0, 16, 16);
    for (let y = 0; y < 16; y += 3) { rect(g, C.tan2, 0, y + 2, 16, 1); for (let x = 0; x < 16; x += 4) rect(g, '#f4cc90', (x + y) % 16, y, 2, 1); }
  });
  T.clawed = tex(16, 16, g => {
    rect(g, C.tan, 0, 0, 16, 16);
    for (let y = 0; y < 16; y += 3) rect(g, C.tan2, 0, y + 2, 16, 1);
    for (const x of [1, 3, 5, 9, 11, 13]) for (let y = 0; y < 16; y++) if ((y * 7 + x) % 5) rect(g, (x + y) % 3 ? '#fff0d0' : C.tan2, x + (y > 8 ? 1 : 0), y, 1, 1);
  });
  T.fence = tex(16, 16, g => { for (let x = 1; x < 16; x += 4) { rect(g, C.ink, x, 2, 1, 14); rect(g, C.gold, x, 1, 1, 1); } rect(g, C.ink, 0, 4, 16, 1); rect(g, C.ink, 0, 13, 16, 1); });
  T.lantern = tex(8, 8, g => { rect(g, C.ink, 0, 0, 8, 8); rect(g, C.yellow, 1, 1, 6, 6); rect(g, C.white, 2, 2, 2, 2); });
  T.tarp = tex(16, 16, g => { rect(g, C.tarp, 0, 0, 16, 16); dith(g, C.tarp, C.tarp2, 0, 0, 16, 16, 0.3); rect(g, C.tarp2, 0, 7, 16, 1); rect(g, '#cfd8e0', 1, 1, 1, 1); rect(g, '#cfd8e0', 14, 1, 1, 1); });
  T.scaffold = tex(4, 4, g => { rect(g, '#b8b8c8', 0, 0, 4, 4); rect(g, '#707088', 3, 0, 1, 4); });
  T.hazard = tex(16, 4, g => { for (let x = 0; x < 16; x++) for (let y = 0; y < 4; y++) rect(g, ((x + y) >> 2) % 2 ? C.black : C.gold, x, y, 1, 1); });
  T.soonSign = tex(96, 32, g => {
    rect(g, C.black, 0, 0, 96, 32); rect(g, C.gold, 1, 1, 94, 30);
    for (let x = 0; x < 94; x++) for (let y of [1, 2, 3, 28, 29, 30]) rect(g, ((x + y) >> 2) % 2 ? C.black : C.gold, x + 1, y, 1, 1);
    words(g, 'MORE ROOMS', 48, 6, 8, C.black, { align: 'center' });
    words(g, 'COMING SOON!!', 48, 16, 8, C.red, { align: 'center' });
  });
  T.wingSign = tex(64, 24, g => {
    rect(g, C.black, 0, 0, 64, 24); rect(g, C.gold, 1, 1, 62, 22);
    words(g, 'NEW WING', 32, 3, 8, C.black, { align: 'center' }); words(g, 'SOON!!', 32, 12, 8, C.red, { align: 'center' });
  });
  T.cat = tex(16, 16, g => {   // the weathervane: a sitting cat in black iron
    const k = C.ink;
    rect(g, k, 5, 7, 7, 8); rect(g, k, 6, 3, 5, 5); rect(g, k, 6, 1, 1, 2); rect(g, k, 10, 1, 1, 2); rect(g, k, 4, 12, 9, 3);
    rect(g, k, 12, 11, 2, 1); rect(g, k, 13, 8, 1, 3); rect(g, k, 14, 7, 1, 1); rect(g, C.gold, 7, 5, 1, 1); rect(g, C.gold, 9, 5, 1, 1);
  });
  // inside: damask wallpaper whose pattern is fish bones and paw prints if you look closely
  T.damask = tex(24, 24, g => {
    rect(g, C.lav, 0, 0, 24, 24); dith(g, C.lav, C.cream, 0, 0, 24, 24, 0.25);
    const m = C.lav2;
    // fish bone
    rect(g, m, 3, 5, 7, 1); for (const x of [4, 6, 8]) { rect(g, m, x, 3, 1, 5); } rect(g, m, 10, 4, 2, 3); rect(g, m, 1, 4, 1, 3); rect(g, m, 2, 5, 1, 1);
    // paw print
    rect(g, m, 15, 16, 4, 3); rect(g, m, 14, 14, 1, 1); rect(g, m, 16, 13, 1, 1); rect(g, m, 18, 13, 1, 1); rect(g, m, 20, 14, 1, 1);
    rect(g, m, 16, 15, 2, 1);
    // little diamonds between
    for (const [x, y] of [[18, 5], [5, 17]]) { rect(g, C.lav3, x, y, 1, 1); rect(g, m, x - 1, y + 1, 3, 1); rect(g, C.lav3, x, y + 2, 1, 1); }
  });
  T.wainscot = tex(16, 16, g => { rect(g, C.plum, 0, 0, 16, 16); rect(g, C.plum2, 1, 2, 14, 12); rect(g, C.pink3, 2, 3, 12, 10); rect(g, C.plum, 3, 4, 10, 8); rect(g, C.gold2, 0, 0, 16, 1); });
  T.brick = tex(16, 16, g => {
    rect(g, '#c86a58', 0, 0, 16, 16);
    for (let y = 0; y < 16; y += 4) { rect(g, '#e8c8b0', 0, y + 3, 16, 1); for (let x = (y % 8 ? 4 : 0); x < 16; x += 8) rect(g, '#e8c8b0', x, y, 1, 3); }
    speckle(g, '#a04a40', 0, 0, 16, 16, 14, 4);
  });
  T.checker = tex(16, 16, g => {
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) rect(g, (x + y) % 2 ? C.lav2 : C.cream, x * 8, y * 8, 8, 8);
    speckle(g, C.white, 0, 0, 16, 16, 10, 2); speckle(g, C.lav3, 0, 0, 16, 16, 8, 6);
  });
  T.carpet = tex(8, 8, g => { rect(g, C.pink2, 0, 0, 8, 8); dith(g, C.pink2, C.pink3, 0, 0, 8, 8, 0.3); speckle(g, C.pink, 0, 0, 8, 8, 6, 3); });
  T.wood = tex(16, 16, g => { rect(g, C.tan2, 0, 0, 16, 16); for (let y = 0; y < 16; y += 4) rect(g, C.tan3, 0, y, 16, 1); speckle(g, C.tan, 0, 0, 16, 16, 16, 8); });
  T.rail = tex(16, 16, g => { rect(g, C.gold, 0, 0, 16, 2); rect(g, C.gold2, 0, 14, 16, 2); for (let x = 1; x < 16; x += 4) { rect(g, C.tan3, x, 2, 2, 12); rect(g, C.tan2, x, 6, 2, 2); } });
  T.velvet = tex(16, 16, g => { rect(g, '#8a2ab0', 0, 0, 16, 16); dith(g, '#8a2ab0', '#6a1a90', 0, 0, 16, 16, 0.35); });
  T.shredded = tex(16, 16, g => {
    rect(g, '#8a2ab0', 0, 0, 16, 16); dith(g, '#8a2ab0', '#6a1a90', 0, 0, 16, 16, 0.35);
    for (const x of [2, 4, 6, 10, 12]) for (let y = 3; y < 16; y++) if ((x * 3 + y) % 4) rect(g, y % 3 ? '#fff4e4' : '#e8c8ff', x, y, 1, 1);
  });
  T.cardboard = tex(16, 16, g => { rect(g, '#d8a060', 0, 0, 16, 16); for (let x = 0; x < 16; x += 2) rect(g, '#c89050', x, 0, 1, 16); rect(g, '#b87838', 0, 0, 16, 1); words(g, 'FRAGILE', 8, 6, 6, C.red, { align: 'center', cut: 60 }); });
  T.sun = tex(16, 16, g => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (Math.hypot(x - 7.5, y - 7.5) < 7.5) rect(g, C.yellow, x, y, 1, 1); });
  T.feather = tex(8, 24, g => { for (let y = 0; y < 22; y++) { const w = Math.round(3.5 * Math.sin(y / 22 * Math.PI)); rect(g, y % 3 ? C.pink : '#ffd0ea', 4 - w, y, w * 2, 1); } rect(g, C.white, 4, 0, 1, 24); });
  T.cloud = tex(32, 12, g => {
    for (const [cx, cy, r] of [[8, 7, 5], [15, 5, 6], [23, 7, 5], [15, 8, 5]]) for (let y = 0; y < 12; y++) for (let x = 0; x < 32; x++) if (Math.hypot(x - cx, (y - cy) * 1.2) < r) rect(g, y > 8 ? '#f0e0ff' : C.white, x, y, 1, 1);
  });
  T.candle = tex(4, 8, g => { rect(g, C.cream, 1, 3, 2, 5); rect(g, C.yellow, 1, 0, 2, 3); rect(g, C.white, 1, 1, 1, 1); });
  T.dark = tex(4, 4, g => rect(g, C.ink, 0, 0, 4, 4));

  // a door to an activity's room: its colour, a sign, and a little something from inside
  function roomDoor(name, col, col2, extra) {
    return tex(64, 104, g => {
      g.scale(2, 2);
      rect(g, C.gold2, 0, 0, 32, 52); rect(g, C.tan3, 1, 1, 30, 51);
      rect(g, col, 3, 3, 26, 49); rect(g, col2, 3, 3, 1, 49); rect(g, col2, 28, 3, 1, 49);
      for (const y of [8, 30]) { rect(g, col2, 6, y, 20, 17); rect(g, col, 7, y + 1, 18, 15); }
      rect(g, C.gold, 24, 27, 2, 2);
      extra(g);
    });
  }
  T.doorDW = roomDoor('dw', '#3aa04a', '#1f6a2a', g => {
    // a sign in the jelly colours, hay sticking out underneath, dirt on the step
    rect(g, C.ink, 4, 10, 24, 14); rect(g, C.pink, 5, 11, 22, 12);
    words(g, 'DROPPER', 32, 23, 8, C.white, { align: 'center', shadow: C.pink3 }); words(g, 'WORLD', 32, 33, 8, C.yellow, { align: 'center', shadow: C.pink3 });
    for (let x = 3; x < 29; x += 2) { const h = 2 + ((x * 7) % 4); rect(g, x % 4 ? C.gold : '#f8e070', x, 52 - h, 1, h); }
  });
  T.doorTF = roomDoor('tf', '#2a3aa0', '#1a2468', g => {
    // a brass nameplate whose name doesn't fit and runs off the edge
    rect(g, C.gold2, 7, 11, 18, 12); rect(g, C.gold, 8, 12, 16, 10);
    words(g, 'TYPEFITTER', 18, 25, 8, C.ink);
    words(g, 'DELUXE 3.1', 22, 35, 8, C.red);
  });
  T.boarded = tex(64, 104, g => {
    g.scale(2, 2);
    rect(g, C.gold2, 0, 0, 32, 52); rect(g, C.ink, 2, 2, 28, 50);
    for (const [y, a] of [[10, 1], [24, -1], [38, 1]]) for (let x = 0; x < 30; x++) rect(g, x % 9 ? C.tan : C.tan3, x + 1, y + Math.round(x * 0.25 * a) - (a > 0 ? 0 : -7), 1, 5);
    rect(g, C.black, 5, 26, 22, 11); rect(g, C.gold, 6, 27, 20, 9); words(g, 'SOON!', 32, 56, 8, C.red, { align: 'center' });
  });
  T.catdoor = tex(8, 8, g => { rect(g, C.gold2, 0, 1, 8, 7); rect(g, C.plum2, 1, 2, 6, 6); rect(g, C.gold2, 0, 0, 8, 1); rect(g, C.pink3, 2, 3, 4, 5); });
  T.hint = null;
  // Sadie's portraits: her real sprite, in oils, in a gold frame
  function portrait(bg, bg2, label, ruff) {
    return tex(48, 56, g => {
      rect(g, C.gold3, 0, 0, 48, 56); rect(g, C.gold, 1, 1, 46, 54); rect(g, C.gold2, 4, 4, 40, 48);
      bands(g, [bg, bg2], 5, 5, 38, 38);
      if (ruff) for (let x = 0; x < 20; x++) rect(g, x % 2 ? C.white : C.lav, 14 + x, 37, 1, 3);
      g.drawImage(sadie, 5, 8, 38, 31);
      rect(g, C.gold3, 12, 45, 24, 6); rect(g, C.gold, 13, 46, 22, 4);
      words(g, label, 24, 45, 5, C.ink, { align: 'center', cut: 60 });
    });
  }
  T.duchess = portrait('#1a4a3a', '#0a2a20', 'DUCHESS', true);
  T.general = portrait('#6a1a2a', '#3a0a18', 'GENERAL', false);
  T.baby = portrait('#2a3a7a', '#1a1a4a', 'AGE 1', false);
  T.sadie = tex(58, 47, g => g.drawImage(sadie, 0, 0));
  T.nap = tex(58, 47, g => g.drawImage(sadieNap, 0, 0));
  return T;
}

// ---------- building bits ----------
function kit(scene) {
  const add = (m, pos, rot) => { if (pos) m.position.set(...pos); if (rot) m.rotation.set(...rot); scene.add(m); return m; };
  return {
    add,
    box: (w, h, d, mat, pos, rot) => add(new Mesh(new BoxGeometry(w, h, d, 2, 2, 2), mat), pos, rot),
    plane: (w, h, mat, pos, rot, seg = 4) => add(new Mesh(new PlaneGeometry(w, h, seg, seg), mat), pos, rot),
    cyl: (r1, r2, h, n, mat, pos, rot, open) => add(new Mesh(new CylinderGeometry(r1, r2, h, n, 2, open), mat), pos, rot),
    ball: (r, mat, pos, sy = 1) => { const m = add(new Mesh(new SphereGeometry(r, 8, 6), mat), pos); m.scale.y = sy; return m; },
    cone: (r, h, n, mat, pos, rot) => add(new Mesh(new ConeGeometry(r, h, n, 2), mat), pos, rot),
  };
}

// ---------- outside ----------
function buildOutside(T) {
  const scene = new Scene(); scene.background = new Color(C.sky1);
  const { add, box, plane, cyl, ball, cone } = kit(scene);
  const sky = new Mesh(new SphereGeometry(200, 16, 12), new ShaderMaterial({
    side: 1, depthWrite: false,
    vertexShader: `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying vec3 vDir;
      float b2(vec2 a){ a = floor(a); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
      float bayer(vec2 a){ return b2(0.5 * a) * 0.25 + b2(a); }
      void main(){
        float h = clamp(normalize(vDir).y, 0.0, 1.0);
        vec3 top = vec3(0.10, 0.10, 0.50), mid = vec3(0.16, 0.38, 0.88), low = vec3(0.25, 0.75, 0.94), rim = vec3(1.0, 0.69, 0.85);
        vec3 c = h < 0.06 ? mix(rim, low, h / 0.06) : h < 0.3 ? mix(low, mid, (h - 0.06) / 0.24) : mix(mid, top, min(1.0, (h - 0.3) / 0.5));
        gl_FragColor = vec4(floor(c * 6.0 + bayer(gl_FragCoord.xy)) / 6.0, 1.0);
      }` }));
  sky.renderOrder = -1; scene.add(sky);
  const hills = new Mesh(new CylinderGeometry(120, 120, 30, 24, 1, true), psx(T.hills, { unlit: 0.6, side: 1, rx: 6 }));
  hills.position.y = 8; scene.add(hills);
  plane(12, 12, psx(T.sun, { unlit: 1 }), [-60, 55, 110], [0, Math.atan2(-60, 110) + Math.PI, 0], 1);
  for (const [x, y, z, s] of [[-40, 38, 100, 1.4], [30, 44, 110, 1.8], [70, 30, 80, 1.2], [-90, 26, 60, 1.5]])
    plane(14 * s, 5 * s, psx(T.cloud, { unlit: 0.9 }), [x, y, z], [0, Math.atan2(x, z) + Math.PI, 0], 1);
  plane(260, 260, psx(T.grass, { rx: 130, ry: 130 }), [0, 0, 0], [-Math.PI / 2, 0, 0], 24);
  plane(3, 30, psx(T.path, { rx: 2, ry: 20, decal: true }), [0, 0.01, -15], [-Math.PI / 2, 0, 0], 12);

  const stucco = (w, h) => psx(T.stucco, { rx: w / 1.5, ry: h / 1.5 });
  const slate = psx(T.roof, { rx: 10, ry: 5 });
  // the main block: two floors, fish-scale hip roof
  box(18, 8, 10, stucco(18, 8), [0, 4, 5]);
  const roof = cone(1, 1, 4, slate, [0, 10, 5], [0, Math.PI / 4, 0]); roof.scale.set(9.8 / 0.7071, 4, 5.8 / 0.7071);
  box(18.6, 0.35, 10.6, psx(T.wood, { tint: 0xffe0c0, rx: 8 }), [0, 8, 5]);
  box(18.2, 0.25, 0.3, psx(null, { tint: 0xe8b070 }), [0, 4.1, -0.05]);
  const win = psx(T.window, { unlit: 0.4, decal: true });
  for (const y of [2.1, 5.9]) for (const x of [-6.8, -3.9, 3.9, 6.8]) plane(1.3, 1.95, win, [x, y, -0.02], [0, Math.PI, 0], 1);
  plane(1.3, 1.95, win, [0, 5.9, -0.02], [0, Math.PI, 0], 1);

  // the trunk: an octagonal tower out of the middle of the house, still being built on top
  const TR = 3.4, TOP = 19;
  cyl(TR, TR, TOP, 8, stucco(24, TOP), [0, TOP / 2, 5], [0, Math.PI / 8, 0]);
  const ap = TR * Math.cos(Math.PI / 8);
  for (const y of [10.5, 14.5]) plane(1.1, 1.65, win, [0, y, 5 - ap - 0.02], [0, Math.PI, 0], 1);
  plane(1.4, 1.4, psx(T.round, { unlit: 0.4, decal: true }), [0, 17.4, 5 - ap - 0.02], [0, Math.PI, 0], 1);
  for (const y of [8.9, 13, TOP]) cyl(TR + 0.15, TR + 0.15, 0.3, 8, psx(null, { tint: 0xe8b070 }), [0, y, 5], [0, Math.PI / 8, 0]);
  // the half-built next floor: scaffolding, a stub of wall, a tarp, and the sign
  const scaf = psx(T.scaffold);
  const half = new Mesh(new CylinderGeometry(TR, TR, 1.6, 8, 1, true, Math.PI / 8 + Math.PI / 4 * 3, Math.PI / 4 * 4), psx(T.brick, { rx: 8, ry: 1, side: DoubleSide }));
  half.position.set(0, TOP + 0.8, 5); scene.add(half);
  for (const [x, z] of [[-4, 1.2], [4, 1.2], [-4, 8.8], [4, 8.8], [0, 1.2]]) cyl(0.07, 0.07, 5, 4, scaf, [x, TOP + 2.5, z]);
  for (const y of [TOP + 1.6, TOP + 3.4, TOP + 4.9]) { box(8.1, 0.1, 0.1, scaf, [0, y, 1.2]); box(8.1, 0.1, 0.1, scaf, [0, y, 8.8]); box(0.1, 0.1, 7.7, scaf, [-4, y, 5]); box(0.1, 0.1, 7.7, scaf, [4, y, 5]); }
  box(8.1, 0.12, 1.1, psx(T.wood, { rx: 4 }), [0, TOP + 1.6, 1.6]);
  const tarp = plane(4.2, 3, psx(T.tarp, { rx: 2, ry: 2, side: DoubleSide }), [2.2, TOP + 3.2, 8.7], [0, 0, 0.05]);
  plane(7, 2.3, psx(T.soonSign, { unlit: 0.4, side: DoubleSide }), [0, TOP + 2.7, 1.1], [0, Math.PI, 0], 1);

  // the front turrets: a pointy roof on each, leaning out a little (from the front, they're ears)
  for (const s of [-1, 1]) {
    cyl(1.6, 1.6, 11, 8, stucco(10, 11), [s * 9, 5.5, 0.4]);
    plane(0.8, 1.2, win, [s * 9, 8.6, 0.4 - 1.6], [0, Math.PI, 0], 1);
    cyl(1.75, 1.75, 0.3, 8, psx(null, { tint: 0xe8b070 }), [s * 9, 11, 0.4]);
    const ear = cone(2.1, 4.6, 4, psx(T.roof, { rx: 3, ry: 3 }), [s * 9.25, 13.2, 0.4], [0, Math.PI / 4, s * -0.13]);
  }
  // the weathervane: a sitting cat on the left ear
  cyl(0.05, 0.05, 1.6, 4, psx(null, { tint: 0x221a44 }), [-9.55, 16.2, 0.4]);
  plane(1.1, 1.1, psx(T.cat, { side: DoubleSide }), [-9.55, 17.3, 0.4], [0, Math.PI, 0], 1);
  box(1.2, 0.05, 0.05, psx(null, { tint: 0x221a44 }), [-9.55, 16.6, 0.4]);

  // the porch: two scratching-rope columns, a little roof and gable, the door with its cat flap
  for (const s of [-1, 1]) cyl(0.28, 0.28, 3.6, 8, psx(T.rope, { rx: 3, ry: 5 }), [s * 2, 1.8 + 0.45, -2.6]);
  for (const s of [-1, 1]) cyl(0.3, 0.3, 1.1, 8, psx(T.clawed, { rx: 3, ry: 1.2 }), [s * 2, 1.0, -2.6]);
  box(5.2, 0.4, 3.2, psx(null, { tint: 0xfff4e4 }), [0, 4.25, -1.5]);
  const gable = new Shape(); gable.moveTo(-2.9, 0); gable.lineTo(2.9, 0); gable.lineTo(0, 1.8); gable.lineTo(-2.9, 0);
  const pg = new Mesh(new ShapeGeometry(gable), psx(T.roof, { rx: 0.4, ry: 0.4, side: DoubleSide })); pg.position.set(0, 4.45, -3.1); scene.add(pg);
  plane(0.9, 0.9, psx(T.round, { unlit: 0.4, decal: true }), [0, 5.05, -3.12], [0, Math.PI, 0], 1);
  plane(2.4, 3.6, psx(T.door, { decal: true, unlit: 0.15 }), [0, 0.45 + 1.8, -0.02], [0, Math.PI, 0], 2);
  for (let i = 0; i < 3; i++) box(5.4 - i * 0.4, 0.15, 3.4 - i * 0.5, psx(T.stone, { rx: 3, ry: 2 }), [0, 0.075 + i * 0.15, -1.6 + i * 0.25]);
  plane(1.5, 0.75, psx(T.mat, { decal: true }), [0, 0.46, -0.9], [-Math.PI / 2, 0, 0], 1);

  // a branch: the games wing, reached by a covered bridge (and a bridge stub on the other side, waiting)
  box(6, 11, 6, stucco(6, 11), [16, 5.5, 6]);
  const wr = cone(1, 1, 4, psx(T.roof, { rx: 4, ry: 3 }), [16, 13.2, 6], [0, Math.PI / 4, 0]); wr.scale.set(3.4 / 0.7071, 4.4, 3.4 / 0.7071);
  for (const y of [2.2, 5.8, 9]) plane(1.1, 1.6, win, [16, y, 2.98], [0, Math.PI, 0], 1);
  box(4.2, 2.4, 2.6, stucco(4, 2.4), [11, 6.4, 4.5]);
  const br = cone(1, 1, 4, psx(T.roof, { rx: 3, ry: 1 }), [11, 8.3, 4.5], [0, Math.PI / 4, 0]); br.scale.set(2.8 / 0.7071, 1.4, 1.7 / 0.7071);
  for (const x of [10, 12]) plane(0.8, 1.2, win, [x, 6.4, 3.18], [0, Math.PI, 0], 1);
  box(6, 0.2, 2.6, psx(T.wood, { rx: 4 }), [-12, 5.1, 7]);
  for (const x of [-11, -14.8]) for (const z of [5.8, 8.2]) cyl(0.06, 0.06, 5.1, 4, scaf, [x, 2.55, z]);
  box(0.1, 0.35, 2.6, psx(T.hazard, { rx: 1, ry: 1, unlit: 0.3 }), [-15, 5.6, 7]);
  plane(2.4, 0.9, psx(T.wingSign, { unlit: 0.4, side: DoubleSide }), [-14, 6.4, 5.6], [0, Math.PI, 0], 1);

  // the front garden: gate, fence, hedges, lanterns, trees, and one topiary cat
  const stone = psx(T.stone, { rx: 1, ry: 3 });
  for (const s of [-1, 1]) {
    box(0.9, 2.4, 0.9, stone, [s * 2.6, 1.2, -20]);
    plane(26, 1.5, psx(T.fence, { rx: 26 / 1.5, side: DoubleSide }), [s * (3.05 + 13), 0.75, -20], [0, 0, 0], 1);
  }
  for (const s of [-1, 1]) for (const z of [-17, -11.5, -6]) box(1, 1.1, 4, psx(T.leaf, { rx: 3, ry: 1.5 }), [s * 2.3, 0.55, z]);
  const lit = psx(T.lantern, { unlit: 1 }), post = psx(null, { tint: 0x221a44 });
  for (const s of [-1, 1]) for (const z of [-15.5, -9.5, -3.5]) { cyl(0.05, 0.05, 1.8, 4, post, [s * 1.85, 0.9, z]); box(0.3, 0.38, 0.3, lit, [s * 1.85, 1.95, z]); }
  const bark = psx(T.bark, { rx: 2, ry: 2 }), leaf = psx(T.leaf, { rx: 3, ry: 3 });
  for (const [x, z, s] of [[-14, -8, 1.2], [-24, -2, 1.5], [22, -6, 1.3], [26, 10, 1.6], [-26, 14, 1.4]]) {
    cyl(0.3 * s, 0.4 * s, 3 * s, 6, bark, [x, 1.5 * s, z]);
    ball(1.8 * s, leaf, [x, 3.6 * s, z]); ball(1.2 * s, leaf, [x + 0.9 * s, 4.4 * s, z - 0.3]);
  }
  const topi = psx(T.leaf, { rx: 2, ry: 2 });
  box(1.6, 0.4, 1.6, psx(T.stone, { rx: 1 }), [-6.5, 0.2, -9]);
  ball(0.75, topi, [-6.5, 1.25, -9], 1.25); ball(0.5, topi, [-6.5, 2.4, -9]);
  for (const s of [-1, 1]) cone(0.17, 0.4, 4, topi, [-6.5 + s * 0.28, 2.9, -9], [0, 0, s * -0.3]);
  cyl(0.12, 0.12, 1, 5, topi, [-5.75, 1.2, -9], [0, 0, -0.5]);

  // Sadie on the gatepost: she's expecting you (not that she'd show it)
  const sadie = new Mesh(new PlaneGeometry(0.9, 0.73, 1, 1).translate(0, 0.365, 0), psx(T.sadie, { unlit: 0.35 }));
  sadie.position.set(2.6, 2.4, -20.1); sadie.userData.face = true; scene.add(sadie);

  const cams = {
    outside: { pos: [0.4, 1.6, -26], at: [0.6, 8.5, 5] },
    invite: { pos: [0.4, 1.6, -26], at: [0.6, 8.5, 5] },
  };
  return { scene, cams, sadie, tarp, env: { sun: 0.5, bulb: 0, lamp: [0, 20, -40] } };
}

// ---------- inside: the trunk, from the entrance hall up ----------
function buildHall(T) {
  const scene = new Scene(); scene.background = new Color(0x0a0628);
  const { add, box, plane, cyl, ball, cone } = kit(scene);
  const R = 8, L1 = 4.6, L2 = 9.2, TOPY = 13.6;   // the hall's radius, the landings, the tarp roof
  const ring = (r, th) => [Math.sin(th) * r, Math.cos(th) * r];
  // round wall, facing in
  function wall(r, y0, h, mat) {
    const g = new CylinderGeometry(r, r, h, 32, 2, true); g.scale(-1, 1, 1); g.computeVertexNormals();
    return add(new Mesh(g, mat), [0, y0 + h / 2, 0]);
  }
  const circ = 2 * Math.PI * R;
  wall(R, 0, L2, psx(T.damask, { rx: circ / 1.3, ry: L2 / 1.3 }));
  wall(R, L2, TOPY - L2, psx(T.brick, { rx: circ / 1.2, ry: (TOPY - L2) / 1.2 }));
  wall(R - 0.03, 0, 1.1, psx(T.wainscot, { rx: circ / 0.9, ry: 1 }));
  wall(R - 0.05, 1.1, 0.12, psx(null, { tint: 0xffd23a }));
  // on the wall: a flat thing at an angle round the room, facing in
  const onWall = (w, h, mat, th, y, inset = 0.12) => { const [x, z] = ring(R - inset, th); return plane(w, h, mat, [x, y, z], [0, th + Math.PI, 0], 3); };

  plane(2 * R, 2 * R, psx(T.checker, { rx: 2 * R / 1.4, ry: 2 * R / 1.4 }), [0, 0, 0], [-Math.PI / 2, 0, 0], 16);
  const rug = new Mesh(new RingGeometry(1.2, 3.6, 24, 1), psx(T.carpet, { rx: 6, ry: 6, decal: true })); rug.rotation.x = -Math.PI / 2; rug.position.y = 0.01; scene.add(rug);
  const roof = new Mesh(new CircleGeometry(R, 24), psx(T.tarp, { rx: 8, ry: 8, unlit: 0.55 })); roof.rotation.x = Math.PI / 2; roof.position.y = TOPY; scene.add(roof);

  // the trunk itself: a giant scratching post, clawed to bits at the bottom
  cyl(1.1, 1.1, TOPY, 14, psx(T.rope, { rx: 5, ry: TOPY / 0.5 }), [0, TOPY / 2, 0]);
  cyl(1.16, 1.16, 1.5, 14, psx(T.clawed, { rx: 5, ry: 3 }), [0, 0.75, 0]);
  // perches off the post, like a real cat tree
  const carpet = psx(T.carpet, { rx: 3, ry: 3 });
  for (const [y, th] of [[7.2, 2.4], [11.2, -0.8]]) { const [x, z] = ring(1.9, th); cyl(1.0, 1.0, 0.16, 12, carpet, [x, y, z]); }

  // the spiral staircase round the post, up to the first landing, then a ladder on towards the second
  const STEPS = 22, rise = L1 / STEPS, turn = 0.29, th0 = -2.1;
  const tread = psx(T.carpet, { rx: 2, ry: 1 }), side = psx(T.wood, { rx: 2 });
  const railPts = [];
  for (let i = 0; i < STEPS; i++) {
    const th = th0 + i * turn, y = (i + 1) * rise, [x, z] = ring(2.1, th);
    const t = box(1.95, 0.14, 0.62, tread, [x, y - 0.07, z], [0, th + Math.PI / 2, 0]);
    const [px, pz] = ring(3.0, th); cyl(0.03, 0.03, 0.9, 4, psx(null, { tint: 0x7a4a2a }), [px, y + 0.45, pz]);
    railPts.push(new Vector3(px, y + 0.92, pz));
  }
  add(new Mesh(new TubeGeometry(new CatmullRomCurve3(railPts), 40, 0.045, 4), psx(null, { tint: 0xffd23a })));
  const thTop = th0 + (STEPS - 1) * turn;
  // the half-built second flight: a few treads, then nothing but a ladder
  for (let i = 0; i < 6; i++) {
    const th = thTop + (i + 1) * turn, y = L1 + (i + 1) * rise, [x, z] = ring(2.1, th);
    box(1.95, 0.14, 0.62, i < 4 ? tread : side, [x, y - 0.07, z], [0, th + Math.PI / 2, 0]);
  }
  { const th = thTop + 7 * turn, [x, z] = ring(2.1, th), y0 = L1 + 6 * rise;
    for (const s of [-0.35, 0.35]) { const g = ring(s, th + Math.PI / 2); cyl(0.04, 0.04, L2 - y0 + 0.8, 4, side, [x + g[0], (y0 + L2 + 0.8) / 2, z + g[1]]); }
    for (let y = y0 + 0.3; y < L2 + 0.6; y += 0.4) box(0.7, 0.05, 0.05, side, [x, y, z], [0, th + Math.PI / 2, 0]); }

  // landing 1: a carpeted ring round the wall, a bridge over from the stairs, a railing
  const IN = R - 2.3;
  const floor1 = new Mesh(new RingGeometry(IN, R, 32, 1), psx(T.carpet, { rx: 10, ry: 10 })); floor1.rotation.x = -Math.PI / 2; floor1.position.y = L1; scene.add(floor1);
  const under1 = new Mesh(new RingGeometry(IN, R, 32, 1), psx(T.wood, { rx: 12, ry: 12 })); under1.rotation.x = Math.PI / 2; under1.position.y = L1 - 0.18; scene.add(under1);
  cyl(IN, IN, 0.18, 32, psx(T.wood, { rx: 20 }), [0, L1 - 0.09, 0], null, true);
  const railMat = psx(T.rail, { rx: 2 * Math.PI * IN / 0.5, ry: 1, side: DoubleSide });
  const gap = 0.36;
  const rail = new Mesh(new CylinderGeometry(IN, IN, 1, 40, 1, true, thTop + gap, 2 * Math.PI - 2 * gap), railMat); rail.position.y = L1 + 0.5; scene.add(rail);
  { const mid = ring((3.1 + IN) / 2, thTop); const b = box(1.3, 0.14, IN - 3.0, tread, [mid[0], L1 - 0.07, mid[1]], [0, thTop, 0]);
    for (const s of [-0.62, 0.62]) { const o = ring(s, thTop + Math.PI / 2); plane(IN - 3.0, 1, psx(T.rail, { rx: 5, side: DoubleSide }), [mid[0] + o[0], L1 + 0.5, mid[1] + o[1]], [0, thTop + Math.PI / 2, 0], 1); } }
  // landing 2, half built: planks with gaps, scaffolding and tape
  const plank = psx(T.wood, { rx: 1, ry: 3 });
  for (let k = 0; k < 18; k++) {
    const th = k * 0.35 - 0.3; if (k % 5 === 3) continue;
    const [x, z] = ring(R - 1.1, th); box(0.5, 0.1, 2.2, plank, [x, L2, z], [0, th, 0]);
  }
  const scaf = psx(T.scaffold);
  for (let k = 0; k < 8; k++) { const th = k * Math.PI / 4 + 0.2, [x, z] = ring(R - 2.3, th); cyl(0.05, 0.05, TOPY - L2, 4, scaf, [x, (L2 + TOPY) / 2, z]); }
  const tape = new Mesh(new CylinderGeometry(R - 2.3, R - 2.3, 0.2, 32, 1, true), psx(T.hazard, { rx: 60, ry: 1, unlit: 0.3, side: DoubleSide })); tape.position.y = L2 + 1; scene.add(tape);
  { const [x, z] = ring(R - 2.35, 0.2); plane(3.2, 1.05, psx(T.soonSign, { unlit: 0.4, side: DoubleSide }), [x, L2 + 1.9, z], [0, 0.2 + Math.PI, 0], 1); }

  // doors on landing 1: the two activities, and spaces boarded up for the next ones
  const doors = [];
  for (const [th, t, name] of [[-0.5, T.doorDW, 'Sadie’s Dropper World'], [0.5, T.doorTF, 'TypeFitter Deluxe 3.1'], [-1.15, T.boarded], [1.15, T.boarded], [1.8, T.boarded], [0, T.boarded]]) {
    onWall(1.5, 2.45, psx(t, { decal: true, unlit: 0.1 }), th, L1 + 1.22, 0.16);
    onWall(0.36, 0.36, psx(T.catdoor, { decal: true }), th + 0.15, L1 + 0.18, 0.15);
    if (name) doors.push({ name, th });
  }
  // a dirt pile outside Dropper World's door, where the mole came up through the floorboards
  { const [x, z] = ring(R - 0.95, -0.64); const d = cone(0.42, 0.3, 7, psx(T.bark, { tint: 0xc08050, rx: 2 }), [x, L1 + 0.15, z]); }

  // ground floor, round the wall: the front door (behind you), a tall window with a sunbeam,
  // an archway to the next wing (taped off), portraits, the shredded armchair, the knocked-over vase
  onWall(2.2, 3.4, psx(T.door, { decal: true, unlit: 0.15 }), Math.PI, 1.7, 0.1);
  onWall(1.5, 3.1, psx(T.window, { unlit: 0.7, decal: true }), 1.15, 2.2, 0.12);
  onWall(1.5, 3.1, psx(T.window, { unlit: 0.7, decal: true }), Math.PI - 0.7, 2.2, 0.12);
  const beam = new Mesh(new PlaneGeometry(1.5, 3.2), psx(null, { tint: 0xffe040, unlit: 1, fade: 0.45, side: DoubleSide, decal: true }));
  { const [x, z] = ring(R - 2.0, 1.1); beam.position.set(x, 0.03, z); beam.rotation.set(-Math.PI / 2, 0, 1.1 + 0.3); scene.add(beam); }
  // the arch: a dark way through, sawhorses and tape, and the sign
  onWall(2.6, 3.4, psx(T.dark, { decal: true }), 2.05, 1.7, 0.1);
  { const [x, z] = ring(R - 0.8, 2.05);
    box(2.4, 0.18, 0.08, psx(T.hazard, { rx: 4, ry: 1, unlit: 0.3 }), [x, 0.95, z], [0, 2.05, 0]);
    box(2.4, 0.18, 0.08, psx(T.hazard, { rx: 4, ry: 1, unlit: 0.3 }), [x, 0.55, z], [0, 2.05, 0]);
    const [sx, sz] = ring(R - 0.14, 2.05); plane(1.8, 0.68, psx(T.wingSign, { unlit: 0.4, decal: true }), [sx, 3.7, sz], [0, 2.05 + Math.PI, 0], 1); }
  onWall(1.25, 1.46, psx(T.duchess, { decal: true, unlit: 0.2 }), -0.95, 2.6);
  onWall(0.85, 1.0, psx(T.general, { decal: true, unlit: 0.2 }), -0.35, 2.5);
  onWall(0.85, 1.0, psx(T.baby, { decal: true, unlit: 0.2 }), -1.5, 2.5);
  // the armchair, under the duchess
  { const th = -0.95, [x, z] = ring(R - 0.9, th), g = new Group(); g.position.set(x, 0, z); g.rotation.y = th + Math.PI; scene.add(g);
    const v = psx(T.velvet, { rx: 2, ry: 2 }), sh = psx(T.shredded, { rx: 1, ry: 1 });
    const part = (w, h, d, m, p) => { const b = new Mesh(new BoxGeometry(w, h, d, 2, 2, 2), m); b.position.set(...p); g.add(b); };
    part(1.2, 0.45, 0.9, v, [0, 0.35, 0]); part(1.2, 0.9, 0.22, v, [0, 0.9, 0.36]);
    part(0.2, 0.75, 0.9, sh, [-0.66, 0.4, 0]); part(0.2, 0.75, 0.9, sh, [0.66, 0.4, 0]);
    for (const [a, b] of [[-0.5, -0.35], [0.5, -0.35], [-0.5, 0.35], [0.5, 0.35]]) part(0.08, 0.14, 0.08, psx(null, { tint: 0xffd23a }), [a, 0.07, b]); }
  // the little table, and the vase that used to be on it
  { const th = -0.35, [x, z] = ring(R - 0.6, th);
    cyl(0.3, 0.3, 0.06, 10, psx(T.wood), [x, 0.9, z]); cyl(0.05, 0.08, 0.9, 6, psx(T.wood), [x, 0.45, z]);
    const [vx, vz] = ring(R - 1.3, th + 0.1); cyl(0.12, 0.18, 0.45, 8, psx(null, { tint: 0x40c0f0 }), [vx, 0.15, vz], [Math.PI / 2, 0, 0.6]); }
  // Sadie asleep in the box the chandelier came in, in the sunbeam
  const nap = new Group(); { const [x, z] = ring(R - 2.1, 1.0); nap.position.set(x, 0, z); nap.rotation.y = -0.4; scene.add(nap);
    const cb = psx(T.cardboard);
    for (const [w, p, r] of [[1.0, [0, 0.25, -0.35], 0], [1.0, [0, 0.25, 0.35], Math.PI], [0.7, [-0.5, 0.25, 0], Math.PI / 2], [0.7, [0.5, 0.25, 0], -Math.PI / 2]]) {
      const m = new Mesh(new PlaneGeometry(w, 0.5), psx(T.cardboard, { side: DoubleSide })); m.position.set(...p); m.rotation.y = r; nap.add(m); }
    const flap = new Mesh(new PlaneGeometry(1.0, 0.35), psx(T.cardboard, { side: DoubleSide })); flap.position.set(0, 0.55, -0.5); flap.rotation.x = -0.9; nap.add(flap); }
  const sadie = new Mesh(new PlaneGeometry(0.78, 0.63, 1, 1).translate(0, 0.31, 0), psx(T.nap, { unlit: 0.4 }));
  sadie.position.copy(nap.position).add(new Vector3(0, 0.12, 0)); sadie.userData.face = true; scene.add(sadie);

  // the chandelier (with a feather toy someone has tied to it) and its light
  const CH = new Vector3(3.2, 7.6, 1.0);
  cyl(0.02, 0.02, TOPY - CH.y, 3, psx(null, { tint: 0xffd23a }), [CH.x, (TOPY + CH.y) / 2, CH.z]);
  const chand = new Group(); chand.position.copy(CH); scene.add(chand);
  { const tor = new Mesh(new TorusGeometry(0.6, 0.05, 4, 12), psx(null, { tint: 0xffd23a })); tor.rotation.x = Math.PI / 2; chand.add(tor);
    const hub = new Mesh(new SphereGeometry(0.16, 6, 4), psx(null, { tint: 0xffd23a })); chand.add(hub);
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; const c = new Mesh(new PlaneGeometry(0.1, 0.22), psx(T.candle, { unlit: 1, side: DoubleSide })); c.position.set(Math.cos(a) * 0.6, 0.14, Math.sin(a) * 0.6); chand.add(c);
      const cr = new Mesh(new SphereGeometry(0.05, 4, 2), psx(null, { tint: 0xd8f0ff, unlit: 0.6 })); cr.position.set(Math.cos(a + 0.4) * 0.6, -0.18, Math.sin(a + 0.4) * 0.6); chand.add(cr); } }
  const string = new Mesh(new CylinderGeometry(0.01, 0.01, 1.6, 3), psx(null, { tint: 0xffffff })); string.position.y = -0.8;
  const feather = new Mesh(new PlaneGeometry(0.22, 0.6).translate(0, -0.3, 0), psx(T.feather, { side: DoubleSide, unlit: 0.3 })); feather.position.y = -1.6;
  const toy = new Group(); toy.add(string); toy.add(feather); toy.position.set(0.3, 0, 0.3); chand.add(toy);

  const aw = ring(R - 1.2, -1.2), at = ring(R - 0.3, -0.25);
  const cams = {
    hall: { pos: [2.4, 1.6, -R + 1.2], at: [-0.8, 3.5, 3] },
    landing: { pos: [aw[0], L1 + 1.6, aw[1]], at: [at[0], L1 + 1.25, at[1]] },
  };
  return { scene, cams, sadie, toy, tarp: null, env: { sun: 0.15, bulb: 0.75, lamp: [CH.x, CH.y - 0.4, CH.z] } };
}

// ---------- the viewer ----------
export async function start(canvas, ui) {
  try { await Promise.race([Promise.all([document.fonts.load('8px Silkscreen'), document.fonts.load('20px "Patrick Hand"')]), new Promise(ok => setTimeout(ok, 2500))]); } catch {}
  const [sa, sn] = await Promise.all([img(P.sadie), img(P.sadieBlink)]);
  const T = drawAll(sa, sn);
  const worlds = { out: buildOutside(T), hall: buildHall(T) };
  const renderer = new WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.outputColorSpace = LinearSRGBColorSpace;
  const cam = new PerspectiveCamera(60, 1, 0.1, 400); cam.rotation.order = 'YXZ';
  const look = { dyaw: 0, dpitch: 0, drag: null };
  let view = 'outside';
  const worldOf = v => (v === 'outside' || v === 'invite') ? worlds.out : worlds.hall;

  let size = '';
  function resize() {
    const box = canvas.parentElement, w = box.clientWidth, h = box.clientHeight;
    if (!w || !h) return;
    const k = Math.max(1, Math.floor(Math.min(w, h) / 220));
    const iw = Math.ceil(w / k), ih = Math.ceil(h / k);
    if (size === iw + 'x' + ih) return; size = iw + 'x' + ih;
    renderer.setSize(iw, ih, false); res.set(iw, ih);
    cam.aspect = iw / ih;
    cam.fov = Math.min(88, Math.max(50, 2 * Math.atan(Math.tan(78 * Math.PI / 360) / cam.aspect) * 180 / Math.PI));
    cam.updateProjectionMatrix();
  }
  function frame(t) {
    resize();
    const W = worldOf(view), c = W.cams[view];
    env.sun.value = W.env.sun; env.bulb.value = W.env.bulb; lamp.set(...W.env.lamp);
    cam.position.set(...c.pos);
    const d = new Vector3(...c.at).sub(cam.position).normalize();
    const sway = Math.sin(t / 2400) * 0.025;
    cam.rotation.set(Math.asin(d.y) + look.dpitch, Math.atan2(-d.x, -d.z) + look.dyaw + sway, 0);
    if (W.sadie) W.sadie.rotation.y = Math.atan2(cam.position.x - W.sadie.position.x, cam.position.z - W.sadie.position.z);
    if (W.toy) W.toy.rotation.z = Math.sin(t / 700) * 0.18;
    if (W.tarp) W.tarp.rotation.z = 0.05 + Math.sin(t / 500) * 0.04;
    renderer.render(W.scene, cam);
  }
  let on = true;
  (function loop(t) { if (on) frame(t); requestAnimationFrame(loop); })(0);
  canvas.addEventListener('pointerdown', e => { look.drag = { x: e.clientX, y: e.clientY, yaw: look.dyaw, pitch: look.dpitch }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    if (!look.drag) return;
    look.dyaw = Math.max(-0.9, Math.min(0.9, look.drag.yaw + (e.clientX - look.drag.x) * 0.004));
    look.dpitch = Math.max(-0.5, Math.min(0.5, look.drag.pitch + (e.clientY - look.drag.y) * 0.004));
  });
  canvas.addEventListener('pointerup', () => { look.drag = null; });
  return {
    show(v) { view = v; look.dyaw = look.dpitch = 0; size = ''; frame(performance.now()); },
    resize() { size = ''; frame(performance.now()); },
  };
}

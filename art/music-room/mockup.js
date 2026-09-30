// Mock-up of the music room (not the game): a room full of instruments you play right where they
// stand, and Sadie now and then walking across one, in the clubhouse's crappy late-90s 3D. The
// PS1 material and the little canvas drawing tools are the mansion mock-up's (art/mansion/).
// Built into one page by art/music-room/build.mjs; pictures taken by art/music-room/shots.mjs.
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


C.teal = '#38b0c8'; C.teal2 = '#1a7890'; C.teal3 = '#70e0e8'; C.navy = '#141a58';

let WHITE;
const solid = (hex, o = {}) => psx(null, { ...o, tint: hex });

// a little eighth note
function note(g, x, y, c) { rect(g, c, x, y, 1, 6); rect(g, c, x - 2, y + 5, 3, 2); rect(g, c, x + 1, y, 2, 1); rect(g, c, x + 2, y + 1, 1, 2); }

// the toy piano's keys, seen from above: ten white keys with a letter sticker each (the computer
// key that plays it), seven black ones; one key chewed, one out of tune (the ? sticker)
function keys(lit = -1) {
  return tex(120, 40, g => {
    rect(g, C.ink, 0, 0, 120, 40);
    const white = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';'];
    white.forEach((k, i) => {
      const x = i * 12;
      rect(g, i === lit ? C.yellow : C.cream, x + 1, 0, 11, 40);
      rect(g, i === lit ? C.gold : C.lav, x + 1, 37, 11, 3);
      const out = i === 2;   // the out-of-tune one: Sadie's favourite
      rect(g, out ? C.pink : C.teal3, x + 2, 28, 9, 8);
      words(g, out ? '?' : k, x + 7, 29, 8, C.ink, { align: 'center', cut: 70 });
    });
    // the chewed one: a bite out of its front edge
    for (const [x, y, w] of [[88, 36, 5], [89, 35, 3], [90, 34, 1]]) rect(g, C.ink, x, y, w, 40 - y);
    const black = [['W', 0], ['E', 1], ['T', 3], ['Y', 4], ['U', 5], ['O', 7], ['P', 8]];
    for (const [k, i] of black) {
      const x = i * 12 + 8;
      rect(g, C.black, x, 0, 9, 22); rect(g, C.slate2, x + 1, 0, 1, 21);
      words(g, k, x + 5, 13, 8, C.lav2, { align: 'center', cut: 70 });
    }
  });
}

function drawAll(sadie, sadieBlink) {
  WHITE = tex(1, 1, g => rect(g, '#fff', 0, 0, 1, 1));
  const T = {};
  // wallpaper: teal, with music notes and the odd fish bone in the pattern
  T.paper = tex(24, 24, g => {
    rect(g, C.teal, 0, 0, 24, 24); dith(g, C.teal, C.teal3, 0, 0, 24, 24, 0.18);
    note(g, 5, 3, C.teal2); note(g, 17, 14, C.teal2);
    const m = C.teal2;
    rect(g, m, 13, 5, 6, 1); for (const x of [14, 16]) rect(g, m, x, 3, 1, 5); rect(g, m, 19, 4, 2, 3); rect(g, m, 12, 4, 1, 3);
    for (const [x, y] of [[4, 17], [21, 2]]) { rect(g, C.gold, x, y, 1, 1); rect(g, C.teal3, x - 1, y + 1, 3, 1); rect(g, C.gold, x, y + 2, 1, 1); }
  });
  T.wainscot = tex(16, 16, g => { rect(g, C.plum, 0, 0, 16, 16); rect(g, C.plum2, 1, 2, 14, 12); rect(g, C.pink3, 2, 3, 12, 10); rect(g, C.plum, 3, 4, 10, 8); rect(g, C.gold2, 0, 0, 16, 1); });
  // floor: a stage-ish wooden floor
  T.floor = tex(16, 16, g => {
    rect(g, C.tan2, 0, 0, 16, 16);
    for (let y = 0; y < 16; y += 4) { rect(g, C.tan3, 0, y, 16, 1); rect(g, C.tan3, (y * 3) % 16, y, 1, 4); }
    speckle(g, C.tan, 0, 0, 16, 16, 18, 8);
  });
  T.ceiling = tex(16, 16, g => { rect(g, C.plum2, 0, 0, 16, 16); speckle(g, C.gold, 0, 0, 16, 16, 3, 5); speckle(g, C.lav3, 0, 0, 16, 16, 4, 9); });
  T.carpet = tex(8, 8, g => { rect(g, C.pink2, 0, 0, 8, 8); dith(g, C.pink2, C.pink3, 0, 0, 8, 8, 0.3); speckle(g, C.pink, 0, 0, 8, 8, 6, 3); });
  T.wood = tex(16, 16, g => { rect(g, C.tan2, 0, 0, 16, 16); for (let y = 0; y < 16; y += 4) rect(g, C.tan3, 0, y, 16, 1); speckle(g, C.tan, 0, 0, 16, 16, 16, 8); });
  T.keys = keys(); T.keysLit = keys(4);
  // the piano's front: pink lacquer, a gold maker's name, a gold trim
  T.piano = tex(96, 32, g => {
    rect(g, C.pink2, 0, 0, 96, 32); dith(g, C.pink2, C.pink, 0, 0, 96, 32, 0.2);
    rect(g, C.gold, 0, 0, 96, 2); rect(g, C.gold2, 0, 30, 96, 2);
    rect(g, C.pink3, 4, 13, 88, 15); rect(g, C.pink2, 5, 14, 86, 13);
    words(g, 'TINKLE-TONE JR.', 48, 3, 8, C.gold, { align: 'center', shadow: C.pink3 });
    // claw marks down one side (it's hers)
    for (const x of [82, 85, 88]) for (let y = 7; y < 25; y++) if ((x + y) % 5) rect(g, '#ffd0ea', x + (y > 16 ? 1 : 0), y, 1, 1);
  });
  T.songbook = tex(48, 32, g => {
    rect(g, C.tan3, 0, 0, 48, 32); rect(g, C.cream, 1, 1, 23, 30); rect(g, C.white, 24, 1, 23, 30);
    words(g, 'FEED ME', 12, 3, 8, C.plum, { align: 'center', cut: 70 }); words(g, 'NOW', 12, 10, 8, C.red, { align: 'center', cut: 70 });
    for (const y of [20, 23, 26]) rect(g, C.grey, 3, y, 19, 1);
    for (const [x, y] of [[6, 16], [11, 19], [16, 14]]) note(g, x, y, C.ink);
    for (const y of [5, 9, 13, 17, 21, 25]) { rect(g, C.grey, 27, y, 18, 1); }
    for (const [x, y] of [[30, 2], [36, 6], [42, 10], [33, 14], [39, 18]]) note(g, x, y, C.ink);
  });
  // the bass drum's front: THE PAWS, with a blanket stuffed in (it's a bed)
  T.head = tex(48, 48, g => {
    for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) {
      const r = Math.hypot(x - 23.5, y - 23.5);
      if (r < 21) rect(g, C.cream, x, y, 1, 1); else if (r < 24) rect(g, (Math.floor(Math.atan2(y - 23.5, x - 23.5) * 5) % 2) ? C.red : C.gold, x, y, 1, 1);
    }
    words(g, 'THE', 24, 10, 8, C.plum, { align: 'center' }); words(g, 'PAWS', 24, 19, 8, C.red, { align: 'center', shadow: C.plum });
    const p = C.pink2, px = 20, py = 30;
    rect(g, p, px, py + 4, 8, 5); for (const [x, y] of [[-2, 1], [1, -1], [5, -1], [8, 1]]) rect(g, p, px + x, py + y, 2, 2);
  });
  T.blanket = tex(16, 16, g => {
    rect(g, '#8ac8ff', 0, 0, 16, 16);
    for (let i = 0; i < 16; i += 6) { rect(g, C.cream, i, 0, 2, 16); rect(g, C.cream, 0, i, 16, 2); }
    for (let i = 3; i < 16; i += 6) { rect(g, '#4a88d8', i, 0, 1, 16); rect(g, '#4a88d8', 0, i, 16, 1); }
  });
  T.fur = tex(16, 16, g => {   // the snare's top: white, and covered in her fur
    rect(g, C.white, 0, 0, 16, 16); dith(g, C.white, C.lav, 0, 0, 16, 16, 0.2);
    let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 26; i++) { const x = Math.floor(r() * 14), y = Math.floor(r() * 15), c = [C.grey, C.tan, C.lav3][i % 3]; rect(g, c, x, y, 2, 1); rect(g, c, x + 1, y + 1, 1, 1); }
  });
  T.shell = tex(16, 8, g => { rect(g, C.pink2, 0, 0, 16, 8); rect(g, C.pink, 0, 1, 16, 1); rect(g, C.gold, 0, 0, 16, 1); rect(g, C.gold, 0, 7, 16, 1); for (let x = 1; x < 16; x += 5) rect(g, C.lav, x, 2, 1, 5); });
  T.brass = tex(8, 8, g => { rect(g, C.gold, 0, 0, 8, 8); dith(g, C.gold, C.yellow, 0, 0, 8, 8, 0.3); rect(g, C.gold2, 0, 3, 8, 1); });
  T.chrome = tex(8, 8, g => { rect(g, C.lav2, 0, 0, 8, 8); rect(g, C.white, 2, 0, 1, 8); rect(g, C.grey, 6, 0, 1, 8); });
  // a xylophone bar that's a fish
  T.fish = tex(24, 10, g => {
    for (let x = 2; x < 19; x++) { const h = Math.round(4 * Math.sin((x - 2) / 17 * Math.PI)); rect(g, C.white, x, 5 - h, 1, h * 2); }
    for (let y = 1; y < 9; y++) { const w = 4 - Math.abs(y - 5); if (w > 0) rect(g, C.white, 19, y, w + 1, 1); }
    rect(g, C.ink, 6, 3, 1, 1); rect(g, C.lav3, 9, 2, 1, 6); rect(g, C.lav3, 13, 2, 1, 6);
  });
  T.pompom = tex(8, 8, g => { rect(g, C.pink, 0, 0, 8, 8); speckle(g, '#ffd0ea', 0, 0, 8, 8, 14, 2); speckle(g, C.pink2, 0, 0, 8, 8, 10, 5); });
  // the synth: a KEYCAT 3000 with silly sounds, and a demo that stops after three notes
  T.synth = tex(96, 36, g => {
    rect(g, '#2a2a40', 0, 0, 96, 36); rect(g, '#3a3a58', 0, 0, 96, 1);
    words(g, 'KEYCAT 3000', 3, 2, 8, C.pink, { cut: 70 });
    rect(g, '#60a060', 56, 2, 36, 8); rect(g, '#a8e0a0', 57, 3, 34, 6); words(g, 'CAT', 60, 2, 8, '#204020', { cut: 70 });
    const btn = [['CAT', C.gold], ['BIRD', C.teal3], ['BELL', C.lav2], ['CAN', C.green]];
    btn.forEach(([l, c], i) => { rect(g, c, 3 + i * 13, 11, 11, 4); words(g, l, 8 + i * 13, 11, 5, C.ink, { align: 'center', cut: 40 }); });
    rect(g, C.red, 58, 11, 18, 5); words(g, 'DEMO', 67, 11, 5, C.white, { align: 'center', cut: 40 });
    for (let i = 0; i < 16; i++) rect(g, C.cream, i * 6, 18, 5, 18);
    for (const i of [0, 1, 3, 4, 5, 7, 8, 10, 11, 12, 14]) rect(g, C.black, i * 6 + 4, 18, 3, 10);
  });
  // the tape deck: a chunky boom box with Sadie's tape in it
  T.tape = tex(160, 80, g => {
    rect(g, C.grey2, 0, 0, 160, 80); rect(g, C.grey, 2, 2, 156, 76); dith(g, C.grey, C.lav2, 2, 2, 156, 20, 0.3);
    for (const cx of [28, 132]) for (let y = 22; y < 78; y++) for (let x = cx - 24; x < cx + 24; x++) {
      const r = Math.hypot(x - cx, y - 48);
      if (r < 23) rect(g, r < 8 ? C.pink3 : (r < 20 ? ((x + y) % 2 ? C.black : C.slate2) : C.black), x, y, 1, 1);
    }
    rect(g, C.black, 54, 24, 52, 44); rect(g, '#7a88a0', 56, 26, 48, 40);
    rect(g, C.cream, 59, 29, 42, 20); words(g, 'SADIE', 80, 30, 8, C.plum, { align: 'center', cut: 70 }); words(g, 'LIVE!', 80, 39, 8, C.red, { align: 'center', cut: 70 });
    for (const x of [66, 86]) { rect(g, C.white, x, 53, 8, 8); rect(g, C.black, x + 3, 56, 2, 2); }
    const keysTop = [[C.red, 'REC'], [C.green, 'PLAY'], [C.cream, 'STOP'], [C.gold, 'LOOP']];
    keysTop.forEach(([c, l], i) => { const x = 6 + i * 38; rect(g, C.black, x, 4, 36, 15); rect(g, c, x + 1, 4, 34, 12); words(g, l, x + 18, 6, 8, C.ink, { align: 'center', cut: 70 }); });
    words(g, 'TAPE-O-MATIC', 80, 69, 8, C.ink, { align: 'center', cut: 70 });
  });
  T.cassette = tex(64, 40, g => { rect(g, C.ink, 0, 0, 64, 40); rect(g, C.pink, 2, 2, 60, 36); rect(g, C.white, 5, 4, 54, 20); words(g, 'SADIE', 32, 5, 8, C.plum, { align: 'center', cut: 70 }); words(g, 'LIVE!', 32, 14, 8, C.red, { align: 'center', cut: 70 }); for (const x of [16, 40]) rect(g, C.ink, x, 27, 8, 8); });
  // the volume dial on the wall: a big 90s knob that remembers where you left it
  T.dial = tex(48, 60, g => {
    rect(g, C.black, 0, 0, 48, 60); rect(g, C.lav, 1, 1, 46, 58);
    for (let a = 0; a < 11; a++) { const th = (-135 + a * 27) * Math.PI / 180, x = 24 + Math.sin(th) * 20, y = 26 - Math.cos(th) * 20; rect(g, a < 4 ? C.green2 : (a > 8 ? C.red : C.plum), Math.round(x) - 1, Math.round(y) - 1, 2, 2); }
    for (let y = 0; y < 60; y++) for (let x = 0; x < 48; x++) { const r = Math.hypot(x - 24, y - 26); if (r < 15) rect(g, r > 13 ? C.plum2 : ((x + y) % 3 ? C.plum : C.pink3), x, y, 1, 1); }
    const th = -80 * Math.PI / 180; for (let k = 3; k < 13; k++) rect(g, C.gold, Math.round(24 + Math.sin(th) * k), Math.round(26 - Math.cos(th) * k), 2, 2);
    words(g, 'VOLUME', 24, 44, 8, C.ink, { align: 'center', cut: 70 });
    words(g, 'SOFT', 6, 1, 5, C.green2, { cut: 40 });
  });
  // the band poster
  T.poster = tex(48, 64, g => {
    rect(g, C.black, 0, 0, 48, 64); bands(g, [C.plum, C.pink3, C.red], 1, 1, 46, 62);
    words(g, 'SADIE', 24, 2, 8, C.gold, { align: 'center', shadow: C.black });
    words(g, '& THE PAWS', 24, 11, 5, C.yellow, { align: 'center', cut: 40 });
    g.drawImage(sadie, 5, 18, 38, 31);
    words(g, 'LIVE! 1 NITE', 24, 51, 5, C.white, { align: 'center', cut: 40 });
    words(g, 'ONLY 1996', 24, 57, 5, C.white, { align: 'center', cut: 40 });
  });
  T.window = tex(32, 40, g => {
    rect(g, C.tan3, 0, 0, 32, 40); bands(g, [C.sky1, C.navy, '#3a2a90'], 2, 2, 28, 36);
    for (let y = 0; y < 40; y++) for (let x = 0; x < 32; x++) if (Math.hypot(x - 22, y - 10) < 4 && Math.hypot(x - 20, y - 9) > 3.4) rect(g, C.yellow, x, y, 1, 1);
    speckle(g, C.white, 2, 2, 28, 36, 14, 4);
    rect(g, C.cream, 15, 2, 2, 36); rect(g, C.cream, 2, 19, 28, 2); rect(g, C.cream, 0, 0, 32, 2); rect(g, C.cream, 0, 38, 32, 2);
  });
  T.door = tex(24, 48, g => {
    rect(g, C.gold2, 0, 0, 24, 48); rect(g, C.plum, 1, 1, 22, 47);
    for (const [y, h] of [[4, 16], [24, 14]]) { rect(g, C.plum2, 4, y, 16, h); rect(g, C.pink3, 5, y + 1, 14, h - 2); rect(g, C.plum, 6, y + 2, 12, h - 4); }
    rect(g, C.gold, 19, 24, 2, 3);
  });
  // the sign on the door's handle: this side lets her in, the other side says SHH
  T.sign = tex(32, 24, g => {
    rect(g, '#b87838', 0, 0, 32, 24); rect(g, '#d8a060', 1, 1, 30, 22);
    words(g, 'SADIE', 16, 3, 8, C.plum, { align: 'center', cut: 70 }); words(g, 'WELCOME', 16, 11, 5, C.green3, { align: 'center', cut: 40 });
    const p = C.pink2; rect(g, p, 13, 18, 5, 3); for (const x of [12, 14, 16, 18]) rect(g, p, x, 16, 1, 1);
  });
  T.cushion = tex(16, 16, g => { rect(g, C.pink, 0, 0, 16, 16); dith(g, C.pink, C.pink2, 0, 0, 16, 16, 0.3); rect(g, C.gold, 7, 7, 2, 2); });
  T.label = tex(48, 10, g => { rect(g, C.tan3, 0, 0, 48, 10); words(g, 'THEREMIN', 24, 1, 8, C.yellow, { align: 'center', cut: 70 }); });
  T.mirror = tex(16, 16, g => { for (let y = 0; y < 16; y += 2) for (let x = 0; x < 16; x += 2) rect(g, [C.white, C.lav2, C.lav3, C.teal3, C.pink][(x * 3 + y * 7) % 5], x, y, 2, 2); });
  T.notes = [C.gold, C.pink, C.teal3].map(c => tex(10, 12, g => { rect(g, c, 6, 0, 2, 9); rect(g, c, 2, 8, 6, 4); rect(g, c, 8, 0, 2, 2); rect(g, c, 9, 2, 1, 3); rect(g, C.ink, 1, 9, 1, 2); }));
  T.sadie = tex(58, 47, g => g.drawImage(sadie, 0, 0));
  return T;
}

// ---------- building bits ----------
function kit(scene) {
  const add = (m, pos, rot, parent = scene) => { if (pos) m.position.set(...pos); if (rot) m.rotation.set(...rot); parent.add(m); return m; };
  return {
    add,
    box: (w, h, d, mat, pos, rot, p) => add(new Mesh(new BoxGeometry(w, h, d, 2, 2, 2), mat), pos, rot, p),
    plane: (w, h, mat, pos, rot, p, seg = 4) => add(new Mesh(new PlaneGeometry(w, h, seg, seg), mat), pos, rot, p),
    cyl: (r1, r2, h, n, mat, pos, rot, p) => add(new Mesh(new CylinderGeometry(r1, r2, h, n, 2), mat), pos, rot, p),
    ball: (r, mat, pos, p) => add(new Mesh(new SphereGeometry(r, 8, 6), mat), pos, null, p),
  };
}
const FLAT = [-Math.PI / 2, 0, 0];

function build(T) {
  const scene = new Scene(); scene.background = new Color(C.black);
  const { add, box, plane, cyl, ball } = kit(scene);
  const W = 12, D = 10, H = 4.6;   // the room: x -6..6, z -5..5
  const paper = (w) => psx(T.paper, { rx: w / 1.2, ry: H / 1.2 });
  plane(W, H, paper(W), [0, H / 2, -D / 2], null, scene, 8);
  plane(W, H, paper(W), [0, H / 2, D / 2], [0, Math.PI, 0], scene, 8);
  plane(D, H, paper(D), [-W / 2, H / 2, 0], [0, Math.PI / 2, 0], scene, 8);
  plane(D, H, paper(D), [W / 2, H / 2, 0], [0, -Math.PI / 2, 0], scene, 8);
  const wain = w => psx(T.wainscot, { rx: w / 0.9, ry: 1 });
  plane(W, 1, wain(W), [0, 0.5, -D / 2 + 0.03]);
  plane(W, 1, wain(W), [0, 0.5, D / 2 - 0.03], [0, Math.PI, 0]);
  plane(D, 1, wain(D), [-W / 2 + 0.03, 0.5, 0], [0, Math.PI / 2, 0]);
  plane(D, 1, wain(D), [W / 2 - 0.03, 0.5, 0], [0, -Math.PI / 2, 0]);
  plane(W, D, psx(T.floor, { rx: W / 1.6, ry: D / 1.6 }), [0, 0, 0], FLAT, scene, 12);
  plane(W, D, psx(T.ceiling, { rx: 6, ry: 5 }), [0, H, 0], [Math.PI / 2, 0, 0], scene, 8);

  // --- the toy piano, against the back wall ---
  const PX = -2.2, PZ = -4.65;
  const pink = solid(0xff8ec8), pinkDark = solid(0xe0509a), gold = psx(T.brass);
  box(2.3, 1.3, 0.6, pinkDark, [PX, 0.95, PZ]);
  box(2.4, 0.08, 0.66, pink, [PX, 1.64, PZ]);
  for (const dx of [-1.05, 1.05]) box(0.14, 0.3, 0.5, gold, [PX + dx, 0.15, PZ + 0.1]);
  box(2.3, 0.14, 0.46, pinkDark, [PX, 0.8, PZ + 0.52]);
  plane(2.2, 0.42, psx(T.keys), [PX, 0.875, PZ + 0.52], FLAT);
  const keysLit = plane(2.2, 0.42, psx(T.keysLit), [PX, 0.876, PZ + 0.52], FLAT);
  plane(2.3, 0.72, psx(T.piano), [PX, 1.25, PZ + 0.305]);
  plane(0.54, 0.36, psx(T.songbook), [PX, 1.2, PZ + 0.36], [-0.25, 0, 0]);
  box(0.8, 0.04, 0.08, gold, [PX, 1.02, PZ + 0.36]);
  // a stool, and Sadie's cushion beside it (her spot)
  cyl(0.28, 0.24, 0.5, 10, pink, [PX, 0.25, PZ + 1.35]);
  cyl(0.3, 0.3, 0.06, 10, psx(T.cushion), [PX, 0.53, PZ + 1.35]);
  cyl(0.45, 0.45, 0.12, 12, psx(T.cushion, { rx: 2, ry: 1 }), [PX - 1.75, 0.06, PZ + 0.8]);
  plane(0.7, 0.93, psx(T.poster), [PX, 2.65, -D / 2 + 0.05]);

  // --- the tape deck on its little table ---
  const TX = -0.2;
  box(0.95, 0.72, 0.5, psx(T.wood, { rx: 2, ry: 2 }), [TX, 0.36, -4.6]);
  box(0.84, 0.42, 0.24, solid(0x5e5c80), [TX, 0.93, -4.62]);
  plane(0.84, 0.42, psx(T.tape), [TX, 0.93, -4.495]);
  box(0.14, 0.08, 0.14, solid(0xb8b8c8), [TX, 1.17, -4.62]);
  box(0.36, 0.035, 0.24, solid(0xff8ec8), [TX + 0.28, 0.738, -4.28], [0, 0.3, 0]);
  plane(0.34, 0.22, psx(T.cassette), [TX + 0.28, 0.757, -4.28], [-Math.PI / 2, 0, 0.3]);
  plane(0.62, 0.78, psx(T.dial), [1.05, 2.0, -D / 2 + 0.05]);

  // --- the drum kit on its rug, a bed as much as a drum kit ---
  const DX = 2.9, DZ = -3.0;
  const rug = new Mesh(new CircleGeometry(1.9, 20), psx(T.carpet, { rx: 6, ry: 6, decal: true })); rug.rotation.x = -Math.PI / 2; rug.position.set(DX, 0.01, DZ); scene.add(rug);
  const shell = psx(T.shell, { rx: 4, ry: 1 });
  cyl(0.48, 0.48, 0.42, 14, shell, [DX, 0.5, DZ], [Math.PI / 2, 0, 0]);
  add(new Mesh(new CircleGeometry(0.47, 16), psx(T.head)), [DX, 0.5, DZ + 0.215]);
  plane(0.62, 0.36, psx(T.blanket, { rx: 2, ry: 1, side: DoubleSide }), [DX + 0.08, 0.62, DZ + 0.24], [0.25, 0, -0.15]);
  plane(0.3, 0.3, psx(T.blanket, { side: DoubleSide }), [DX + 0.2, 0.43, DZ + 0.26], [0.05, 0, 0.5]);
  const chrome = psx(T.chrome);
  const drum = (r, h, x, y, z, tilt = 0) => {
    cyl(r, r, h, 12, shell, [x, y, z], [tilt, 0, 0]);
    cyl(r - 0.01, r - 0.01, 0.01, 12, psx(T.fur, { rx: 1, ry: 1 }), [x, y + h / 2 * Math.cos(tilt) + 0.005, z + h / 2 * Math.sin(tilt)], [tilt, 0, 0]);
    cyl(0.015, 0.015, y, 4, chrome, [x, y / 2, z]);
  };
  drum(0.26, 0.18, DX - 0.75, 0.7, DZ + 0.45, 0.15);   // the snare: covered in fur
  drum(0.2, 0.2, DX - 0.25, 0.98, DZ - 0.05, 0.35);
  drum(0.2, 0.2, DX + 0.3, 0.98, DZ - 0.05, 0.35);
  drum(0.3, 0.4, DX + 0.9, 0.42, DZ + 0.5);
  const cym = (r, x, y, z) => { cyl(0.015, 0.015, y, 4, chrome, [x, y / 2, z]); add(new Mesh(new CylinderGeometry(r * 0.1, r, 0.05, 14, 1), gold), [x, y, z], [0.2, 0, 0.1]); };
  cym(0.36, DX + 0.95, 1.45, DZ - 0.35);
  cym(0.24, DX - 1.25, 1.02, DZ + 0.2); add(new Mesh(new CylinderGeometry(0.24, 0.024, 0.04, 14, 1), gold), [DX - 1.25, 0.96, DZ + 0.2]);
  cyl(0.24, 0.2, 0.5, 10, solid(0x3a1858), [DX - 0.05, 0.25, DZ + 1.0]);

  // --- the xylophone: fish-shaped bars, mallets with pom-poms (cat toys, obviously) ---
  const XX = 0.4, XZ = -1.0, XY = 0.78;
  for (const dz of [-0.26, 0.26]) box(1.5, 0.06, 0.06, psx(T.wood), [XX, XY - 0.04, XZ + dz * (dz < 0 ? 1 : 0.7)]);
  for (const [dx, dz] of [[-0.68, -0.24], [0.68, -0.24], [-0.68, 0.2], [0.68, 0.2]]) box(0.05, XY, 0.05, psx(T.wood), [XX + dx, XY / 2, XZ + dz]);
  const rainbow = [0xff5a5a, 0xff9a3a, 0xffd23a, 0x58d04a, 0x40c0f0, 0x6a7aff, 0xb46aff, 0xff8ec8];
  rainbow.forEach((c, i) => {
    const len = 0.56 - i * 0.035, x = XX - 0.6 + i * 0.17;
    plane(0.16, len, psx(T.fish, { tint: c }), [x, XY + 0.01, XZ - 0.04], [-Math.PI / 2, 0, Math.PI / 2]);
  });
  for (const [dx, a] of [[-0.1, 0.5], [0.25, -0.3]]) {
    cyl(0.012, 0.012, 0.45, 4, psx(T.wood), [XX + dx, XY + 0.03, XZ + 0.36], [Math.PI / 2, 0, a]);
    ball(0.05, psx(T.pompom), [XX + dx - Math.sin(a) * 0.22, XY + 0.05, XZ + 0.36 - Math.cos(a) * 0.22]);
  }

  // --- the KEYCAT 3000 on its stand, turned to face the room ---
  const syn = new Group(); syn.position.set(4.3, 0, 0.4); syn.rotation.y = -1.0; scene.add(syn);
  for (const s of [1, -1]) box(0.05, 1.1, 0.05, chrome, [0.4 * s, 0.45, 0], [0.5, 0, 0], syn), box(0.05, 1.1, 0.05, chrome, [0.4 * s, 0.45, 0], [-0.5, 0, 0], syn);
  box(1.3, 0.1, 0.46, solid(0x2a2a40), [0, 0.92, 0], null, syn);
  plane(1.28, 0.46, psx(T.synth), [0, 0.972, 0], FLAT, syn);

  // --- the window, its wind chimes, and the theremin under it ---
  plane(1.2, 1.5, psx(T.window), [4.4, 2.35, -D / 2 + 0.04]);
  const chimeTop = [4.4, 3.35, -4.6];
  cyl(0.005, 0.005, 0.35, 3, chrome, [chimeTop[0], chimeTop[1] + 0.17, chimeTop[2]]);
  cyl(0.18, 0.18, 0.03, 10, psx(T.wood), chimeTop);
  [0.55, 0.7, 0.62, 0.8, 0.48].forEach((len, i) => {
    const th = i / 5 * Math.PI * 2, x = chimeTop[0] + Math.sin(th) * 0.13, z = chimeTop[2] + Math.cos(th) * 0.13;
    cyl(0.018, 0.018, len, 5, chrome, [x, chimeTop[1] - 0.05 - len / 2, z]);
  });
  plane(0.22, 0.1, psx(T.fish, { tint: 0x40c0f0, side: DoubleSide }), [chimeTop[0], chimeTop[1] - 1.05, chimeTop[2]]);
  const TH = [4.4, 0, -4.3];
  cyl(0.03, 0.03, 0.9, 5, chrome, [TH[0], 0.45, TH[2]]);
  cyl(0.25, 0.3, 0.04, 8, chrome, [TH[0], 0.02, TH[2]]);
  box(0.62, 0.18, 0.3, psx(T.wood), [TH[0], 0.98, TH[2]]);
  plane(0.58, 0.12, psx(T.label), [TH[0], 0.98, TH[2] + 0.155]);
  cyl(0.012, 0.012, 0.75, 4, chrome, [TH[0] + 0.26, 1.45, TH[2]]);
  add(new Mesh(new TorusGeometry(0.13, 0.012, 4, 10, Math.PI), chrome), [TH[0] - 0.33, 1.07, TH[2]], [0, Math.PI / 2, Math.PI / 2]);

  // --- the door (on the right wall), with Sadie's sign on its handle ---
  plane(1.2, 2.3, psx(T.door), [W / 2 - 0.04, 1.15, 2.2], [0, -Math.PI / 2, 0]);
  plane(0.42, 0.32, psx(T.sign), [W / 2 - 0.08, 1.02, 1.8], [0, -Math.PI / 2, 0.08]);

  // --- a mirror ball, because of course ---
  cyl(0.008, 0.008, 0.6, 3, chrome, [0.5, H - 0.3, 0]);
  const mb = ball(0.32, psx(T.mirror, { rx: 3, ry: 2, unlit: 0.4 }), [0.5, H - 0.75, 0]);

  // --- Sadie: on her cushion, or out on the keys; and the notes she makes ---
  const sprite = (w, h, mat) => new Mesh(new PlaneGeometry(w, h, 1, 1).translate(0, h / 2, 0), mat);
  const sadieCushion = add(sprite(0.9, 0.73, psx(T.sadie, { unlit: 0.35 })), [PX - 1.75, 0.12, PZ + 0.8]);
  const sadieKeys = add(sprite(0.78, 0.63, psx(T.sadie, { unlit: 0.35 })), [PX + 0.35, 0.88, PZ + 0.5]);
  const notes = [[-0.2, 1.55, 0], [0.25, 1.85, 1], [0.7, 1.6, 2], [0.45, 2.15, 0]].map(([dx, y, k]) => add(sprite(0.16, 0.19, psx(T.notes[k], { unlit: 0.6 })), [PX + dx, y, PZ + 0.55]));

  const cams = {
    room: { pos: [-4.6, 1.65, 4.3], at: [1.1, 1.0, -2.8], phone: { pos: [-3.2, 1.65, 4.3], at: [-0.6, 1.0, -3.5] } },
    piano: { pos: [PX, 1.62, PZ + 1.55], at: [PX, 0.95, PZ + 0.3], phone: { pos: [PX, 3.0, PZ + 1.35], at: [PX, 0.88, PZ + 0.42] } },
    sadie: { pos: [PX + 1.9, 1.45, PZ + 2.0], at: [PX + 0.1, 1.1, PZ + 0.4] },
    tape: { pos: [TX, 1.25, -3.55], at: [TX, 0.88, -4.6] },
  };
  const views = {
    room: { cushion: true, keys: false, notes: false, lit: false },
    piano: { cushion: true, keys: false, notes: false, lit: true },
    sadie: { cushion: false, keys: true, notes: true, lit: true },
    tape: { cushion: true, keys: false, notes: false, lit: false },
  };
  return {
    scene, cams, sprites: [sadieCushion, sadieKeys, ...notes], notes, mb,
    set(v) { const s = views[v]; sadieCushion.visible = s.cushion; sadieKeys.visible = s.keys; notes.forEach(n => (n.visible = s.notes)); keysLit.visible = s.lit; },
  };
}

// ---------- the viewer ----------
export async function start(canvas) {
  try { await Promise.race([document.fonts.load('8px Silkscreen'), new Promise(ok => setTimeout(ok, 2500))]); } catch {}
  const [sa, sb] = await Promise.all([img(P.sadie), img(P.sadieBlink)]);
  const T = drawAll(sa, sb);
  const room = build(T);
  env.sun.value = 0.2; env.bulb.value = 0.8; lamp.set(0.5, 3.6, -1.5);
  const renderer = new WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.outputColorSpace = LinearSRGBColorSpace;
  const cam = new PerspectiveCamera(60, 1, 0.1, 100); cam.rotation.order = 'YXZ';
  const look = { dyaw: 0, dpitch: 0, drag: null };
  let view = 'room', size = '';
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
    const c0 = room.cams[view], c = (cam.aspect < 0.8 && c0.phone) || c0;
    cam.position.set(...c.pos);
    const d = new Vector3(...c.at).sub(cam.position).normalize();
    const sway = Math.sin(t / 2400) * 0.02;
    cam.rotation.set(Math.asin(d.y) + look.dpitch, Math.atan2(-d.x, -d.z) + look.dyaw + sway, 0);
    for (const s of room.sprites) s.rotation.y = Math.atan2(cam.position.x - s.position.x, cam.position.z - s.position.z);
    room.notes.forEach((n, i) => { n.position.y += Math.sin(t / 600 + i * 1.7) * 0.0015; });
    room.mb.rotation.y = t / 4000;
    renderer.render(room.scene, cam);
  }
  (function loop(t) { frame(t); requestAnimationFrame(loop); })(0);
  canvas.addEventListener('pointerdown', e => { look.drag = { x: e.clientX, y: e.clientY, yaw: look.dyaw, pitch: look.dpitch }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    if (!look.drag) return;
    look.dyaw = Math.max(-0.9, Math.min(0.9, look.drag.yaw + (e.clientX - look.drag.x) * 0.004));
    look.dpitch = Math.max(-0.5, Math.min(0.5, look.drag.pitch + (e.clientY - look.drag.y) * 0.004));
  });
  canvas.addEventListener('pointerup', () => { look.drag = null; });
  return {
    show(v) { view = v; room.set(v); look.dyaw = look.dpitch = 0; size = ''; frame(performance.now()); },
    resize() { size = ''; frame(performance.now()); },
  };
}

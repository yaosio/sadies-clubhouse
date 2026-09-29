// The mansion's look: the PS1 material everything is drawn with, the see-through doorway material,
// and every texture, drawn right here on little canvases when the mansion opens.
//
// The PS1 look is all in psx(): corners snap to the pixel grid (the jitter), light is worked out
// per corner, and colours are cut down to a few levels with an ordered dither between them.
// (Textures used to swim too, like a real PS1's; the owner found it far too distracting.) Each place (outside, the hall, a room)
// has its own light: set it with light() before drawing that place.
import {
  Color, Vector2, Vector3, ShaderMaterial, CanvasTexture, NearestFilter, RepeatWrapping, FrontSide, BackSide,
} from 'three';

// the drawing size in pixels (the mansion keeps it up to date) and each place's light
export const res = new Vector2(320, 240);
const env = { sun: { value: 0.45 }, bulb: { value: 0 }, lamp: { value: new Vector3(0, 5, 0) } };
export function light({ sun, bulb, lamp }) { env.sun.value = sun; env.bulb.value = bulb; env.lamp.value.set(...lamp); }

const VS = `
uniform vec2 uRes; uniform vec2 uRep; uniform vec3 uLamp; uniform float uUnlit; uniform float uBulb; uniform float uSun;
varying vec2 vUv; varying float vLight;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vec4 p = projectionMatrix * viewMatrix * wp;
  // A corner almost exactly level with your eye (right beside you, like the ends of the walls along
  // a doorway you're standing in) loses so much precision that its whole wall or floor can draw
  // wrong for a frame. Counting it as just behind you instead changes nothing you can see.
  if (abs(p.w) < 0.002) p.w = -0.002;
  vec2 g = uRes * 0.5;
  // corners snap to the pixel grid: the jitter. Not corners level with your eye or behind it: there
  // the sum divides by almost nothing, and a whole wall or floor would vanish for a frame
  if (p.w > 0.3) p.xy = floor(p.xy / p.w * g + 0.5) / g * p.w;
  gl_Position = p;
  vec3 n = normalize(mat3(modelMatrix) * normal);
  float sun = max(dot(n, normalize(vec3(-0.45, 0.8, -0.5))), 0.0);
  vec3 toL = uLamp - wp.xyz; float d = length(toL);
  float bulb = max(dot(n, toL / d), 0.0) * clamp(1.5 - d * 0.09, 0.0, 1.0);
  vLight = mix(0.45 + uSun * sun + uBulb * bulb, 1.0, uUnlit);  // lit per corner
  vUv = uv * uRep;
}`;
const DITHER = `
float b2(vec2 a){ a = floor(a); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
float bayer(vec2 a){ return b2(0.5 * a) * 0.25 + b2(a); }`;
const FS = `
uniform sampler2D map; uniform vec3 tint; uniform float uLevels; uniform float uFade;
varying vec2 vUv; varying float vLight;
${DITHER}
void main(){
  vec4 c = texture2D(map, vUv);
  if (c.a < 0.5) discard;
  float d = bayer(gl_FragCoord.xy);
  if (d < uFade) discard;                                  // see-through the 90s way: skip some dots
  vec3 col = c.rgb * tint * vLight * 1.12;
  col = floor(col * uLevels + d) / uLevels;              // few colours, ordered dither between them
  gl_FragColor = vec4(col, 1.0);
}`;

let WHITE = null;
const made = [];     // everything to hand back to the graphics card when the mansion closes
export const keep = x => (made.push(x), x);
export function disposeLook() { for (const x of made.splice(0)) x.dispose(); WHITE = null; }

// o: rx, ry (texture repeats), tint, unlit (0-1), fade (0-1, see-through dots), side, decal (flat on
// a wall: pulled towards you in the depth test, so it doesn't flicker), onFloor (painted straight onto
// the floor under it: no depth test at all, drawn just after the floor, so it can never flicker even
// far away on a phone; give the floor renderOrder -2 and this -1)
export function psx(map, o = {}) {
  return keep(new ShaderMaterial({
    uniforms: {
      map: { value: map || WHITE }, uRes: { value: res }, uRep: { value: new Vector2(o.rx || 1, o.ry || 1) },
      tint: { value: new Color(o.tint ?? 0xffffff) }, uLamp: env.lamp, uUnlit: { value: o.unlit || 0 },
      uBulb: env.bulb, uSun: env.sun, uLevels: { value: 14 }, uFade: { value: o.fade || 0 },
    },
    vertexShader: VS, fragmentShader: FS, side: o.side ?? FrontSide,
    polygonOffset: !!o.decal, polygonOffsetFactor: -4, polygonOffsetUnits: -16,
    depthTest: !o.onFloor, depthWrite: !o.onFloor,
  }));
}

// A doorway: the inside of a shallow box behind the door's hole, showing the place on the other
// side, which was drawn into a picture the size of the screen just before. It's looked up by screen
// position, so every side of the box shows exactly what's through the door.
export function doorwayMat(picture) {
  return keep(new ShaderMaterial({
    uniforms: { pic: { value: picture }, uRes: { value: res }, uOn: { value: 0 } },
    vertexShader: `void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform sampler2D pic; uniform vec2 uRes; uniform float uOn;
      void main(){ gl_FragColor = uOn > 0.5 ? texture2D(pic, gl_FragCoord.xy / uRes) : vec4(0.04, 0.02, 0.1, 1.0); }`,
    side: BackSide,
  }));
}

// The sky outside: dithered bands from deep blue overhead to pink at the horizon.
export function skyMat() {
  return keep(new ShaderMaterial({
    side: BackSide, depthWrite: false,
    vertexShader: `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying vec3 vDir; ${DITHER}
      void main(){
        float h = clamp(normalize(vDir).y, 0.0, 1.0);
        vec3 top = vec3(0.10, 0.10, 0.50), mid = vec3(0.16, 0.38, 0.88), low = vec3(0.25, 0.75, 0.94), rim = vec3(1.0, 0.69, 0.85);
        vec3 c = h < 0.06 ? mix(rim, low, h / 0.06) : h < 0.3 ? mix(low, mid, (h - 0.06) / 0.24) : mix(mid, top, min(1.0, (h - 0.3) / 0.5));
        gl_FragColor = vec4(floor(c * 6.0 + bayer(gl_FragCoord.xy)) / 6.0, 1.0);
      }`,
  }));
}

// ---------- little canvas drawings ----------
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export function tex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  draw(g, w, h);
  const t = keep(new CanvasTexture(c));
  t.magFilter = t.minFilter = NearestFilter; t.generateMipmaps = false; t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}
const rect = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
// b's dots over a, `amt` of the way (0-1), in the ordered pattern
function dith(g, a, b, x, y, w, h, amt) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++)
    rect(g, BAYER[((y + j) % 4) * 4 + ((x + i) % 4)] / 16 < amt ? b : a, x + i, y + j, 1, 1);
}
// a run of bands, top to bottom, dithered from one to the next
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
// words in the kit's tiny 3x5 pixel font (the same one as the mock-ups), s pixels per dot: drawn
// straight into the picture, so they never wait for a web font to load
const FONT = {
 "A": "010101111101101", "B": "110101110101110", "C": "011100100100011", "D": "110101101101110",
 "E": "111100110100111", "F": "111100110100100", "G": "011100101101011", "H": "101101111101101",
 "I": "111010010010111", "J": "001001001101010", "K": "101101110101101", "L": "100100100100111",
 "M": "101111111101101", "N": "110101101101101", "O": "010101101101010", "P": "110101110100100",
 "Q": "010101101110011", "R": "110101110101101", "S": "011100010001110", "T": "111010010010010",
 "U": "101101101101111", "V": "101101101101010", "W": "101101111111101", "X": "101101010101101",
 "Y": "101101010010010", "Z": "111001010100111", "0": "111101101101111", "1": "010110010010111",
 "2": "110001010100111", "3": "110001010001110", "4": "101101111001001", "5": "111100110001110",
 "6": "011100111101111", "7": "111001010010010", "8": "111101111101111", "9": "111101111001110",
 ".": "000000000000010", "!": "010010010000010", "'": "010010000000000", "(": "001010010010001",
 ")": "100010010010100", "-": "000000111000000", "$": "011110010011110", ":": "000010000010000",
 "?": "110001010000010", "/": "001001010100100", " ": "000000000000000", "&": "010101010101011", "*": "000101010101000",
};
export const wordsWidth = (text, s = 1) => text.length * 4 * s - s;
export function words(g, text, x, y, s, color, o = {}) {
  if (o.align === 'center') x = Math.round(x - wordsWidth(text, s) / 2);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  for (const pass of o.shadow ? [o.shadow, color] : [color]) {
    const d = pass === color ? 0 : s;
    g.fillStyle = pass;
    let cx = x;
    for (const ch of text.toUpperCase()) {
      const bits = FONT[ch] || FONT['?'];
      for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (bits[j * 3 + i] === '1') g.fillRect(cx + i * s + d, y + j * s + d, s, s);
      cx += 4 * s;
    }
  }
  g.restore();
}
export const picture = im => tex(im.width, im.height, g => g.drawImage(im, 0, 0));   // a loaded picture, as a texture
// the back of an activity's door: its picture with the sign painted over in the door's own colour
export function doorBack(im) {
  return tex(im.width, im.height, g => {
    g.drawImage(im, 0, 0);
    const [r, gg, b] = g.getImageData(Math.round(im.width / 2), Math.round(im.height * 0.44), 1, 1).data;
    g.fillStyle = `rgb(${r},${gg},${b})`; g.fillRect(4, 4, im.width - 8, Math.round(im.height * 0.4));
  });
}
export const loadImage = src => new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });

// the palette: Sadie's own colours (white going lavender, grey, tan, pink) turned up loud
export const C = {
  ink: '#1c1238', cream: '#fff4e4', lav: '#e8dcff', lav2: '#c9b6f2', lav3: '#9c86d6', plum: '#5a2a78', plum2: '#3a1858',
  grey: '#8a88a8', grey2: '#5e5c80', slate: '#4a4a78', slate2: '#34305c', tan: '#e8b070', tan2: '#b87848', tan3: '#7a4a2a',
  pink: '#ff8ec8', pink2: '#e0509a', pink3: '#a02a70', gold: '#ffd23a', gold2: '#c89018', gold3: '#8a5a10',
  green: '#58d04a', green2: '#2a9a3a', green3: '#16602a', tarp: '#2a78e8', tarp2: '#1a4ab0', red: '#e83a3a', white: '#ffffff',
  black: '#120a24', yellow: '#fff08a',
};
const hex = n => '#' + n.toString(16).padStart(6, '0');

// Every texture the mansion uses. sadie, sadieNap: her sprite (the clubhouse's), awake and asleep.
export function drawTextures(sadie, sadieNap) {
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
  T.fanlight = tex(32, 12, g => {
    for (let y = 0; y < 12; y++) for (let x = 0; x < 32; x++) {
      const r = Math.hypot(x - 15.5, y - 12);
      if (r < 15.5) rect(g, r > 13.5 ? C.tan2 : r < 2 ? C.tan2 : (Math.floor(Math.atan2(y - 12, x - 15.5) * 3) % 2 ? C.gold : C.yellow), x, y, 1, 1);
    }
  });
  // the front door's two leaves: plum, gold studs, and a cat flap on the right one
  const leaf = flap => tex(16, 48, g => {
    rect(g, C.plum, 0, 0, 16, 48); rect(g, C.pink3, 0, 0, 1, 48); rect(g, C.plum2, 15, 0, 1, 48); rect(g, C.pink3, 0, 0, 16, 1);
    for (const [y, h] of [[4, 16], [24, 18]]) { rect(g, C.plum2, 2, y, 12, h); rect(g, C.pink3, 3, y + 1, 10, h - 2); rect(g, C.plum, 4, y + 2, 8, h - 4); }
    rect(g, C.gold, flap ? 1 : 13, 22, 2, 3);
    if (flap) { rect(g, C.tan3, 4, 37, 9, 10); rect(g, C.gold2, 5, 38, 7, 9); rect(g, '#d8b0e8', 6, 39, 5, 8); rect(g, C.lav3, 6, 39, 5, 1); }
  });
  T.leafL = leaf(false); T.leafR = leaf(true);
  T.mat = tex(32, 16, g => {
    rect(g, C.tan2, 0, 0, 32, 16); rect(g, C.tan, 1, 1, 30, 14); dith(g, C.tan, C.tan2, 2, 2, 28, 12, 0.25);
    words(g, 'FRIENDS', 16, 2, 1, C.tan3, { align: 'center' }); words(g, 'ONLY', 16, 9, 1, C.tan3, { align: 'center' });
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
  const sign = (w, h, a, b) => tex(w, h, g => {
    rect(g, C.black, 0, 0, w, h); rect(g, C.gold, 1, 1, w - 2, h - 2);
    for (let x = 0; x < w - 2; x++) for (const y of [1, 2, 3, h - 4, h - 3, h - 2]) rect(g, ((x + y) >> 2) % 2 ? C.black : C.gold, x + 1, y, 1, 1);
    words(g, a, w / 2, h / 2 - 11, 2, C.black, { align: 'center' });
    words(g, b, w / 2, h / 2 + 1, 2, C.red, { align: 'center' });
  });
  T.soonSign = sign(96, 32, 'MORE ROOMS', 'COMING SOON!!');
  T.wingSign = sign(72, 32, 'NEW WING', 'SOON!!');
  T.cat = tex(16, 16, g => {   // the weathervane: a sitting cat in black iron
    const k = C.ink;
    rect(g, k, 5, 7, 7, 8); rect(g, k, 6, 3, 5, 5); rect(g, k, 6, 1, 1, 2); rect(g, k, 10, 1, 1, 2); rect(g, k, 4, 12, 9, 3);
    rect(g, k, 12, 11, 2, 1); rect(g, k, 13, 8, 1, 3); rect(g, k, 14, 7, 1, 1); rect(g, C.gold, 7, 5, 1, 1); rect(g, C.gold, 9, 5, 1, 1);
  });
  // inside: damask wallpaper whose pattern is fish bones and paw prints, if you look closely
  T.damask = tex(24, 24, g => {
    rect(g, C.lav, 0, 0, 24, 24); dith(g, C.lav, C.cream, 0, 0, 24, 24, 0.25);
    const m = C.lav2;
    rect(g, m, 3, 5, 7, 1); for (const x of [4, 6, 8]) rect(g, m, x, 3, 1, 5); rect(g, m, 10, 4, 2, 3); rect(g, m, 1, 4, 1, 3); rect(g, m, 2, 5, 1, 1);
    rect(g, m, 15, 16, 4, 3); rect(g, m, 14, 14, 1, 1); rect(g, m, 16, 13, 1, 1); rect(g, m, 18, 13, 1, 1); rect(g, m, 20, 14, 1, 1); rect(g, m, 16, 15, 2, 1);
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
  T.cardboard = tex(16, 16, g => { rect(g, '#d8a060', 0, 0, 16, 16); for (let x = 0; x < 16; x += 2) rect(g, '#c89050', x, 0, 1, 16); rect(g, '#b87838', 0, 0, 16, 1); rect(g, C.red, 3, 6, 10, 1); rect(g, C.red, 3, 9, 10, 1); });
  T.sun = tex(16, 16, g => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (Math.hypot(x - 7.5, y - 7.5) < 7.5) rect(g, C.yellow, x, y, 1, 1); });
  T.feather = tex(8, 24, g => { for (let y = 0; y < 22; y++) { const w = Math.round(3.5 * Math.sin(y / 22 * Math.PI)); rect(g, y % 3 ? C.pink : '#ffd0ea', 4 - w, y, w * 2, 1); } rect(g, C.white, 4, 0, 1, 24); });
  T.cloud = tex(32, 12, g => {
    for (const [cx, cy, r] of [[8, 7, 5], [15, 5, 6], [23, 7, 5], [15, 8, 5]]) for (let y = 0; y < 12; y++) for (let x = 0; x < 32; x++) if (Math.hypot(x - cx, (y - cy) * 1.2) < r) rect(g, y > 8 ? '#f0e0ff' : C.white, x, y, 1, 1);
  });
  T.candle = tex(4, 8, g => { rect(g, C.cream, 1, 3, 2, 5); rect(g, C.yellow, 1, 0, 2, 3); rect(g, C.white, 1, 1, 1, 1); });
  T.dark = tex(4, 4, g => rect(g, C.ink, 0, 0, 4, 4));
  T.catdoor = tex(8, 8, g => { rect(g, C.gold2, 0, 1, 8, 7); rect(g, C.plum2, 1, 2, 6, 6); rect(g, C.gold2, 0, 0, 8, 1); rect(g, C.pink3, 2, 3, 4, 5); });
  T.boarded = tex(64, 104, g => {
    g.scale(2, 2);
    rect(g, C.gold2, 0, 0, 32, 52); rect(g, C.ink, 2, 2, 28, 50);
    for (const [y, a] of [[10, 1], [24, -1], [38, 1]]) for (let x = 0; x < 30; x++) rect(g, x % 9 ? C.tan : C.tan3, x + 1, y + Math.round(x * 0.25 * a) - (a > 0 ? 0 : -7), 1, 5);
    rect(g, C.black, 5, 26, 22, 11); rect(g, C.gold, 6, 27, 20, 9); words(g, 'SOON!', 32, 58, 2, C.red, { align: 'center' });
  });
  // Sadie's portraits: her sprite, in oils, in a gold frame
  function portrait(bg, bg2, label, ruff) {
    return tex(48, 56, g => {
      rect(g, C.gold3, 0, 0, 48, 56); rect(g, C.gold, 1, 1, 46, 54); rect(g, C.gold2, 4, 4, 40, 48);
      bands(g, [bg, bg2], 5, 5, 38, 38);
      if (ruff) for (let x = 0; x < 20; x++) rect(g, x % 2 ? C.white : C.lav, 14 + x, 37, 1, 3);
      if (sadie) g.drawImage(sadie, 5, 8, 38, 31);
      rect(g, C.gold3, 8, 44, 32, 8); rect(g, C.gold, 9, 45, 30, 6);
      words(g, label, 24, 45, 1, C.ink, { align: 'center' });
    });
  }
  T.duchess = portrait('#1a4a3a', '#0a2a20', 'DUCHESS', true);
  T.general = portrait('#6a1a2a', '#3a0a18', 'GENERAL', false);
  T.baby = portrait('#2a3a7a', '#1a1a4a', 'AGE 1', false);
  T.sadie = tex(58, 47, g => sadie && g.drawImage(sadie, 0, 0));
  T.nap = tex(58, 47, g => sadieNap && g.drawImage(sadieNap, 0, 0));
  // an old beige computer, and a keyboard
  T.beige = tex(8, 8, g => { rect(g, '#e8dcc0', 0, 0, 8, 8); speckle(g, '#d0c4a8', 0, 0, 8, 8, 8, 3); });
  T.keys = tex(16, 8, g => { rect(g, '#d0c4a8', 0, 0, 16, 8); for (let y = 1; y < 7; y += 2) for (let x = 1; x < 15; x += 2) rect(g, '#f4ecd8', x, y, 1, 1); });
  return T;
}

// An activity's door on the landing, in its box's colour, with its name on a sign.
export function doorTexture(card) {
  const col = hex(card.box?.side ?? 0x3aa04a), name = card.name.toUpperCase();
  return tex(64, 104, g => {
    rect(g, C.gold2, 0, 0, 64, 104); rect(g, C.tan3, 2, 2, 60, 102);
    rect(g, col, 6, 6, 52, 98); rect(g, '#00000040', 6, 6, 2, 98); rect(g, '#00000040', 56, 6, 2, 98);
    for (const y of [16, 60]) { rect(g, '#00000030', 12, y, 40, 34); rect(g, '#ffffff20', 14, y + 2, 36, 30); }
    rect(g, C.gold, 48, 54, 4, 4);
    // the sign: a brass plate; long names spill off it (it's that kind of house)
    rect(g, C.ink, 8, 20, 48, 26); rect(g, C.gold, 10, 22, 44, 22);
    const parts = name.split(' '), half = Math.ceil(parts.length / 2);
    words(g, parts.slice(0, half).join(' '), 32, 25, 1, C.ink, { align: 'center' });
    words(g, parts.slice(half).join(' '), 32, 34, 1, C.red, { align: 'center' });
  });
}

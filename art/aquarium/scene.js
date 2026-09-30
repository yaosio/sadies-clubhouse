// The aquarium room mock-up: a room in Sadie's mansion with a big fish tank along the back wall.
// Sadie swims in it in a little diving suit, with the fish. A sign taped to the glass says not to
// tap on it, and a cabinet on the side wall is where things found in the ocean will go.
// Built from the mansion's own pieces (its PS1 material, textures, font and shapes), so it looks
// like it belongs. Walkable: WASD or the thumb stick, drag to look.
import { WebGLRenderer, PerspectiveCamera, Scene, Color, Mesh, Group, PlaneGeometry, BoxGeometry, DoubleSide, LinearSRGBColorSpace } from 'three';
import { res, light, drawTextures, loadImage, psx, keep, tex, words, C, doorBack } from '../../src/clubhouse/look.js';
import { kit, wallGeometry } from '../../src/clubhouse/build.js';
import P from '../../src/clubhouse/pictures.js';
import { aquariumDoor } from './door.js';

const RW = 5, RD = 6, RH = 4.2;                    // the room: half its width and depth, its height
const TW = 3.6, T0 = 0.8, T1 = 3.2, GZ = 4.2, BZ = 5.9;   // the tank: half its width, its bottom and top, the glass and the back
const WATER = 3.02;                                  // the water's surface
const EYE = 1.55;
const px = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const dot = (x, y) => BAYER[(y % 4) * 4 + (x % 4)] / 16;
function oval(g, cx, cy, rx, ry, col, edge) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
    const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2;
    if (d <= 1) px(g, edge && d > 0.72 ? edge : col, x, y);
  }
}

// ---------- the pictures ----------
function fishPics() {
  const eye = (g, x, y) => { px(g, C.white, x, y, 2, 2); px(g, C.black, x + 1, y + 1, 1, 1); };
  return {
    gold: tex(20, 12, g => {
      for (let i = 0; i < 5; i++) px(g, '#ff7a2a', i, 6 - i, 1, 2 * i + 1 - Math.max(0, i - 3));
      oval(g, 11, 6, 7, 4.5, '#ff9a1e', '#e0501a'); px(g, '#ffe08a', 9, 7, 6, 2); px(g, '#ff7a2a', 9, 1, 4, 2); eye(g, 14, 4);
    }),
    tang: tex(20, 12, g => {
      for (let i = 0; i < 4; i++) px(g, C.gold, i, 5 - i, 1, 2 * i + 2);
      oval(g, 11, 6, 7.5, 5, '#2a6af0', '#1a3aa0'); px(g, C.ink, 7, 3, 7, 1); px(g, C.ink, 6, 4, 2, 4); px(g, C.gold, 5, 6, 3, 1); eye(g, 15, 4);
    }),
    angel: tex(16, 20, g => {
      for (let y = 0; y < 20; y++) { const w = Math.round(6 - Math.abs(y - 10) * 0.55); if (w > 0) px(g, y % 5 < 2 ? C.ink : C.yellow, 8 - w, y, w + 3, 1); }
      oval(g, 9, 10, 5, 4, C.yellow); px(g, C.ink, 7, 6, 2, 8); px(g, '#ffffff', 12, 8, 2, 2); px(g, C.black, 13, 9, 1, 1);
      for (let i = 0; i < 4; i++) px(g, C.yellow, 1 + i, 8 - i % 2, 1, 4 + i % 2);
    }),
    puffer: tex(16, 16, g => {
      for (let a = 0; a < 12; a++) { const t = a / 12 * Math.PI * 2; px(g, C.tan3, Math.round(8 + 7.2 * Math.cos(t)), Math.round(8 + 7.2 * Math.sin(t))); }
      oval(g, 8, 8, 6, 6, '#f8d860', C.tan2); px(g, '#fff4c0', 4, 9, 7, 3); eye(g, 10, 5); px(g, C.pink2, 13, 9, 2, 1);
      for (const [x, y] of [[5, 5], [7, 3], [4, 7]]) px(g, C.tan2, x, y);
    }),
    pink: tex(20, 12, g => {   // a pink fish, the colour of Dropper World's jelly
      px(g, C.pink2, 0, 2, 3, 8); px(g, C.pink2, 3, 4, 2, 4);
      oval(g, 12, 6, 7, 4, C.pink, C.pink2); px(g, '#ffd0ea', 10, 7, 6, 2); eye(g, 15, 4);
      for (const x of [8, 11]) px(g, '#ffd0ea', x, 3, 1, 1);
    }),
    silver: tex(16, 8, g => { px(g, '#8a88a8', 0, 1, 2, 6); px(g, '#8a88a8', 2, 3, 2, 2); oval(g, 9, 4, 6, 2.6, '#d8dcf0', '#8a88a8'); px(g, C.tarp, 6, 3, 6, 1); px(g, C.black, 12, 3, 1, 1); }),
  };
}

// Sadie in a diving suit: her sprite, with a fishbowl helmet, an air tank on her back and flippers
function scubaSadie(sadie, blink) {
  return tex(66, 60, g => {
    if (sadie) g.drawImage(blink || sadie, 4, 10);
    // flippers on her feet, and an air tank strapped on her back
    for (const fx of [15, 32]) { px(g, C.ink, fx, 55, 13, 5); px(g, C.gold, fx + 1, 56, 11, 3); px(g, '#fff08a', fx + 1, 56, 11, 1); }
    const ty = 26;
    px(g, C.ink, 11, ty, 20, 9); px(g, '#ff7a2a', 12, ty + 1, 18, 7); px(g, '#ffb070', 13, ty + 2, 16, 2); px(g, '#c04a10', 12, ty + 6, 18, 2);
    px(g, '#8a88a8', 30, ty + 2, 3, 4); px(g, C.ink, 30, ty + 2, 3, 1);
    for (const x of [16, 25]) px(g, C.ink, x, ty + 9, 2, 4);
    // the helmet: a fishbowl round her head, dithered glass with a shine, and a brass collar
    const cx = 46, cy = 28, r = 15.5;
    for (let y = 0; y < 60; y++) for (let x = 0; x < 66; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d > r - 1.2 && d <= r) px(g, '#dff6ff', x, y);
      else if (d > r - 2.2 && d <= r - 1.2 && (x + y) % 2) px(g, '#8ad8ff', x, y);
      else if (d < r - 1.2 && dot(x, y) < 0.1) px(g, '#bff0ff', x, y);
    }
    for (let a = 0; a < 9; a++) { const t = Math.PI * (1.1 + a * 0.05); px(g, C.white, Math.round(cx + (r - 4) * Math.cos(t)), Math.round(cy + (r - 4) * Math.sin(t)), 2, 1); }
    px(g, C.gold3, 34, 42, 25, 4); px(g, C.gold, 35, 42, 23, 2); for (const x of [37, 46, 55]) px(g, C.gold3, x, 42, 1, 1);
  });
}

function build(T, sadieImg, blinkImg) {
  const scene = new Scene(); scene.background = new Color(0x0a0628);
  const { add, box, plane, cyl, ball, cone } = kit(scene);
  const faces = [], swayers = [];

  // ---------- the room: sea-blue wallpaper, the wainscot and its rail, a rug, the door ----------
  const paper = psx(T.damask, { rx: 1 / 1.3, ry: 1 / 1.3, tint: 0xa8e0ff });
  add(new Mesh(wallGeometry(2 * RW, RH), paper), [0, 0, -RD]);
  add(new Mesh(wallGeometry(2 * RW, RH), paper), [0, 0, RD], [0, Math.PI, 0]);
  add(new Mesh(wallGeometry(2 * RD, RH), paper), [-RW, 0, 0], [0, Math.PI / 2, 0]);
  add(new Mesh(wallGeometry(2 * RD, RH), paper), [RW, 0, 0], [0, -Math.PI / 2, 0]);
  const side = (RW - 0.9) / 2 + 0.9, sw = RW - 0.9;
  for (const [w, pos, rot] of [[sw, [-side, 0.55, -RD + 0.04], 0], [sw, [side, 0.55, -RD + 0.04], 0], [2 * RD, [-RW + 0.04, 0.55, 0], Math.PI / 2], [2 * RD, [RW - 0.04, 0.55, 0], -Math.PI / 2]]) {
    plane(w, 1.1, psx(T.wainscot, { rx: w / 0.9, decal: true, tint: 0x9ad0ff }), pos, [0, rot, 0], 2);
    plane(w, 0.1, psx(null, { tint: 0xffd23a, decal: true }), [pos[0], 1.12, pos[2]], [0, rot, 0], 2);
  }
  plane(2 * RW, 2 * RD, psx(T.wood, { rx: 2 * RW / 1.2, ry: 2 * RD / 1.2 }), [0, 0, 0], [-Math.PI / 2, 0, 0], 8).renderOrder = -2;
  plane(2 * RW, 2 * RD, psx(null, { tint: 0xd8f4ff }), [0, RH, 0], [Math.PI / 2, 0, 0], 6);
  // a round rug with waves on it
  const rug = tex(32, 32, g => {
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      const d = Math.hypot(x - 15.5, y - 15.5);
      if (d < 15.5) px(g, d > 14 ? C.cream : Math.floor(d / 2.5 + Math.sin(Math.atan2(y - 15.5, x - 15.5) * 6) * 0.4) % 2 ? '#2a8ad0' : '#58c8f0', x, y);
    }
  });
  plane(3.2, 3.2, psx(rug, { onFloor: true }), [0, 0, 1.4], [-Math.PI / 2, 0, 0], 4).renderOrder = -1;
  // the door you came in by, with its gold frame
  // (inside, its sign is painted over, like every activity's door; the sign's on the landing side)
  const doorPic = aquariumDoor(), doorFront = tex(40, 64, g => g.drawImage(doorPic, 0, 0));
  plane(1.5, 2.45, psx(doorBack(doorPic)), [0, 1.225, -RD + 0.05], [0, 0, 0], 2);
  for (const [w, h, x, y] of [[0.12, 2.57, -0.81, 1.285], [0.12, 2.57, 0.81, 1.285], [1.74, 0.12, 0, 2.51]]) box(w, h, 0.1, psx(null, { tint: 0xffd23a }), [x, y, -RD + 0.05]);

  // ---------- a bit of the first landing, outside the door ----------
  const LZ = -RD - 0.03;   // the landing side of the front wall
  plane(2 * RW, RH, psx(T.damask, { rx: 2 * RW / 1.3, ry: RH / 1.3 }), [0, RH / 2, LZ], [0, Math.PI, 0], 4);
  plane(2 * RW, 1.1, psx(T.wainscot, { rx: 2 * RW / 0.9, decal: true }), [0, 0.55, LZ - 0.02], [0, Math.PI, 0], 2);
  plane(2 * RW, 0.1, psx(null, { tint: 0xffd23a, decal: true }), [0, 1.12, LZ - 0.02], [0, Math.PI, 0], 2);
  plane(2 * RW, 6, psx(T.carpet, { rx: 10, ry: 6 }), [0, 0, LZ - 3], [-Math.PI / 2, 0, 0], 6).renderOrder = -2;
  plane(2 * RW, 1.0, psx(T.rail, { rx: 10 }), [0, 0.5, LZ - 5.2], [0, 0, 0], 2);
  cyl(1.3, 1.3, 14, 10, psx(T.rope, { rx: 4, ry: 10 }), [0, 3, LZ - 9.5]);
  const frame = z => { for (const [w, h, x, y] of [[0.12, 2.57, -0.81, 1.285], [0.12, 2.57, 0.81, 1.285], [1.74, 0.12, 0, 2.51]]) box(w, h, 0.1, psx(null, { tint: 0xffd23a }), [x + z, y, LZ - 0.05]); };
  plane(1.5, 2.45, psx(doorFront), [0, 1.225, LZ - 0.06], [0, Math.PI, 0], 2); frame(0);
  for (const x of [-3.2, 3.2]) { plane(1.5, 2.45, psx(T.boarded), [x, 1.225, LZ - 0.06], [0, Math.PI, 0], 2); frame(x); }
  plane(0.36, 0.36, psx(T.catdoor, { decal: true }), [-1.15, 0.18, LZ - 0.06], [0, Math.PI, 0], 1);
  cyl(0.3, 0.42, 0.3, 8, psx(null, { tint: 0xfff08a, unlit: 0.85 }), [0, RH - 0.15, 0]);

  // on the left wall: a life ring from Sadie's boat, and a porthole (the ocean, later)
  const ring = tex(48, 48, g => {
    for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) {
      const d = Math.hypot(x - 23.5, y - 23.5), a = Math.atan2(y - 23.5, x - 23.5);
      if (d < 23.5 && d > 11) px(g, d > 22.5 || d < 12 ? '#a02030' : Math.floor((a + Math.PI) / (Math.PI / 2) + 0.5) % 2 ? C.white : C.red, x, y);
    }
    // the boat's name, painted round it on two white labels
    for (const [text, y] of [['S.S.', 3], ['SADIE', 40]]) { const w = text.length * 4 + 1; px(g, C.ink, 24 - w / 2 - 1, y - 2, w + 2, 9); px(g, C.cream, 24 - w / 2, y - 1, w, 7); words(g, text, 24, y, 1, C.ink, { align: 'center' }); }
  });
  plane(1.0, 1.0, psx(ring, { decal: true }), [-RW + 0.06, 2.3, -1.6], [0, Math.PI / 2, 0], 2);
  const porthole = tex(32, 32, g => {
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      const d = Math.hypot(x - 15.5, y - 15.5);
      if (d < 15.5) px(g, d > 12 ? (d > 14.5 ? C.gold3 : C.gold) : y < 15 ? (dot(x, y) < (15 - y) / 15 ? '#58c8f0' : '#8ad8ff') : dot(x, y) < (y - 15) / 16 ? '#1a3aa0' : '#2a6af0', x, y);
    }
    for (const a of [0, 1, 2, 3, 4, 5, 6, 7]) px(g, C.gold3, Math.round(15.5 + 13.2 * Math.cos(a * Math.PI / 4)), Math.round(15.5 + 13.2 * Math.sin(a * Math.PI / 4)));
    px(g, C.white, 8, 14, 16, 1); px(g, C.white, 9, 8, 3, 1);
  });
  plane(1.2, 1.2, psx(porthole, { decal: true, unlit: 0.3 }), [-RW + 0.06, 2.2, 1.2], [0, Math.PI / 2, 0], 2);

  // ---------- the tank: a cabinet, the water, the glass, the hood with its light ----------
  const wood = psx(T.wood, { rx: 4, ry: 1 });
  box(2 * TW + 0.3, T0, BZ - GZ + 0.3, wood, [0, T0 / 2, (GZ + BZ) / 2]);
  for (const x of [-2.4, 0, 2.4]) plane(2.1, 0.55, psx(T.wainscot, { rx: 2, decal: true }), [x, T0 / 2, GZ - 0.16], [0, Math.PI, 0], 2);
  const plate = tex(64, 10, g => { px(g, C.gold3, 0, 0, 64, 10); px(g, C.gold, 1, 1, 62, 8); words(g, "SADIE'S FISH", 32, 3, 1, C.ink, { align: 'center' }); });
  plane(1.3, 0.2, psx(plate, { decal: true }), [0, T0 - 0.1, GZ - 0.17], [0, Math.PI, 0], 1);
  // inside: the painted sea on the back, sand, and the water's blue
  const sea = tex(64, 32, g => {
    const cols = ['#58c8f0', '#2a8ad0', '#1a5ab0', '#123a80'];
    for (let y = 0; y < 32; y++) { const f = y / 31 * 3, k = Math.min(2, Math.floor(f)); for (let x = 0; x < 64; x++) px(g, dot(x, y) < f - k ? cols[k + 1] : cols[k], x, y); }
    for (let x = 0; x < 64; x++) { const h = 3 + Math.round(2 * Math.sin(x / 3) + 2 * Math.sin(x / 7.3)); px(g, '#0e2a60', x, 32 - h, 1, h); }
    for (const [x0, col] of [[6, C.pink2], [22, '#ff7a2a'], [41, C.pink], [55, '#ffd23a']]) for (let i = 0; i < 6; i++) px(g, col, x0 + Math.round(Math.sin(i) * 2), 26 - i, 2, 1);
    for (const x0 of [14, 33, 48]) for (let y = 12; y < 30; y++) px(g, '#16602a', x0 + Math.round(Math.sin(y / 2.5) * 1.5), y, 2, 1);
    for (const [x, y] of [[10, 6], [30, 3], [52, 9], [44, 4]]) px(g, '#dff6ff', x, y);
  });
  const blue = 0x9ad8ff;
  plane(2 * TW, T1 - T0, psx(sea, { unlit: 0.5 }), [0, (T0 + T1) / 2, BZ], [0, Math.PI, 0], 4);
  for (const s of [-1, 1]) plane(BZ - GZ, T1 - T0, psx(sea, { rx: 0.3, unlit: 0.45, tint: 0xc8e8ff }), [s * TW, (T0 + T1) / 2, (GZ + BZ) / 2], [0, -s * Math.PI / 2, 0], 2);
  const sand = tex(16, 16, g => { px(g, '#f0d890', 0, 0, 16, 16); for (let i = 0; i < 40; i++) px(g, i % 3 ? '#d8b868' : '#fff0c0', (i * 7) % 16, (i * 11) % 16); px(g, C.pink, 3, 12, 1, 1); px(g, C.lav3, 12, 5, 1, 1); });
  plane(2 * TW, BZ - GZ, psx(sand, { rx: 8, ry: 2, tint: 0xd8f0ff }), [0, T0 + 0.02, (GZ + BZ) / 2], [-Math.PI / 2, 0, 0], 4);
  // a castle, a treasure chest, a diving helmet that bubbles, coral and weed
  const stone = psx(T.stone, { rx: 1, ry: 1, tint: blue });
  box(0.7, 0.55, 0.45, stone, [-2.3, T0 + 0.3, 5.3]);
  for (const x of [-2.7, -1.9]) { cyl(0.16, 0.16, 0.85, 6, stone, [x, T0 + 0.45, 5.3]); cone(0.22, 0.32, 6, psx(null, { tint: 0xe0509a }), [x, T0 + 1.03, 5.3]); }
  box(0.22, 0.28, 0.05, psx(T.dark), [-2.3, T0 + 0.15, 5.07]);
  const chest = psx(T.wood, { rx: 1, tint: 0xc8a070 });
  box(0.5, 0.3, 0.34, chest, [1.4, T0 + 0.16, 5.25]);
  const lid = box(0.5, 0.08, 0.34, chest, [1.4, T0 + 0.38, 5.36], [-0.7, 0, 0]);
  box(0.52, 0.04, 0.36, psx(null, { tint: 0xffd23a }), [1.4, T0 + 0.26, 5.25]);
  for (const [x, z] of [[1.25, 5.05], [1.36, 4.98], [1.6, 5.02]]) cyl(0.05, 0.05, 0.02, 6, psx(null, { tint: 0xffd23a, unlit: 0.4 }), [x, T0 + 0.04, z]);
  const brass = psx(null, { tint: 0xe8b050 });
  const helmet = ball(0.26, brass, [2.8, T0 + 0.3, 5.1]);
  cyl(0.1, 0.1, 0.02, 8, psx(null, { tint: 0x2a3a80 }), [2.8, T0 + 0.32, 4.84], [Math.PI / 2, 0, 0]);
  box(0.4, 0.08, 0.36, brass, [2.8, T0 + 0.06, 5.1]);
  const weed = tex(8, 32, g => { for (let y = 0; y < 32; y++) { const x = 3 + Math.round(Math.sin(y / 4) * 2); px(g, y % 5 ? C.green : '#8af070', x, y, 2, 1); if (y % 6 === 2) px(g, C.green2, x + 2, y, 2, 1); } });
  for (const [x, z, h] of [[-3.3, 5.6, 1.5], [-1.2, 5.5, 1.1], [-0.6, 5.7, 1.7], [0.5, 5.4, 1.2], [2.2, 5.6, 1.6], [3.3, 5.2, 1.0], [-3.0, 4.7, 0.8], [0.1, 4.8, 0.7]]) {
    const m = new Mesh(keep(new PlaneGeometry(0.35, h, 1, 4).translate(0, h / 2, 0)), psx(weed, { side: DoubleSide, tint: 0xc8f0e0 }));
    m.position.set(x, T0 + 0.02, z); m.rotation.y = x * 0.7; scene.add(m); swayers.push([m, x * 1.3]);
  }
  for (const [x, z, c] of [[-1.6, 5.1, C.pink2], [0.9, 5.6, '#ff7a2a'], [3.1, 5.6, C.pink]]) {
    const col = parseInt(c.slice(1), 16);
    for (let i = 0; i < 3; i++) cyl(0.03, 0.05, 0.3 + i * 0.1, 4, psx(null, { tint: col }), [x + (i - 1) * 0.08, T0 + 0.16 + i * 0.05, z], [0, 0, (i - 1) * 0.4]);
  }
  // the water's surface (you only see it from above), the glass, and the frame round it
  const ripples = tex(16, 16, g => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(g, (Math.sin(x / 2.5 + Math.sin(y / 3) * 2) > 0.6) ? '#dff6ff' : '#58c8f0', x, y); });
  const surface = plane(2 * TW, BZ - GZ, psx(ripples, { rx: 10, ry: 3, fade: 0.25, side: DoubleSide, unlit: 0.4 }), [0, WATER, (GZ + BZ) / 2], [-Math.PI / 2, 0, 0], 6);
  const glass = psx(null, { tint: 0x7ad8ff, fade: 0.84, unlit: 0.5, side: DoubleSide });
  plane(2 * TW, WATER - T0, glass, [0, (T0 + WATER) / 2, GZ], [0, Math.PI, 0], 4);
  const trim = psx(null, { tint: 0x1c1238 });
  box(2 * TW + 0.12, 0.08, 0.08, trim, [0, T0 + 0.02, GZ]); box(2 * TW + 0.12, 0.08, 0.08, trim, [0, T1, GZ]);
  for (const s of [-1, 1]) box(0.08, T1 - T0, 0.08, trim, [s * TW, (T0 + T1) / 2, GZ]);
  // the hood on top, with its light, and a can of fish food Sadie has clearly been at
  // (the top is open, a rim along the front and a light bar along the back, so from above you see the water)
  const rim = psx(T.velvet, { rx: 6, tint: 0x3a8ad0 });
  box(2 * TW + 0.3, 0.3, 0.26, rim, [0, T1 + 0.15, GZ - 0.02]);
  box(2 * TW + 0.3, 0.3, 0.4, rim, [0, T1 + 0.15, BZ - 0.05]);
  for (const x of [-TW - 0.05, TW + 0.05]) box(0.2, 0.3, BZ - GZ, rim, [x, T1 + 0.15, (GZ + BZ) / 2]);
  const hood = tex(96, 12, g => { px(g, C.ink, 0, 0, 96, 12); px(g, '#2a6af0', 1, 1, 94, 10); words(g, "SADIE'S AQUARIUM", 48, 3, 1, C.yellow, { align: 'center', shadow: C.ink }); });
  plane(2.6, 0.26, psx(hood, { decal: true, unlit: 0.3 }), [0, T1 + 0.15, GZ - 0.16], [0, Math.PI, 0], 1);
  const food = tex(16, 16, g => { px(g, '#e83a3a', 0, 0, 16, 16); px(g, C.cream, 0, 5, 16, 7); words(g, 'FISH', 8, 6, 1, C.ink, { align: 'center' }); for (const x of [3, 5, 7]) px(g, C.ink, x, 1 + (x % 2), 1, 3); });
  cyl(0.12, 0.12, 0.3, 8, psx(food, { rx: 2 }), [3.2, T1 + 0.45, BZ - 0.05]);
  const shine = new Mesh(keep(new PlaneGeometry(2 * TW - 0.2, 0.06)), psx(null, { tint: 0xfff8c0, unlit: 1 }));
  shine.position.set(0, T1 - 0.01, BZ - 0.3); shine.rotation.x = Math.PI / 2; scene.add(shine);

  // ---------- the sign: cardboard taped to the glass, in Sadie's own capitals ----------
  const sign = tex(64, 48, g => {
    px(g, '#c89050', 0, 0, 64, 48); px(g, '#e8b878', 1, 1, 62, 46);
    for (let x = 1; x < 63; x += 3) px(g, '#d8a060', x, 1, 1, 46);
    words(g, "DON'T TAP", 32, 6, 2, C.red, { align: 'center' });
    words(g, 'ON THE', 32, 19, 2, C.red, { align: 'center' });
    words(g, 'GLASS!!', 32, 32, 2, C.red, { align: 'center' });
    for (const [x, y] of [[-2, -1], [56, -2], [-1, 42], [55, 41]]) { px(g, '#f8f0d0', x + 1, y + 2, 9, 5); px(g, '#e8dcb0', x + 1, y + 6, 9, 1); }
    const pw = [50, 42]; px(g, C.pink2, pw[0], pw[1] - 5, 4, 3); for (const [x, y] of [[-1, -7], [1, -8], [3, -8], [5, -7]]) px(g, C.pink2, pw[0] + x, pw[1] + y - 1, 1, 1);
  });
  plane(1.05, 0.79, psx(sign, { unlit: 0.25 }), [0.9, 2.25, GZ - 0.05], [0, Math.PI, 0.05], 2);

  // ---------- the cabinet of ocean finds, on the right wall ----------
  const cab = new Group(); cab.position.set(RW - 0.3, 0, 0.8); cab.rotation.y = -Math.PI / 2; scene.add(cab);
  const cpart = (mesh, pos) => { mesh.position.set(...pos); cab.add(mesh); return mesh; };
  const cbox = (w, h, d, mat, pos) => cpart(new Mesh(keep(new BoxGeometry(w, h, d, 2, 2, 2)), mat), pos);
  const cplane = (w, h, mat, pos) => cpart(new Mesh(keep(new PlaneGeometry(w, h, 2, 2)), mat), pos);
  const CW = 2.6, CH = 1.9, CB = 0.5;   // its width, height and how high it stands
  const dark = psx(T.wood, { rx: 2, tint: 0x9a6a50 });
  cbox(CW + 0.1, 0.08, 0.5, dark, [0, CB, 0]); cbox(CW + 0.1, 0.08, 0.5, dark, [0, CB + CH, 0]); cbox(CW + 0.1, 0.06, 0.5, dark, [0, CB + CH / 2, 0]);
  for (const x of [-CW / 2, -CW / 6, CW / 6, CW / 2]) cbox(0.06, CH, 0.5, dark, [x, CB + CH / 2, 0]);
  for (const x of [-CW / 2 + 0.05, CW / 2 - 0.05]) cbox(0.08, CB, 0.08, dark, [x, CB / 2, 0.15]);
  cplane(CW, CH, psx(T.velvet, { rx: 4, ry: 3, tint: 0x3a4ab0 }), [0, CB + CH / 2, -0.22]);
  const head = tex(64, 12, g => { px(g, C.gold3, 0, 0, 64, 12); px(g, C.gold, 1, 1, 62, 10); words(g, 'OCEAN FINDS', 32, 4, 1, C.ink, { align: 'center' }); });
  cplane(1.6, 0.3, psx(head, { unlit: 0.2 }), [0, CB + CH + 0.26, 0.2]);
  cbox(1.7, 0.36, 0.04, dark, [0, CB + CH + 0.26, 0.17]);
  const qmark = tex(16, 16, g => {
    for (let a = 0; a < 40; a++) { const t = a / 40 * Math.PI * 2; if (a % 3 !== 2) px(g, '#8a9af0', Math.round(7.5 + 7 * Math.cos(t)), Math.round(7.5 + 7 * Math.sin(t))); }
    words(g, '?', 5, 3, 2, '#8a9af0');
  });
  const finds = [
    ['SHELL', g => { for (let y = 0; y < 11; y++) { const w = Math.round(7 - y * 0.55); px(g, y % 2 ? C.pink : '#ffd0ea', 8 - w, 3 + y, w * 2, 1); } for (const x of [5, 8, 11]) px(g, C.pink2, x, 4, 1, 8); px(g, C.pink2, 6, 13, 4, 2); }],
    ['BOTTLE', g => { px(g, '#16602a', 3, 5, 10, 6); px(g, '#58d04a', 4, 6, 8, 4); px(g, '#16602a', 13, 7, 2, 2); px(g, C.tan2, 15, 7, 1, 2); px(g, C.cream, 5, 7, 5, 2); }],
    ['ANCHOR', g => { px(g, C.slate, 7, 2, 2, 11); px(g, C.slate, 4, 4, 8, 1); oval(g, 8, 2, 1.8, 1.8, C.slate); px(g, C.slate, 2, 11, 12, 2); px(g, C.slate, 2, 9, 1, 2); px(g, C.slate, 13, 9, 1, 2); }],
    ['PEARL', g => { oval(g, 8, 11, 7, 3, C.lav3, C.plum); oval(g, 8, 6, 7, 3, C.lav2, C.plum); oval(g, 8, 9, 2.6, 2.6, C.white); px(g, C.cream, 7, 8, 1, 1); }],
    ['STARFISH', g => { for (let a = 0; a < 5; a++) for (let r = 0; r < 7; r++) { const t = -Math.PI / 2 + a * Math.PI * 2 / 5; px(g, r < 5 ? '#ff7a2a' : '#ffb070', Math.round(8 + r * Math.cos(t)), Math.round(8 + r * Math.sin(t)), 2, 2); } }],
    ['COIN', g => { oval(g, 8, 8, 6, 6, C.gold, C.gold3); words(g, 'S', 7, 6, 1, C.gold3); }],
  ].map(([name, draw]) => [name, tex(16, 16, draw)]);
  const slots = [];
  finds.forEach(([name, pic], i) => {
    const x = (i % 3 - 1) * CW / 3, y = CB + (i < 3 ? CH * 0.75 : CH * 0.25);
    const m = cpart(new Mesh(keep(new PlaneGeometry(0.46, 0.46)), psx(qmark, { unlit: 0.3 })), [x, y + 0.08, -0.05]);
    const label = n => tex(40, 9, g => { px(g, C.gold3, 0, 0, 40, 9); px(g, C.gold, 1, 1, 38, 7); words(g, n, 20, 2, 1, C.ink, { align: 'center' }); });
    const plateMat = psx(label('???'));
    cpart(new Mesh(keep(new PlaneGeometry(0.44, 0.1)), plateMat), [x, y - 0.3, 0.2]);
    slots.push({ m, pic, plateMat, empty: qmark, emptyPlate: plateMat.uniforms.map.value, fullPlate: label(name) });
  });
  function showFinds(on) {
    for (const s of slots) { s.m.material.uniforms.map.value = on ? s.pic : s.empty; s.m.material.uniforms.uUnlit.value = on ? 0.15 : 0.3; s.plateMat.uniforms.map.value = on ? s.fullPlate : s.emptyPlate; }
  }

  // ---------- the swimmers ----------
  const F = fishPics();
  const fish = [
    ['gold', 0.42, 2.2, 4.9, 0.7], ['gold', 0.36, 1.5, 5.4, 0.55], ['tang', 0.44, 2.6, 5.2, 0.8], ['angel', 0.36, 1.8, 4.7, 0.45],
    ['puffer', 0.34, 1.3, 5.0, 0.3], ['pink', 0.4, 2.45, 5.6, 0.6], ['silver', 0.3, 2.8, 4.6, 1.0], ['silver', 0.3, 2.72, 4.66, 1.0], ['tang', 0.38, 1.1, 5.7, 0.65],
  ].map(([kind, size, y, z, speed], i) => {
    const pic = F[kind], w = size * pic.image.width / 16, h = size * pic.image.height / 16;
    const m = new Mesh(keep(new PlaneGeometry(w, h)), psx(pic, { side: DoubleSide, tint: 0xd8f0ff }));
    m.position.set((i * 1.37) % 6 - 3, y, z); m.rotation.y = Math.PI; scene.add(m);
    return { m, y, v: speed * (i % 2 ? 1 : -1), phase: i * 1.7, lim: TW - w / 2 - 0.15, turn: 0 };
  });
  const scuba = scubaSadie(sadieImg), scubaBlink = scubaSadie(sadieImg, blinkImg);
  const sadie = new Mesh(keep(new PlaneGeometry(1.0, 0.91)), psx(scuba, { tint: 0xe8f6ff }));
  scene.add(sadie); faces.push(sadie);
  const bubble = tex(4, 4, g => { px(g, '#dff6ff', 1, 0, 2, 1); px(g, '#dff6ff', 0, 1, 1, 2); px(g, '#dff6ff', 3, 1, 1, 2); px(g, '#dff6ff', 1, 3, 2, 1); px(g, C.white, 1, 1, 1, 1); });
  const bubbles = Array.from({ length: 16 }, (_, i) => {
    const m = new Mesh(keep(new PlaneGeometry(0.07, 0.07)), psx(bubble, { unlit: 0.6 }));
    scene.add(m); faces.push(m);
    return { m, from: i % 2 ? 'sadie' : 'helmet', k: i / 16 };
  });
  // a little ! over Sadie's head when you tap
  const bang = tex(8, 16, g => { px(g, C.ink, 2, 0, 5, 16); px(g, C.yellow, 3, 1, 3, 9); px(g, C.yellow, 3, 12, 3, 3); });
  const alarm = new Mesh(keep(new PlaneGeometry(0.16, 0.32)), psx(bang, { unlit: 1 })); alarm.visible = false; scene.add(alarm); faces.push(alarm);
  // where you tapped: two rings on the glass
  const ringPic = tex(16, 16, g => { for (let a = 0; a < 48; a++) { const t = a / 48 * Math.PI * 2; px(g, C.white, Math.round(7.5 + 7 * Math.cos(t)), Math.round(7.5 + 7 * Math.sin(t))); } });
  const knock = new Mesh(keep(new PlaneGeometry(0.3, 0.3)), psx(ringPic, { unlit: 1, side: DoubleSide })); knock.visible = false; knock.rotation.y = Math.PI; scene.add(knock);

  let spook = 0, blinkAt = 3, blinkOff = 0, lookAtYou = 0;
  const sp = { x: 0, y: 2, z: 5.1, dir: 1 };
  function update(t, dt, cam) {
    // fish: back and forth along their lanes, bobbing, turning round at the ends; a tap scatters them
    const rush = 1 + 2.5 * Math.max(0, spook);
    for (const f of fish) {
      f.m.position.x += f.v * dt * rush;
      if (Math.abs(f.m.position.x) > f.lim) { f.m.position.x = Math.sign(f.m.position.x) * f.lim; f.v = -f.v; }
      f.m.position.y = f.y + Math.sin(t * 0.9 + f.phase) * 0.06 + (spook > 0 ? Math.sin(t * 9 + f.phase) * 0.03 : 0);
      f.m.scale.x = f.v < 0 ? 1 : -1;
    }
    // Sadie: a slow lazy loop round the tank, paddling
    const s = t * 0.16;
    const nx = Math.sin(s) * 2.3, ny = 1.95 + Math.sin(s * 2.1) * 0.35 + Math.sin(t * 1.3) * 0.04, nz = 5.1 + Math.cos(s) * 0.35;
    const vx = nx - sp.x; sp.x = nx; sp.y = ny; sp.z = nz;
    sadie.position.set(sp.x, sp.y, sp.z);
    const right = cam ? { x: Math.cos(cam.rotation.y), z: -Math.sin(cam.rotation.y) } : { x: 1, z: 0 };
    if (Math.abs(vx) > 1e-5) sp.dir = (vx * right.x) >= 0 ? 1 : -1;
    const facing = lookAtYou > 0 ? 1 : sp.dir;
    sadie.scale.x = facing; sadie.rotation.z = Math.sin(t * 1.3) * 0.08;
    if (t > blinkAt) { sadie.material.uniforms.map.value = scubaBlink; blinkOff = t + 0.15; blinkAt = t + 2.5 + Math.random() * 3; }
    if (blinkOff && t > blinkOff) { sadie.material.uniforms.map.value = scuba; blinkOff = 0; }
    alarm.visible = lookAtYou > 0; alarm.position.set(sp.x + 0.15, sp.y + 0.65, sp.z);
    // bubbles drifting up from her helmet and the diving helmet on the sand
    for (const b of bubbles) {
      b.k += dt * (b.from === 'sadie' ? 0.35 : 0.28);
      if (b.k > 1) b.k -= 1;
      const src = b.from === 'sadie' ? [sp.x + 0.2 * facing, sp.y + 0.3, sp.z] : [2.8, T0 + 0.5, 5.1];
      const top = WATER - 0.04, y = src[1] + (top - src[1]) * b.k;
      b.m.position.set(src[0] + Math.sin(b.k * 12 + b.from.length) * 0.05, y, src[2]);
      b.m.visible = y < top;
    }
    for (const [m, ph] of swayers) m.rotation.z = Math.sin(t * 0.8 + ph) * 0.08;
    surface.material.uniforms.map.value.offset.set(t * 0.03, t * 0.017);
    spook -= dt / 2.2; lookAtYou -= dt;
    if (knock.visible) { knock.userData.t += dt; const k = knock.userData.t; knock.scale.setScalar(1 + k * 3); knock.visible = k < 0.5; }
  }
  function tap(x, y) {
    spook = 1; lookAtYou = 3.2;
    knock.position.set(Math.max(-TW + 0.3, Math.min(TW - 0.3, x)), Math.max(T0 + 0.3, Math.min(WATER - 0.2, y)), GZ - 0.03);
    knock.userData.t = 0; knock.visible = true;
  }
  return { scene, faces, update, tap, showFinds };
}

export async function start(canvas) {
  const [awake, asleep] = await Promise.all([loadImage(P.sadie), loadImage(P.sadieBlink)]);
  const T = drawTextures(awake, asleep);
  const room = build(T, awake, asleep);
  const renderer = new WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(1); renderer.outputColorSpace = LinearSRGBColorSpace;
  const cam = new PerspectiveCamera(70, 1, 0.1, 100); cam.rotation.order = 'YXZ';
  light({ sun: 0.2, bulb: 0.8, lamp: [0, RH - 0.4, 1.5] });

  let drawnAt = '';
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    const k = Math.max(1, Math.floor(Math.min(w, h) / 220));
    const iw = Math.ceil(w / k), ih = Math.ceil(h / k);
    if (drawnAt === iw + 'x' + ih) return;
    drawnAt = iw + 'x' + ih;
    renderer.setSize(iw, ih, false); res.set(iw, ih);
    cam.aspect = iw / ih;
    cam.fov = Math.min(68, Math.max(55, 2 * Math.atan(Math.tan(80 * Math.PI / 360) / cam.aspect) * 180 / Math.PI));
    cam.updateProjectionMatrix();
  }

  // you: where you stand and look; walking stays on the floor and out of the furniture
  const me = { x: 0, z: -4.2, yaw: Math.PI, pitch: -0.05, bob: 0 };
  const PAD = 0.35;
  const free = (x, z) => me.z < -RD ? Math.abs(x) < RW - PAD && z < -RD - PAD && z > -RD - 5.1 + PAD : Math.abs(x) < RW - PAD && Math.abs(z) < RD - PAD
    && !(z > GZ - 0.2 - PAD && Math.abs(x) < TW + 0.2 + PAD)
    && !(x > RW - 0.6 - PAD && Math.abs(z - 0.8) < 1.4 + PAD);
  function walk(fwd, strafe, dt) {
    if (!fwd && !strafe) return;
    const sp = 2.4 * dt, fx = -Math.sin(me.yaw), fz = -Math.cos(me.yaw), rx = Math.cos(me.yaw), rz = -Math.sin(me.yaw);
    const dx = (fx * fwd + rx * strafe) * sp, dz = (fz * fwd + rz * strafe) * sp;
    if (free(me.x + dx, me.z + dz)) { me.x += dx; me.z += dz; }
    else if (free(me.x + dx, me.z)) me.x += dx;
    else if (free(me.x, me.z + dz)) me.z += dz;
    me.bob += dt * 9;
  }
  // near enough to tap: close to the glass and looking at it
  // or at the door and facing it, to go in or out
  const nearWhat = () => {
    const fz = -Math.cos(me.yaw);
    if (me.z < -RD) return me.z > -RD - 1.7 && Math.abs(me.x) < 1 && fz > 0.55 ? 'in' : null;
    if (me.z < -RD + 1.7 && Math.abs(me.x) < 1 && fz < -0.55) return 'out';
    return GZ - me.z < 1.9 && Math.abs(me.x) < TW && fz > 0.55 ? 'glass' : null;
  };
  function use(what) {
    if (what === 'in') { me.x = 0; me.z = -RD + 1.0; me.yaw = Math.PI; me.pitch = -0.05; }
    if (what === 'out') { me.x = 0; me.z = -RD - 1.0; me.yaw = 0; me.pitch = 0; }
  }

  // tapping: the rings, Sadie's look, then your view rises over the rim to the water's surface and dips in
  let dive = null;
  function tapGlass() {
    if (dive) return;
    const fx = -Math.sin(me.yaw), fz = -Math.cos(me.yaw), d = (GZ - me.z) / Math.max(0.2, fz);
    room.tap(me.x + fx * d, EYE + Math.tan(me.pitch) * d);
    dive = { t: 0, from: { ...me, y: EYE }, done: false };
  }
  function diveView(dt) {
    dive.t += dt;
    const t = dive.t, ease = k => k < 0 ? 0 : k > 1 ? 1 : k * k * (3 - 2 * k);
    const up = ease((t - 1.0) / 1.2);         // rising up past the rim
    const a = ease((t - 1.7) / 1.6);          // leaning over the water, looking down
    const b = ease((t - 3.4) / 0.8);          // dipping in
    const f = dive.from, tx = Math.max(-TW + 0.6, Math.min(TW - 0.6, f.x)), tz = (GZ + BZ) / 2 - 0.2;
    const x = f.x + (tx - f.x) * a, z = f.z + (tz - f.z) * a, y = f.y + (T1 + 0.75 - f.y) * up - (T1 + 0.75 - WATER + 0.12) * b;
    const turn = ((Math.PI - f.yaw + Math.PI) % (2 * Math.PI)) - Math.PI;
    cam.position.set(x, y, z);
    cam.rotation.set(f.pitch + (-1.35 - f.pitch) * a, f.yaw + turn * a, 0);
    if (t > 4.3 && !dive.done) { dive.done = true; hooks.onDived?.(); }
  }
  function back() { dive = null; }

  let last = performance.now() / 1000, t0 = last;
  const hooks = {};
  const held = new Set();
  function frame() {
    const now = performance.now() / 1000, dt = Math.min(0.05, now - last); last = now;
    resize();
    if (!dive) {
      const f = (held.has('f') ? 1 : 0) - (held.has('b') ? 1 : 0) + (hooks.stick?.().y || 0);
      const s = (held.has('r') ? 1 : 0) - (held.has('l') ? 1 : 0) + (hooks.stick?.().x || 0);
      if (held.has('tl')) me.yaw += 1.8 * dt; if (held.has('tr')) me.yaw -= 1.8 * dt;
      walk(Math.max(-1, Math.min(1, f)), Math.max(-1, Math.min(1, s)), dt);
      cam.position.set(me.x, EYE + Math.sin(me.bob) * 0.03, me.z);
      cam.rotation.set(me.pitch, me.yaw, 0);
      hooks.onNear?.(nearWhat());
    } else diveView(dt);
    cam.updateMatrixWorld();
    room.update(now - t0, dt, cam);
    for (const f of room.faces) f.rotation.y = Math.atan2(cam.position.x - f.position.x, cam.position.z - f.position.z);
    renderer.render(room.scene, cam);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return {
    me, held, hooks, tapGlass, back, use, showFinds: room.showFinds, resize: () => { drawnAt = ''; resize(); },
    turn(dx, dy) { if (dive) return; me.yaw -= dx; me.pitch = Math.max(-0.75, Math.min(0.75, me.pitch - dy)); },
    put(x, z, yaw, pitch = 0) { me.x = x; me.z = z; me.yaw = yaw; me.pitch = pitch; },
  };
}

// Lily's house's pictures, drawn on little canvases. Outside: a peach cottage with pink scalloped
// shingles like icing, orange trim, round windows, an orange door, a HI! HI! HI! doormat, and a
// trampoline. Inside: her real kitchen's look (pale gray walls, white baseboards, beige tile, a floor
// vent), her pink bed and bowls, a basket of rubber chickens; through the big doorway, the game room's
// 90s arcade carpet and dark starry walls. Her friends' pictures (Sadie, Chooter, Marbles, Toots).
import { paint, chickenPix, frontLily, chooterPortrait, CHOOTER } from './lily-art.js';
import { TOOTS, TOOTS_PAL } from './toots-pic.js';
const rect = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function dith(g, a, b, x, y, w, h, amt) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) rect(g, BAYER[((y + j) % 4) * 4 + ((x + i) % 4)] / 16 < amt ? b : a, x + i, y + j); }
function disc(g, c, cx, cy, r) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) rect(g, c, cx + x, cy + y); }
function paw(g, c, x, y) { disc(g, c, x + 2, y + 4, 2); for (const [i, j] of [[-1, 0], [1, -1], [3, -1], [5, 0]]) rect(g, c, x + i, y + j, 2, 2); }
function framed(g, w, h, bg) {
  rect(g, '#8a5a10', 0, 0, w, h); rect(g, '#ffd23a', 1, 1, w - 2, h - 2); rect(g, '#c89018', 2, 2, w - 4, h - 4);
  rect(g, '#fff4e4', 3, 3, w - 6, h - 6); rect(g, bg, 5, 5, w - 10, h - 10);
}
export const BOW_HEX = { pink: [0xff6fb4, 0xc63c86], orange: [0xff9a2a, 0xcc5e10] };

export function drawArt(m) {
  const { tex, words, C, T } = m, A = {};
  // ---------- outside ----------
  A.siding = tex(16, 16, g => { rect(g, '#ffc89e', 0, 0, 16, 16); for (let y = 0; y < 16; y += 4) { rect(g, '#e89c70', 0, y + 3, 16, 1); rect(g, '#ffe2c4', 0, y, 16, 1); } });
  // pink scalloped shingles, like icing on a cupcake
  A.shingles = tex(16, 16, g => {
    rect(g, '#ff8ec8', 0, 0, 16, 16);
    for (let y = 0; y < 16; y += 4) for (let x = (y / 4) % 2 ? 0 : 4; x < 20; x += 8) {
      for (let i = -3; i <= 3; i++) rect(g, '#e0509a', (x + i + 16) % 16, y + 3 - (Math.abs(i) > 2 ? 1 : 0));
      rect(g, '#ffc0e0', (x - 1 + 16) % 16, y + 1, 2, 1);
    }
  });
  // the front door: orange, a round window, a paw print, and a squeaky rubber-chicken knocker
  const door = (g, front) => {
    rect(g, '#ff9a3a', 0, 0, 24, 40); rect(g, '#d8701a', 0, 0, 24, 1); rect(g, '#d8701a', 0, 39, 24, 1);
    for (const [x, y, w, h] of [[3, 20, 8, 15], [13, 20, 8, 15]]) { rect(g, '#d8701a', x, y, w, h); rect(g, '#ffb460', x + 1, y + 1, w - 2, h - 2); }
    disc(g, '#ffffff', 12, 10, 6); disc(g, '#9ad0ff', 12, 10, 5); rect(g, '#ffffff', 10, 7, 2, 2);
    if (front) { paw(g, '#ffffff', 10, 25); rect(g, '#ffd23a', 19, 22, 3, 3); }
  };
  A.door = tex(24, 40, g => door(g, true));
  A.doorBack = tex(24, 40, g => door(g, false));
  // a round window's frame (the glass is a hole: you see into the nook behind it)
  A.ring = tex(32, 32, g => { for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const d = Math.hypot(x + 0.5 - 16, y + 0.5 - 16); if (d <= 16 && d > 12.5) rect(g, d > 15 ? '#c8601a' : d > 13.5 ? '#ff9a3a' : '#ffd0a0', x, y); } });
  A.nook = tex(16, 16, g => { rect(g, '#d8dce4', 0, 0, 16, 16); dith(g, '#d8dce4', '#c8ccd8', 0, 0, 16, 16, 0.2); });
  A.curtain = tex(8, 32, g => { for (let x = 0; x < 8; x++) rect(g, x % 4 < 2 ? '#ffd6ea' : '#ffb8d8', x, 0, 1, 32); rect(g, '#ff9a3a', 0, 18, 8, 2); });
  A.mat = tex(64, 16, g => { rect(g, '#7a4a2a', 0, 0, 64, 16); rect(g, '#ff8ec8', 1, 1, 62, 14); words(g, 'HI! HI! HI!', 32, 5, 1, '#5a1840', { align: 'center' }); });
  A.sign = tex(64, 24, g => { rect(g, '#7a4a2a', 0, 0, 64, 24); rect(g, '#ffe2c4', 2, 2, 60, 20); words(g, "LILY'S", 32, 4, 1, '#c63c86', { align: 'center' }); words(g, 'HOUSE', 32, 13, 1, '#c63c86', { align: 'center' }); paw(g, '#ff9a3a', 4, 14); paw(g, '#ff9a3a', 54, 14); });
  A.mat2 = tex(16, 16, g => { rect(g, '#2a2a5a', 0, 0, 16, 16); dith(g, '#2a2a5a', '#3a3a7a', 0, 0, 16, 16, 0.3); });   // the trampoline's mat
  A.pad = tex(16, 4, g => { for (let x = 0; x < 16; x++) rect(g, x % 8 < 4 ? '#ff6fb4' : '#ffd23a', x, 0, 1, 4); });
  A.pot = tex(8, 8, g => { rect(g, '#c8603a', 0, 0, 8, 8); rect(g, '#e88a60', 0, 0, 8, 2); });
  A.flowers = tex(16, 16, g => { for (let i = 0; i < 9; i++) { const x = (i * 5) % 14 + 1, y = (i * 7) % 8 + 1; rect(g, '#2a9a3a', x, y + 2, 1, 16); disc(g, i % 2 ? '#ff6fb4' : '#ff9a2a', x, y, 1); rect(g, '#fff08a', x, y); } });
  A.chicken = tex(32, 16, g => paint(g, chickenPix()));

  // ---------- inside: the living room, like her real home ----------
  A.wall = tex(16, 16, g => { rect(g, '#c4ccc8', 0, 0, 16, 16); dith(g, '#c4ccc8', '#b8c2be', 0, 0, 16, 16, 0.15); });
  A.wallTop = tex(16, 16, g => { rect(g, '#c4ccc8', 0, 0, 16, 16); dith(g, '#c4ccc8', '#b8c2be', 0, 0, 16, 16, 0.15); paw(g, '#d4dad8', 3, 4); paw(g, '#d4dad8', 11, 11); });
  A.baseboard = tex(8, 4, g => { rect(g, '#ffffff', 0, 0, 8, 4); rect(g, '#e4e4ec', 0, 0, 8, 1); });
  A.tile = tex(16, 16, g => { rect(g, '#e8dcc4', 0, 0, 16, 16); dith(g, '#e8dcc4', '#f0e6d2', 0, 0, 16, 16, 0.3); rect(g, '#a89880', 0, 15, 16, 1); rect(g, '#a89880', 15, 0, 1, 16); });
  A.vent = tex(16, 8, g => { rect(g, '#6a4a30', 0, 0, 16, 8); for (let x = 1; x < 15; x += 2) rect(g, '#2a1a10', x, 1, 1, 6); });
  A.bed = tex(16, 4, g => { rect(g, '#ff8ec8', 0, 0, 16, 4); for (let x = 1; x < 16; x += 4) rect(g, '#ffffff', x, 1, 2, 2); });
  A.bedTop = tex(16, 16, g => { rect(g, '#ffd6ea', 0, 0, 16, 16); dith(g, '#ffd6ea', '#ffc4e0', 0, 0, 16, 16, 0.4); });
  A.couch = tex(16, 16, g => { rect(g, '#ff9a5a', 0, 0, 16, 16); dith(g, '#ff9a5a', '#ffb070', 0, 0, 16, 16, 0.3); rect(g, '#d8703a', 0, 15, 16, 1); });
  A.rug = tex(32, 32, g => { for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const d = Math.hypot(x + 0.5 - 16, y + 0.5 - 16); if (d < 15.5) rect(g, ['#ff9a2a', '#fff4e4', '#ff6fb4', '#fff4e4'][Math.floor(d / 4) % 4], x, y); } });
  A.basket = tex(16, 8, g => { rect(g, '#c89050', 0, 0, 16, 8); for (let x = 0; x < 16; x += 2) rect(g, '#9a6a30', x, (x / 2) % 2, 1, 8); rect(g, '#7a4a2a', 0, 0, 16, 1); });
  A.basketSign = tex(48, 10, g => { rect(g, C.ink, 0, 0, 48, 10); rect(g, '#ffe23a', 1, 1, 46, 8); words(g, 'CHICKENS', 24, 2, 1, C.ink, { align: 'center' }); });
  A.bowl = tex(24, 8, g => { rect(g, '#ff6fb4', 0, 0, 24, 8); words(g, 'LILY', 12, 2, 1, '#ffffff', { align: 'center' }); });
  A.bowl2 = tex(24, 8, g => { rect(g, '#ff9a2a', 0, 0, 24, 8); paw(g, '#ffffff', 10, 1); });
  A.picLily = tex(64, 72, g => { framed(g, 64, 72, '#9ad0ff'); rect(g, '#e8dcc4', 5, 50, 54, 17); paint(g, frontLily({ pose: 'up', wag: 1 }), 4, 6); });
  // Chooter, head and shoulders, on paint-shop mint (painted dot by dot in his own colours)
  A.picChooter = tex(58, 56, g => { framed(g, 58, 56, '#9ae8c8'); const p = chooterPortrait(); for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) { const c = p.d[y][x]; if (c !== '.' && 5 + y < 51) { g.fillStyle = CHOOTER[c]; g.fillRect(5 + x, 5 + y, 1, 1); } } });
  // Sadie: her own picture, the same as everywhere, on pink (dot for dot, never shrunk: shrunk, it blurs)
  A.picSadie = tex(70, 60, g => { framed(g, 70, 60, '#ff8ec8'); g.drawImage(T.sadie.image, 6, 7); });
  // Marbles: the brown tabby who runs the barbershop, green eyes, the M on her forehead, her red bow
  A.picMarbles = tex(48, 44, g => {
    framed(g, 48, 44, '#9ad0ff');
    const K = '#2b1d3c', B = '#a8743a', S = '#5a3618', L = '#e8c89a';
    rect(g, K, 12, 26, 24, 13); rect(g, B, 13, 27, 22, 12); for (let i = 0; i < 3; i++) rect(g, S, 14, 29 + i * 3, 20, 1); rect(g, L, 20, 30, 8, 9);
    rect(g, K, 13, 11, 22, 17); rect(g, B, 14, 12, 20, 15);
    rect(g, K, 13, 6, 6, 7); rect(g, K, 29, 6, 6, 7);
    rect(g, B, 14, 8, 4, 4); rect(g, B, 30, 8, 4, 4); rect(g, '#ff9ab8', 15, 9, 2, 3); rect(g, '#ff9ab8', 31, 9, 2, 3);
    rect(g, S, 20, 13, 1, 4); rect(g, S, 24, 13, 1, 3); rect(g, S, 27, 13, 1, 4); rect(g, S, 21, 13, 6, 1);
    rect(g, '#3ec43e', 17, 18, 4, 3); rect(g, K, 18, 18, 2, 3); rect(g, '#3ec43e', 27, 18, 4, 3); rect(g, K, 28, 18, 2, 3);
    rect(g, '#ff6fa0', 22, 22, 4, 2); rect(g, K, 20, 24, 8, 1);
    rect(g, '#fff', 9, 21, 5, 1); rect(g, '#fff', 34, 21, 5, 1);
    rect(g, '#e8202a', 30, 9, 6, 3); rect(g, '#e8202a', 32, 7, 2, 7);
  });
  // Toots on her own, on sky blue, a little grass under her feet (toots-pic.js)
  A.picToots = tex(58, 74, g => {
    framed(g, 58, 74, '#9ad0ff'); rect(g, '#5ac85a', 5, 58, 48, 11);
    TOOTS.forEach((r, y) => [...r].forEach((c, x) => { if (c !== '.' && 5 + y < 69) rect(g, TOOTS_PAL[c], 5 + x, 5 + y); }));
  });
  A.plate = name => { const w = Math.max(40, name.length * 5 + 6); return tex(w, 8, g => { rect(g, '#8a5a10', 0, 0, w, 8); rect(g, '#ffd23a', 1, 1, w - 2, 6); words(g, name, w / 2, 2, 1, C.ink, { align: 'center' }); }); };
  A.arch = tex(8, 8, g => { rect(g, '#ffffff', 0, 0, 8, 8); rect(g, '#ff8ec8', 0, 0, 8, 2); });
  A.archSign = tex(64, 12, g => { rect(g, C.ink, 0, 0, 64, 12); rect(g, '#ff6fb4', 1, 1, 62, 10); words(g, 'GAME ROOM', 32, 3, 1, '#ffffff', { align: 'center', shadow: C.ink }); });

  // ---------- the game room: 90s arcade carpet, dark walls with stars ----------
  A.arcadeCarpet = tex(32, 32, g => {
    rect(g, '#1a1040', 0, 0, 32, 32);
    const squig = (c, pts) => { for (const [x, y] of pts) rect(g, c, x % 32, y % 32); };
    for (let i = 0; i < 4; i++) { const ox = (i * 13) % 32, oy = (i * 9) % 32;
      squig(['#ff3ab0', '#3af0ff', '#ffe23a', '#6aff5a'][i], [[ox, oy], [ox + 1, oy + 1], [ox + 2, oy + 1], [ox + 3, oy], [ox + 4, oy], [ox + 5, oy + 1]]);
      squig(['#3af0ff', '#ffe23a', '#ff3ab0', '#ff9a2a'][i], [[ox + 16, oy + 10], [ox + 16, oy + 11], [ox + 17, oy + 12], [ox + 18, oy + 12]]);
      disc(g, ['#ff9a2a', '#6aff5a', '#3af0ff', '#ff3ab0'][i], (ox + 8) % 32, (oy + 22) % 32, 1); }
  });
  A.starWall = tex(32, 32, g => { rect(g, '#24164a', 0, 0, 32, 32); dith(g, '#24164a', '#2c1c58', 0, 0, 32, 32, 0.2); for (const [x, y, c] of [[4, 5, '#ffe23a'], [20, 9, '#ff8ec8'], [12, 22, '#9ad0ff'], [27, 26, '#ffe23a']]) { rect(g, c, x, y - 1); rect(g, c, x - 1, y, 3, 1); rect(g, c, x, y + 1); } });
  A.tape = tex(16, 4, g => { for (let x = 0; x < 16; x++) rect(g, (x % 8) < 4 ? '#ffe23a' : '#1c1238', x, 0, 1, 4); });
  A.spot = tex(32, 32, g => { for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const d = Math.hypot(x + 0.5 - 16, y + 0.5 - 16); if (d < 15.5 && d > 12) rect(g, '#ffe23a', x, y); } paw(g, '#ffe23a', 13, 13); });
  A.lights = tex(16, 4, g => { rect(g, '#2a2a2a', 0, 1, 16, 1); for (const [x, c] of [[1, '#ff3ab0'], [5, '#ffe23a'], [9, '#3af0ff'], [13, '#6aff5a']]) rect(g, c, x, 2, 2, 2); });
  return A;
}

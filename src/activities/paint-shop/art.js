// Chooter's paint shop's pictures, drawn on little canvases when the room's built: the shop from outside
// (its splattered walls, the striped awning, the sign, the door, the window, the sandwich board), and
// inside Chooter, the signs, the pegboard, each tool, the pots' labels, the plunger's box and the BOOM.
// (The walls, floor and things you paint aren't pictures: they're paint, surfaces.js.)
import { PAINTS } from './layer.js';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const rect = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
function dith(g, a, b, x, y, w, h, amt) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) rect(g, BAYER[((y + j) % 4) * 4 + ((x + i) % 4)] / 16 < amt ? b : a, x + i, y + j);
}
function disc(g, c, cx, cy, r) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) rect(g, c, cx + x, cy + y); }
const css = n => '#' + n.toString(16).padStart(6, '0');
export const PAINT_CSS = PAINTS.map(p => p && css(p.hex));
// a splat of paint: a blob and a few drops round it
function splat(g, c, x, y, r, seed) {
  let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  disc(g, c, x, y, r);
  for (let k = 0; k < 5; k++) { const a = rnd() * 6.3, d = r + 1 + rnd() * r * 1.4; disc(g, c, Math.round(x + Math.cos(a) * d), Math.round(y + Math.sin(a) * d), Math.max(0, Math.round(r / 3 - 1 + rnd()))); }
}

export function drawArt(m) {
  const { tex, words, C } = m, A = {};
  const loud = [1, 2, 3, 6, 8, 10, 4].map(i => PAINT_CSS[i]);

  // ---------- outside ----------
  // the walls: mint, splattered in every colour (the shop's been painted by its customers)
  A.wall = tex(64, 48, g => {
    rect(g, '#9af0d0', 0, 0, 64, 48); dith(g, '#9af0d0', '#c8fff0', 0, 0, 64, 20, 0.25);
    for (let k = 0; k < 9; k++) splat(g, loud[k % loud.length], 4 + (k * 23) % 58, 6 + (k * 17) % 38, 2 + (k % 3), k + 3);
    // drips running down from the top
    for (const [x, c, l] of [[6, 1, 9], [19, 3, 5], [31, 8, 12], [44, 6, 7], [57, 10, 10]]) { rect(g, PAINT_CSS[c], x, 0, 2, l); rect(g, PAINT_CSS[c], x, l, 3, 2); }
  });
  // the awning: pink and yellow stripes, scalloped
  A.awning = tex(32, 16, g => {
    for (let x = 0; x < 32; x++) rect(g, Math.floor(x / 4) % 2 ? C.yellow : C.pink2, x, 0, 1, 12);
    for (let x = 0; x < 32; x += 4) for (let y = 12; y < 16; y++) for (let i = 0; i < 4; i++) if (Math.hypot(i - 1.5, y - 12) < 2.6) rect(g, Math.floor(x / 4) % 2 ? C.yellow : C.pink2, x + i, y);
    dith(g, 'rgba(0,0,0,0)', 'rgba(0,0,0,0.25)', 0, 0, 32, 2, 0.5);
  });
  // the sign over the door
  A.sign = tex(96, 22, g => {
    rect(g, C.ink, 0, 0, 96, 22); rect(g, C.white, 1, 1, 94, 20);
    for (let x = 1; x < 95; x++) rect(g, loud[Math.floor(x / 6) % loud.length], x, 1, 1, 2);
    words(g, "CHOOTER'S", 48, 5, 1, C.pink3, { align: 'center' });
    words(g, 'PAINT SHOP', 48, 12, 2, C.ink, { align: 'center' });
  });
  // the front door: a little window in it and an OPEN sign
  const door = (g, open) => {
    rect(g, '#2a5ae8', 0, 0, 24, 40); rect(g, '#1a3ab0', 1, 1, 22, 38);
    rect(g, '#2a5ae8', 3, 3, 18, 34); rect(g, C.ink, 5, 5, 14, 12); dith(g, '#8ad8ff', '#c8f0ff', 6, 6, 12, 10, 0.4);
    if (open) { rect(g, C.ink, 2, 19, 20, 9); rect(g, C.white, 3, 20, 18, 7); words(g, 'OPEN', 12, 21, 1, C.red, { align: 'center' }); }
    rect(g, C.gold, 18, 30, 2, 2);
    splat(g, PAINT_CSS[3], 6, 33, 1, 5); splat(g, PAINT_CSS[10], 12, 36, 1, 8);
  };
  A.door = tex(24, 40, g => door(g, true));
  A.doorBack = tex(24, 40, g => door(g, false));
  // the shop windows: paint cans in a pyramid, on show
  A.window = tex(32, 24, g => {
    rect(g, C.white, 0, 0, 32, 24); rect(g, C.ink, 1, 1, 30, 22); dith(g, '#2a2a6a', '#3a3a8a', 2, 2, 28, 20, 0.5);
    const can = (x, y, c) => { rect(g, '#c8c8d8', x, y, 6, 6); rect(g, c, x, y + 2, 6, 3); rect(g, '#8a88a8', x, y, 6, 1); };
    [[5, 15, 1], [12, 15, 3], [19, 15, 6], [26 - 1, 15, 10], [8, 9, 4], [15, 9, 8], [22, 9, 2], [12, 3, 9], [18, 3, 7]].forEach(([x, y, c]) => can(x, y, PAINT_CSS[c]));
    rect(g, '#ffffff60', 3, 3, 1, 8); rect(g, '#ffffff60', 5, 3, 1, 3);
  });
  // the sandwich board on the path
  A.board = tex(24, 32, g => {
    rect(g, C.tan3, 0, 0, 24, 32); rect(g, C.ink, 2, 2, 20, 28);
    words(g, 'TODAY', 12, 4, 1, C.yellow, { align: 'center' });
    words(g, 'PAINT', 12, 11, 1, C.white, { align: 'center' }); words(g, 'THE', 12, 17, 1, C.white, { align: 'center' }); words(g, 'WALLS', 12, 23, 1, C.white, { align: 'center' });
  });
  A.boardBack = tex(24, 32, g => {
    rect(g, C.tan3, 0, 0, 24, 32); rect(g, C.ink, 2, 2, 20, 28);
    words(g, 'ALSO', 12, 4, 1, C.yellow, { align: 'center' });
    words(g, 'FLOOR', 12, 10, 1, C.white, { align: 'center' }); words(g, 'AND', 12, 16, 1, C.white, { align: 'center' }); words(g, 'CAT?', 12, 22, 1, C.pink, { align: 'center' });
  });
  // the giant paint can tipping off the roof: its label, and the paint pouring down the front
  A.canLabel = tex(32, 16, g => {
    rect(g, '#d8d8e8', 0, 0, 32, 16); rect(g, C.pink2, 0, 3, 32, 10);
    words(g, 'PAINT', 16, 4, 1, C.white, { align: 'center' }); words(g, '1 TON', 16, 9, 1, C.yellow, { align: 'center' });
    rect(g, '#8a88a8', 0, 0, 32, 1); rect(g, '#8a88a8', 0, 15, 32, 1);
  });
  A.pour = tex(8, 32, g => {
    rect(g, PAINT_CSS[9], 2, 0, 4, 32); rect(g, PAINT_CSS[10], 2, 0, 1, 32);
    for (const y of [26, 29]) disc(g, PAINT_CSS[9], 4, y, 3);
  });

  // ---------- inside ----------
  A.bigSign = tex(168, 24, g => {
    rect(g, C.ink, 0, 0, 168, 24); rect(g, '#fff8e0', 1, 1, 166, 22);
    for (let x = 1; x < 167; x++) rect(g, loud[Math.floor(x / 8) % loud.length], x, 21, 1, 2);
    words(g, "CHOOTER'S PAINT SHOP", 84, 3, 2, C.plum, { align: 'center' });
    words(g, 'PAINT ANYTHING! (NOT THE CAT)', 84, 14, 1, C.pink3, { align: 'center' });
  });
  A.toolSign = tex(64, 10, g => { rect(g, C.ink, 0, 0, 64, 10); rect(g, C.yellow, 1, 1, 62, 8); words(g, 'TOOLS. TAKE ONE!', 32, 3, 1, C.ink, { align: 'center' }); });
  A.potSign = tex(64, 10, g => { rect(g, C.ink, 0, 0, 64, 10); rect(g, C.yellow, 1, 1, 62, 8); words(g, 'PAINT. DIP IN!', 32, 3, 1, C.ink, { align: 'center' }); });
  A.morePaint = tex(132, 10, g => { rect(g, C.ink, 0, 0, 132, 10); rect(g, C.white, 1, 1, 130, 8); words(g, 'MORE COLOURS IN THE FULL VERSION', 66, 3, 1, C.plum, { align: 'center' }); });
  A.pegboard = tex(16, 16, g => { rect(g, '#d8a868', 0, 0, 16, 16); for (let y = 2; y < 16; y += 4) for (let x = 2; x < 16; x += 4) rect(g, '#8a5a30', x, y); });
  A.counter = tex(16, 16, g => { rect(g, C.tan, 0, 0, 16, 16); rect(g, C.tan2, 0, 7, 16, 1); rect(g, C.tan2, 0, 15, 16, 1); splat(g, PAINT_CSS[6], 4, 4, 1, 2); splat(g, PAINT_CSS[1], 12, 11, 1, 9); });
  A.plaque = tex(48, 10, g => { rect(g, C.gold3, 0, 0, 48, 10); rect(g, C.gold, 1, 1, 46, 8); words(g, 'SADIE', 24, 3, 1, C.ink, { align: 'center' }); });
  A.catflap = tex(12, 12, g => { rect(g, C.tan3, 0, 0, 12, 12); rect(g, '#5a2a78', 1, 1, 10, 10); rect(g, '#7a4a98', 2, 2, 8, 2); words(g, 'S', 5, 5, 1, C.pink); });

  // the tools, as they hang on the pegboard (16 x 16, see-through round them)
  const ICON = {
    brush: g => { rect(g, C.tan2, 7, 1, 2, 9); rect(g, '#c8c8d8', 6, 9, 4, 2); rect(g, C.ink, 6, 11, 4, 3); rect(g, PAINT_CSS[1], 6, 13, 4, 2); },
    roller: g => { rect(g, C.ink, 7, 7, 2, 8); rect(g, '#c8c8d8', 7, 4, 2, 3); rect(g, '#c8c8d8', 3, 4, 5, 1); rect(g, C.white, 1, 0, 14, 4); rect(g, PAINT_CSS[6], 1, 2, 14, 2); },
    spray: g => { rect(g, PAINT_CSS[8], 5, 4, 6, 11); rect(g, '#c8c8d8', 6, 2, 4, 2); rect(g, C.ink, 7, 1, 2, 1); rect(g, C.white, 6, 7, 4, 4); for (const [x, y] of [[2, 1], [1, 3], [3, 0], [0, 1]]) rect(g, PAINT_CSS[8], x, y); },
    bucket: g => { rect(g, '#c8c8d8', 3, 5, 10, 10); rect(g, '#8a88a8', 3, 5, 10, 1); rect(g, PAINT_CSS[3], 4, 6, 8, 3); rect(g, PAINT_CSS[3], 10, 9, 2, 4); for (let x = 3; x < 13; x++) rect(g, C.ink, x, 2 + Math.round(Math.abs(x - 8) * 0.5)); },
    dynamite: g => { for (const x of [3, 7, 11]) { rect(g, C.red, x, 5, 3, 10); rect(g, '#a02030', x, 5, 1, 10); } rect(g, C.ink, 3, 9, 11, 2); rect(g, C.ink, 8, 2, 1, 3); rect(g, C.yellow, 9, 0, 2, 2); rect(g, C.white, 10, 0); words(g, 'TNT', 4, 10, 1, C.white); },
  };
  A.tool = {};
  for (const [k, d] of Object.entries(ICON)) A.tool[k] = tex(16, 16, d);
  // a stamp: a wooden block with its picture on the end
  A.stampIcon = st => tex(16, 16, g => {
    rect(g, C.tan2, 4, 0, 8, 4); rect(g, C.tan3, 6, 4, 4, 3);
    rect(g, C.white, 1, 7, 14, 9);
    const p = st.pic, sx = 14 / p[0].length, sy = 9 / p.length;
    for (let j = 0; j < p.length; j++) for (let i = 0; i < p[0].length; i++) if (p[j][i] !== '.') rect(g, PAINT_CSS[st.key[p[j][i]]], 1 + Math.floor(i * sx), 7 + Math.floor(j * sy));
  });
  // the pots' labels: their colour's name on the tin; the rainbow pot's in stripes
  A.potLabel = (paint, name) => tex(32, 12, g => {
    rect(g, '#d8d8e8', 0, 0, 32, 12);
    if (paint === 'rainbow') for (let x = 0; x < 32; x++) rect(g, loud[Math.floor(x / 4) % loud.length], x, 2, 1, 8);
    else rect(g, PAINT_CSS[paint], 0, 2, 32, 8);
    words(g, name.length > 7 ? name.split(' ').pop() : name, 16, 4, 1, paint === 13 || paint === 3 || paint === 4 ? C.ink : C.white, { align: 'center', shadow: paint === 'rainbow' ? C.ink : undefined });
    rect(g, '#8a88a8', 0, 0, 32, 1); rect(g, '#8a88a8', 0, 11, 32, 1);
  });
  A.rainbowTop = tex(16, 16, g => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) rect(g, loud[Math.floor(Math.hypot(x - 7.5, y - 7.5) / 1.6) % loud.length], x, y); });
  // the plunger's box: TNT, for the whole room
  A.tnt = tex(32, 24, g => {
    rect(g, C.tan3, 0, 0, 32, 24); rect(g, C.red, 1, 1, 30, 22);
    words(g, 'TNT', 16, 0, 2, C.yellow, { align: 'center', shadow: C.ink });
    words(g, 'WHOLE', 16, 12, 1, C.white, { align: 'center', shadow: C.ink }); words(g, 'ROOM', 16, 18, 1, C.white, { align: 'center', shadow: C.ink });
  });
  // the BOOM, Kid Pix style: a starburst with the word on it
  A.boom = tex(40, 28, g => {
    for (let y = 0; y < 28; y++) for (let x = 0; x < 40; x++) {
      const dx = (x - 19.5) / 20, dy = (y - 13.5) / 14, a = Math.atan2(dy, dx), r = Math.hypot(dx, dy), edge = 0.78 + 0.2 * Math.sin(a * 9);
      if (r < edge) rect(g, r < edge - 0.18 ? C.yellow : C.red, x, y);
    }
    words(g, 'BOOM!', 20, 10, 2, C.red, { align: 'center', shadow: C.ink });
  });
  // Chooter (the black lab/pitbull mix from Dropper World), sitting by his counter: stocky, floppy
  // ears, a white blaze, his tongue out, a blue collar with a gold tag, and a tail that never stops
  // wagging (two pictures). He wears a painter's cap, and holds a paintbrush in his mouth, in
  // whatever you just dipped in (stripes for RAINBOW), so you can see your colour on him. Made the first time each paint's needed.
  const dogs = new Map();
  A.chooter = (paint, wag) => {
    const k = paint + '/' + wag;
    if (!dogs.has(k)) dogs.set(k, tex(28, 32, g => chooter(g, paint, wag)));
    return dogs.get(k);
  };
  const DOG = { coat: '#2d2733', shine: '#4d4558', dark: '#1b1620', white: '#fffaf3', ink: '#1b1424', tongue: '#ff7a9a', nose: '#120d16', collar: '#3fa9e8', tag: '#ffd23f', eye: '#5a3a22' };
  function chooter(g, paint, wag) {
    const spot = i => PAINT_CSS[paint === 'rainbow' ? [1, 3, 6, 10][i % 4] : paint];
    // his tail, wagging (behind him)
    const tip = wag ? [26, 19] : [27, 24];
    for (let t = 0; t <= 1; t += 0.1) { const x = Math.round(21 + (tip[0] - 21) * t), y = Math.round(28 + (tip[1] - 28) * t); rect(g, DOG.ink, x - 1, y - 1, 3, 3); }
    for (let t = 0; t <= 1; t += 0.1) { const x = Math.round(21 + (tip[0] - 21) * t), y = Math.round(28 + (tip[1] - 28) * t); rect(g, DOG.coat, x, y); }
    // sitting: a big round body, front legs and white paws
    disc(g, DOG.ink, 14, 23, 9); disc(g, DOG.coat, 14, 23, 8);
    disc(g, DOG.shine, 11, 19, 2);
    for (const x of [9, 17]) { rect(g, DOG.ink, x - 1, 22, 5, 10); rect(g, DOG.coat, x, 22, 3, 9); rect(g, DOG.white, x, 29, 3, 2); }
    disc(g, DOG.white, 14, 21, 2); rect(g, DOG.white, 13, 23, 3, 2);   // the blaze on his chest
    // his head: broad and blocky, floppy ears, a white stripe up his nose
    disc(g, DOG.ink, 14, 9, 8); disc(g, DOG.coat, 14, 9, 7); disc(g, DOG.shine, 12, 5, 2);
    for (const [x, d] of [[5, 1], [21, -1]]) { rect(g, DOG.ink, x - 1, 4, 4, 10); rect(g, DOG.dark, x, 5, 2, 8); rect(g, DOG.dark, x + d, 12, 2, 2); }
    rect(g, DOG.white, 14, 3, 1, 6);
    rect(g, DOG.shine, 10, 10, 9, 4); rect(g, DOG.nose, 13, 9, 3, 2); rect(g, '#ffffff', 13, 9);
    for (const x of [10, 17]) { rect(g, DOG.white, x, 6, 2, 2); rect(g, DOG.eye, x + 1, 7); rect(g, DOG.nose, x + 1, 6); }
    rect(g, DOG.ink, 11, 13, 7, 1); rect(g, DOG.tongue, 13, 14, 3, 3); rect(g, '#d9546f', 14, 14, 1, 2);
    // his collar and its tag
    rect(g, DOG.collar, 8, 16, 13, 2); rect(g, DOG.tag, 14, 18, 2, 2);
    // his painter's cap, in the paint you're holding (striped, for RAINBOW), tipped over one ear
    rect(g, DOG.ink, 7, 0, 13, 4); rect(g, DOG.ink, 6, 2, 15, 2);
    for (let x = 7; x < 20; x++) rect(g, spot(Math.floor((x - 7) / 3)), x, x < 8 || x > 18 ? 2 : 1, 1, x < 8 || x > 18 ? 1 : 2);
    rect(g, DOG.ink, 13, 0, 1, 1);
    // and a paintbrush in his mouth, its bristles dipped in it too
    rect(g, DOG.ink, 16, 11, 7, 3); rect(g, '#b87848', 16, 12, 6, 1);
    rect(g, DOG.ink, 22, 10, 6, 5); rect(g, '#c8c8d8', 22, 11, 1, 3); rect(g, spot(0), 23, 11, 4, 3);
  }
  A.sure = tex(48, 10, g => { rect(g, C.ink, 0, 0, 48, 10); rect(g, C.yellow, 1, 1, 46, 8); words(g, 'SURE? PUSH AGAIN', 24, 3, 1, C.red, { align: 'center' }); });
  return A;
}

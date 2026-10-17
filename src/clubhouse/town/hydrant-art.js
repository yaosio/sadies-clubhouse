// Dog City's pictures: the hydrant's red enamel, its concrete, the signs, and the doors. Drawn on
// little canvases when the outside is built (the same way as every other texture in look.js).
import { tex, words, wordsWidth, C } from '../look.js';

const rect = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const speckle = (g, c, w, h, n) => { for (let i = 0; i < n; i++) rect(g, c, Math.floor(rnd() * w), Math.floor(rnd() * h), 1, 1); };
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const hex = n => '#' + n.toString(16).padStart(6, '0');
// a colour made lighter (f > 1) or darker (f < 1)
export const shade = (n, f) => hex([16, 8, 0].reduce((s, sh) => s | Math.max(0, Math.min(255, Math.round(((n >> sh) & 255) * f))) << sh, 0));

// a pawprint, 7 dots across, at (x, y)
function paw(g, c, x, y) {
  for (const [dx, dy, w, h] of [[2, 3, 3, 3], [1, 4, 5, 2], [0, 1, 2, 2], [2, 0, 2, 2], [3, 0, 2, 2], [5, 1, 2, 2]]) rect(g, c, x + dx, y + dy, w, h);
}

// A signboard: a painted board with a dark edge, a cream rim, rivets in its corners, and its words in
// big cream letters with a shadow, a pawprint at each end. `lines`: the words, `s`: dots across
// each letter's stroke (the font is 3 dots wide), `color`: its paint (a number).
export function signboard(lines, { color = 0xffd23a, s = 3, ink = C.ink, light = false, mark = 'paw' } = {}) {
  const longest = Math.max(...lines.map(l => wordsWidth(l, s)));
  const W = longest + 26 + (mark ? 14 : 0), H = lines.length * (5 * s + s + 2) + 14;
  return tex(W, H, g => {
    rect(g, ink, 0, 0, W, H);
    rect(g, C.cream, 1, 1, W - 2, H - 2);
    // the paint, a few shades down the board, dithered between them
    const top = hex(color), low = shade(color, 0.72);
    for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) {
      const f = (y - 3) / (H - 6);
      rect(g, BAYER[(y % 4) * 4 + (x % 4)] / 16 < f * 0.9 ? low : top, x, y, 1, 1);
    }
    rect(g, ink, 3, 3, W - 6, 1); rect(g, ink, 3, H - 4, W - 6, 1); rect(g, ink, 3, 3, 1, H - 6); rect(g, ink, W - 4, 3, 1, H - 6);
    for (const [x, y] of [[5, 5], [W - 7, 5], [5, H - 7], [W - 7, H - 7]]) { rect(g, ink, x + 1, y + 1, 2, 2); rect(g, C.cream, x, y, 2, 2); }
    if (mark === 'paw') { paw(g, light ? ink : C.cream, 9, Math.round(H / 2 - 3)); paw(g, light ? ink : C.cream, W - 16, Math.round(H / 2 - 3)); }
    if (mark === 'down') for (const x of [9, W - 16]) { rect(g, C.cream, x + 2, Math.round(H / 2) - 4, 3, 5); rect(g, C.cream, x, Math.round(H / 2), 7, 1); rect(g, C.cream, x + 1, Math.round(H / 2) + 1, 5, 1); rect(g, C.cream, x + 2, Math.round(H / 2) + 2, 3, 1); rect(g, C.cream, x + 3, Math.round(H / 2) + 3, 1, 1); }
    const y0 = Math.round((H - lines.length * (5 * s + s + 2) + s + 2) / 2);
    lines.forEach((l, i) => words(g, l, W / 2, y0 + i * (5 * s + s + 2), s, light ? ink : C.cream, { align: 'center', shadow: light ? C.cream : ink }));
  });
}

// a door in a colour: panels, a window with a shine, a knob, and a small pawprint plaque
export function doorLeaf(color) {
  const mid = hex(color), dark = shade(color, 0.6), lite = shade(color, 1.25);
  return tex(16, 28, g => {
    rect(g, dark, 0, 0, 16, 28); rect(g, mid, 1, 1, 14, 26); rect(g, lite, 1, 1, 14, 1); rect(g, lite, 1, 1, 1, 26);
    rect(g, dark, 3, 3, 10, 9); rect(g, '#bfe8ff', 4, 4, 8, 7); rect(g, '#ffffff', 5, 5, 2, 2); rect(g, dark, 7, 4, 2, 7); rect(g, dark, 4, 7, 8, 1);
    for (const y of [14, 21]) { rect(g, dark, 3, y, 10, 6); rect(g, shade(color, 0.85), 4, y + 1, 8, 4); }
    paw(g, C.cream, 4, 15);
    rect(g, C.gold, 12, 14, 2, 3); rect(g, C.gold2, 12, 16, 2, 1);
  });
}

// Everything else, in one go
export function hydrantArt() {
  seed = 7;
  const A = {};
  A.red = tex(16, 16, g => { rect(g, '#d8261e', 0, 0, 16, 16); speckle(g, '#ee4a3a', 16, 16, 18); speckle(g, '#a81814', 16, 16, 22); });
  A.redDark = tex(16, 16, g => { rect(g, '#a81814', 0, 0, 16, 16); speckle(g, '#c82a22', 16, 16, 14); speckle(g, '#7a0e10', 16, 16, 18); });
  A.concrete = tex(16, 16, g => { rect(g, '#bdb8cf', 0, 0, 16, 16); speckle(g, '#cfcade', 16, 16, 24); speckle(g, '#a29cb8', 16, 16, 26); rect(g, '#9a94b0', 0, 15, 16, 1); rect(g, '#9a94b0', 15, 0, 1, 16); });
  A.concreteSide = tex(16, 16, g => { rect(g, '#8c86a6', 0, 0, 16, 16); speckle(g, '#9e98b8', 16, 16, 20); speckle(g, '#706a8c', 16, 16, 24); });
  A.paw = tex(16, 16, g => paw(g, '#5a2a78', 5, 4));   // (the ramp's pawprints: the rest of the picture is clear)
  A.water = tex(16, 16, g => { rect(g, '#4aa8e8', 0, 0, 16, 16); speckle(g, '#7ac8f8', 16, 16, 18); speckle(g, '#3a88c8', 16, 16, 14); rect(g, '#cdeeff', 3, 4, 4, 1); rect(g, '#cdeeff', 4, 3, 2, 1); });
  A.chrome = tex(16, 16, g => { rect(g, '#cfd3e0', 0, 0, 16, 16); rect(g, '#f4f6ff', 0, 0, 16, 2); rect(g, '#9aa0b8', 0, 12, 16, 4); });
  // the cap's rotunda: DOG CITY in white on a red band, over and over round it
  A.capBand = tex(72, 20, g => {
    rect(g, '#d8261e', 0, 0, 72, 20); rect(g, '#a81814', 0, 0, 72, 2); rect(g, '#a81814', 0, 18, 72, 2); rect(g, C.gold, 0, 2, 72, 1); rect(g, C.gold, 0, 17, 72, 1);
    words(g, 'DOG CITY', 36, 6, 2, C.cream, { align: 'center', shadow: '#7a0e10' });
  });
  A.stake = tex(8, 8, g => { rect(g, '#6e4526', 0, 0, 8, 8); rect(g, '#8a5a30', 1, 0, 2, 8); });
  A.pennant = tex(8, 6, g => { rect(g, '#ff6a9a', 0, 0, 8, 6); rect(g, '#ffffff', 1, 1, 2, 1); });
  return A;
}

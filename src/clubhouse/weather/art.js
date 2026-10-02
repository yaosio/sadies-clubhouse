// The weather's pictures, drawn on little canvases when the mansion opens: the cloud cover and the
// snow on the ground, the falling cats, and what Sadie wears on the gatepost (an umbrella, a heap of
// snow, sunglasses) and says.
import { tex, words, C } from '../look.js';
import { SADIE } from './rules.js';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const rect = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
function dith(g, a, b, x, y, w, h, amt) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) rect(g, BAYER[((y + j) % 4) * 4 + ((x + i) % 4)] / 16 < amt ? b : a, x + i, y + j, 1, 1);
}
function disc(g, c, cx, cy, r) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) rect(g, c, cx + x, cy + y); }

export function drawWeatherArt() {
  const A = {};
  // the sky: cloud cover (tinted to each weather's colour), and snow lying on the ground
  A.cover = tex(32, 32, g => {
    rect(g, '#d8d8e8', 0, 0, 32, 32);
    for (const [x, y, r] of [[6, 7, 5], [20, 5, 6], [28, 18, 5], [12, 22, 6], [2, 28, 4], [24, 29, 3]]) {
      for (const dx of [-32, 0, 32]) for (const dy of [-32, 0, 32]) { disc(g, '#ffffff', x + dx, y + dy, r); disc(g, '#b8b8d0', x + dx + 1, y + dy + r - 1, Math.max(1, r - 3)); }
    }
    dith(g, '#d8d8e8', '#ffffff', 0, 0, 32, 3, 0.25);
  });
  A.snow = tex(16, 16, g => { rect(g, C.white, 0, 0, 16, 16); dith(g, C.white, '#e0e8ff', 0, 0, 16, 16, 0.2); rect(g, '#a8e8ff', 3, 4); rect(g, '#a8e8ff', 11, 12); rect(g, C.yellow, 12, 3); });

  // the falling cats: three kinds, sitting (they always land on their feet) and falling (legs out)
  const COATS = [['#ff9a3a', '#c86010'], ['#3a3450', '#1c1238'], ['#c8c8d8', '#8a88a8']];
  const cat = (fur, dark, falling) => tex(16, 14, g => {
    const ink = C.ink;
    if (falling) {
      rect(g, ink, 3, 4, 10, 6); rect(g, fur, 4, 5, 8, 4);                // body, flat out
      for (const x of [2, 5, 10, 13]) { rect(g, ink, x, 9, 1, 3); }        // legs out
      rect(g, ink, 12, 1, 4, 5); rect(g, fur, 13, 2, 2, 3); rect(g, ink, 12, 0); rect(g, ink, 15, 0);   // head
      rect(g, ink, 0, 3, 3, 1);                                            // tail up
      rect(g, C.white, 13, 3); rect(g, dark, 5, 6, 2, 1); rect(g, dark, 8, 7, 2, 1);
    } else {
      rect(g, ink, 4, 5, 8, 9); rect(g, fur, 5, 6, 6, 7);                 // body
      rect(g, ink, 3, 1, 10, 7); rect(g, fur, 4, 2, 8, 5);                // head
      rect(g, ink, 3, 0, 2, 2); rect(g, ink, 11, 0, 2, 2); rect(g, fur, 4, 1); rect(g, fur, 11, 1);   // ears
      rect(g, ink, 5, 3); rect(g, ink, 10, 3); rect(g, C.pink, 7, 5, 2, 1);   // eyes, nose
      rect(g, ink, 12, 10, 3, 1); rect(g, ink, 14, 8, 1, 3);               // tail
      rect(g, dark, 6, 8, 4, 1); rect(g, dark, 6, 10, 4, 1);
    }
  });
  A.cats = COATS.map(([f, d]) => ({ sit: cat(f, d, false), fall: cat(f, d, true) }));

  // Sadie on the gatepost: a little umbrella, a heap of snow, sunglasses, and what she says
  A.umbrella = tex(20, 14, g => {
    for (let y = 0; y < 6; y++) rect(g, y % 2 ? C.pink2 : C.pink, 10 - (y + 4), y, 2 * (y + 4), 1);
    for (const x of [2, 7, 12, 17]) rect(g, C.pink3, x, 5, 2, 1);
    rect(g, C.ink, 10, 6, 1, 7); rect(g, C.ink, 8, 12, 2, 1); rect(g, C.white, 8, 1, 2, 1);
  });
  A.heap = tex(16, 7, g => { disc(g, '#c8d8ff', 8, 6, 5); disc(g, C.white, 8, 5, 5); disc(g, C.white, 4, 6, 3); disc(g, C.white, 12, 6, 3); rect(g, '#a8e8ff', 6, 3); });
  A.shades = tex(16, 5, g => { rect(g, C.ink, 0, 0, 16, 1); rect(g, C.ink, 1, 1, 6, 4); rect(g, C.ink, 9, 1, 6, 4); rect(g, '#5e5c80', 2, 1, 2, 1); rect(g, '#5e5c80', 10, 1, 2, 1); });
  A.says = {};
  for (const [k, text] of Object.entries(SADIE)) {
    const w = text.length * 4 + 7;
    A.says[k] = tex(w, 12, g => {
      rect(g, C.ink, 1, 0, w - 2, 9); rect(g, C.ink, 0, 1, w, 7); rect(g, C.white, 1, 1, w - 2, 7);
      rect(g, C.ink, 4, 9, 3, 1); rect(g, C.white, 5, 8, 1, 1); rect(g, C.ink, 4, 10, 1, 2);
      words(g, text, Math.round(w / 2), 2, 1, C.ink, { align: 'center' });
    });
  }
  return A;
}

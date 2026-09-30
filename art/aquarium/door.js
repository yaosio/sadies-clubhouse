// The aquarium's door on the mansion's landing (40 x 64, like every activity's door), drawn in code.
// tools/aquarium/pictures.mjs draws it in a browser and writes src/activities/aquarium/door.js
// (run it after changing the drawing: node tools/aquarium/pictures.mjs). The mock-up uses it too.
import { words, C } from '../../src/clubhouse/look.js';
import { px, dot, oval } from '../../src/activities/aquarium/pictures.js';

// The aquarium's door on the landing, 40 x 64 like the other activities' doors: sea blue, a sign
// with a goldfish swimming in it, a porthole, and water seeping out underneath (the tank's that full)
export function aquariumDoor() {
  const c = document.createElement('canvas'); c.width = 40; c.height = 64;
  const g = c.getContext('2d');
  const col = '#2a8ad0', dark = '#1a4ab0', lite = '#58c8f0';
  px(g, '#8a5a10', 0, 0, 40, 64); px(g, '#c89018', 1, 1, 38, 63); px(g, col, 3, 3, 34, 61);
  px(g, lite, 3, 3, 1, 61); px(g, dark, 36, 3, 1, 61);
  px(g, dark, 7, 47, 26, 14); px(g, lite, 8, 48, 24, 12); px(g, col, 9, 49, 22, 10);
  px(g, C.gold, 31, 36, 3, 3); px(g, '#fff6b0', 31, 36, 1, 1);
  // the sign: a little tank of its own, with its name over the water and a goldfish in it
  px(g, C.ink, 2, 5, 36, 20);
  for (let y = 6; y < 24; y++) for (let x = 3; x < 37; x++) px(g, y < 14 ? '#123a80' : dot(x, y) < (y - 14) / 10 ? '#1a5ab0' : '#58c8f0', x, y);
  for (let x = 3; x < 37; x++) px(g, '#dff6ff', x, 14 + (x % 4 === 0 ? 1 : 0));
  words(g, 'AQUARIUM', 4, 7, 1, C.yellow, { shadow: '#e0509a' });
  oval(g, 18, 19.5, 3.5, 2, '#ff9a1e'); px(g, '#ff7a2a', 12, 17, 2, 5); px(g, '#ff7a2a', 14, 18, 1, 3); px(g, C.black, 20, 18, 1, 1);
  for (const [x, y] of [[24, 17], [26, 15], [29, 19], [8, 20]]) px(g, '#dff6ff', x, y);
  // a porthole instead of the top panel, with a fish going past
  for (let y = 28; y < 46; y++) for (let x = 10; x < 30; x++) {
    const d = Math.hypot(x + 0.5 - 20, y + 0.5 - 37);
    if (d < 8.5) px(g, d > 7 ? C.gold2 : d > 6 ? C.gold : dot(x, y) < (y - 31) / 12 ? '#1a5ab0' : '#58c8f0', x, y);
  }
  px(g, C.gold3, 20, 28, 1, 1); px(g, C.gold3, 20, 45, 1, 1); px(g, C.gold3, 11, 37, 1, 1); px(g, C.gold3, 28, 37, 1, 1);
  px(g, C.pink, 17, 37, 5, 3); px(g, C.pink2, 15, 36, 2, 5); px(g, C.black, 20, 37, 1, 1); px(g, C.white, 16, 32, 3, 1);
  // water seeping out under it
  for (let x = 2; x < 38; x++) { const h = 1 + ((x * 5) % 3); px(g, x % 3 ? '#58c8f0' : '#dff6ff', x, 64 - h, 1, h); }
  return c;
}

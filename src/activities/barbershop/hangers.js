// The outfits as they hang on the clothes rail (one little picture each, 24 x 34 dots, on its hanger),
// so each one looks like what it is: the pop star's sparkly jacket, the hard hat and vest, the ball gown,
// the magician's coat and top hat, the superhero's cape, the detective's trench coat and hat, the
// pajamas and nightcap. The first (NO OUTFIT) is only an empty hanger. Drawn when the room's built.
import { OUTFIT } from './looks.js';

export const HANGER = { W: 24, H: 34 };
const K = '#2b1d3c', CHROME = '#d8d8e8';

export function drawHangers(m) {
  return OUTFIT.map((o, i) => m.tex(HANGER.W, HANGER.H, g => {
    const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    // an outlined block, and rows that widen or narrow (an outlined shape, row by row)
    const box = (x, y, w, h, c) => { r(x - 1, y - 1, w + 2, h + 2, K); r(x, y, w, h, c); };
    const rows = (y0, y1, half0, half1, c, cx = 12) => {
      for (let y = y0; y <= y1; y++) { const k = (y - y0) / Math.max(1, y1 - y0), h = Math.round(half0 + (half1 - half0) * k); r(cx - h - 1, y, 2 * h + 2, 1, K); }
      for (let y = y0; y <= y1; y++) { const k = (y - y0) / Math.max(1, y1 - y0), h = Math.round(half0 + (half1 - half0) * k); r(cx - h, y, 2 * h, 1, c); }
    };
    const hook = (y = 0) => { r(11, y, 2, 3, CHROME); r(5, y + 3, 14, 1, CHROME); };
    if (i === 0) { hook(); r(5, 4, 1, 2, CHROME); r(18, 4, 1, 2, CHROME); return; }
    hook(1);
    if (o.show === 'sing') {           // a purple jacket with gold sparkles and a pink stripe
      box(5, 6, 14, 20, '#8a2be2'); box(1, 6, 4, 14, '#8a2be2'); box(19, 6, 4, 14, '#8a2be2');
      r(11, 6, 2, 20, '#ff4fa3');
      for (const [x, y] of [[7, 9], [15, 11], [8, 15], [16, 18], [7, 21], [14, 23], [3, 11], [20, 14], [3, 16]]) r(x, y, 1, 1, '#ffd23f');
      r(8, 28, 8, 4, K); r(9, 29, 6, 2, '#ff4fa3');     // (a little hat to go with it)
    } else if (o.show === 'build') {   // a hard hat on the hook, an orange vest with silver stripes
      r(7, 0, 10, 5, K); r(8, 1, 8, 4, '#ffd23f'); r(11, 0, 2, 4, '#e8b020'); r(5, 4, 14, 2, K); r(6, 4, 12, 1, '#ffd23f');
      box(5, 8, 5, 22, '#ff8a1f'); box(14, 8, 5, 22, '#ff8a1f'); r(10, 9, 4, 20, K);
      r(5, 16, 5, 2, '#e8f0f0'); r(14, 16, 5, 2, '#e8f0f0'); r(5, 23, 5, 2, '#e8f0f0'); r(14, 23, 5, 2, '#e8f0f0');
    } else if (o.show === 'dance') {   // a ball gown: a small top, a huge skirt, a frill along the bottom
      box(8, 5, 8, 7, '#ff6fb8'); r(10, 6, 4, 1, '#fff');
      rows(12, 32, 4, 11, '#ff4fa3');
      for (let x = 6; x < 19; x += 3) r(x, 15, 1, 15, '#ff9fd0');
      r(2, 31, 20, 2, '#fff'); r(9, 8, 6, 1, '#ffd23f');
    } else if (o.show === 'magic') {   // a black coat with a red lining, a top hat on the hook, a bow tie
      r(7, 0, 10, 6, K); r(8, 1, 8, 4, '#1a1a1a'); r(8, 4, 8, 1, '#e8202a'); r(5, 5, 14, 2, K); r(6, 5, 12, 1, '#1a1a1a');
      box(5, 8, 14, 22, '#1a1a1a'); box(1, 8, 4, 14, '#1a1a1a'); box(19, 8, 4, 14, '#1a1a1a');
      r(9, 8, 6, 14, '#f4f4f4'); r(10, 9, 4, 2, '#e8202a'); r(5, 28, 14, 2, '#c01030');
    } else if (o.show === 'fly') {     // a red cape behind a blue suit with a gold badge
      rows(5, 33, 5, 11, '#e8202a');
      box(7, 6, 10, 14, '#3a7bff'); r(9, 8, 6, 6, '#ffd23f'); r(11, 9, 2, 4, '#e8202a'); r(7, 19, 10, 2, '#ffd23f');
    } else if (o.show === 'sleuth') {  // a tan trench coat with a belt and a collar, a hat on the hook
      r(6, 0, 12, 4, K); r(7, 1, 10, 3, '#9a7a4a'); r(3, 4, 18, 2, K); r(4, 4, 16, 1, '#9a7a4a');
      box(5, 8, 14, 24, '#b08a5a'); box(1, 8, 4, 16, '#b08a5a'); box(19, 8, 4, 16, '#b08a5a');
      r(5, 18, 14, 2, '#6a4a2a'); r(11, 18, 2, 2, '#ffd23f'); r(9, 8, 2, 8, '#8a6a40'); r(13, 8, 2, 8, '#8a6a40'); r(11, 8, 2, 24, K);
    } else {                           // pajamas: pale blue with yellow moons and a green nightcap with a pompom
      r(7, 0, 9, 4, K); r(8, 1, 7, 3, '#3ee8b5'); r(16, 2, 3, 3, K); r(17, 3, 1, 1, '#fff'); r(18, 4, 4, 4, K); r(19, 5, 2, 2, '#fff');
      box(5, 8, 14, 22, '#7aa8ff'); box(1, 8, 4, 14, '#7aa8ff'); box(19, 8, 4, 14, '#7aa8ff');
      for (const [x, y] of [[7, 11], [13, 15], [8, 20], [14, 24], [3, 13], [20, 16]]) r(x, y, 2, 2, '#ffd23f');
      r(11, 8, 2, 22, '#5a88e0');
    }
  }));
}

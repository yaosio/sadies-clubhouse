// Cats Only's door on the clubhouse's landing (40 x 64, like every activity's door), drawn in code.
// tools/cats-only/pictures.mjs draws it in a browser and writes src/activities/cats-only/door.js
// (run it after changing the drawing: node tools/cats-only/pictures.mjs).
import { words, C } from '../../src/clubhouse/look.js';

const px = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

// A small plain door, a deep cat-fur orange, with a brass plate that says CATS ONLY, a paw print
// in the middle and a cat flap at the bottom with something looking out of it.
export function catsOnlyDoor() {
  const c = document.createElement('canvas'); c.width = 40; c.height = 64;
  const g = c.getContext('2d');
  const col = '#d8782a', dark = '#a8501a', lite = '#f0a050';
  px(g, '#8a5a10', 0, 0, 40, 64); px(g, '#c89018', 1, 1, 38, 63); px(g, col, 3, 3, 34, 61);
  px(g, lite, 3, 3, 1, 61); px(g, dark, 36, 3, 1, 61);
  // the sign: a brass plate, two lines
  px(g, C.ink, 5, 6, 30, 17); px(g, C.gold, 6, 7, 28, 15); px(g, C.gold3, 6, 21, 28, 1);
  words(g, 'CATS', 20, 9, 1, C.ink, { align: 'center' });
  words(g, 'ONLY', 20, 15, 1, C.red, { align: 'center' });
  // a big paw print: one pad and four toes
  const pad = '#5a2a10';
  px(g, pad, 16, 38, 8, 6); px(g, pad, 14, 35, 2, 3); px(g, pad, 18, 33, 2, 4); px(g, pad, 21, 33, 2, 4); px(g, pad, 24, 35, 2, 3);
  px(g, pad, 15, 44, 10, 2);
  // the cat flap, with two eyes in the dark
  px(g, C.ink, 12, 50, 16, 10); px(g, '#2a1a3a', 13, 51, 14, 8);
  px(g, '#fff060', 16, 54, 2, 2); px(g, '#fff060', 22, 54, 2, 2); px(g, C.black, 17, 54, 1, 2); px(g, C.black, 23, 54, 1, 2);
  px(g, C.gold, 31, 36, 3, 3); px(g, '#fff6b0', 31, 36, 1, 1);
  return c;
}

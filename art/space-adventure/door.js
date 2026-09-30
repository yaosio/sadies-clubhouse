// Space Adventure's door on the landing (40 x 64, like every activity's door), drawn in code.
// tools/space-adventure/pictures.mjs draws it in a browser and writes src/activities/space-adventure/door.js
// (run it after changing the drawing: node tools/space-adventure/pictures.mjs).
import { words, C } from '../../src/clubhouse/look.js';
import { px, dot, oval } from '../../src/activities/space-adventure/pictures.js';

// A spaceship's hatch: deep purple with rivets, a sign with a little rocket on it, a round porthole
// with a planet in it, and yellow and black hazard stripes along the bottom
export function spaceDoor() {
  const c = document.createElement('canvas'); c.width = 40; c.height = 64;
  const g = c.getContext('2d');
  px(g, '#5e5c80', 0, 0, 40, 64); px(g, '#8a88a8', 1, 1, 38, 63); px(g, '#3a2a8c', 3, 3, 34, 61);
  px(g, '#5a48b8', 3, 3, 1, 61); px(g, '#1c1238', 36, 3, 1, 61);
  for (const y of [5, 30, 50]) for (const x of [5, 34]) px(g, '#c8c6e0', x, y);
  // the sign: stars behind SPACE, and a rocket
  px(g, C.ink, 2, 5, 36, 20);
  for (let y = 6; y < 24; y++) for (let x = 3; x < 37; x++) px(g, dot(x, y) < (y - 6) / 30 ? '#3a2a9c' : '#1a1a60', x, y);
  for (const [x, y] of [[5, 16], [33, 8], [28, 21], [9, 21], [21, 7]]) px(g, C.white, x, y);
  words(g, 'SPACE', 20, 8, 1, C.yellow, { align: 'center', shadow: '#e0509a' });
  px(g, C.white, 18, 15, 4, 6); px(g, C.red, 18, 14, 4, 1); px(g, C.red, 19, 13, 2, 1); px(g, '#8ad8ff', 19, 16, 2, 2);
  px(g, C.red, 17, 19, 1, 3); px(g, C.red, 22, 19, 1, 3); px(g, '#ffd23a', 19, 21, 2, 2); px(g, '#ff7a2a', 19, 23, 2, 1);
  // the porthole, with the planet in it
  for (let y = 28; y < 46; y++) for (let x = 10; x < 30; x++) {
    const d = Math.hypot(x + 0.5 - 20, y + 0.5 - 37);
    if (d < 8.5) px(g, d > 7 ? '#c8c6e0' : d > 6 ? '#8a88a8' : '#05020f', x, y);
  }
  oval(g, 21, 38, 3.5, 3.5, '#2a6af0'); px(g, '#58d04a', 19, 36, 3, 2); px(g, '#58d04a', 22, 39, 2, 1); px(g, C.white, 20, 35, 1, 1);
  for (const [x, y] of [[15, 34], [24, 41], [16, 40]]) px(g, C.white, x, y);
  // hazard stripes along the bottom
  for (let y = 54; y < 62; y++) for (let x = 3; x < 37; x++) px(g, Math.floor((x + y) / 3) % 2 ? '#ffd23a' : C.ink, x, y);
  return c;
}

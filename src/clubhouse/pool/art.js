// The pool's pictures, drawn on little canvases when the outside is built: the paving, the water (three
// frames that shimmer), the beach ball's stripes, a droplet and a ripple, the sign, the bunting, and
// Chooter and Marbles in the poses sim.js gives them. Chooter is the black lab/pitbull mix from the
// paint shop and Marbles the brown tabby from the barbershop, drawn again here in their swimming
// things (an activity's own pictures stay in its folder, so these are this folder's own).
import { tex, words, C } from '../look.js';

const px = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const disc = (g, c, cx, cy, r) => { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + 1) px(g, c, cx + x, cy + y); };

export const CHOOTER = { W: 30, H: 22 };
export const MARBLES = { W: 34, H: 42 };

const DOG = { coat: '#2d2733', shine: '#4d4558', dark: '#1b1620', white: '#fffaf3', ink: '#1b1424', tongue: '#ff7a9a', nose: '#120d16', collar: '#3fa9e8', tag: '#ffd23f', eye: '#5a3a22' };

// Chooter, side on, facing right
function chooter(g, pose) {
  const D = DOG;
  const leg = (x, y, w = 3, h = 6) => { px(g, D.ink, x, y, w, h); px(g, D.coat, x + 1, y, w - 2, h - 1); px(g, D.white, x, y + h - 2, w, 2); };
  const head = (x, y) => {   // a blocky head with floppy ears, a white stripe on his nose, his tongue out and a blue collar
    px(g, D.ink, x, y, 10, 10); px(g, D.coat, x + 1, y + 1, 8, 8); px(g, D.shine, x + 2, y + 1, 4, 2);
    px(g, D.ink, x + 7, y + 4, 4, 5); px(g, D.shine, x + 7, y + 5, 3, 3); px(g, D.nose, x + 10, y + 4, 1, 2);
    px(g, D.ink, x - 1, y + 1, 4, 7); px(g, D.dark, x, y + 2, 2, 5);
    px(g, D.white, x + 5, y + 3, 2, 2); px(g, D.eye, x + 6, y + 4); px(g, D.white, x + 7, y + 1, 1, 2);
    px(g, D.tongue, x + 8, y + 9, 2, 3); px(g, '#d9546f', x + 9, y + 9, 1, 2);
    px(g, D.collar, x, y + 9, 7, 2); px(g, D.tag, x + 3, y + 11, 2, 2);
  };
  const body = (x, y, w, h) => { px(g, D.ink, x - 1, y - 1, w + 2, h + 2); px(g, D.coat, x, y, w, h); px(g, D.shine, x + 2, y + 1, 5, 2); px(g, D.white, x + w - 2, y + 3, 2, 3); };
  if (pose === 'run0' || pose === 'run1') {
    const a = pose === 'run0';
    px(g, D.ink, 2, a ? 3 : 5, 4, 3); px(g, D.coat, 3, a ? 4 : 6, 3, 1);   // tail
    leg(a ? 4 : 7, 14, 3, 7); leg(a ? 9 : 11, 14, 3, 6); leg(a ? 18 : 15, 14, 3, 6); leg(a ? 21 : 17, 14, 3, 7);
    body(5, 6, 16, 9); head(19, 2);
  } else if (pose === 'air') {   // stretched out, mid-leap
    px(g, D.ink, 1, 4, 4, 3); px(g, D.coat, 2, 5, 3, 1);
    px(g, D.ink, 1, 12, 8, 3); px(g, D.coat, 2, 12, 6, 2); px(g, D.white, 1, 13, 2, 2);
    px(g, D.ink, 20, 13, 9, 3); px(g, D.coat, 21, 13, 7, 2); px(g, D.white, 27, 13, 2, 3);
    body(6, 5, 15, 9); head(19, 1);
  } else if (pose === 'bow') {   // front paws down, back end up: ready to go
    px(g, D.ink, 2, 1, 4, 3); px(g, D.coat, 3, 2, 3, 1);
    leg(5, 12, 3, 9); leg(9, 12, 3, 9); leg(17, 17, 6, 4); leg(22, 17, 6, 4);
    body(5, 4, 15, 9); head(19, 8);
  } else if (pose === 'sit') {   // sitting up, panting
    px(g, D.ink, 1, 18, 7, 3); px(g, D.coat, 2, 19, 6, 1);
    disc(g, D.ink, 10, 15, 7); disc(g, D.coat, 10, 15, 6); disc(g, D.shine, 8, 12, 2);
    leg(15, 11, 3, 10); leg(18, 11, 3, 10);
    px(g, D.ink, 14, 6, 6, 8); px(g, D.coat, 15, 6, 4, 8); px(g, D.white, 16, 11, 2, 3);
    head(15, 0);
  } else {   // swimming: just his head and shoulders out of the water, and his paws going
    head(14, 5); px(g, D.ink, 8, 11, 8, 6); px(g, D.coat, 9, 11, 6, 5);
    px(g, '#8ae8ff', 6, 17, 22, 1); px(g, '#fff', 8, 18, 6, 1); px(g, '#fff', 17, 19, 8, 1);
    px(g, D.ink, 21, 14, 3, 2); px(g, D.white, 22, 14, 2, 2);
  }
}

// Marbles, front on, in a straw hat; `pose` says what her paws are doing
function marbles(g, pose) {
  const K = '#2b1d3c', B = '#a8743a', S = '#5a3618', L = '#e8c89a', P = '#ff9ab8', Y = '#ffd23a', Y2 = '#c89018';
  const R = (x, y, w, h, c) => px(g, c, x, y + 4, w, h);
  const arm = (x, y, w, h) => { R(x, y, w, h, K); R(x + 1, y + 1, w - 2, h - 2, B); };
  // body and feet
  R(9, 19, 16, 16, K); R(10, 20, 14, 14, B); for (let i = 0; i < 3; i++) R(10, 23 + i * 4, 14, 1, S); R(13, 24, 8, 9, L);
  R(9, 33, 6, 4, K); R(10, 33, 4, 3, B); R(19, 33, 6, 4, K); R(20, 33, 4, 3, B);
  R(24, 28, 7, 3, K); R(25, 29, 6, 1, B); R(29, 24, 3, 7, K); R(30, 25, 1, 5, S);   // tail
  // head
  R(6, 5, 22, 15, K); R(7, 6, 20, 13, B);
  R(6, 2, 5, 5, K); R(7, 3, 3, 3, P); R(23, 2, 5, 5, K); R(24, 3, 3, 3, P);
  R(12, 7, 1, 3, S); R(16, 7, 1, 4, S); R(20, 7, 1, 3, S);
  R(10, 11, 5, 3, '#3ec43e'); R(11, 11, 2, 3, K); R(19, 11, 5, 3, '#3ec43e'); R(20, 11, 2, 3, K);
  R(15, 15, 4, 2, '#ff6fa0'); R(12, 17, 10, 1, K); R(11, 16, 1, 1, K); R(22, 16, 1, 1, K);
  R(3, 14, 4, 1, '#fff'); R(27, 14, 4, 1, '#fff');
  // her straw hat
  R(3, 3, 28, 2, Y2); R(4, 3, 26, 1, Y); R(10, -1, 14, 5, Y2); R(11, 0, 12, 3, Y); R(10, 2, 14, 1, '#e8202a');
  if (pose === 'up') { arm(3, 8, 3, 12); arm(28, 8, 3, 12); R(2, 6, 5, 3, K); R(3, 7, 3, 1, B); R(27, 6, 5, 3, K); R(28, 7, 3, 1, B); }
  else if (pose === 'throw') { arm(6, 22, 3, 9); arm(27, 3, 3, 14); R(26, 0, 5, 4, K); R(27, 1, 3, 2, B); }
  else if (pose === 'squirt') {
    arm(6, 22, 3, 9); arm(24, 22, 6, 3);
    R(28, 19, 6, 6, K); R(29, 20, 4, 4, '#ff7a1a'); R(33, 21, 1, 2, '#9ad8ff'); R(30, 24, 2, 3, K);
  } else if (pose === 'bucket') {
    arm(6, 22, 3, 7); arm(25, 22, 3, 7);
    R(9, 26, 16, 9, K); R(10, 27, 14, 7, '#2a78e8'); R(10, 27, 14, 2, '#6ab4ff'); R(12, 24, 10, 2, K);
  } else { arm(6, 22, 3, 9); arm(25, 22, 3, 9); }
}

export function drawPoolArt() {
  const A = {};
  A.deck = tex(16, 16, g => {
    px(g, '#f1e4ff', 0, 0, 16, 16);
    for (const o of [0, 8]) { px(g, '#cdbbf2', o, 0, 1, 16); px(g, '#cdbbf2', 0, o, 16, 1); }
    for (const [x, y] of [[3, 3], [11, 5], [5, 11], [13, 12], [2, 8]]) px(g, '#dccdf7', x, y);
  });
  const water = (frame) => tex(16, 16, g => {
    px(g, '#2fb8ee', 0, 0, 16, 16);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const w = Math.sin((x + frame * 3) * 0.7 + Math.sin(y * 0.6) * 1.3) + Math.sin((y - frame * 2) * 0.9 + x * 0.3);
      if (w > 1.2) px(g, '#9fe8ff', x, y); else if (w < -1.3) px(g, '#1c93d4', x, y);
    }
  });
  A.water = [0, 1, 2].map(water);
  A.shadow = tex(8, 4, g => { px(g, '#1c1238', 0, 1, 8, 2); px(g, '#1c1238', 1, 0, 6, 4); });
  A.ball = tex(12, 2, g => { ['#ff4f6a', '#fff', '#ffd23a', '#fff', '#3a8aff', '#fff'].forEach((c, i) => px(g, c, i * 2, 0, 2, 2)); });
  A.drop = tex(3, 3, g => { px(g, '#7fd6ff', 0, 0, 3, 3); px(g, '#fff', 1, 1); });
  A.ripple = tex(16, 16, g => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x - 7.5, y - 7.5); if (d > 5.6 && d < 7.6) px(g, '#d8f6ff', x, y); } });
  A.bang = tex(5, 11, g => { px(g, C.ink, 0, 0, 5, 7); px(g, C.red, 1, 0, 3, 6); px(g, C.ink, 1, 8, 3, 3); px(g, C.red, 1, 8, 3, 2); });
  A.stripe = tex(8, 8, g => { for (let i = 0; i < 8; i += 2) { px(g, '#ff7ab8', i, 0, 1, 8); px(g, '#fff', i + 1, 0, 1, 8); } });
  A.towel = tex(8, 8, g => { px(g, '#ffd23a', 0, 0, 8, 8); for (let i = 0; i < 8; i += 4) px(g, '#3ec8f0', 0, i, 8, 2); });
  A.sign = tex(52, 26, g => {
    px(g, C.ink, 0, 0, 52, 26); px(g, '#fff4e4', 1, 1, 50, 24);
    words(g, 'POOL RULES', 26, 3, 1, C.red, { align: 'center' });
    for (const [i, t] of ['NO RUNNING', 'NO SPLASHING', 'NO ANNOYING', 'SADIE NAPS'].entries()) words(g, t, 26, 9 + i * 4, 1, i === 3 ? C.pink3 : C.plum2, { align: 'center' });
  });
  A.bunting = tex(96, 8, g => {
    const cols = ['#ff4f6a', '#ffd23a', '#3ec8f0', '#58d04a', '#ff8ec8'];
    px(g, '#5e5c80', 0, 0, 96, 1);
    for (let i = 0; i < 12; i++) { const x = i * 8 + 1; for (let r = 0; r < 6; r++) px(g, cols[i % 5], x + Math.floor(r / 2), 1 + r, 6 - r, 1); }
  });
  A.chooter = Object.fromEntries(['run0', 'run1', 'air', 'bow', 'sit', 'swim'].map(p => [p, tex(CHOOTER.W, CHOOTER.H, g => chooter(g, p))]));
  A.marbles = Object.fromEntries(['grin', 'up', 'throw', 'squirt', 'bucket'].map(p => [p, tex(MARBLES.W, MARBLES.H, g => marbles(g, p))]));
  return A;
}

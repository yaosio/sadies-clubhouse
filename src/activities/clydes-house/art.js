// Clyde's house's pictures, drawn on little canvases when the clubhouse opens: Clyde (a little orange
// spark, in a few moods), the junk in the spare-parts box, the speech bubble, the house's siding,
// door and signs, the wallpaper, the chalkboard, and the bits of the machine that are flat.
// The speech bubble, the tags under the gaps and the treat counter are drawn again as they change.
import { NAMES } from './machine.js';

// (the pixel-drawing bits: weather-art.js uses them too)
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const rect = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
export function dith(g, a, b, x, y, w, h, amt) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) rect(g, BAYER[((y + j) % 4) * 4 + ((x + i) % 4)] / 16 < amt ? b : a, x + i, y + j, 1, 1);
}
function speckle(g, c, x, y, w, h, n, seed = 1) {
  let s = seed; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) rect(g, c, x + Math.floor(r() * w), y + Math.floor(r() * h), 1, 1);
}
export function disc(g, c, cx, cy, r) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) rect(g, c, cx + x, cy + y); }
// a sign: an edge, a stripe top and bottom, and its lines of words centred ([text, size, colour]);
// `edge` and `stripe` in the colours of whatever it's on (the house, the weather machine)
export const signs = ({ tex, words, C }, edge, stripe, plain) => (w, h, lines, bg = plain) => tex(w, h, g => {
  rect(g, edge, 0, 0, w, h); rect(g, bg, 1, 1, w - 2, h - 2); rect(g, stripe, 1, 1, w - 2, 2); rect(g, stripe, 1, h - 3, w - 2, 2);
  const lh = lines.map(l => (l[1] || 1) * 5 + 2), tot = lh.reduce((a, b) => a + b, 0) - 2;
  let y = Math.round((h - tot) / 2);
  lines.forEach(([text, s = 1, col = C.ink], i) => { words(g, text, w / 2, y, s, col, { align: 'center' }); y += lh[i]; });
});

// Clyde's own colours: terracotta, with a darker edge and a peach shine
// the speech bubble's lines: at most this many letters
export const LINE = 26;

export const K = { body: '#d97757', dark: '#a8502e', edge: '#5a2414', shine: '#ffb48e', cheek: '#ff7aa8' };

// Clyde: a spark with eight stubby rays, big eyes and little legs. 24 x 28.
// mood: 'idle', 'blink', 'talk', 'happy', 'oops', 'run1', 'run2', 'wave', 'think'
function clyde(g, mood) {
  const cx = 12, cy = 12;
  // the rays (one lifted for a wave), an edge first, then the body
  for (const pass of [0, 1]) for (let k = 0; k < 8; k++) {
    let a = k * Math.PI / 4 + Math.PI / 8, len = 10.5;
    if (mood === 'wave' && k === 6) { a -= 0.35; len = 11.5; }
    if (mood === 'think' && k === 1) { a += 0.5; len = 9; }
    for (let t = 5; t <= len; t += 0.5) {
      const x = Math.round(cx + Math.cos(a) * t), y = Math.round(cy + Math.sin(a) * t);
      if (pass === 0) rect(g, K.edge, x - 2, y - 2, 4, 4); else rect(g, t > len - 2 ? K.dark : K.body, x - 1, y - 1, 2, 2);
    }
  }
  disc(g, K.edge, cx, cy, 8); disc(g, K.body, cx, cy, 7);
  dith(g, K.body, K.dark, cx - 7, cy + 3, 15, 5, 0.35);
  rect(g, K.shine, cx - 5, cy - 6, 3, 1); rect(g, K.shine, cx - 6, cy - 5, 1, 2);
  // the legs
  const leg = (x, dy) => { rect(g, K.edge, x, 20, 2, 5 + dy); rect(g, K.edge, x - 1, 24 + dy, 4, 2); };
  if (mood === 'run1') { leg(8, -2); leg(14, 1); } else if (mood === 'run2') { leg(9, 1); leg(13, -2); } else { leg(9, 0); leg(13, 0); }
  // the face
  const eye = (x, open) => {
    if (mood === 'happy') { rect(g, K.edge, x, 10, 1, 1); rect(g, K.edge, x + 1, 9, 1, 1); rect(g, K.edge, x + 2, 10, 1, 1); return; }
    if (mood === 'oops') { rect(g, K.edge, x, 9, 1, 1); rect(g, K.edge, x + 2, 9, 1, 1); rect(g, K.edge, x + 1, 10, 1, 1); rect(g, K.edge, x, 11, 1, 1); rect(g, K.edge, x + 2, 11, 1, 1); return; }
    if (!open) { rect(g, K.edge, x, 11, 3, 1); return; }
    rect(g, '#ffffff', x, 8, 3, 4); rect(g, K.edge, x + (mood === 'think' ? 1 : 1), mood === 'think' ? 8 : 10, 2, 2);
  };
  eye(7, mood !== 'blink'); eye(14, mood !== 'blink');
  rect(g, K.cheek, 6, 13, 2, 1); rect(g, K.cheek, 16, 13, 2, 1);
  if (mood === 'talk' || mood === 'oops') { rect(g, K.edge, 11, 14, 3, 2); rect(g, K.cheek, 12, 15, 1, 1); }
  else if (mood === 'happy' || mood === 'wave' || mood.startsWith('run')) { rect(g, K.edge, 10, 14, 1, 1); rect(g, K.edge, 11, 15, 3, 1); rect(g, K.edge, 14, 14, 1, 1); }
  else rect(g, K.edge, 11, 15, 3, 1);
}

export function drawArt({ tex, words, C }) {
  const A = {};
  A.clyde = {};
  for (const mood of ['idle', 'blink', 'talk', 'happy', 'oops', 'run1', 'run2', 'wave', 'think']) A.clyde[mood] = tex(24, 28, g => clyde(g, mood));

  // ---------- the spare-parts box: junk, 16 x 16 each ----------
  const J = {
    duck: g => { disc(g, '#8a6a00', 7, 10, 5); disc(g, '#ffd23a', 7, 10, 4); disc(g, '#8a6a00', 10, 5, 3); disc(g, '#ffd23a', 10, 5, 2); rect(g, '#ff8a2a', 12, 5, 3, 2); rect(g, C.ink, 10, 4); rect(g, '#fff08a', 5, 8, 3, 1); },
    banana: g => { for (let i = 0; i < 12; i++) { const x = 2 + i, y = Math.round(4 + 0.12 * (i - 6) * (i - 6) * -1 + 7); rect(g, '#8a6a00', x, y - 1, 1, 4); rect(g, '#ffe040', x, y, 1, 2); } rect(g, '#5a3a10', 1, 7, 2, 2); rect(g, '#5a3a10', 14, 7, 1, 2); },
    sock: g => { rect(g, C.ink, 5, 1, 6, 10); rect(g, C.ink, 3, 9, 10, 6); for (let y = 2; y < 14; y++) { const col = (y >> 1) % 2 ? C.red : C.white; rect(g, col, 6, y, 4, 1); if (y > 9) rect(g, col, 4, y, 8, 1); } },
    cactus: g => { rect(g, '#b85a2a', 4, 11, 8, 5); rect(g, '#7a3a1a', 4, 11, 8, 1); rect(g, C.green3, 6, 2, 4, 9); rect(g, C.green, 7, 3, 2, 8); rect(g, C.green3, 2, 5, 3, 2); rect(g, C.green3, 2, 3, 2, 3); rect(g, C.green3, 11, 6, 3, 2); rect(g, C.green3, 12, 4, 2, 3); rect(g, C.pink, 7, 1, 2, 2); speckle(g, C.white, 6, 3, 4, 7, 5, 3); },
    floppy: g => { rect(g, '#1a1a60', 1, 1, 14, 14); rect(g, '#3a4ab0', 2, 2, 12, 12); rect(g, '#c8c8d8', 4, 2, 8, 5); rect(g, '#1a1a60', 9, 3, 2, 3); rect(g, C.white, 3, 9, 10, 5); rect(g, C.red, 4, 10, 8, 1); rect(g, C.ink, 4, 12, 5, 1); },
    toaster: g => { rect(g, '#5e5c80', 1, 5, 14, 10); rect(g, '#c8c8d8', 2, 6, 12, 8); rect(g, C.white, 3, 7, 3, 1); rect(g, C.ink, 4, 5, 3, 1); rect(g, C.ink, 9, 5, 3, 1); rect(g, '#d8a060', 4, 3, 3, 2); rect(g, C.red, 12, 10, 2, 2); rect(g, '#5e5c80', 2, 15, 2, 1); rect(g, '#5e5c80', 12, 15, 2, 1); },
    trophy: g => { rect(g, '#8a5a10', 3, 1, 10, 7); rect(g, C.gold, 4, 2, 8, 5); rect(g, '#fff08a', 5, 2, 1, 4); rect(g, '#8a5a10', 1, 2, 2, 4); rect(g, '#8a5a10', 13, 2, 2, 4); rect(g, '#8a5a10', 7, 8, 2, 3); rect(g, '#8a5a10', 4, 11, 8, 4); rect(g, C.gold, 5, 12, 6, 2); },
    bulb: g => { disc(g, '#8a6a00', 8, 6, 5); disc(g, '#fff08a', 8, 6, 4); rect(g, C.white, 6, 3, 2, 2); rect(g, '#8a88a8', 6, 11, 5, 4); rect(g, '#5e5c80', 6, 12, 5, 1); rect(g, '#5e5c80', 7, 14, 3, 1); rect(g, C.gold, 1, 2, 1, 1); rect(g, C.gold, 14, 3, 1, 1); rect(g, C.gold, 2, 9, 1, 1); },
    sandwich: g => { for (let y = 0; y < 12; y++) { const w = Math.round((12 - y) * 1.1); rect(g, '#b87838', 2, 3 + y, w, 1); rect(g, '#f0d8a0', 3, 3 + y, Math.max(0, w - 2), 1); } rect(g, C.green, 3, 9, 10, 1); rect(g, C.pink, 3, 10, 9, 1); rect(g, C.yellow, 3, 8, 11, 1); },
    plant: g => { rect(g, '#b85a2a', 4, 10, 8, 6); rect(g, '#7a3a1a', 3, 10, 10, 1); for (const [x, y, w] of [[7, 2, 2], [3, 4, 4], [9, 4, 4], [5, 6, 6], [2, 7, 3], [11, 7, 3]]) { rect(g, C.green3, x, y, w, 3); rect(g, C.green, x, y, w - 1, 1); } rect(g, C.green3, 7, 5, 2, 5); },
    shoe: g => { rect(g, C.ink, 2, 4, 7, 6); rect(g, C.ink, 1, 8, 14, 6); rect(g, '#2a8ad0', 3, 5, 5, 5); rect(g, '#2a8ad0', 2, 9, 12, 3); rect(g, C.white, 2, 12, 12, 1); rect(g, C.white, 4, 6, 3, 1); rect(g, C.white, 4, 8, 3, 1); rect(g, C.yellow, 10, 10, 2, 1); },
    fishbone: g => { for (const x of [5, 7, 9]) { rect(g, C.ink, x - 1, 3, 3, 10); } rect(g, C.ink, 1, 6, 12, 4); rect(g, C.white, 2, 7, 10, 2); for (const x of [5, 7, 9]) { rect(g, C.white, x, 4, 1, 3); rect(g, C.white, x, 9, 1, 3); } disc(g, C.ink, 12, 8, 3); disc(g, C.white, 12, 8, 2); rect(g, C.ink, 13, 7); rect(g, C.ink, 0, 4, 2, 8); rect(g, C.white, 0, 5, 1, 2); rect(g, C.white, 0, 9, 1, 2); },
    yoyo: g => { rect(g, C.ink, 8, 0, 1, 4); disc(g, C.ink, 8, 9, 6); disc(g, C.red, 8, 9, 5); rect(g, C.ink, 3, 9, 11, 1); rect(g, '#ff9a9a', 5, 5, 2, 2); rect(g, C.gold, 8, 9); },
    umbrella: g => { disc(g, C.ink, 8, 8, 7); disc(g, '#8a4ae8', 8, 8, 6); rect(g, C.yellow, 5, 3, 2, 5); rect(g, C.yellow, 10, 3, 2, 5); g.clearRect(0, 9, 16, 7); rect(g, C.ink, 1, 8, 15, 1); rect(g, C.ink, 8, 8, 1, 7); rect(g, C.ink, 5, 14, 3, 1); rect(g, C.ink, 5, 12, 1, 2); },
    pizza: g => { for (let y = 0; y < 12; y++) { const w = Math.max(1, 14 - Math.round(y * 1.2)), x = 8 - Math.floor(w / 2); rect(g, '#8a5a10', x, 3 + y, w, 1); rect(g, '#ffd060', x + 1, 3 + y, Math.max(0, w - 2), 1); } rect(g, '#8a5a10', 1, 1, 14, 3); rect(g, '#d89048', 2, 2, 12, 1); rect(g, C.red, 5, 6, 2, 2); rect(g, C.red, 9, 7, 2, 2); rect(g, C.red, 7, 10, 2, 2); },
  };
  A.junk = {};
  for (const [k, draw] of Object.entries(J)) A.junk[k] = tex(16, 16, draw);

  // an empty gap: a dashed outline and a question mark
  A.gap = tex(16, 16, g => {
    for (let i = 0; i < 16; i++) if ((i >> 1) % 2 === 0) { rect(g, C.ink, i, 0, 1, 2); rect(g, C.ink, i, 14, 1, 2); rect(g, C.ink, 0, i, 2, 1); rect(g, C.ink, 14, i, 2, 1); }
    disc(g, C.ink, 8, 8, 4); disc(g, C.white, 8, 8, 3); words(g, '?', 7, 6, 1, C.red);
  });
  // the arrow over the gap you've picked (keyboard), and puffs: a question mark, a heart, a sparkle
  A.arrow = tex(9, 7, g => { for (let y = 0; y < 5; y++) rect(g, C.ink, y, y, 9 - 2 * y, 1); for (let y = 0; y < 4; y++) rect(g, C.yellow, y + 1, y, 7 - 2 * y, 1); rect(g, C.ink, 4, 5, 1, 2); });
  A.what = tex(8, 8, g => { rect(g, C.ink, 0, 0, 8, 8); rect(g, C.white, 1, 1, 6, 6); words(g, '?', 2, 1, 1, C.red); });
  A.bang = tex(8, 8, g => { rect(g, C.ink, 0, 0, 8, 8); rect(g, C.yellow, 1, 1, 6, 6); words(g, '!', 2, 1, 1, C.red); });
  A.heart = tex(9, 8, g => { const H = ['011000110', '111101111', '111111111', '111111111', '011111110', '001111100', '000111000', '000010000'];
    H.forEach((row, y) => [...row].forEach((b, x) => b === '1' && rect(g, x < 3 && y < 2 ? '#ffc0e0' : C.pink2, x, y))); });
  A.spark = tex(7, 7, g => { rect(g, C.yellow, 3, 0, 1, 7); rect(g, C.yellow, 0, 3, 7, 1); rect(g, C.white, 3, 3); rect(g, C.yellow, 1, 1); rect(g, C.yellow, 5, 5); rect(g, C.yellow, 5, 1); rect(g, C.yellow, 1, 5); });
  // the treat: a little fish biscuit
  // the toaster's toast (it pops out), and the idea bulb lit up
  A.toast = tex(12, 11, g => { rect(g, '#7a4a2a', 0, 1, 12, 10); rect(g, '#7a4a2a', 1, 0, 10, 2); rect(g, '#e8b060', 1, 2, 10, 8); rect(g, '#f8d890', 2, 3, 8, 6); rect(g, '#c07838', 4, 5, 2, 1); rect(g, '#c07838', 7, 7, 1, 1); });
  A.lit = tex(16, 16, g => { disc(g, C.gold, 8, 6, 6); disc(g, '#fffbe0', 8, 6, 4); rect(g, C.white, 6, 3, 2, 2); rect(g, '#8a88a8', 6, 11, 5, 4); rect(g, '#5e5c80', 6, 12, 5, 1); rect(g, '#5e5c80', 7, 14, 3, 1); for (const [x, y] of [[0, 6], [15, 6], [8, 0], [2, 1], [13, 1], [1, 11], [14, 11]]) rect(g, C.yellow, x, y, 1, 1); });
  A.treat = tex(12, 7, g => { rect(g, '#7a4a2a', 1, 1, 8, 5); rect(g, '#d89048', 2, 2, 6, 3); rect(g, '#7a4a2a', 9, 0, 3, 7); rect(g, '#d89048', 10, 1, 1, 5); rect(g, C.ink, 3, 2); rect(g, '#f0c080', 4, 4, 3, 1); });
  // the paper boat, folded out of an old manual
  A.boat = tex(20, 12, g => {
    for (let y = 0; y < 6; y++) rect(g, '#c8c0e0', 4 + y, 6 + y, 12 - 2 * y, 1);
    for (let y = 0; y < 6; y++) { rect(g, C.white, 10 - y, y, y + 1, 1); rect(g, '#e8e0ff', 10, y, y + 1, 1); }
    rect(g, '#5e5c80', 0, 6, 20, 1); for (let x = 6; x < 15; x += 3) rect(g, '#8a88a8', x, 8, 2, 1);
  });
  // the teacup: white, with a pink band and a gold rim
  A.cup = tex(14, 12, g => {
    rect(g, C.ink, 1, 1, 10, 10); rect(g, C.white, 2, 1, 8, 9); rect(g, C.gold, 1, 1, 10, 1); rect(g, C.pink, 2, 5, 8, 2);
    rect(g, C.ink, 11, 3, 3, 1); rect(g, C.ink, 13, 3, 1, 5); rect(g, C.ink, 11, 7, 3, 1); rect(g, C.ink, 0, 11, 12, 1);
  });

  // ---------- the house ----------
  A.siding = tex(16, 16, g => { rect(g, '#ffd860', 0, 0, 16, 16); for (let y = 0; y < 16; y += 4) { rect(g, '#e8a030', 0, y + 3, 16, 1); rect(g, '#fff0a0', 0, y, 16, 1); } speckle(g, '#ffc040', 0, 0, 16, 16, 10, 4); });
  A.tiles = tex(16, 16, g => {
    rect(g, K.body, 0, 0, 16, 16);
    for (let y = 0; y < 16; y += 4) for (let x = (y / 4 % 2) * 4; x < 20; x += 8) { rect(g, K.dark, x - 4, y + 3, 8, 1); rect(g, K.dark, x - 4, y, 1, 4); rect(g, K.shine, x - 2, y + 1, 3, 1); }
  });
  A.door = tex(26, 46, g => {
    rect(g, K.edge, 0, 0, 26, 46); rect(g, '#2a8ad0', 1, 1, 24, 45); dith(g, '#2a8ad0', '#1a5a9a', 1, 30, 24, 16, 0.3);
    for (const [x, y, w, h] of [[3, 20, 9, 10], [14, 20, 9, 10], [3, 32, 9, 11], [14, 32, 9, 11]]) { rect(g, '#1a5a9a', x, y, w, h); rect(g, '#50b0f0', x + 1, y + 1, w - 2, 1); }
    disc(g, K.edge, 13, 9, 6); disc(g, '#a8e8ff', 13, 9, 5); rect(g, K.edge, 8, 9, 11, 1); rect(g, K.edge, 13, 4, 1, 11); rect(g, C.white, 10, 6, 2, 1);
    disc(g, C.gold2, 21, 27, 1); rect(g, C.gold, 21, 26);
    // the knocker: a little brass spark
    for (let k = 0; k < 4; k++) { rect(g, C.gold2, 12, 16, 3, 1); rect(g, C.gold2, 13, 15, 1, 3); } rect(g, C.gold, 13, 16);
  });
  A.doorBack = tex(26, 46, g => { rect(g, K.edge, 0, 0, 26, 46); rect(g, '#2a8ad0', 1, 1, 24, 45); for (const [x, y] of [[3, 3], [14, 3], [3, 24], [14, 24]]) { rect(g, '#1a5a9a', x, y, 9, 18); rect(g, '#50b0f0', x + 1, y + 1, 7, 1); } disc(g, C.gold2, 4, 26, 1); });
  A.round = tex(16, 16, g => { disc(g, K.edge, 8, 8, 7); disc(g, C.gold2, 8, 8, 6); disc(g, '#60c8f8', 8, 8, 5); dith(g, '#60c8f8', '#a8e8ff', 3, 3, 6, 5, 0.5); rect(g, C.gold2, 3, 8, 11, 1); rect(g, C.gold2, 8, 3, 1, 11); rect(g, '#fff08a', 5, 5, 2, 2); });
  A.window = tex(16, 20, g => { rect(g, K.edge, 0, 0, 16, 20); rect(g, '#fff4e4', 1, 1, 14, 18); rect(g, '#60c8f8', 2, 2, 12, 16); dith(g, '#60c8f8', '#fff08a', 2, 10, 12, 8, 0.4); rect(g, '#fff4e4', 7, 2, 2, 16); rect(g, '#fff4e4', 2, 9, 12, 2); rect(g, C.pink, 1, 17, 14, 2); });
  const board = signs({ tex, words, C }, K.edge, K.body, '#fff4e4');
  A.houseSign = board(76, 30, [['THE', 1, K.dark], ['OVERTHINKERY', 1, C.ink], ['CLYDE: I CAN', 1, K.dark], ['HELP WITH THAT!', 1, K.dark]]);
  A.mailbox = board(28, 11, [['CLYDE', 1, C.ink]]);
  A.mat = tex(40, 16, g => { rect(g, '#7a4a2a', 0, 0, 40, 16); rect(g, '#b87848', 1, 1, 38, 14); words(g, 'WIPE YOUR', 20, 2, 1, C.ink, { align: 'center' }); words(g, 'THOUGHTS', 20, 9, 1, C.ink, { align: 'center' }); });
  A.greet = tex(56, 13, g => bubble(g, 56, 13, ['HI! COME IN!'], words, C));

  // ---------- inside ----------
  A.paper = tex(16, 16, g => {
    rect(g, '#fff0dc', 0, 0, 16, 16); dith(g, '#fff0dc', '#ffe0c0', 0, 0, 16, 16, 0.2);
    rect(g, K.body, 3, 2, 1, 3); rect(g, K.body, 2, 3, 3, 1);          // little sparks
    words(g, '?', 10, 9, 1, '#f0b890');
  });
  A.floor = tex(16, 16, g => { rect(g, '#c07848', 0, 0, 16, 16); for (let y = 0; y < 16; y += 4) { rect(g, '#8a4a2a', 0, y, 16, 1); rect(g, '#8a4a2a', (y * 5) % 16, y, 1, 4); } speckle(g, '#e0a070', 0, 0, 16, 16, 14, 6); });
  A.pegboard = tex(8, 8, g => { rect(g, '#d8a060', 0, 0, 8, 8); rect(g, '#8a5a30', 2, 2); rect(g, '#8a5a30', 6, 6); rect(g, '#c89050', 0, 7, 8, 1); });
  A.rug = tex(16, 16, g => { rect(g, K.dark, 0, 0, 16, 16); rect(g, K.body, 1, 1, 14, 14); dith(g, K.body, '#ffc080', 3, 3, 10, 10, 0.3); rect(g, C.yellow, 7, 3, 2, 10); rect(g, C.yellow, 3, 7, 10, 2); });
  A.chalk = tex(64, 44, g => {
    rect(g, '#7a4a2a', 0, 0, 64, 44); rect(g, '#1a4a3a', 2, 2, 60, 40); dith(g, '#1a4a3a', '#2a5a48', 2, 2, 60, 40, 0.15);
    const ch = '#e8f0e8';
    words(g, 'PLAN V47', 4, 4, 1, ch);
    // the machine, drawn badly: a zig-zag of arrows ending at a cat
    const pts = [[6, 14], [18, 18], [28, 13], [40, 20], [52, 15], [52, 26], [38, 30], [24, 27], [12, 33]];
    for (let i = 1; i < pts.length; i++) { const [a, b] = pts[i - 1], [c, d] = pts[i]; for (let t = 0; t <= 1; t += 0.05) rect(g, ch, Math.round(a + (c - a) * t), Math.round(b + (d - b) * t)); }
    for (const [x, y] of pts) rect(g, C.yellow, x - 1, y - 1, 3, 3);
    rect(g, ch, 6, 34, 5, 3); rect(g, ch, 6, 33); rect(g, ch, 10, 33);   // the cat
    words(g, 'TREAT', 14, 36, 1, C.pink);
    words(g, '=1', 36, 36, 1, ch);
  });
  A.notes = tex(24, 24, g => {
    const note = (x, y, c, t) => { rect(g, c, x, y, 11, 11); rect(g, '#00000030', x + 1, y + 10, 10, 1); words(g, t, x + 1, y + 3, 1, C.ink); };
    note(0, 0, C.yellow, 'TO'); note(12, 2, C.pink, 'DO:'); note(3, 12, '#a8e8ff', 'ALL'); rect(g, C.ink, 14, 16, 8, 1); rect(g, C.ink, 14, 19, 6, 1);
  });
  A.books = tex(32, 24, g => {
    rect(g, '#7a4a2a', 0, 0, 32, 24);
    const cols = [C.red, C.tarp, C.gold, C.green2, C.pink2, K.body, C.plum, C.tarp2];
    for (const row of [0, 12]) { let x = 1; let i = row / 3; while (x < 31) { const w = 2 + ((i * 7) % 3), h = 8 + (i % 3); rect(g, cols[i % cols.length], x, row + 11 - h, w, h); rect(g, '#ffffff40', x, row + 11 - h + 1, w, 1); x += w + ((i % 4) ? 0 : 1); i++; } rect(g, '#5a3018', 0, row + 11, 32, 1); }
    rect(g, C.white, 20, 3, 9, 1); rect(g, C.white, 21, 2, 7, 1);   // a pile of papers on top
  });
  A.frame = tex(38, 36, g => { rect(g, C.gold2, 0, 0, 38, 36); rect(g, C.gold, 1, 1, 36, 34); rect(g, '#a8e8ff', 4, 3, 30, 20); words(g, 'MY FIRST', 19, 24, 1, C.ink, { align: 'center' }); words(g, 'CLIENT', 19, 30, 1, C.ink, { align: 'center' }); });
  A.title = board(96, 22, [['THE GOOD MORNING', 1, C.ink], ['MACHINE (MORE STEPS', 1, K.dark], ['IN THE FULL VERSION!)', 1, K.dark]], C.yellow);
  A.weight = tex(12, 10, g => { rect(g, C.ink, 1, 2, 10, 8); rect(g, '#5e5c80', 2, 3, 8, 6); rect(g, C.ink, 4, 0, 4, 3); rect(g, '#8a88a8', 5, 1, 2, 1); words(g, '1LB', 0, 4, 1, C.white); });

  // ---------- things drawn again as they change ----------
  // the speech bubble (108 x 34: up to four lines of 26 letters), wrapped to fit
  A.bubble = tex(108, 34, () => {});
  let said = null;
  A.say = text => { if (text === said) return; said = text; const g = A.bubble.image.getContext('2d'); g.clearRect(0, 0, 108, 34); if (text) bubble(g, 108, 34, wrap(text, LINE).slice(0, 4), words, C); A.bubble.needsUpdate = true; };
  // the tag under a gap: what's in it
  A.tag = () => tex(64, 9, () => {});
  A.label = (t, part) => {
    const g = t.image.getContext('2d'); g.clearRect(0, 0, 64, 9);
    const text = part ? NAMES[part] : 'EMPTY', w = text.length * 4 + 3;
    rect(g, C.ink, 32 - w / 2 - 1, 0, w + 2, 9); rect(g, part ? C.white : C.yellow, 32 - w / 2, 1, w, 7);
    words(g, text, 32, 2, 1, C.ink, { align: 'center' }); t.needsUpdate = true;
  };
  // the treat counter: a red LED board
  A.led = tex(48, 11, () => {});
  A.count = n => { const g = A.led.image.getContext('2d'); rect(g, C.ink, 0, 0, 48, 11); rect(g, '#300810', 1, 1, 46, 9); words(g, 'TREATS ' + String(n).padStart(3, '0'), 24, 3, 1, '#ff4040', { align: 'center' }); A.led.needsUpdate = true; };
  return A;
}

// a speech bubble with its lines: white, an ink edge, and a little tail at the bottom
function bubble(g, w, h, lines, words, C) {
  const bh = h - 4;
  rect(g, C.ink, 1, 0, w - 2, bh); rect(g, C.ink, 0, 1, w, bh - 2); rect(g, C.white, 1, 1, w - 2, bh - 2);
  rect(g, C.ink, 10, bh, 5, 1); rect(g, C.white, 11, bh - 1, 3, 2); rect(g, C.ink, 10, bh + 1, 3, 1); rect(g, C.white, 11, bh, 1, 1); rect(g, C.ink, 10, bh + 2, 1, 2);
  const top = Math.round((bh - lines.length * 7 + 2) / 2);
  lines.forEach((l, i) => words(g, l, Math.round(w / 2), top + i * 7, 1, C.ink, { align: 'center' }));
}
// words wrapped into lines of at most n letters
export function wrap(text, n) {
  const lines = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      if (line && (line + ' ' + word).length > n) { lines.push(line); line = word; }
      else line = line ? line + ' ' + word : word;
    }
    lines.push(line);
  }
  return lines;
}

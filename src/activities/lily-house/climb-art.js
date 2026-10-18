// The little pictures for Lily's Big Climb, dot by dot, at the game screen's own size (one dot is
// about 6 cm on the wall): Lily (16 dots long), Marbles up top (a brown tabby with her red bow), the
// things Marbles throws, the trampolines, her rubber chicken.
import { Pix } from './lily-art.js';

export const PAL = {
  K: '#3a2414', A: '#d9a066', L: '#f0c890', a: '#b07a46', d: '#94603a', C: '#f4dcb2', E: '#c98a52', P: '#1c120c', N: '#2c1c18',
  O: '#4a1e1e', M: '#e8749a', R: '#e8287c', B: '#ff6fb4', b: '#c63c86', W: '#ffffff',
  // Marbles
  k: '#2b1d3c', T: '#a8743a', S: '#5a3618', t: '#e8c89a', G: '#3ec43e', p: '#ff9ab8', r: '#e8202a',
  // the things she throws, and the chicken
  w: '#e8f4ff', c: '#9ad0ff', u: '#5a9ae8', h: '#ff8ec8', H: '#c0508a', g: '#8a8aa0', s: '#d8d8e8', v: '#e83a3a', V: '#a01a1a',
  Y: '#ffe23a', y: '#d6a818', Z: '#ee2a2a', X: '#ff8a1a', n: '#1c1238',
};
export const BOWS = { pink: { B: '#ff6fb4', b: '#c63c86' }, orange: { B: '#ff9a2a', b: '#cc5e10' } };

const grid = rows => { const w = Math.max(...rows.map(r => r.length)), p = new Pix(w, rows.length); rows.forEach((r, y) => [...r.padEnd(w, '.')].forEach((c, x) => { p.d[y][x] = c; })); return p; };

// ---------- Lily, from the side ----------
// Her body's the same both ways, but her bow isn't: it's on her left, so facing right (you see her
// left side) the whole bow is on top of her head, and facing left it only peeks over the back of it.
// Each way's head is drawn on its own; the body rows are the same rows read backwards.
const HEAD_R = [
  '..........BbB...',
  '.........KKBKK..',
  '........KALAAAK.',
  '...KK...KAAAPCK.',
  '..KLAK..KEAACCNK',
  '..KAAK..KEACCCK.',
  '...KAKKKKERRKKK.',
];
const HEAD_L = [
  '...B.B..........',
  '..KKbKK.........',
  '.KAAALAK........',
  '.KCPAAAK...KK...',
  'KNCCAAEK..KALK..',
  '.KCCCAEK..KAAK..',
  '.KKKRREKKKKAK...',
];
const BODY = [
  '...KALAAALAAAK..',
  '...KAALAAAALAK..',
  '...KAAAAAAAAAK..',
];
const LEGS = {
  walk0: ['...KAAKK.KKAAK..', '...KAK.....KAK..', '...KKK.....KKK..'],
  walk1: ['....KAAKKKAAK...', '.....KAK.KAK....', '.....KKK.KKK....'],
  jump: ['..KAAKKKKKKAAK..', '.KAK........KAK.', '.KK..........KK.'],
};
const back = r => [...r].reverse().join('');
export function lilySide(dir, legs) {
  const rows = dir > 0 ? [...HEAD_R, ...BODY, ...LEGS[legs]] : [...HEAD_L, ...BODY.map(back), ...LEGS[legs].map(back)];
  return grid(rows);
}
// from behind, climbing a ladder: her bow on her left (your left, from behind), paws reaching up in
// turn (frame 0 or 1)
export function lilyClimb(frame) {
  const top = [
    '...BbB........',
    '..KKBKKKKKK...',
    '.KEAALAAALEK..',
    'KEAAAAAAAAAEK.',
    'KEALAAAALAAEK.',
    '.KEAAAAAAAEK..',
    '..KKRRRRRKK...',
  ];
  const rest = frame ? [
    '.KAKALAAAK....', '.KAKAAAAAKAK..', '..K.KAAAKKAK..', '....KAAAK.K...', '...KAK.KAAK...', '...KKK.KKKK...',
  ] : [
    '....KALAAKAK..', '..KAKAAAAKAK..', '..KAKKAAAK.K..', '...K.KAAAK....', '...KAAK.KAK...', '...KKKK.KKK...',
  ];
  return grid([...top, ...rest]);
}
// from the front: hugging her chicken (won), or seeing stars (hit)
export function lilyFront(kind) {
  const top = [
    '..........BbB.',
    '...KKKKKKKKBK.',
    '..KEALAAALAEK.',
    '.KEAALAAAALAEK',
    '.KEAPCAACPAAEK',
    '.KEACCNNCCAAEK',
    '..KEACOOCAEK..',
    '...KKRRRRKK...',
  ];
  if (kind === 'dizzy') { top[4] = '.KEAKCAACKAAEK'; top[6] = '..KEACCMCAEK..'; }
  const body = kind === 'hug'
    ? ['..KAYYYYYYZK..', '..KAKYYYYYXK..', '..KALAAAAAAK..', '..KAK....KAK..', '..KKK....KKK..']
    : ['...KALAAALK...', '...KAAAAAAK...', '...KAAKKAAK...', '...KAK..KAK...', '...KKK..KKK...'];
  return grid([...top, ...body]);
}

// ---------- Marbles: a brown tabby sitting up, green eyes, the M on her forehead, her red bow ----------
// mood: 'plain', 'grin' (just let one go), 'cross' (Lily got the chicken); wind: her paw up, holding
// the next thing to throw
export function marbles(mood = 'plain', wind = false) {
  const p = new Pix(22, 22), cx = 11;
  // body and tail
  p.oval(cx, 17, 6.5, 5, 'T'); p.oval(cx, 18, 3, 3.5, 't');
  p.line(cx + 6, 20, cx + 9.5, 14, 'T', 2.2);
  for (let i = 0; i < 3; i++) p.line(cx - 6 + i, 14 + i * 2, cx - 4 + i, 14 + i * 2, 'S');
  // head and ears
  for (const s of [-1, 1]) { p.poly([[cx + s * 2, 3], [cx + s * 7, 0], [cx + s * 7.5, 6]], 'T'); p.poly([[cx + s * 4, 3.5], [cx + s * 6.4, 1.5], [cx + s * 6.5, 5]], 'p'); }
  p.oval(cx, 7, 7, 5.5, 'T');
  p.set(cx - 2, 3, 'S'); p.set(cx, 4, 'S'); p.set(cx + 2, 3, 'S'); p.set(cx - 1, 4, 'S'); p.set(cx + 1, 4, 'S');   // the M
  for (const s of [-1, 1]) { const ex = cx + s * 3; if (mood === 'cross') { p.line(ex - 1, 6 - s * 0.5, ex + 1, 6 + s * 0.5, 'k'); } else { p.rect(ex - 1, 6, 2, 2, 'G'); p.set(ex - (s < 0 ? 0 : 1) + (s < 0 ? 0 : 1), 6, 'k'); } }
  p.set(cx, 9, 'p');
  if (mood === 'grin') { p.line(cx - 2, 10, cx + 2, 10, 'k'); p.set(cx - 2, 9, 'k'); p.set(cx + 2, 9, 'k'); }
  else if (mood === 'cross') { p.line(cx - 2, 11, cx + 2, 11, 'k'); p.set(cx - 2, 12, 'k'); p.set(cx + 2, 12, 'k'); }
  else p.line(cx - 1, 10, cx + 1, 10, 'k');
  for (const s of [-1, 1]) { p.line(cx + s * 4, 9, cx + s * 8, 8.5, 'W'); }   // whiskers
  p.rect(cx + 3, 1, 4, 2, 'r'); p.rect(cx + 4, 0, 2, 4, 'r');   // her red bow
  // paws: one up with the next throw in it, or both down
  if (wind) p.line(cx + 5, 14, cx + 8, 9, 'T', 2.2); else p.oval(cx + 3, 21, 1.6, 1, 't');
  p.oval(cx - 3, 21, 1.6, 1, 't');
  return p.outlined('k');
}

// ---------- the things she throws: 10 x 10 each ----------
export function thing(kind) {
  const p = new Pix(12, 12);
  if (kind === 'bubbles') {
    for (const [x, y, r] of [[4, 7, 3], [8, 6, 2.6], [6, 3.5, 2.4], [8.5, 9, 1.8]]) { p.oval(x, y, r, r, 'c'); p.oval(x - 0.6, y - 0.6, r * 0.5, r * 0.5, 'w'); }
    return p.outlined('u');
  }
  if (kind === 'dryer') { p.oval(5, 4.5, 4, 3, 'h'); p.rect(8, 3, 3, 3, 'H'); p.rect(3, 7, 3, 4, 'H'); p.set(4, 4, 'W'); return p.outlined('n'); }
  if (kind === 'vacuum') { p.oval(5, 6, 4, 4, 'v'); p.oval(5, 6, 1.6, 1.6, 'V'); p.line(8, 3, 11, 0, 'g', 1.5); p.set(4, 4, 'W'); p.rect(1, 10, 9, 1, 'n'); return p.outlined('n'); }
  // clippers
  p.line(1, 8, 10, 4, 's', 2); p.line(1, 10, 10, 6, 'g', 1.5); p.oval(2, 9, 1.6, 1.6, 's');
  return p.outlined('n');
}
// a picture turned a quarter turn `n` times (they tumble as they roll)
export function quarter(p, n) {
  let q = p;
  for (let i = 0; i < (n % 4 + 4) % 4; i++) { const r = new Pix(q.h, q.w); for (let y = 0; y < q.h; y++) for (let x = 0; x < q.w; x++) r.d[x][q.h - 1 - y] = q.d[y][x]; q = r; }
  return q;
}

// the rubber chicken, standing on its perch
export function chick() {
  return grid([
    '.......ZZ....',
    '......KYYK...',
    '......KYPYXX.',
    '......KYYKZ..',
    '.KK..KYYK....',
    'KYYKKYYYK....',
    '.KYYYYYYYK...',
    '..KyYYYYyK...',
    '...KKXKXK....',
    '.....X.X.....',
  ]);
}
// a squeaky toy hammer: a pink head with red ends, a yellow handle (upright; quarter() turns it)
export function hammer() {
  return grid([
    '.KKKKKKK.',
    'KvhhhhhvK',
    'KvhWhhhvK',
    'KvhhhhhvK',
    '.KKKYKKK.',
    '...KYK...',
    '...KYK...',
    '...KYK...',
    '...KYK...',
    '...KKK...',
  ]);
}
// a sud: a little blob of soap foam with eyes, wobbling as it goes (frame 0 or 1)
export function sud(frame) {
  return grid(frame ? [
    '...KKKK...',
    '..KwwccK..',
    '.KwcccccK.',
    'KcwKccKccK',
    'KccKccKccK',
    'KcccccccuK',
    '.KcuccucK.',
    '..KK.KKK..',
  ] : [
    '..KKKKK...',
    '.KwwcccK..',
    '.KwcccccK.',
    'KcwKccKccK',
    'KccKccKccK',
    'KcccccccuK',
    '.KcucccuK.',
    '..KKK.KK..',
  ]);
}
// the bathtub at the bottom (where everything ends up): white, clawed feet, bubbles over the rim
export function tub() {
  return grid([
    '...w.c..w..c.w....',
    '..cwcwcwcwcwcwc...',
    'KKKKKKKKKKKKKKKKKK',
    'KWWWWWWWWWWWWWWWWK',
    '.KWWWWWWWWWWWWWWK.',
    '.KWWWWWWWWWWWWWsK.',
    '.KsWWWWWWWWWWWssK.',
    '..KssssssssssssK..',
    '...KKKKKKKKKKKK...',
    '...KY.......KY....',
  ]);
}
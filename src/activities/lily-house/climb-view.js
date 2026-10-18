// Lily's Big Climb, drawn: the game's numbers (climb.js) onto its screen (W x H dots), every frame
// it's looked at. Dark night-purple, stepped pink girders with rivets, the ladders, Marbles up
// top, her chicken on the perch, the things tumbling down, Lily; the scores along the top; and the
// words over it all (the title, READY!, YOU GOT IT!, GAME OVER).
import { W, H, GIRDERS, LADDERS, MARBLES, CHICKEN, TUB, gy } from './climb.js';
import { PAL, BOWS, lilySide, lilyFront, lilyClimb, marbles, thing, quarter, chick, hammer, sud, tub } from './climb-art.js';

// each little picture made once (per bow colour), as its own small canvas
const made = new Map();
function pic(key, bow, make) {
  const k = key + '/' + bow;
  if (!made.has(k)) {
    const p = make(), c = document.createElement('canvas'); c.width = p.w; c.height = p.h;
    const g = c.getContext('2d'), pal = { ...PAL, ...BOWS[bow] };
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) { const ch = p.d[y][x]; if (ch !== '.') { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); } }
    made.set(k, c);
  }
  return made.get(k);
}
const STARS = Array.from({ length: 40 }, (_, i) => [(i * 73 + 11) % W, (i * 151 + 37) % H, i % 3]);
const rect = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
let words;
const say = (g, text, y, s, color, shadow = '#1c1238') => words(g, text, W / 2, y, s, color, { align: 'center', shadow });
const fy = (g, x) => Math.round(gy(g, x));

// the girders: drawn in steps 8 dots long, like the real thing, a pink beam with a lattice and rivets
function girders(g) {
  for (const gd of GIRDERS) for (let x = gd.x0; x < gd.x1; x += 8) {
    const y = fy(gd, x + 4), w = Math.min(8, gd.x1 - x);
    rect(g, '#ff6fb4', x, y, w, 1); rect(g, '#c63c86', x, y + 1, w, 4); rect(g, '#ff9ad0', x, y + 5, w, 1);
    for (let i = 0; i < w; i++) if ((i + (x >> 3)) % 4 === 1) { rect(g, '#ffb8e0', x + i, y + 2, 1, 1); rect(g, '#ffb8e0', x + i + 1, y + 3, 1, 1); }
    rect(g, '#5a1a48', x, y + 6, w, 1);
  }
}

// the ladders: two cyan rails and their rungs, from the girder below up through the one above
function ladders(g) {
  for (const l of LADDERS) {
    const lo = fy(GIRDERS[l.on], l.x), hi = fy(GIRDERS[l.on + 1], l.x);
    // (a broken one is missing its middle)
    const gap = l.broken ? [hi + 7 + Math.round((lo - hi - 7) * 0.35), hi + 7 + Math.round((lo - hi - 7) * 0.65)] : [0, 0];
    for (const [a, b] of [[hi, gap[0] || lo], ...(l.broken ? [[gap[1], lo]] : [])]) {
      rect(g, '#3ec4e8', l.x - 5, a, 1, b - a); rect(g, '#3ec4e8', l.x + 4, a, 1, b - a);
      for (let y = b - 3; y > a; y -= 4) rect(g, '#9ae8ff', l.x - 4, y, 8, 1);
    }
  }
}

// G: the game; bow: her bow's colour; t: the clock (for blinking)
export function drawClimb(g, G, bow, t, write) {
  words = write;   // the clubhouse's letters, handed in (a room can't import the clubhouse)
  g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false;
  rect(g, '#120a24', 0, 0, W, H);
  for (const [x, y, k] of STARS) if (k || Math.floor(t * 2 + x) % 5) rect(g, k === 2 ? '#5a3a9a' : '#3a2a6a', x, y, 1, 1);
  ladders(g);
  girders(g);
  const L = G.lily, playing = G.state !== 'idle';
  // her chicken, on the perch (bobbing a little), until she's got it
  if (!G.won) g.drawImage(pic('chick', bow, chick), CHICKEN.x - 6, fy(GIRDERS[CHICKEN.on], CHICKEN.x) - 10 - (Math.floor(t * 3) % 2));
  // the bathtub, bottom left
  g.drawImage(pic('tub', bow, tub), TUB.x - 9, fy(GIRDERS[0], TUB.x) - 10 + 1);
  // the hammers still hanging there
  for (const h of G.hammers) if (!h.taken) g.drawImage(pic('hammer0', bow, hammer), h.x - 4, Math.round(h.y) - 10);
  // Marbles, up on her girder, her pile of things beside her
  const M = G.marbles, my = fy(GIRDERS[MARBLES.on], MARBLES.x);
  for (const [k, x, y] of [['vacuum', 0, 12], ['dryer', 9, 12], ['bubbles', 4, 23]]) g.drawImage(pic(k + 0, bow, () => thing(k)), x, my - y);
  const mood = G.won ? 'cross' : M.mood;
  g.drawImage(pic('marbles-' + mood + (M.throwing > 0 ? '-up' : ''), bow, () => marbles(mood, M.throwing > 0)), MARBLES.x - 11, my - 22);
  // what's tumbling down
  for (const it of G.items) {
    const n = Math.floor(it.spin) % 4, bob = it.kind === 'bubbles' ? Math.round(Math.sin(it.spin * 1.7)) : 0;
    g.drawImage(pic(it.kind + n, bow, () => quarter(thing(it.kind), n)), Math.round(it.x - 6), Math.round(it.y - 12 + bob));
  }
  // the suds
  for (const u of G.suds) { const f = Math.floor(u.t * 4) % 2; g.drawImage(pic('sud' + f, bow, () => sud(f)), Math.round(u.x - 5), Math.round(u.y - 8)); }
  // Lily
  if (L && playing && !(L.dying && L.dying < 0.6 && Math.floor(t * 10) % 2)) {
    const lx = Math.round(L.x), ly = Math.round(L.y);
    if (G.won) {
      g.drawImage(pic('hug', bow, () => lilyFront('hug')), lx - 7, ly - 13 - (Math.floor(G.t * 4) % 2) * 3);
    } else if (L.dying) {
      g.drawImage(pic('dizzy', bow, () => lilyFront('dizzy')), lx - 7, ly - 13);
      for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.1; rect(g, '#ffe23a', lx + Math.round(Math.cos(a) * 7), ly - 16 + Math.round(Math.sin(a) * 2), 1, 1); }
    } else if (L.climb) {
      const f = Math.floor(L.step / 4) % 2;
      g.drawImage(pic('climb' + f, bow, () => lilyClimb(f)), lx - 7, ly - 13);
    } else {
      const legs = L.air ? 'jump' : Math.floor(L.step / 5) % 2 ? 'walk1' : 'walk0';
      g.drawImage(pic('lily' + L.face + legs, bow, () => lilySide(L.face, legs)), lx - 8, ly - 13);
      // the hammer: up over her head, then down in front, over and over (flashing as it runs out)
      if (L.hammer > 0 && !(L.hammer < 2 && Math.floor(t * 8) % 2)) {
        const down = Math.floor(t * 6) % 2, n = down ? (L.face > 0 ? 1 : 3) : 0;
        g.drawImage(pic('hammer' + n, bow, () => quarter(hammer(), n)), down ? lx + (L.face > 0 ? 4 : -14) : lx - 4 + L.face * 2, down ? ly - 9 : ly - 23);
      }
    }
  }
  // little hearts when she's got it; the 100s
  if (G.won) for (let i = 0; i < 5; i++) { const k = (G.t * 0.6 + i / 5) % 1; heart(g, Math.round(L.x - 14 + i * 7 + Math.sin(k * 9 + i) * 2), Math.round(L.y - 18 - k * 34)); }
  for (const h of G.hearts) words(g, h.text, Math.round(h.x - 6), Math.round(h.y - h.t * 8), 1, '#ffe23a');
  // along the top: the score, the best, the bonus, the lives (her bows)
  rect(g, '#120a24', 0, 0, W, 21);
  words(g, 'SCORE', 4, 3, 1, '#ff8ec8'); words(g, String(G.score).padStart(6, '0'), 4, 10, 1, '#f2eaff');
  words(g, 'BEST', W / 2, 3, 1, '#ff8ec8', { align: 'center' }); words(g, String(G.high).padStart(6, '0'), W / 2, 10, 1, '#f2eaff', { align: 'center' });
  rect(g, '#3ec4e8', W - 34, 2, 31, 16); rect(g, '#120a24', W - 33, 3, 29, 14);
  words(g, 'BONUS', W - 28, 4, 1, '#3ec4e8'); words(g, String(G.bonus).padStart(4, '0'), W - 26, 11, 1, '#ffe23a');
  for (let i = 0; i < G.lives - (G.state === 'play' || G.state === 'won' ? 1 : 0); i++) bowPic(g, 4 + i * 8, 26, bow);
  // the words over it
  const blink = Math.floor(t * 2.5) % 2 === 0;
  if (G.state === 'idle') {
    panel(g, 96, 66);
    say(g, "LILY'S", 104, 2, '#ffe23a', '#a01018'); say(g, 'BIG CLIMB', 118, 2, '#ff8ec8', '#5a1a48');
    say(g, 'GET YOUR CHICKEN!', 138, 1, '#f2eaff');
    if (blink) say(g, 'PRESS PLAY', 150, 1, '#3ec4e8');
  } else if (G.state === 'ready') {
    say(g, G.lives === 3 && G.score === 0 ? 'GO GET IT, LILY!' : 'READY!', 238, 1, '#ffe23a');
  } else if (G.state === 'won' || G.state === 'done') {
    panel(g, 100, 50);
    say(g, 'YOU GOT IT!', 108, 2, '#ffe23a', '#a01018');
    say(g, 'BONUS ' + G.bonusWon, 126, 1, '#3ec4e8');
    if (G.state === 'done' && blink) say(g, 'PRESS PLAY AGAIN', 138, 1, '#f2eaff');
  } else if (G.state === 'over') {
    panel(g, 100, 44);
    say(g, 'GAME OVER', 108, 2, '#ff8ec8', '#5a1a48');
    if (blink) say(g, 'PRESS PLAY', 128, 1, '#3ec4e8');
  }
}
function panel(g, y, h) { rect(g, '#ff6fb4', 14, y - 2, W - 28, h); rect(g, '#1c1238', 16, y, W - 32, h - 4); }
function heart(g, x, y) { rect(g, '#ff6fb4', x, y, 2, 1); rect(g, '#ff6fb4', x + 3, y, 2, 1); rect(g, '#ff6fb4', x - 1, y + 1, 7, 2); rect(g, '#ff6fb4', x, y + 3, 5, 1); rect(g, '#ff6fb4', x + 1, y + 4, 3, 1); rect(g, '#ff6fb4', x + 2, y + 5, 1, 1); }
function bowPic(g, x, y, bow) { const c = BOWS[bow]; rect(g, c.B, x, y, 2, 4); rect(g, c.B, x + 4, y, 2, 4); rect(g, c.b, x + 2, y + 1, 2, 2); }

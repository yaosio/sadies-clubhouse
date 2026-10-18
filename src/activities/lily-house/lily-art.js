// Lily, drawn dot by dot: a curly apricot doodle with a big round teddy-bear head, dark eyes peeping out
// of her fluff, a big dark nose, a huge open smile (her tongue stays in: the owner's word), a pink
// collar, and a bow in her hair (pink some days, orange others), always on the LEFT side of her head.
// She loves to jump.
//
// Every picture is a grid of palette letters ('.' is see-through), drawn without a browser, so a check
// can read them. The outline is added last, round whatever was drawn.
//
// Her two side views are each drawn on purpose, never made by flipping the other: she isn't the same
// both sides. Seen from her left (facing your right) you see her whole bow; seen from her right (facing
// your left) it only peeks over the top of her head. Flip one and the bow swaps sides.

export const PAL = {
  K: '#4a2c18',   // outline: a warm dark brown, never black (she's all soft)
  A: '#d9a066',   // her coat: apricot
  a: '#b07a46',   // the shade in her curls
  L: '#f0c890',   // the light on her curls
  d: '#94603a',   // the far side of her (far legs, the inside of her ears)
  C: '#f4dcb2',   // the cream round her muzzle and eyes
  E: '#c98a52',   // her ears: a touch darker than the rest of her
  P: '#1c120c',   // her eyes
  W: '#ffffff',   // the glint in her eyes, her teeth
  N: '#2c1c18',   // her nose
  n: '#7a5a52',   // its shine
  O: '#4a1e1e',   // inside her mouth
  M: '#e8749a',   // her tongue
  m: '#c04c74',   // the line down her tongue
  R: '#e8287c',   // her collar
  r: '#a8145a',   // its shade
  S: '#ffb6d6',   // its stitching
  T: '#ffd23a',   // her tag
  B: '#ff6fb4',   // her bow (pink; the orange one swaps these two: see BOWS)
  b: '#c63c86',   // its shade and knot
  Y: '#ffe23a',   // her rubber chicken
  y: '#d6a818',   // its shade
  Z: '#ee2a2a',   // its comb and wattle
  X: '#ff8a1a',   // its beak and feet
};
export const BOWS = { pink: { B: '#ff6fb4', b: '#c63c86' }, orange: { B: '#ff9a2a', b: '#cc5e10' } };

export class Pix {
  constructor(w, h) { this.w = w; this.h = h; this.d = Array.from({ length: h }, () => Array(w).fill('.')); }
  set(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y][x] = c; }
  get(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.d[y][x] : '.'; }
  oval(cx, cy, rx, ry, c, only) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1 && (!only || only(x, y))) this.set(x, y, c);
    }
  }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  poly(pts, c) {
    const ys = pts.map(p => p[1]), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
    for (let y = y0; y <= y1; y++) {
      const yy = y + 0.5, xs = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= yy && by > yy) || (by <= yy && ay > yy)) xs.push(ax + (yy - ay) / (by - ay) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) this.set(x, y, c);
    }
  }
  line(x0, y0, x1, y1, c, wd = 1) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; if (wd > 1) this.oval(x, y, wd / 2, wd / 2, c); else this.set(x, y, c); }
  }
  curve(pts, c, wd) { for (let i = 0; i + 1 < pts.length; i++) this.line(...pts[i], ...pts[i + 1], c, wd); }
  // a fluffy blob: an oval with little bumps of fur all round its edge
  fluff(cx, cy, rx, ry, c, bumps = 14, r = 1.6) {
    this.oval(cx, cy, rx, ry, c);
    for (let i = 0; i < bumps; i++) { const t = i / bumps * Math.PI * 2 + 0.3; this.oval(cx + Math.cos(t) * rx, cy + Math.sin(t) * ry, r, r, c); }
  }
  over(p, dx = 0, dy = 0) { for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) if (p.d[y][x] !== '.') this.set(x + dx, y + dy, p.d[y][x]); }
  // her curls: every patch of `base` gets little rings of light and shade, staggered like a fleece
  curls(base, light, dark, seed = 0) {
    const ring = ['.L...', 'L.a..', '.a...', '...L.', '..L.a'];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.d[y][x] !== base) continue;
      const row = Math.floor((y + seed) / 5), xx = (x + seed + (row % 2) * 2) % 5, k = ring[(y + seed) % 5][xx];
      if (k === 'L') this.d[y][x] = light; else if (k === 'a') this.d[y][x] = dark;
    }
  }
  turned(a, px, py) {
    const out = new Pix(this.w, this.h), c = Math.cos(a), s = Math.sin(a);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const dx = x + 0.5 - px, dy = y + 0.5 - py, sx = Math.floor(px + c * dx + s * dy), sy = Math.floor(py - s * dx + c * dy);
      out.d[y][x] = this.get(sx, sy);
    }
    return out;
  }
  outlined(c = 'K') {
    const out = new Pix(this.w, this.h); out.d = this.d.map(r => [...r]);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.d[y][x] !== '.') continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([i, j]) => this.get(x + i, y + j) !== '.')) out.d[y][x] = c;
    }
    return out;
  }
  rows() { return this.d.map(r => r.join('')); }
}

// ---------- her bow: two loops and a knot, tipped a little ----------
function bow(p, x, y, s = 1) {
  p.poly([[x, y], [x - 5 * s, y - 3.5 * s], [x - 5.5 * s, y + 3 * s]], 'B');
  p.poly([[x, y], [x + 5 * s, y - 4 * s], [x + 5.5 * s, y + 2.5 * s]], 'B');
  p.set(x - 4 * s, y - 0.5, 'b'); p.set(x + 4 * s, y - 1, 'b');
  p.poly([[x - 1, y + 1], [x - 3 * s, y + 5 * s], [x - 1.5 * s, y + 5 * s]], 'b');   // the ribbon's tails
  p.poly([[x + 1, y + 1], [x + 2.5 * s, y + 5.5 * s], [x + 1, y + 5 * s]], 'b');
  p.oval(x, y, 1.5 * s, 1.5 * s, 'b');
}

// ---------- the rubber chicken: long, floppy, yellow, red comb, orange beak and dangly feet ----------
// lying on its side, its head to `dir` (1: your right)
function chicken(p, x, y, dir = 1, s = 1) {
  const X = u => x + dir * u * s, Yy = v => y + v * s;
  p.oval(X(-1), Yy(0), 6 * s, 2.6 * s, 'Y');                 // its body
  p.oval(X(-2), Yy(1.2), 4.5 * s, 1.2 * s, 'y');
  p.line(X(4), Yy(-0.5), X(8), Yy(-2.5), 'Y', 2.2 * s);       // its long neck
  p.oval(X(9), Yy(-3), 2 * s, 1.8 * s, 'Y');                 // its head
  p.poly([[X(10.5), Yy(-3.5)], [X(13.5), Yy(-2.6)], [X(10.6), Yy(-2)]], 'X');   // its beak
  p.oval(X(8.4), Yy(-5), 1.6 * s, 1 * s, 'Z'); p.set(X(10), Yy(-1), 'Z');     // comb and wattle
  p.set(X(9.4), Yy(-3.4), 'P');                               // its eye: a cross, it's a rubber chicken
  for (const u of [-3, 0]) p.line(X(u), Yy(2), X(u - 1), Yy(5), 'X');        // its feet, dangling
  p.line(X(-6), Yy(-1), X(-8), Yy(-2.5), 'Y', 1.5);           // its tail, a stub
}
export function chickenPix() { const p = new Pix(32, 16); chicken(p, 15, 8, 1, 1.05); return p.outlined(); }

// ---------- her head from the front: round and fluffy, ears hanging in big curls ----------
// look: -1 (your left) to 1 (your right); ears: 0 hanging, 1 flying up (mid-jump); mouth: 'smile' (tongue
// out), 'shut' (a little closed smile), 'chicken' (her rubber chicken in her mouth); blink.
function head(o = {}) {
  const { look = 0, ears = 0, mouth = 'smile', blink = false, cx = 28, cy = 17, bowOn = true } = o;
  const W = 56, H = 56, p = new Pix(W, H), l = look;
  // ears behind: long, hanging, curly; up and out when she's flying
  for (const s of [-1, 1]) {
    if (ears) p.fluff(cx + s * 13, cy - 6, 3.6, 6, 'E', 9, 1.4);
    else p.fluff(cx + s * 11.5 + l * 0.4, cy + 6, 3.8, 7.5, 'E', 10, 1.5);
  }
  // the head: a big round teddy-bear head, fluffier on top
  p.fluff(cx + l * 0.5, cy, 11.5, 10.5, 'A', 18, 1.8);
  p.fluff(cx + l * 0.5, cy - 7, 8, 4, 'A', 10, 1.6);
  p.curls('A', 'L', 'a', 1); p.curls('E', 'A', 'd', 2);
  // the cream round her eyes and muzzle, softly curled
  p.fluff(cx + l * 1.2, cy + 5, 7.5, 5.5, 'C', 12, 1.3);
  for (let i = 0; i < 9; i++) p.set(cx - 6 + i * 1.5 + l, cy + 1 + (i % 3 === 0 ? 1 : 0), 'L');
  // eyes: dark, round, half hidden under her fluffy brows
  for (const s of [-1, 1]) {
    const ex = cx + s * 5 + l * 1.3, ey = cy - 1;
    if (blink) { p.line(ex - 1.5, ey + 0.5, ex + 1.5, ey + 0.5, 'K'); continue; }
    p.oval(ex, ey, 2.2, 2.3, 'P');
    p.set(ex - 0.7 + l * 0.6, ey - 0.9, 'W');
    p.line(ex - 2.5, ey - 2.8, ex + 2.5, ey - 3, 'L');   // her brow fluff over it
  }
  // her nose: big, dark, round
  const nx = cx + l * 1.8, ny = cy + 4;
  p.oval(nx, ny, 3, 2.3, 'N');
  p.rect(Math.round(nx - 1.5), Math.round(ny - 1.5), 2, 1, 'n');
  p.line(nx, ny + 2, nx, ny + 3, 'K');
  if (mouth === 'smile') {
    // a huge open smile: the dark of her mouth, a row of teeth, her tongue tucked in at the bottom (never hanging out)
    p.poly([[nx - 6, ny + 2.5], [nx + 6, ny + 2.5], [nx + 4, ny + 7], [nx - 4, ny + 7]], 'O');
    p.line(nx - 5, ny + 3, nx + 5, ny + 3, 'W');
    p.line(nx - 6.5, ny + 1.5, nx - 5, ny + 3, 'K'); p.line(nx + 6.5, ny + 1.5, nx + 5, ny + 3, 'K');   // the corners, turned right up
    p.oval(nx, ny + 6, 3, 1.3, 'M');
  } else if (mouth === 'shut') {
    p.line(nx - 4.5, ny + 2, nx - 2, ny + 3.5, 'K'); p.line(nx - 2, ny + 3.5, nx + 2, ny + 3.5, 'K'); p.line(nx + 2, ny + 3.5, nx + 4.5, ny + 2, 'K');
    p.oval(nx - 2.5, ny + 4.6, 1.3, 1, 'M');   // just the tip of her tongue
  } else if (mouth === 'chicken') {
    p.line(nx - 5, ny + 2.5, nx + 5, ny + 2.5, 'O');
    const c = new Pix(W, H); chicken(c, nx - 2, ny + 5, 1, 0.95); p.over(c.outlined());
  }
  if (bowOn) bow(p, cx + 9 + l * 0.5, cy - 9, 1);   // on the left side of her head (your right): she's facing you
  return p;
}

// ---------- from the front, standing, sitting or up on her back legs ----------
// pose: 'stand', 'up' (on her back legs, front paws up, like a big hello), 'fly' (in the air, ears up,
// legs dangling); plus head's own options.
export function frontLily(o = {}) {
  const { pose = 'stand', wag = 0 } = o;
  const W = 56, H = 64, p = new Pix(W, H);
  const tw = wag * 5;
  if (pose === 'up') {
    // up on her back legs: a tall curly body, hind legs planted, front paws curled up in front of her chest
    p.curve([[28, 46], [28 + tw, 48]], 'a', 3);
    for (const s of [-1, 1]) { p.fluff(28 + s * 6, 54, 3.6, 6, 'A', 8, 1.2); p.oval(28 + s * 6.5, 61, 3.6, 2, 'A'); }
    p.fluff(28, 42, 9.5, 12, 'A', 14, 1.6);
    p.curls('A', 'L', 'a', 3);
    for (const s of [-1, 1]) { const leg = new Pix(W, H); leg.line(28 + s * 9, 42, 28 + s * 5, 39, 'A', 5); leg.fluff(28 + s * 4, 39.5, 3, 2.6, 'A', 7, 1); leg.curls('A', 'L', 'a', 0); leg.set(28 + s * 3, 41, 'a'); leg.set(28 + s * 5, 41, 'a'); p.over(leg.outlined()); }
  } else {
    const fly = pose === 'fly';
    // her tail: a curly plume over her back, wagging
    p.fluff(28 + tw, fly ? 32 : 34, 3, 3, 'A', 6, 1.2);
    // hind legs behind, peeking out either side
    for (const s of [-1, 1]) p.oval(28 + s * 9, fly ? 54 : 56, 3, 1.8, 'd');
    // chest: big and curly
    p.fluff(28, 44, 10, 9, 'A', 14, 1.6);
    p.curls('A', 'L', 'a', 3);
    // front legs: two curly columns, each with its own outline so they read in front of her chest
    for (const s of [-1, 1]) {
      const leg = new Pix(W, H), x = 28 + s * 4.5 - 2.5, y0 = 47, y1 = fly ? 54 : 56.5;
      leg.rect(x, y0, 5, y1 - y0, 'A'); leg.oval(x + 2.5, y1 + 0.5, 3.4, 2, 'A');
      leg.curls('A', 'L', 'a', s > 0 ? 1 : 3);
      leg.set(x + 1, y1 + 1, 'a'); leg.set(x + 3, y1 + 1, 'a');
      p.over(leg.outlined());
    }
  }
  // collar (just under her chin) and its heart-shaped tag
  const cy = pose === 'up' ? 29 : 33;
  if (pose !== 'up') p.poly([[18, cy], [38, cy], [37, cy + 3], [28, cy + 4.5], [19, cy + 3]], 'R');
  else p.poly([[19, cy], [37, cy], [36, cy + 3], [28, cy + 4], [20, cy + 3]], 'R');
  p.line(19, cy + 1, 28, cy + 2.5, 'S'); p.line(28, cy + 2.5, 37, cy + 1, 'S');
  p.oval(27.4, cy + 6, 1.2, 1.2, 'T'); p.oval(29, cy + 6, 1.2, 1.2, 'T'); p.set(28, cy + 7.3, 'T');
  const hd = head({ ...o, ears: o.ears ?? (pose === 'fly' ? 1 : 0) }).outlined();
  p.over(hd, 0, pose === 'up' ? -2 : 2);
  return p.outlined();
}

// ---------- from the side ----------
// dir 1: facing your right (you see her LEFT side, and her bow). dir -1: facing your left (you see
// her RIGHT side, and her bow only peeks over her head). Each drawn on purpose, never flipped:
// X() places a dot along her (nose at the high end), so the shapes run her way and the near and far
// things are chosen by hand for each side.
// step: 0..3, a trot; pose: 'trot', 'leap' (stretched out, front legs reaching, back legs pushing),
// 'crouch' (about to spring); chick: her chicken in her mouth.
export function sideLily(dir = 1, o = {}) {
  const { step = 0, pose = 'trot', wag = 0, chick = false } = o;
  const W = 64, H = 50, p = new Pix(W, H);
  const X = u => dir > 0 ? u : W - 1 - u;
  const P2 = pts => pts.map(([u, v]) => [X(u), v]);
  const leap = pose === 'leap', crouch = pose === 'crouch';
  const bob = leap ? -2 : crouch ? 3 : [0, -1, 0, -1][step % 4];
  const leg = (u, top, phase, c, front) => {
    // a curly leg from the body down to a round paw; swinging with the trot, or stretched in a leap
    let sw = [0, 2, 0, -2][(step + phase) % 4], foot = 44, fu = u + sw;
    if (leap) { fu = front ? u + 7 : u - 7; foot = front ? 36 : 38; }
    if (crouch) { fu = u + (front ? 2 : -1); foot = 44; }
    const q = new Pix(W, H);
    q.line(X(u), top + bob, X(fu), foot - 1, c, 4.2);
    q.oval(X(fu + (front ? 1 : 0.5)), foot, 2.8, 1.8, c);
    if (c === 'A') q.curls('A', 'L', 'a', phase);
    p.over(q);
  };
  // far legs first, in shade
  leg(17, 30, 2, 'd', false); leg(41, 30, 0, 'd', true);
  // her tail: a curly plume up over her back
  const tw = wag * 2;
  p.fluff(X(9 - tw), 18 + bob, 3.2, 3.6, 'A', 7, 1.2);
  p.line(X(13), 24 + bob, X(10 - tw), 20 + bob, 'A', 3);
  // her body: a round curly barrel, a deep chest
  p.fluff(X(28), 28 + bob, 15, 8, 'A', 16, 1.6);
  p.fluff(X(40), 28 + bob, 7, 8.5, 'A', 8, 1.4);
  if (leap) { const t = p.turned(dir * -0.18, X(30), 28); p.d = t.d; }
  p.curls('A', 'L', 'a', 2);
  // near legs
  leg(19, 31, 0, 'A', false); leg(39, 31, 2, 'A', true);
  // neck, and the collar
  const hy = 14 + bob + (crouch ? 2 : 0);
  p.poly(P2([[38, 22 + bob], [44, hy + 2], [52, hy + 4], [48, 30 + bob]]), 'A');
  p.curls('A', 'L', 'a', 1);
  p.poly(P2([[42.5, hy + 7], [45.5, hy + 5.5], [49.5, hy + 12], [46.5, hy + 13.5]]), 'R');
  p.line(X(43.5), hy + 6.5, X(47.5), hy + 12.5, 'S');
  p.oval(X(46.5), hy + 15, 1.1, 1.1, 'T');
  // her head: round and fluffy, the muzzle out in front
  const hx = 47;
  // the far ear just shows behind her head when she faces left; the near one hangs in front either way
  p.fluff(X(hx), hy, 9, 8.5, 'A', 16, 1.7);
  p.fluff(X(hx - 1), hy - 6, 6.5, 3, 'A', 8, 1.5);
  p.curls('A', 'L', 'a', 0);
  p.fluff(X(hx + 6.5), hy + 3, 4.5, 3.8, 'C', 8, 1.2);   // her muzzle: short and round, a doodle's
  p.oval(X(hx + 10), hy + 1.4, 2.2, 2, 'N'); p.set(X(hx + 9.5), hy + 0.4, 'n');
  // her smile, open, and her tongue: far side (facing right) just a bit under her jaw; near side (facing left) flopping out
  if (chick) {
    // hanging from her mouth by its neck, its body swinging down under her chin
    const mx = X(hx + 8), my = hy + 5, c = new Pix(W, H);
    chicken(c, mx - dir * 9 * 0.9, my + 3 * 0.9, dir, 0.9);
    p.over(c.turned(-dir * 1.25, mx + 0.5, my + 0.5).outlined());
  } else {
    p.poly(P2([[hx + 4, hy + 4.5], [hx + 10.5, hy + 3.8], [hx + 9, hy + 6.5], [hx + 5, hy + 6.5]]), 'O');
    p.line(X(hx + 5), hy + 4.6, X(hx + 9.5), hy + 4.2, 'W');
    p.line(X(hx + 3), hy + 3.5, X(hx + 4.5), hy + 4.8, 'K');
    p.line(X(hx + 5.5), hy + 6, X(hx + 8), hy + 6, 'M');   // her tongue, tucked in
  }
  // eye, under her fluffy brow
  p.oval(X(hx + 4), hy - 1.5, 1.6, 1.8, 'P'); p.set(X(hx + 3.6), hy - 2.3, 'W');
  p.line(X(hx + 2), hy - 4, X(hx + 6), hy - 3.8, 'L');
  // her near ear: a long curly flop down the side of her head
  const ey = leap ? hy - 4 : hy;
  p.fluff(X(hx - 3), ey + 4, 3.4, leap ? 4 : 6.5, 'E', 9, 1.3);
  p.curls('E', 'A', 'd', 1);
  // her bow: on her left: in full on the near side when she faces right, peeking over her head when she faces left
  if (dir > 0) bow(p, X(hx - 1), hy - 7, 1);
  else { p.poly(P2([[hx - 3, hy - 7], [hx - 6, hy - 12], [hx - 1, hy - 11]]), 'B'); p.poly(P2([[hx - 1, hy - 7], [hx + 1, hy - 12], [hx + 3, hy - 9]]), 'B'); p.set(X(hx - 1), hy - 8, 'b'); }
  return p.outlined();
}

// ---------- from behind: a round curly back end, her tail up, her ears, the bow on her left (your left) ----------
export function backLily(o = {}) {
  const { step = 0, wag = 0 } = o;
  const W = 56, H = 64, p = new Pix(W, H);
  const lift = [0, 1, 0, -1][step % 4];
  for (const s of [-1, 1]) p.oval(28 + s * 6, 56, 2.6, 1.6, 'd');   // her front paws, further off
  p.fluff(28, 44, 11, 9, 'A', 14, 1.6);
  for (const s of [-1, 1]) { const l = s < 0 ? lift : -lift; p.rect(28 + s * 6 - 3, 49 + l, 6, 10 - l, 'A'); p.oval(28 + s * 6, 59.5, 3.4, 1.8, 'A'); }
  p.fluff(28, 22, 11, 10, 'A', 16, 1.7);
  p.fluff(28, 15, 8, 4, 'A', 10, 1.5);
  for (const s of [-1, 1]) p.fluff(28 + s * 11, 28, 3.6, 7, 'E', 9, 1.4);
  p.curls('A', 'L', 'a', 2); p.curls('E', 'A', 'd', 0);
  p.poly([[19, 32], [37, 32], [37, 35], [19, 35]], 'R'); p.rect(26, 32, 4, 3, 'T');
  const tw = wag * 4;
  p.fluff(28 + tw, 34, 3.2, 3.2, 'A', 7, 1.2);
  p.curls('A', 'L', 'a', 1);
  bow(p, 28 - 9, 13, 1);   // her left side: your left, from behind
  return p.outlined();
}

// ---------- in her round front window: her head and front paws popping up as she jumps ----------
export function windowLily(o = {}) {
  const W = 56, H = 56, p = new Pix(W, H);
  p.fluff(28, 52, 12, 8, 'A', 12, 1.6); p.curls('A', 'L', 'a', 1);
  p.poly([[18, 40], [38, 40], [37, 43], [28, 44.5], [19, 43]], 'R'); p.line(19, 41, 28, 42.5, 'S'); p.line(28, 42.5, 37, 41, 'S');
  for (const s of [-1, 1]) { const q = new Pix(W, H); q.fluff(28 + s * 10, 50, 3.6, 3, 'A', 7, 1.1); q.curls('A', 'L', 'a', 0); q.set(28 + s * 10 - 1, 51, 'a'); q.set(28 + s * 10 + 1, 51, 'a'); p.over(q.outlined()); }
  p.over(head({ ...o, cy: 22 }).outlined());
  return p.outlined();
}

// every picture of her, by name (the game would make these once)
export function lilyPoses(make = f => f()) {
  const P = {};
  for (let i = 0; i < 4; i++) {
    const wag = [-1, 0, 1, 0][i];
    P[`right${i}`] = make(() => sideLily(1, { step: i, wag }));
    P[`left${i}`] = make(() => sideLily(-1, { step: i, wag }));
    P[`rightChick${i}`] = make(() => sideLily(1, { step: i, wag, chick: true }));
    P[`leftChick${i}`] = make(() => sideLily(-1, { step: i, wag, chick: true }));
    P[`back${i}`] = make(() => backLily({ step: i, wag }));
  }
  for (const d of ['right', 'left']) { const dir = d === 'right' ? 1 : -1; P[d + 'Leap'] = make(() => sideLily(dir, { pose: 'leap', wag: 1 })); P[d + 'Crouch'] = make(() => sideLily(dir, { pose: 'crouch' })); }
  for (const [k, wag] of [['A', -1], ['B', 1]]) {
    P['front' + k] = make(() => frontLily({ wag }));
    P['frontChick' + k] = make(() => frontLily({ wag, mouth: 'chicken' }));
  }
  P.frontL = make(() => frontLily({ look: -1, wag: 0 })); P.frontR = make(() => frontLily({ look: 1, wag: 0 }));
  P.frontBlink = make(() => frontLily({ blink: true }));
  P.fly = make(() => frontLily({ pose: 'fly', wag: 1 }));
  P.up = make(() => frontLily({ pose: 'up' }));
  P.upShut = make(() => frontLily({ pose: 'up', mouth: 'shut' }));
  P.window = make(() => windowLily({})); P.windowL = make(() => windowLily({ look: -1 })); P.windowR = make(() => windowLily({ look: 1 }));
  P.windowFly = make(() => windowLily({ ears: 1 }));
  return P;
}

// a grid of letters onto a 2D canvas context, in her pink bow or her orange one
export function paint(g, pix, bowColor = 'pink', x0 = 0, y0 = 0) {
  const pal = { ...PAL, ...BOWS[bowColor] };
  for (let y = 0; y < pix.h; y++) for (let x = 0; x < pix.w; x++) {
    const c = pix.d[y][x];
    if (c !== '.') { g.fillStyle = pal[c]; g.fillRect(x0 + x, y0 + y, 1, 1); }
  }
}

// ---------- her friend Chooter, for her wall: a black lab/pitbull mix, head and shoulders ----------
// broad blocky head, floppy lab ears, brown eyes, a big pink tongue, a white blaze on his chest, a blue
// collar with a gold tag (as he is in Dropper World and his paint shop)
export const CHOOTER = { K: '#1b1424', B: '#2d2733', H: '#4d4558', D: '#1b1620', Q: '#fffaf3', E: '#5a3a22', P: '#120d16', W: '#ffffff', N: '#120d16', n: '#5a5266', M: '#ff7a9a', m: '#d9546f', O: '#4a1e2a', R: '#3fa9e8', r: '#2a78c0', T: '#ffd23f' };
export function chooterPortrait() {
  const W = 48, H = 46, p = new Pix(W, H), cx = 24;
  // shoulders and chest, the white blaze
  p.poly([[6, 46], [10, 34], [16, 28], [32, 28], [38, 34], [42, 46]], 'B');
  p.poly([[20, 46], [21, 37], [24, 34], [27, 37], [28, 46]], 'Q');
  p.oval(12, 38, 3, 4, 'H', (x, y) => (x + y) % 2 === 0);
  // collar and tag
  p.poly([[14, 29], [34, 29], [35, 32.5], [24, 34.5], [13, 32.5]], 'R'); p.line(14, 32, 24, 34, 'r'); p.line(24, 34, 34, 32, 'r');
  p.oval(24, 36.5, 1.7, 1.7, 'T');
  const hd = new Pix(W, H);
  // ears: floppy lab ears, hanging either side
  for (const s of [-1, 1]) hd.poly([[cx + s * 7, 5], [cx + s * 13, 7], [cx + s * 14, 18], [cx + s * 11, 21], [cx + s * 8, 13]], 'D');
  // a broad blocky head and a big square muzzle
  hd.poly([[cx - 10, 5], [cx + 10, 5], [cx + 11, 14], [cx + 9, 21], [cx - 9, 21], [cx - 11, 14]], 'B');
  hd.poly([[cx - 6.5, 14], [cx + 6.5, 14], [cx + 7, 22], [cx + 5, 26], [cx - 5, 26], [cx - 7, 22]], 'B');
  hd.oval(cx - 4, 7.5, 3.5, 1.5, 'H'); hd.oval(cx, 16, 4, 1.6, 'H');
  for (const s of [-1, 1]) { const ex = cx + s * 5, ey = 11; hd.oval(ex, ey, 2, 1.8, 'E'); hd.set(ex, ey, 'P'); hd.set(ex - 1, ey - 1, 'W'); }
  hd.oval(cx, 18, 3.4, 2.2, 'N'); hd.rect(cx - 2, 17, 2, 1, 'n');
  // a big open grin and his big pink tongue
  hd.poly([[cx - 6, 21], [cx + 6, 21], [cx + 4, 24.5], [cx - 4, 24.5]], 'O');
  hd.line(cx - 7, 20, cx - 6, 21, 'K'); hd.line(cx + 7, 20, cx + 6, 21, 'K');
  hd.poly([[cx - 2.8, 22.5], [cx + 2.8, 22.5], [cx + 2.6, 28], [cx, 29.5], [cx - 2.6, 28]], 'M'); hd.line(cx, 23.5, cx, 28, 'm');
  p.over(hd.outlined());
  return p.outlined();
}

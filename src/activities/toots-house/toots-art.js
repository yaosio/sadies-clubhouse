// Toots, drawn dot by dot: a black pit mix with a gray muzzle, amber eyes, soft folded ears and a red
// collar. She has three legs: her FRONT LEFT leg is never drawn, in any picture.
//
// Every picture is a grid of palette letters ('.' is see-through), drawn without a browser, so a check
// can read them (tests/toots-house/run.mjs looks for a front left leg in each). The outline is added
// last, round whatever was drawn.
//
// The one rule that matters: her side pictures are never made by flipping each other. Flipping a dog
// seen from her left gives a dog seen from her right with the wrong leg missing. So `sideToots(dir)` draws
// each way on purpose: seen from her left (facing right) the near front leg is the missing one; seen
// from her right (facing left) it's the far one.

export const PAL = {
  K: '#121218',   // outline
  B: '#2e2f3a',   // her coat
  H: '#4a4d5e',   // shine on her coat
  D: '#1d1e26',   // shade
  G: '#8e8e98',   // gray muzzle
  g: '#bcbcc4',   // light gray chin
  E: '#c07a2e',   // amber eyes
  e: '#7a4418',   // darker amber
  P: '#140a06',   // pupil
  W: '#ffffff',   // glint
  N: '#0a0a0c',   // nose
  n: '#5c5e6c',   // shine on her nose
  R: '#e8202a',   // collar
  r: '#9a1018',   // collar's shade
  S: '#ff9a9a',   // collar stitching
  T: '#d8d8e8',   // tag
  M: '#ff7a98',   // tongue
  m: '#4a1420',   // inside her mouth
  Y: '#d8f03a',   // a tennis ball
  y: '#ffffff',   // its seam
};

class Pix {
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
  // a smooth bendy line through points (a tail)
  curve(pts, c, wd) { for (let i = 0; i + 1 < pts.length; i++) this.line(...pts[i], ...pts[i + 1], c, wd); }
  // lay another picture over this one, moved by dx, dy
  over(p, dx = 0, dy = 0) { for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) if (p.d[y][x] !== '.') this.set(x + dx, y + dy, p.d[y][x]); }
  // turned round a point, dot by dot (no smoothing: chunky on purpose)
  turned(a, px, py) {
    const out = new Pix(this.w, this.h), c = Math.cos(a), s = Math.sin(a);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const dx = x + 0.5 - px, dy = y + 0.5 - py, sx = Math.floor(px + c * dx + s * dy), sy = Math.floor(py - s * dx + c * dy);
      out.d[y][x] = this.get(sx, sy);
    }
    return out;
  }
  mirrored() { const out = new Pix(this.w, this.h); out.d = this.d.map(r => [...r].reverse()); return out; }
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

// a little dither: every other dot, for the edge between two colours
const checker = (x, y) => (x + y) % 2 === 0;

// ---------- her head, from the front ----------
// look: -1 (your left) to 1 (your right); ears: 0 soft and folded, 1 perked up; mouth: 'shut' or 'roo'
// (open and round, head up, eyes half shut: her talking howl); blink.
function head(o = {}) {
  const { look = 0, ears = 0, mouth = 'shut', blink = false, W = 48, H = 48, cx = 24, cy = 15 } = o;
  const p = new Pix(W, H), l = look, roo = mouth === 'roo';
  const up = roo ? -1.5 : 0;
  // ears, behind: soft rose ears fold out and down; perked, they stand up with the tips folded over
  for (const s of [-1, 1]) {
    const bx = cx + s * 7 + l * 0.8, by = cy - 6 + up;
    // (perked, the base lifts and the tip still flops over: rose ears never stand straight up)
    const tip = ears ? [cx + s * 11.5 + l, cy - 10.5 + up] : [cx + s * 14 + l * 0.5, cy - 5 + up];
    p.poly([[bx - s * 3, by + 3], [bx + s * 1.5, by - 2.5], tip, [bx + s * 4.5, by + 4]], 'B');
    const fold = ears ? [cx + s * 14.5 + l, cy - 6 + up] : [cx + s * 14 + l * 0.5, cy - 1 + up];
    p.poly([tip, fold, [tip[0] - s * 1.5, tip[1] + 4]], 'D');
  }
  // the skull and cheeks: broad, a pittie's head
  p.oval(cx + l * 0.6, cy + up, 10.5, 9, 'B');
  p.oval(cx + l * 0.8, cy + 5.5 + up, 11.5, 6.5, 'B');
  p.oval(cx - 3 + l, cy - 5 + up, 4, 2, 'H');   // shine on her forehead
  p.oval(cx + 3 + l * 1.2, cy - 6 + up, 1.6, 1, 'H');
  // the gray muzzle (she was a grand old lady), going into the black above with a dither
  const mx = cx + l * 1.6, my = cy + 8.5 + up;
  p.oval(mx, my, 7, 5.5, 'G', (x, y) => y >= my - 2 || checker(x, y));
  p.oval(mx, my + 3.5, 5, 2.4, 'g');
  // gray eyebrows
  for (const s of [-1, 1]) { const ex = cx + s * 5 + l * 1.2; p.set(ex - 1, cy - 3.5 + up, 'G'); p.set(ex, cy - 4 + up, 'G'); p.set(ex + 1, cy - 3.5 + up, 'G'); }
  // eyes: amber and soft, smiling (her cheeks push up under them)
  for (const s of [-1, 1]) {
    const ex = cx + s * 5 + l * 1.2, ey = cy + up;
    if (blink) { p.rect(Math.round(ex - 2), Math.round(ey), 4, 1, 'K'); continue; }
    p.oval(ex, ey, 2.3, 1.9, 'K');
    p.oval(ex, ey + 0.2, 1.7, 1.4, 'E');
    p.rect(Math.round(ex - 1.5), Math.round(ey + 1), 3, 1, 'e');
    const px = Math.round(ex - 0.5 + l * 0.8);
    p.rect(px, Math.round(ey - 0.5), 1, 2, 'P'); p.set(px + 1, ey - 0.5, 'P');
    p.set(px, ey - 1, 'W');
    if (roo) p.rect(Math.round(ex - 2), Math.round(ey - 2), 5, 2, 'B');   // half shut, singing
    else p.rect(Math.round(ex - 1.5), Math.round(ey + 1.5), 3, 1, 'B');   // happy eyes: her cheeks push up under them
  }
  // her nose, with its shine
  const nx = mx + l * 0.4, ny = cy + 5.8 + up;
  p.oval(nx, ny, 3.3, 1.9, 'N');
  p.rect(Math.round(nx - 1.5), Math.round(ny - 1.5), 3, 1, 'n');
  p.set(nx - 2, ny + 0.3, 'D'); p.set(nx + 1, ny + 0.3, 'D');
  // her mouth
  if (roo) {
    p.oval(nx, ny + 5, 2.3, 2.8, 'm');
    p.oval(nx, ny + 6.5, 1.6, 1, 'M');
  } else {
    // a big happy smile, open, with her tongue out: the corners turned right up
    p.oval(nx, ny + 3.8, 3.4, 1.6, 'm', (x, y) => y >= ny + 3);
    p.oval(nx + 0.5, ny + 5.4, 1.7, 1.9, 'M');
    p.set(nx + 0.5, ny + 5, 'm');
    p.line(nx, ny + 2, nx, ny + 2.6, 'K');
    p.line(nx - 4.6, ny + 1.6, nx - 2.6, ny + 3.2, 'K'); p.line(nx + 4.6, ny + 1.6, nx + 2.6, ny + 3.2, 'K');
    p.line(nx - 2.6, ny + 3.2, nx + 2.6, ny + 3.2, 'K');
  }
  return p;
}

// ---------- in the window: her head, shoulders and her one front paw on the sill ----------
// She faces you, so her right front paw is on YOUR left, and on your right there's no leg at all.
// tilt: -1, 0, 1 (a head tilt: "what's that?"); lift: 0 to 1, how far her paw is up (excited bounces).
export function windowToots(o = {}) {
  const { tilt = 0, lift = 0, sink = 0 } = o;
  const W = 48, H = 48, p = new Pix(W, H);
  const body = new Pix(W, H);
  // neck, shoulders and chest, going on down behind the sill (the picture's bottom edge)
  body.rect(16, 22, 16, 8, 'B');
  body.poly([[8, 48], [11, 38], [16, 29], [32, 29], [37, 38], [40, 48]], 'B');
  body.oval(36, 42, 4, 5, 'D', (x, y) => checker(x, y));    // her left side: smooth, no leg
  // her collar, and its tag
  body.poly([[15, 29], [33, 29], [34, 32], [24, 34.5], [14, 32]], 'R');
  body.line(15, 30, 24, 32.5, 'S'); body.line(24, 32.5, 33, 30, 'S');
  body.line(16, 32, 24, 34, 'r'); body.line(24, 34, 33, 32, 'r');
  body.oval(24, 36.2, 1.6, 1.8, 'T');
  p.over(body.outlined(), 0, sink);
  // her right front leg and paw, on your left, resting on the sill (its own outline, so it reads in front of her chest)
  const leg = new Pix(W, H), ly = Math.round(-lift * 4);
  leg.rect(11, 36 + ly, 7, 9, 'B');
  leg.rect(11, 37 + ly, 2, 6, 'H');
  leg.oval(14.5, 45 + ly, 4.6, 2.6, 'B');
  leg.set(12, 46 + ly, 'D'); leg.set(14, 46 + ly, 'D'); leg.set(16, 46 + ly, 'D');
  p.over(leg.outlined(), 0, sink);
  let h = head({ ...o });
  if (tilt) h = h.turned(tilt * 0.22, 24, 26);
  p.over(h.outlined(), 0, sink + (o.mouth === 'roo' ? -1 : 0));
  return p.outlined();
}

// ---------- from the side ----------
// dir 1: facing your right, so you see her LEFT side: the near front leg is the missing one, and her
// right front leg shows a little behind, darker, tucked in under her chest (where a three-legged dog
// carries it). dir -1: facing your left, you see her RIGHT side: the near front leg is there, the far
// one isn't. step: 0..3, a walk; wag: -1..1, her tail.
export function sideToots(dir = 1, o = {}) {
  const { step = 0, wag = 0, look = 0, ball = false } = o;
  const W = 72, H = 50, p = new Pix(W, H);
  const hop = [0, -1, -2, -1][step % 4];   // her front hops with each step
  const near = dir < 0;                   // drawn facing right, flipped at the end: is the near front leg there?
  const legsBack = (x, phase, c) => {
    const sw = [0, 1.5, 0, -1.5][(step + phase) % 4];
    p.poly([[x - 3, 27], [x + 3, 27], [x + 2 + sw, 36], [x + 4 + sw, 44], [x + 1 + sw, 44], [x - 2 + sw * 0.5, 36]], c);
    p.oval(x + 3 + sw, 44.5, 2.6, 1.5, c);
  };
  // far legs first (darker)
  legsBack(25, 2, 'D');
  // the far front leg: her RIGHT front leg when she faces right; when she faces left, the far one is her
  // missing left leg, so nothing
  const fsw = [0, 2, 0, -2][step % 4];
  if (!near) {
    p.poly([[44, 28 + hop], [49, 28 + hop], [48 + fsw, 44], [44.5 + fsw, 44]], 'D');
    p.oval(47.5 + fsw, 44.5, 2.6, 1.5, 'D');
  }
  // her tail, long and thin, wagging
  const tw = wag * 5;
  p.curve([[16, 22], [11, 21 + tw * 0.3], [7, 23 + tw], [4, 27 + tw * 1.4]], 'B', 2.2);
  // her body: deep chest, tucked waist
  p.oval(32, 24 + hop * 0.3, 16, 7.5, 'B');
  p.oval(45, 26 + hop * 0.6, 8, 8.5, 'B');
  p.oval(21, 23, 7.5, 7.5, 'B');
  p.line(18, 17.5, 42, 17.5 + hop * 0.5, 'H');   // shine along her back
  p.oval(30, 30, 9, 1.4, 'D', (x, y) => checker(x, y));
  // the near hind leg
  legsBack(22, 0, 'B');
  // the near front leg: only when it's her right one (facing left)
  if (near) {
    p.poly([[42, 27 + hop], [48, 27 + hop], [47 - fsw, 44], [43.5 - fsw, 44]], 'B');
    p.oval(46.5 - fsw, 44.5, 2.6, 1.5, 'B');
  } else {
    // where her left leg was: a smooth shoulder, a little shine
    p.oval(45, 27 + hop, 3.5, 3, 'H', (x, y) => checker(x, y));
  }
  // neck and collar
  p.poly([[44, 16 + hop], [53, 9 + hop], [58, 15 + hop], [52, 26 + hop]], 'B');
  p.poly([[50, 12 + hop], [53, 10.5 + hop], [57, 19 + hop], [54, 21 + hop]], 'R');
  p.line(51, 12 + hop, 55, 20 + hop, 'S');
  p.oval(55, 22.5 + hop, 1.3, 1.5, 'T');
  // her head
  const hy = 9 + hop;
  p.oval(58, hy, 7, 6, 'B');
  p.oval(55, hy - 3, 3, 1.5, 'H');
  p.poly([[60, hy - 1], [69, hy], [70, hy + 4], [61, hy + 6]], 'G');
  p.poly([[60, hy - 1.5], [68, hy - 0.5], [67, hy + 1], [60, hy + 1]], 'B');
  p.oval(65, hy + 5, 4, 1.6, 'g');
  p.oval(69.5, hy + 0.5, 1.6, 1.6, 'N');
  p.set(69, hy - 0.5, 'n');
  // her smile: the corner turned up, and her tongue out (not with the ball in her mouth)
  p.line(61.5, hy + 2.5, 63.5, hy + 4, 'K'); p.line(63.5, hy + 4, 68, hy + 4, 'K');
  if (!ball) { p.oval(64.5, hy + 5.6, 1.4, 1.6, 'M'); p.set(64.5, hy + 4.6, 'm'); }
  // eye
  p.oval(61, hy - 2, 1.6, 1.3, 'K'); p.set(61, hy - 2, 'E'); p.set(62, hy - 2, look > 0 ? 'P' : 'E'); p.set(61 + (look > 0 ? 1 : 0), hy - 2, 'P'); p.set(61, hy - 3, 'B');
  p.set(60, hy - 4, 'G'); p.set(61, hy - 4.5, 'G');
  // her ear: soft, folded back
  p.poly([[54, hy - 5], [57, hy - 7], [52, hy - 4], [50, hy - 1]], 'D');
  p.poly([[54, hy - 5.5], [57.5, hy - 6.5], [55, hy - 3]], 'B');
  if (ball) { p.oval(67, hy + 5.5, 2.8, 2.8, 'Y'); p.set(66, hy + 4.5, 'y'); p.set(68, hy + 6.5, 'y'); }
  const out = p.outlined();
  return dir < 0 ? out.mirrored() : out;
}

// ---------- from the front, standing: you see her right front leg on your left, nothing on your right ----------
export function frontToots(o = {}) {
  const { wag = 0, look = 0, ears = 0, mouth = 'shut', blink = false, ball = false } = o;
  const W = 48, H = 64, p = new Pix(W, H);
  // her tail, wagging above her back
  const tw = wag * 7;
  p.curve([[24, 34], [26 + tw * 0.5, 28], [28 + tw, 24]], 'D', 2.2);
  // hind legs, further back: their paws sit higher in the picture, peeking out either side
  // (only their paws show, tucked behind her: so the one front leg is the only leg you see)
  for (const sd of [-1, 1]) p.oval(24 + sd * 7, 53.5, 2.6, 1.5, 'D');
  // chest and body
  p.oval(24, 44, 10, 8.5, 'B');
  p.oval(31, 46, 4, 5, 'D', (x, y) => checker(x, y));   // her left shoulder: smooth, no leg
  // her right front leg, on your left, set in toward the middle the way she carried it, nearest you
  const leg = new Pix(W, H);
  leg.rect(17, 45, 6, 14, 'B'); leg.rect(17, 46, 2, 10, 'H');
  leg.oval(20, 59.5, 4.2, 2.2, 'B'); leg.set(18, 60, 'D'); leg.set(20, 60, 'D'); leg.set(22, 60, 'D');
  p.over(leg.outlined());
  // collar and tag
  p.poly([[15, 33], [33, 33], [34, 36], [24, 38.5], [14, 36]], 'R');
  p.line(15, 34, 24, 36.5, 'S'); p.line(24, 36.5, 33, 34, 'S');
  p.oval(24, 40, 1.6, 1.8, 'T');
  p.over(head({ look, ears, mouth, blink }).outlined(), 0, 3);
  if (ball) { const b = new Pix(W, H); b.oval(24 + look * 1.6, 31.5, 3.3, 3.1, 'Y'); b.set(23 + look * 1.6, 30, 'y'); b.set(25 + look * 1.6, 33, 'y'); p.over(b.outlined()); }
  return p.outlined();
}

// ---------- from behind: her tail up, both back legs, and her one front leg (her right: on your right,
// since you're behind her). Nothing on your left. ----------
export function backToots(o = {}) {
  const { wag = 0, step = 0 } = o;
  const W = 48, H = 64, p = new Pix(W, H);
  const lift = [0, 1, 0, -1][step % 4];
  // her front leg, further off: a little higher in the picture, peeking out past her body on your right
  p.rect(27, 46, 5, 9, 'D'); p.oval(29.5, 55.5, 2.6, 1.5, 'D');
  // her body from behind, and her back legs
  p.oval(24, 42, 10, 9, 'B');
  for (const sd of [-1, 1]) { const l = sd < 0 ? lift : -lift; p.rect(24 + sd * 6 - 3, 47 + l, 6, 12 - l, 'B'); p.oval(24 + sd * 6, 59.5, 3.4, 1.8, 'B'); p.line(24 + sd * 6 - sd * 3, 48, 24 + sd * 6 - sd * 3, 58, 'D'); }
  p.oval(24, 36, 6, 3, 'H', (x, y) => (x + y) % 2 === 0);
  // the back of her head, ears, and the collar's buckle
  p.oval(24, 22, 9, 8, 'B');
  for (const sd of [-1, 1]) p.poly([[24 + sd * 4, 16], [24 + sd * 11, 18], [24 + sd * 8, 23]], 'D');
  p.oval(24, 18, 4, 2, 'H');
  p.poly([[15, 29], [33, 29], [33, 32], [15, 32]], 'R'); p.rect(22, 29, 4, 3, 'T');
  // her tail, up and going
  const tw = wag * 6;
  p.curve([[24, 38], [24 + tw * 0.4, 32], [24 + tw, 27]], 'B', 2.4);
  return p.outlined();
}

// every picture the window uses, by name (the game would make these once). `make`: how each is
// made: straight away (the tests), or handed over still to make (the room, a breath between each)
export function windowPoses(make = f => f()) {
  const P = {};
  for (const [k, look] of [['L', -1], ['C', 0], ['R', 1]]) {
    P['soft' + k] = make(() => windowToots({ look }));
    P['perk' + k] = make(() => windowToots({ look, ears: 1 }));
  }
  P.blink = make(() => windowToots({ ears: 1, blink: true }));
  P.blinkSoft = make(() => windowToots({ blink: true }));
  P.tiltL = make(() => windowToots({ ears: 1, tilt: 1 }));
  P.tiltR = make(() => windowToots({ ears: 1, tilt: -1 }));
  P.bounce = make(() => windowToots({ ears: 1, lift: 1, look: 0 }));
  return P;
}

// every picture of her inside the house, by name: walking each way (four steps), with and without the
// ball, from the front (tail one way and the other, a blink, a roo) and from behind
export function roomPoses(make = f => f()) {
  const P = {};
  for (const ball of [false, true]) for (let i = 0; i < 4; i++) {
    const wag = [-1, 0, 1, 0][i], b = ball ? 'Ball' : '';
    P[`right${b}${i}`] = make(() => sideToots(1, { step: i, wag, ball }));
    P[`left${b}${i}`] = make(() => sideToots(-1, { step: i, wag, ball }));
  }
  for (const ball of [false, true]) for (const [k, wag] of [['A', -1], ['B', 1]]) P[`front${ball ? 'Ball' : ''}${k}`] = make(() => frontToots({ wag, ears: 1, ball }));
  P.frontBlink = make(() => frontToots({ wag: 0, ears: 1, blink: true }));
  P.frontRoo = make(() => frontToots({ mouth: 'roo' }));
  for (let i = 0; i < 4; i++) P[`back${i}`] = make(() => backToots({ step: i, wag: [-1, 0, 1, 0][i] }));
  return P;
}

// a grid of letters onto a 2D canvas context
export function paint(g, pix, x0 = 0, y0 = 0) {
  for (let y = 0; y < pix.h; y++) for (let x = 0; x < pix.w; x++) {
    const c = pix.d[y][x];
    if (c !== '.') { g.fillStyle = PAL[c]; g.fillRect(x0 + x, y0 + y, 1, 1); }
  }
}

// A coat of paint on one surface: a little grid of pixels, each one bare (0: the surface's own look)
// or one of the paints (1 to 14). Plain numbers, no browser, no three.js: the tests run it in Node,
// and it doesn't know what it's painted on (surfaces.js puts layers on the room's walls and things).
//
// Row 0 is the bottom (the way the graphics card reads a picture), so a stamp is drawn upside down
// into it and comes out the right way up on the wall.

// the paints, loud like Kid Pix (index 1 onwards; 0 is bare)
export const PAINTS = [
  null,
  { name: 'RED', hex: 0xe8283a }, { name: 'ORANGE', hex: 0xff8a1e }, { name: 'YELLOW', hex: 0xffe02a },
  { name: 'LIME', hex: 0x9af03a }, { name: 'GREEN', hex: 0x1fae4a }, { name: 'SKY BLUE', hex: 0x3ad0ff },
  { name: 'BLUE', hex: 0x2a5ae8 }, { name: 'PURPLE', hex: 0x8a3ae0 }, { name: 'PINK', hex: 0xff8ec8 },
  { name: 'HOT PINK', hex: 0xff2a9a }, { name: 'BROWN', hex: 0x9a5a2a }, { name: 'BLACK', hex: 0x1c1238 },
  { name: 'WHITE', hex: 0xffffff }, { name: 'GRAY', hex: 0x8a88a8 },
];
// the RAINBOW pot: a stroke goes through these in turn as it goes
export const RAINBOW = [1, 2, 3, 4, 6, 7, 8, 10];

export function makeLayer(w, h) { return { w, h, px: new Uint8Array(w * h) }; }

// what a tool might paint outside of: a box of pixels (x0, y0 to x1, y1, not including x1, y1). A
// box's six sides share one layer, each in its own cell, and paint never spills from one into the next.
const whole = L => ({ x0: 0, y0: 0, x1: L.w, y1: L.h });
const inside = (c, x, y) => x >= c.x0 && y >= c.y0 && x < c.x1 && y < c.y1;

// a round dab (or a square one: the roller), r pixels across from its middle. Returns how many
// pixels changed.
export function dab(L, x, y, r, c, o = {}) {
  const clip = o.clip || whole(L), R = Math.max(0.5, r);
  let n = 0;
  for (let j = Math.floor(y - R); j <= Math.ceil(y + R); j++) for (let i = Math.floor(x - R); i <= Math.ceil(x + R); i++) {
    if (!inside(clip, i, j)) continue;
    const dx = i + 0.5 - x, dy = j + 0.5 - y;
    if (o.square ? Math.max(Math.abs(dx), Math.abs(dy)) > R : dx * dx + dy * dy > R * R) continue;
    const k = j * L.w + i;
    if (L.px[k] !== c) { L.px[k] = c; n++; }
  }
  return n;
}

// a line of dabs from one point to the next (so a quick stroke has no gaps)
export function stroke(L, x0, y0, x1, y1, r, c, o = {}) {
  const d = Math.hypot(x1 - x0, y1 - y0), step = Math.max(0.5, Math.max(0.5, r) * 0.5), n = Math.max(1, Math.ceil(d / step));
  let changed = 0;
  for (let s = 1; s <= n; s++) changed += dab(L, x0 + (x1 - x0) * s / n, y0 + (y1 - y0) * s / n, r, c, o);
  return changed;
}

// a puff from the spray can: `dots` single pixels, scattered in a circle r across, thickest in the
// middle. rnd: a random number from 0 to 1 (seeded in the tests).
export function spray(L, x, y, r, c, dots, rnd, o = {}) {
  const clip = o.clip || whole(L);
  let n = 0;
  for (let s = 0; s < dots; s++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * rnd() ** 0.3 * r;
    const i = Math.floor(x + Math.cos(a) * d), j = Math.floor(y + Math.sin(a) * d);
    if (!inside(clip, i, j)) continue;
    const k = j * L.w + i;
    if (L.px[k] !== c) { L.px[k] = c; n++; }
  }
  return n;
}

// the paint bucket: every pixel joined to this one (up, down, left, right) that's the same as it
// becomes c. Returns how many changed.
export function fill(L, x, y, c, o = {}) {
  const clip = o.clip || whole(L);
  x = Math.floor(x); y = Math.floor(y);
  if (!inside(clip, x, y)) return 0;
  const was = L.px[y * L.w + x];
  if (was === c) return 0;
  const todo = [x, y];
  let n = 0;
  while (todo.length) {
    const ty = todo.pop(), tx = todo.pop();
    if (L.px[ty * L.w + tx] !== was) continue;   // (filled already, from another seed)
    // (along the row both ways, then the rows above and below it)
    let a = tx, b = tx;
    while (a - 1 >= clip.x0 && L.px[ty * L.w + a - 1] === was) a--;
    while (b + 1 < clip.x1 && L.px[ty * L.w + b + 1] === was) b++;
    for (let i = a; i <= b; i++) { L.px[ty * L.w + i] = c; n++; }
    for (const ny of [ty - 1, ty + 1]) {
      if (ny < clip.y0 || ny >= clip.y1) continue;
      let open = false;
      for (let i = a; i <= b; i++) {
        const same = L.px[ny * L.w + i] === was;
        if (same && !open) { todo.push(i, ny); open = true; } else if (!same) open = false;
      }
    }
  }
  return n;
}

// a stamp: a little picture (rows of letters, top row first; each letter a paint from `key`, '.'
// left alone), its middle at x, y, `s` pixels per dot. `tint` paints every dot that colour instead
// (the paw prints Sadie leaves are whatever she stepped in).
export function stamp(L, x, y, pic, key, s = 1, o = {}) {
  const clip = o.clip || whole(L), H = pic.length, W = pic[0].length;
  const x0 = Math.round(x - W * s / 2), y0 = Math.round(y - H * s / 2);
  let n = 0;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const ch = pic[j][i];
    if (ch === '.') continue;
    const c = o.tint || key[ch];
    for (let b = 0; b < s; b++) for (let a = 0; a < s; a++) {
      const px = x0 + i * s + a, py = y0 + (H - 1 - j) * s + b;   // (row 0 is the bottom)
      if (!inside(clip, px, py)) continue;
      const k = py * L.w + px;
      if (L.px[k] !== c) { L.px[k] = c; n++; }
    }
  }
  return n;
}

export function clear(L) { const n = L.px.reduce((a, v) => a + (v ? 1 : 0), 0); L.px.fill(0); return n; }
export const painted = L => L.px.reduce((a, v) => a + (v ? 1 : 0), 0);

// ---------- keeping it ----------
// Each layer is saved as runs: a byte with the paint in its top half and the run's length in its
// bottom half (1 to 14), or 14 meaning "15 plus the next byte", 15 "15 plus the next two". A bare wall
// is a few dozen bytes, a wall covered in spray-can dots about one byte a pixel. Then base64, so it
// fits in the browser's storage as text.
export function encode(L) {
  const out = [];
  const px = L.px;
  for (let i = 0; i < px.length;) {
    const v = px[i];
    let n = 1;
    while (i + n < px.length && px[i + n] === v && n < 65550) n++;
    if (n <= 14) out.push((v << 4) | (n - 1));
    else if (n - 15 < 256) out.push((v << 4) | 14, n - 15);
    else out.push((v << 4) | 15, (n - 15) >> 8, (n - 15) & 255);
    i += n;
  }
  let s = '';
  for (let i = 0; i < out.length; i += 4096) s += String.fromCharCode(...out.slice(i, i + 4096));
  return btoa(s);
}
// back into the layer (false, and left bare, if it doesn't fit: a save from some other shape of room)
export function decode(L, text) {
  let bin;
  try { bin = atob(text); } catch { return false; }
  const px = new Uint8Array(L.w * L.h);
  let p = 0;
  for (let i = 0; i < bin.length;) {
    const b = bin.charCodeAt(i++), v = b >> 4, k = b & 15;
    let n;
    if (k < 14) n = k + 1;
    else if (k === 14) n = 15 + bin.charCodeAt(i++);
    else { n = 15 + (bin.charCodeAt(i) << 8) + bin.charCodeAt(i + 1); i += 2; }
    if (v >= PAINTS.length || p + n > px.length) return false;
    px.fill(v, p, p + n); p += n;
  }
  if (p !== px.length) return false;
  L.px.set(px);
  return true;
}

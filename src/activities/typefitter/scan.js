// Sadie in TypeFitter: not drawn like in Dropper World, but a flat picture, the way a 1993 program
// would have her. Her real photo, shrunk way down, squashed to 16 colors with a dot pattern, traced
// over with a mouse (wobbly lines, a little off, some gone over twice; no line around her outside),
// and saved as a cheap JPEG twice (blocky squares, smeared color). Made once when the activity starts.
import PHOTO from './photo.js';

export async function drawScan(canvas) {
  const W = 128, H = 109;
  const photo = new Image(); photo.src = PHOTO;
  try { await photo.decode(); } catch (e) { return; }
  // 1. the photo, shrunk way down and brightened (it was taken at night)
  const S = document.createElement('canvas'); S.width = W; S.height = H;
  const s = S.getContext('2d');
  s.drawImage(photo, 0, 0, W, H);
  const im = s.getImageData(0, 0, W, H), d = im.data;
  // 2. squashed to 16 colors with a dot pattern
  const PAL = ['#1a1020', '#3a2418', '#5e3a22', '#8a5a34', '#b88050', '#e0b080', '#fff8ec', '#e2d8d0', '#b8aca4', '#857874', '#554a4c', '#f0a8a0', '#c87870', '#6f8290', '#c8b8d8', '#a02830']
    .map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, t = ((BAYER[(y & 3) * 4 + (x & 3)] + .5) / 16 - .5) * 44;
    const lift = v => (v - 14) * 1.42 + 6;
    const r = lift(d[i]) + t, gg = lift(d[i + 1]) + 4 + t, b = lift(d[i + 2]) + 10 + t;
    let best = PAL[0], bd = 1e9;
    for (const c of PAL) { const dd = (r - c[0]) ** 2 * .3 + (gg - c[1]) ** 2 * .59 + (b - c[2]) ** 2 * .11; if (dd < bd) { bd = dd; best = c; } }
    d[i] = best[0]; d[i + 1] = best[1]; d[i + 2] = best[2]; d[i + 3] = 255;
  }

  jpegCrush(d, W, H, 30); // the scan was saved as a JPEG once already...

  // 3. traced over with a mouse: wobbly ink lines, a little off from the photo, some gone over twice
  let seed = 7; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const dot = (x, y) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; const j = (y * W + x) * 4; d[j] = 30; d[j + 1] = 16; d[j + 2] = 40; };
  const line = (x0, y0, x1, y1) => { const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))) || 1; for (let k = 0; k <= n; k++) dot(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n); };
  // points are in the 256x218 photo; a smooth curve through them, wobbled, shifted a bit
  const trace = (pts, wob = 1) => {
    const curve = [];
    for (let k = 0; k < pts.length - 1; k++) {
      const p0 = pts[Math.max(0, k - 1)], p1 = pts[k], p2 = pts[k + 1], p3 = pts[Math.min(pts.length - 1, k + 2)];
      for (let t = 0; t < 1; t += .125) { const t2 = t * t, t3 = t2 * t; curve.push([0, 1].map(a => .5 * (2 * p1[a] + (-p0[a] + p2[a]) * t + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 + (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * t3))); }
    }
    curve.push(pts[pts.length - 1]);
    const passes = rand() < .35 ? 2 : 1;
    for (let pass = 0; pass < passes; pass++) {
      const f1 = 3 + rand() * 4, f2 = 9 + rand() * 6, ph1 = rand() * 6, ph2 = rand() * 6, ox = 1 + rand() * .8, oy = -.6 + rand() * .6;
      let prev = null;
      curve.forEach(([x, y], k) => {
        const u = k / Math.max(1, curve.length - 1);
        const q = [x / 2 + ox + (Math.sin(u * f1 + ph1) * .7 + Math.sin(u * f2 + ph2) * .3) * wob, y / 2 + oy + (Math.cos(u * f1 + ph2) * .7 + Math.sin(u * f2 + ph1) * .3) * wob];
        if (prev) line(...prev, ...q);
        prev = q;
      });
    }
  };
  trace([[40, 26], [45, 38], [50, 52]], .5);                                                     // inside the ears
  trace([[168, 25], [163, 40], [157, 52]], .5);
  trace([[55, 64], [66, 52], [80, 44], [92, 48], [104, 44], [118, 47], [134, 54], [150, 64]], .6);   // edge of her gray cap
  trace([[60, 77], [68, 74], [78, 76], [88, 81]], .4); trace([[62, 78], [70, 86], [80, 88], [88, 83]], .4);       // heavy-lidded eyes
  trace([[112, 81], [122, 77], [132, 76], [141, 78]], .4); trace([[113, 82], [120, 87], [132, 87], [140, 80]], .4);
  trace([[84, 71], [91, 70], [96, 79], [95, 95], [92, 106], [86, 99], [82, 86], [84, 71]], .5);  // the gray patch by her nose
  trace([[92, 106], [100, 104], [108, 106], [101, 117], [92, 106]], .3);                          // nose
  trace([[101, 117], [100, 123], [95, 127]], .3); trace([[100, 123], [106, 127]], .3);            // mouth
  for (const [a, b] of [[[86, 120], [38, 126]], [[86, 124], [42, 140]], [[118, 118], [172, 124]], [[118, 122], [166, 140]]]) trace([a, b], .6); // whiskers

  // 4. ...and again after tracing, at low quality, to fit on a floppy
  jpegCrush(d, W, H, 38);
  s.putImageData(im, 0, 0);
  canvas.getContext('2d').drawImage(S, 0, 0);
}

// A real (tiny) JPEG round trip: colors shared per 2x2 pixels, 8x8 blocks, most detail thrown away.
export function jpegCrush(d, W, H, quality) {
  const QY = [16,11,10,16,24,40,51,61,12,12,14,19,26,58,60,55,14,13,16,24,40,57,69,56,14,17,22,29,51,87,80,62,18,22,37,56,68,109,103,77,24,35,55,64,81,104,113,92,49,64,78,87,103,121,120,101,72,92,95,98,112,100,103,99];
  const QC = [17,18,24,47,99,99,99,99,18,21,26,66,99,99,99,99,24,26,56,99,99,99,99,99,47,66,99,99,99,99,99,99].concat(Array(32).fill(99));
  const sc = quality < 50 ? 5000 / quality : 200 - quality * 2;
  const qt = t => t.map(v => Math.max(1, Math.min(255, Math.floor((v * sc + 50) / 100))));
  const qy = qt(QY), qc = qt(QC);
  const cos = [], al = u => u ? 1 : Math.SQRT1_2;
  for (let x = 0; x < 8; x++) { cos[x] = []; for (let u = 0; u < 8; u++) cos[x][u] = Math.cos((2 * x + 1) * u * Math.PI / 16); }
  const block = (plane, pw, ph, bx, by, q) => {
    const f = new Float64Array(64), F = new Float64Array(64), t = new Float64Array(64);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) f[y * 8 + x] = plane[Math.min(ph - 1, by + y) * pw + Math.min(pw - 1, bx + x)] - 128;
    for (let y = 0; y < 8; y++) for (let u = 0; u < 8; u++) { let s = 0; for (let x = 0; x < 8; x++) s += f[y * 8 + x] * cos[x][u]; t[y * 8 + u] = s * al(u) / 2; }
    for (let u = 0; u < 8; u++) for (let v = 0; v < 8; v++) { let s = 0; for (let y = 0; y < 8; y++) s += t[y * 8 + u] * cos[y][v]; F[v * 8 + u] = Math.round(s * al(v) / 2 / q[v * 8 + u]) * q[v * 8 + u]; }
    for (let v = 0; v < 8; v++) for (let x = 0; x < 8; x++) { let s = 0; for (let u = 0; u < 8; u++) s += al(u) * F[v * 8 + u] * cos[x][u]; t[v * 8 + x] = s / 2; }
    for (let x = 0; x < 8; x++) for (let y = 0; y < 8; y++) { let s = 0; for (let v = 0; v < 8; v++) s += al(v) * t[v * 8 + x] * cos[y][v]; const yy = by + y, xx = bx + x; if (yy < ph && xx < pw) plane[yy * pw + xx] = s / 2 + 128; }
  };
  const Y = new Float64Array(W * H), cw = Math.ceil(W / 2), ch = Math.ceil(H / 2), Cb = new Float64Array(cw * ch), Cr = new Float64Array(cw * ch), n = new Float64Array(cw * ch);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, r = d[i], g = d[i + 1], b = d[i + 2], j = (y >> 1) * cw + (x >> 1);
    Y[y * W + x] = .299 * r + .587 * g + .114 * b;
    Cb[j] += 128 - .168736 * r - .331264 * g + .5 * b; Cr[j] += 128 + .5 * r - .418688 * g - .081312 * b; n[j]++;
  }
  for (let j = 0; j < Cb.length; j++) { Cb[j] /= n[j]; Cr[j] /= n[j]; }
  for (let by = 0; by < H; by += 8) for (let bx = 0; bx < W; bx += 8) block(Y, W, H, bx, by, qy);
  for (let by = 0; by < ch; by += 8) for (let bx = 0; bx < cw; bx += 8) { block(Cb, cw, ch, bx, by, qc); block(Cr, cw, ch, bx, by, qc); }
  const cl = v => v < 0 ? 0 : v > 255 ? 255 : v;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, j = (y >> 1) * cw + (x >> 1), yy = Y[y * W + x], cb = Cb[j] - 128, cr = Cr[j] - 128;
    d[i] = cl(yy + 1.402 * cr); d[i + 1] = cl(yy - .344136 * cb - .714136 * cr); d[i + 2] = cl(yy + 1.772 * cb);
  }
}

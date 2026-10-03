// TypeFitter's headless checks: the parts with no screen (the meter, the box, what Sadie says, the
// JPEG crusher), run in Node. Seeded, so every run is the same. A few seconds.
//
//   node tests/typefitter/run.mjs
import { makeMeter, boxFor, FEWEST, MOST, HEARTS, FIT_SCORES } from '../../src/activities/typefitter/love.js';
import { SAYS, reaction, SENTENCES } from '../../src/activities/typefitter/says.js';
import { jpegCrush } from '../../src/activities/typefitter/scan.js';
import { checker } from '../shared/check.mjs';

const { check, finish } = checker();
function seeded(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

// 1. the meter always fills, somewhere from the 4th to the 10th change, and never before its goal
{
  const random = seeded(12345);
  const m = makeMeter(random);
  const took = [], goals = new Set();
  let early = 0, overflow = 0, downs = 0, ups = 0;
  for (let round = 0; round < 3000; round++) {
    m.reset(); goals.add(m.goal);
    let n = 0;
    while (!m.full && n < 50) {
      const before = m.love, up = m.change(); n++;
      if (up) ups++; else downs++;
      if (m.love < 0 || m.love > HEARTS) overflow++;
      if (m.full && n < m.goal) early++;
      if (up !== (m.love >= before)) overflow++;
    }
    took.push(n);
  }
  check('the meter always fills within 10 changes', Math.max(...took) <= MOST, `slowest ${Math.max(...took)}`);
  check('...and never in fewer than 4', Math.min(...took) >= FEWEST, `quickest ${Math.min(...took)}`);
  check('...and every number of changes from 4 to 10 comes up', [...Array(MOST - FEWEST + 1)].every((_, i) => goals.has(FEWEST + i)), [...goals].sort((a, b) => a - b).join(' '));
  check('it never fills before its secret goal, or goes outside 0 to 10 hearts', !early && !overflow, `${early} early, ${overflow} out of range`);
  const share = downs / (ups + downs);
  check('it goes down now and then, so Sadie seems picky', share > 0.1 && share < 0.4, `${(share * 100).toFixed(0)}% of changes go down`);
  m.reset(); while (!m.full) m.change();
  const at = m.changes; m.change(); m.change();
  check('once full it stays full', m.full && m.changes === at);
}

// 2. the box never fits, and gets closer as the meter fills
{
  let fits = 0, worst = Infinity, grows = true;
  for (const [w, h] of [[20, 10], [300, 40], [900, 120], [5000, 700]]) {
    let last = 0;
    for (let love = 0; love <= HEARTS; love++) {
      const b = boxFor(w, h, love);
      if (b.w >= w || b.h >= h) fits++;
      worst = Math.min(worst, w - b.w);
      if (b.w < last) grows = false;
      last = b.w;
    }
  }
  check('the box is always too small for the text', !fits, `closest: ${worst.toFixed(1)} px too wide`);
  check('...by at least 5 px', worst >= 5 - 1e-9);
  check('...and never shrinks as the meter fills', grows);
  check('the fit score is always a win (over 100%)', FIT_SCORES.every(s => s > 100));
}

// 3. Sadie has something to say about every button, up or down
{
  const style = { fontName: 'GOTHICK', warpName: 'ARCH', colorName: 'RED', bold: true, italic: false, underline: true, outline: false, shadow: true, symbols: false };
  const random = seeded(99);
  let empty = 0;
  for (const fx of Object.keys(SAYS)) for (const w of [{ up: true }, { up: false }, { up: true, nowFull: true }, { up: true, wasFull: true, nowFull: true }]) {
    const line = reaction(fx, style, w, random);
    if (!line || /undefined/.test(line)) empty++;
  }
  check('Sadie has a line for every button, whichever way the meter goes', !empty, `${Object.keys(SAYS).length} buttons`);
  check('there are sentences to fit', SENTENCES.length >= 5 && SENTENCES.every(s => s.length <= 30));
}

// 4. the JPEG crusher keeps the picture (smeared, not wrecked)
{
  const W = 32, H = 24, d = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; d[i] = x * 8; d[i + 1] = y * 10; d[i + 2] = 128; d[i + 3] = 255; }
  const before = d.slice();
  jpegCrush(d, W, H, 30);
  let diff = 0; for (let i = 0; i < d.length; i += 4) diff += Math.abs(d[i] - before[i]) + Math.abs(d[i + 1] - before[i + 1]) + Math.abs(d[i + 2] - before[i + 2]);
  const avg = diff / (W * H * 3);
  check('the JPEG crusher changes the picture, but not beyond recognition', avg > 0.3 && avg < 25, `average change ${avg.toFixed(1)} of 255`);
}

finish('check(s) failed', 'all checks passed');

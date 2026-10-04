// Pictures of the town square outside the gate, from the built page (npm run build first):
// dist/shots/town/*.png. Birds and Sadie's watching move, so a few frames are taken a moment apart.
//   node tools/clubhouse/town.mjs
import { serve } from '../serve.mjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { launch, DEVICES } from '../browser.mjs';

const root = new URL('../..', import.meta.url).pathname, out = join(root, 'dist/shots/town');
mkdirSync(out, { recursive: true });
const server = await serve();
const browser = await launch();
for (const [device, opts] of [['desktop', DEVICES.desktop], ['phone', { ...DEVICES.phone, deviceScaleFactor: 1 }]]) {
  const ctx = await browser.newContext({ ...opts, ignoreHTTPSErrors: true });
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('page error:', e.message));
  await p.goto(`http://127.0.0.1:${server.address().port}/`);
  await p.waitForFunction(() => window.__clubhouse && window.__clubhouse.frames() > 5 && window.__clubhouse.settled(), null, { timeout: 40000 });
  await p.evaluate(() => document.querySelector('#ok')?.click());
  const M = (fn, ...a) => p.evaluate(([f, a]) => window.__clubhouse[f](...a), [fn, a]);
  const look = async (x, z, y, lx, ly, lz) => {
    const dx = lx - x, dz = lz - z;
    await M('put', 'outside', { x, z, y, yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(ly - (y + 1.6), Math.hypot(dx, dz)) });
  };
  const shot = async (name, wait = 500) => { await p.waitForTimeout(wait); await p.screenshot({ path: join(out, `${device}-${name}.png`) }); console.log(`${device}-${name}`); };
  await look(0, -22.5, 0, 0, 1.5, -40); await shot('1-from-the-gate', 1500);
  await look(0, -22.5, 0, 0, 3, -40); await shot('1b-from-the-gate-later', 2500);
  await look(0, -30, 0, -12, 2, -42); await shot('2-left-buildings');
  await look(0, -30, 0, 12, 2, -42); await shot('3-right-buildings');
  await look(0, -26, 0, 0, 2, -50); await shot('4-ahead-path');
  for (let i = 0; i < 8; i++) { await look(2.2, -21.3, 0.6, 2.6, 2.6, -20.1); await shot(`5-sadie-${i}`, 1100); }
  await look(8, -24, 0, 2.6, 2.4, -20.1); await shot('5b-sadie-side');
  await look(4, -45, 0, 0, 3, -30); await shot('6-from-behind-the-square', 800);
  await look(0, -22, 12, 0, -5, -60); await shot('7-high');
  await ctx.close();
}
await browser.close(); server.close();

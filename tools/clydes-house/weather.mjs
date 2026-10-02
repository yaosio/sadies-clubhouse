// Pictures of Clyde's Weather Machine and each kind of weather (npm run build first): the machine up
// close, then for each weather (clear, rain, snow, a second sun, cats) the lane looking back at the
// mansion, Sadie on the gatepost, and the view out through the front door from the hall. As a
// desktop and a phone. Saves dist/shots/clydes-house/<device>-weather-<name>.png.
//   node tools/clydes-house/weather.mjs [desktop|phone] [rain|snow|sun|cats|clear]
import { serve } from '../serve.mjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { launch, quietFonts, DEVICES } from '../browser.mjs';

const root = new URL('../..', import.meta.url).pathname, out = join(root, 'dist/shots/clydes-house');
mkdirSync(out, { recursive: true });

const [only, which] = process.argv.slice(2);
const server = await serve();
const browser = await launch();
for (const [device, opts] of Object.entries(DEVICES)) {
  if (only && only !== device) continue;
  const ctx = await browser.newContext(opts);
  await quietFonts(ctx);
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('page error:', e.message));
  await p.goto(`http://127.0.0.1:${server.address().port}/`);
  await p.waitForFunction(() => window.__mansion && window.__mansion.frames() > 5 && window.__mansion.settled() && window.__weather, null, { timeout: 30000 });
  await p.evaluate(() => document.querySelector('#ok')?.click());
  const M = (fn, ...a) => p.evaluate(([f, a]) => window.__mansion[f](...a), [fn, a]);
  const shot = async (name, wait = 600) => { await p.waitForTimeout(wait); await p.screenshot({ path: join(out, `${device}-weather-${name}.png`) }); console.log(`${device}-weather-${name}`); };
  const look = async (place, x, z, y, lx, ly, lz) => {
    const dx = lx - x, dz = lz - z;
    await M('put', place, { x, z, y, yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(ly - (y + 1.6), Math.hypot(dx, dz)) });
  };
  const { x: mx, z: mz } = await p.evaluate(() => window.__weather.machine);
  await p.evaluate(() => window.__mansion.weatherSpeed(8));
  await look('outside', mx + 1.5, mz + 3.6, 0, mx, 1.6, mz); await shot('0-machine');
  for (const w of ['rain', 'snow', 'sun', 'cats', 'clear']) {
    if (which && which !== w) continue;
    await p.evaluate(w => { const W = window.__weather; if (W.state().now !== w) W.pull(w === 'clear' ? W.state().now : w); }, w);
    if (w === 'snow') await p.evaluate(() => window.__mansion.weatherSpeed(40));
    await look('outside', mx + 0.3, mz + 2.4, 0, mx, 1.4, mz); await shot(`${w}-1-levers`, 1500);
    await p.evaluate(() => window.__mansion.weatherSpeed(8));
    await look('outside', -3, -31, 0, 2, 5, -10); await shot(`${w}-2-lane`, 1200);
    await look('outside', 1.2, -23.5, 0, 2.6, 2.7, -20.1); await shot(`${w}-3-sadie`, 400);
    await look('outside', 0, -27, 0, 0, 3, -20); await shot(`${w}-4-sky`, 400);
    await look('hall', 0, -3, 0, 0, 1.6, 2); await M('faceDoor', 'hall', 'front', 2.2); await shot(`${w}-5-from-the-hall`, 1500);
  }
  await ctx.close();
}
await browser.close(); server.close();

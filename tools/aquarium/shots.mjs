// Pictures of the aquarium from the built page (dist/index.html): its door on the landing next to
// its neighbours, the sign on the glass, and the room, as a desktop and a phone: dist/shots/aquarium/
//   npm run build -- --preview && node tools/aquarium/shots.mjs
import { serve } from '../serve.mjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { launch, DEVICES } from '../browser.mjs';

const root = join(new URL('.', import.meta.url).pathname, '../..'), out = join(root, 'dist/shots/aquarium');
mkdirSync(out, { recursive: true });
const server = await serve();
const browser = await launch();
const SHOTS = [
  ['doors', async M => { await M('faceDoor', 'hall', 'aquarium', 4.5); const w = await M('where'); await M('turnTo', w.yaw - 0.4, 0); }],
  ['sign', async M => M('put', 'room:aquarium', { x: 0.9, z: 2.9, yaw: Math.PI, pitch: 0.22, y: 0 })],
  ['room', async M => M('put', 'room:aquarium', { x: -3.6, z: -4.8, yaw: Math.PI + 0.62, pitch: -0.12, y: 0 })],
];
for (const [device, opts] of Object.entries(DEVICES)) {
  const ctx = await browser.newContext(opts);
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('page error:', e.message));
  await p.goto(`http://127.0.0.1:${server.address().port}/`);
  await p.waitForFunction(() => window.__clubhouse && window.__clubhouse.frames() > 10 && window.__clubhouse.settled(), null, { timeout: 20000 });
  await p.click('#ok');
  const M = (fn, ...a) => p.evaluate(([f, a]) => window.__clubhouse[f](...a), [fn, a]);
  for (const [name, go] of SHOTS) {
    await go(M); await p.waitForTimeout(700);
    await p.screenshot({ path: join(out, `${device}-${name}.png`) });
    console.log(`dist/shots/aquarium/${device}-${name}.png`);
  }
  await ctx.close();
}
await browser.close(); server.close();

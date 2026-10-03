// Pictures from inside the hedge maze, looking all round (npm run build first): walks in through the
// front gate, then turns a step at a time. For checking the clubhouse over the hedges and the gates.
//   node tools/hedge-maze/look.mjs [steps] [pitch: how far up to look] [weather: rain, snow, sun, cats]
// Saves dist/shots/hedge-maze/look-<n>.png (desktop size).
import { serve } from '../serve.mjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { launch, DEVICES } from '../browser.mjs';

const root = new URL('../..', import.meta.url).pathname, out = join(root, 'dist/shots/hedge-maze');
mkdirSync(out, { recursive: true });

const steps = Number(process.argv[2] || 4);
const server = await serve();
const browser = await launch();
const p = await browser.newPage(DEVICES.desktop);
p.on('pageerror', e => console.log('page error:', e.message));
await p.goto(`http://127.0.0.1:${server.address().port}/`);
await p.waitForFunction(() => window.__mansion && window.__mansion.frames() > 5 && window.__mansion.settled(), null, { timeout: 30000 });
await p.click('#ok');
const M = (f, ...a) => p.evaluate(([f, a]) => window.__mansion[f](...a), [f, a]);
if (process.argv[4]) await M('setWeather', process.argv[4], { snap: true });
await M('faceDoor', 'outside', 'hedge-maze', 3);
await p.keyboard.down('KeyW'); await p.waitForTimeout(1700); await p.keyboard.up('KeyW');
await p.waitForTimeout(500);
// a few steps further in, along the way through
for (let n = 0; n < 8; n++) {
  const h = await M('where'), a = await p.evaluate(([x, z]) => window.__maze.ahead(x, z), [h.x, h.z]);
  if (!a || a.gate) break;
  await M('turnTo', Math.atan2(-(a.x - h.x), -(a.z - h.z)));
  await M('step', Math.min(0.5, Math.hypot(a.x - h.x, a.z - h.z)));
}
const w = await M('where');
console.log('in', JSON.stringify(w));
for (let n = 0; n < steps; n++) {
  await M('put', w.place, { x: Math.round(w.x / 3) * 3, z: Math.round(w.z / 3) * 3, yaw: w.yaw + n * 2 * Math.PI / steps, pitch: Number(process.argv[3] ?? 0.2) });
  await p.waitForTimeout(800);
  await p.screenshot({ path: join(out, `look-${n}.png`) });
}
console.log(`dist/shots/hedge-maze/look-0..${steps - 1}.png`);
await browser.close(); server.close();

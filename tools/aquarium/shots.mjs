// Pictures of the aquarium from the built page (dist/index.html): its door on the landing next to
// its neighbours, the sign on the glass, and the room, as a desktop and a phone: dist/shots/aquarium/
//   npm run build -- --preview && node tools/aquarium/shots.mjs
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { serve } from '../serve.mjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = join(new URL('.', import.meta.url).pathname, '../..'), out = join(root, 'dist/shots/aquarium');
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(join(spawnSync('npm', ['root', '-g']).stdout.toString().trim(), 'playwright'))); }
mkdirSync(out, { recursive: true });
const server = await serve();
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const SHOTS = [
  ['doors', async M => { await M('faceDoor', 'hall', 'aquarium', 4.5); const w = await M('where'); await M('turnTo', w.yaw - 0.4, 0); }],
  ['sign', async M => M('put', 'room:aquarium', { x: 0.9, z: 2.9, yaw: Math.PI, pitch: 0.22, y: 0 })],
  ['room', async M => M('put', 'room:aquarium', { x: -3.6, z: -4.8, yaw: Math.PI + 0.62, pitch: -0.12, y: 0 })],
];
for (const [device, opts] of [['desktop', { viewport: { width: 1280, height: 800 } }], ['phone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]]) {
  const ctx = await browser.newContext(opts);
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('page error:', e.message));
  await p.goto(`http://127.0.0.1:${server.address().port}/`);
  await p.waitForFunction(() => window.__mansion && window.__mansion.frames() > 10 && window.__mansion.settled(), null, { timeout: 20000 });
  await p.click('#ok');
  const M = (fn, ...a) => p.evaluate(([f, a]) => window.__mansion[f](...a), [fn, a]);
  for (const [name, go] of SHOTS) {
    await go(M); await p.waitForTimeout(700);
    await p.screenshot({ path: join(out, `${device}-${name}.png`) });
    console.log(`dist/shots/aquarium/${device}-${name}.png`);
  }
  await ctx.close();
}
await browser.close(); server.close();

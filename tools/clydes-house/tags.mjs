// Pictures of the name tags under the Good Morning Machine's gaps (npm run build first): every gap
// empty at once with the same part in it (the longest name, FLOPPY DISK, unless you name one), to
// check the tags are readable and don't bump into each other or the machine. Also one with nothing
// in the gaps (EMPTY). Saves dist/shots/clydes-house/tags-<device>-<part>.png.
//   node tools/clydes-house/tags.mjs [part]
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { serve } from '../serve.mjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../..', import.meta.url).pathname, out = join(root, 'dist/shots/clydes-house');
mkdirSync(out, { recursive: true });
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(join(spawnSync('npm', ['root', '-g']).stdout.toString().trim(), 'playwright'))); }

const part = process.argv[2] || 'floppy';
const server = await serve();
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const DEVICES = { desktop: { viewport: { width: 1920, height: 1080 } }, laptop: { viewport: { width: 1280, height: 800 } }, phone: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } };
for (const [device, opts] of Object.entries(DEVICES)) {
  const ctx = await browser.newContext(opts);
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('page error:', e.message));
  await p.goto(`http://127.0.0.1:${server.address().port}/`);
  await p.waitForFunction(() => window.__mansion && window.__mansion.frames() > 5 && window.__mansion.settled(), null, { timeout: 30000 });
  await p.evaluate(() => document.querySelector('#ok')?.click());
  await p.evaluate(() => window.__mansion.put('room:clydes-house', 'machine'));
  await p.waitForTimeout(300);
  if (opts.hasTouch) await p.tap('#mansion #use'); else await p.keyboard.press('KeyE');
  await p.waitForFunction(() => window.__clydesHouse?.state().phase === 'ready', null, { timeout: 60000 });
  await p.evaluate(() => window.__clydesHouse.speed(8));
  await p.waitForFunction(() => !window.__clydesHouse.state().lines, null, { timeout: 60000 });
  await p.evaluate(pt => window.__clydesHouse.everyGap(pt), part);
  await p.waitForTimeout(1500);
  await p.screenshot({ path: join(out, `tags-${device}-${part}.png`) });
  console.log(device, 'saved');
  await ctx.close();
}
await browser.close(); server.close();

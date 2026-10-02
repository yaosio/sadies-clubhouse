// Pictures of the world's weather in every place out of doors (npm run build first): for each place
// with a `sky` (the outside, the Hedge Maze...) and each weather, a look round from its start, a little
// way up. As a desktop and a phone. Saves dist/shots/clubhouse/<device>-weather-<place>-<weather>.png.
//   node tools/clubhouse/weather.mjs [desktop|phone] [rain|snow|sun|cats|clear]
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { serve } from '../serve.mjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../..', import.meta.url).pathname, out = join(root, 'dist/shots/clubhouse');
mkdirSync(out, { recursive: true });
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(join(spawnSync('npm', ['root', '-g']).stdout.toString().trim(), 'playwright'))); }

const [only, which] = process.argv.slice(2);
const server = await serve();
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const DEVICES = { desktop: { viewport: { width: 1280, height: 800 } }, phone: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } };
for (const [device, opts] of Object.entries(DEVICES)) {
  if (only && only !== device) continue;
  const ctx = await browser.newContext(opts);
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('page error:', e.message));
  await p.goto(`http://127.0.0.1:${server.address().port}/`);
  await p.waitForFunction(() => window.__mansion && window.__mansion.frames() > 5 && window.__mansion.settled(), null, { timeout: 30000 });
  await p.evaluate(() => document.querySelector('#ok')?.click());
  const M = (fn, ...a) => p.evaluate(([f, a]) => window.__mansion[f](...a), [fn, a]);
  for (const n of await M('places')) await M('build', n);
  await M('weatherSpeed', 30);
  for (const w of which ? [which] : ['clear', 'rain', 'snow', 'sun', 'cats']) {
    await M('setWeather', w);
    if (w === 'snow') await M('weatherSpeed', 60);
    for (const n of await M('outdoors')) {
      await M('put', n, 'start'); await M('turnTo', (await M('where')).yaw, 0.15);
      await p.waitForTimeout(w === 'cats' ? 4000 : 1500);
      const name = `${device}-weather-${n.replace('room:', '')}-${w}`;
      await p.screenshot({ path: join(out, name + '.png') }); console.log(name);
    }
    await M('weatherSpeed', 30);
  }
  await ctx.close();
}
await browser.close(); server.close();

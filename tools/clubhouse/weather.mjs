// Pictures of the world's weather in every place out of doors (npm run build first): for each place
// with a `sky` (the outside, the Hedge Maze...) and each weather, a look four ways round from its start.
// As a desktop and a phone. Saves dist/shots/clubhouse/<device>-weather-<place>-<weather>-<ahead|right|behind|left>.png.
//   node tools/clubhouse/weather.mjs [desktop|phone] [rain|snow|sun|cats|tornado|clear]
import { serve } from '../serve.mjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { launch, DEVICES } from '../browser.mjs';

const root = new URL('../..', import.meta.url).pathname, out = join(root, 'dist/shots/clubhouse');
mkdirSync(out, { recursive: true });

const [only, which] = process.argv.slice(2);
const server = await serve();
const browser = await launch();
for (const [device, opts] of Object.entries(DEVICES)) {
  if (only && only !== device) continue;
  const ctx = await browser.newContext(opts);
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('page error:', e.message));
  await p.goto(`http://127.0.0.1:${server.address().port}/`);
  await p.waitForFunction(() => window.__clubhouse && window.__clubhouse.frames() > 5 && window.__clubhouse.settled(), null, { timeout: 30000 });
  await p.evaluate(() => document.querySelector('#ok')?.click());
  const M = (fn, ...a) => p.evaluate(([f, a]) => window.__clubhouse[f](...a), [fn, a]);
  for (const n of await M('places')) await M('build', n);
  await M('weatherSpeed', 30);
  for (const w of which ? [which] : ['clear', 'rain', 'snow', 'sun', 'cats', 'tornado']) {
    await M('setWeather', w);
    if (w === 'snow') await M('weatherSpeed', 60);
    for (const n of await M('outdoors')) {
      await M('put', n, 'start');
      const yaw = (await M('where')).yaw;
      // (looking four ways round: whatever's far off, like the clubhouse over the maze's hedges, in one of them)
      for (const [i, turn] of ['ahead', 'right', 'behind', 'left'].entries()) {
        await M('turnTo', yaw - i * Math.PI / 2, 0.3);
        await p.waitForTimeout(i ? 500 : w === 'cats' ? 4000 : 1500);
        const name = `${device}-weather-${n.replace('room:', '')}-${w}-${turn}`;
        await p.screenshot({ path: join(out, name + '.png') }); console.log(name);
      }
    }
    await M('weatherSpeed', 30);
  }
  await ctx.close();
}
await browser.close(); server.close();

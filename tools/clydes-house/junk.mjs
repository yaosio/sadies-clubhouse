// Pictures of every bit of junk doing its thing when the machine bumps into it (npm run build first):
// for each, it's put in the first gap, the lever's pulled, and two pictures are taken as it reacts.
// Saves dist/shots/clydes-house/junk-<part>-<1|2>.png, as a desktop.
//   node tools/clydes-house/junk.mjs [part]
import { serve } from '../serve.mjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { JUNK } from '../../src/activities/clydes-house/machine.js';
import { launch, DEVICES } from '../browser.mjs';

const root = new URL('../..', import.meta.url).pathname, out = join(root, 'dist/shots/clydes-house');
mkdirSync(out, { recursive: true });

const only = process.argv[2];
const server = await serve();
const browser = await launch();
const ctx = await browser.newContext(DEVICES.desktop);
const p = await ctx.newPage();
p.on('pageerror', e => console.log('page error:', e.message));
await p.goto(`http://127.0.0.1:${server.address().port}/`);
await p.waitForFunction(() => window.__mansion && window.__mansion.frames() > 5 && window.__mansion.settled(), null, { timeout: 30000 });
await p.evaluate(() => document.querySelector('#ok')?.click());
await p.evaluate(() => window.__mansion.put('room:clydes-house', 'machine'));
await p.waitForTimeout(300); await p.keyboard.press('KeyE');
const S = () => p.evaluate(() => window.__clydesHouse.state());
const ready = () => p.waitForFunction(() => { const s = window.__clydesHouse.state(); return s.phase === 'ready' && !s.lines; }, null, { timeout: 60000 });
await p.evaluate(() => window.__clydesHouse.speed(8)); await ready(); await p.evaluate(() => window.__clydesHouse.speed(1));
for (const part of JUNK) {
  if (only && only !== part) continue;
  const gap = await p.evaluate(j => window.__clydesHouse.junk(j), part);
  await p.keyboard.press('Space');
  await p.waitForTimeout(1250);
  await p.screenshot({ path: join(out, `junk-${part}-1.png`) });
  await p.waitForTimeout(700);
  await p.screenshot({ path: join(out, `junk-${part}-2.png`) });
  console.log(part, 'in', gap, (await S()).sounds);
  await p.evaluate(() => window.__clydesHouse.speed(8));
  for (let i = 0; i < 12 && (await S()).lines; i++) { await p.keyboard.press('Enter'); await p.waitForTimeout(150); }
  await ready(); await p.evaluate(() => window.__clydesHouse.speed(1));
}
await browser.close(); server.close();

// Tries the ocean by hand from the built page (dist/index.html): taps the glass, sails round,
// and takes pictures on the way (dist/shots/aquarium/sail/). For looking at it while working on it.
//   npm run build -- --preview && node tools/aquarium/sail.mjs [desktop|phone]
import { serve } from '../serve.mjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { launch, DEVICES } from '../browser.mjs';

const root = join(new URL('.', import.meta.url).pathname, '../..'), out = join(root, 'dist/shots/aquarium/sail');
mkdirSync(out, { recursive: true });
const server = await serve();
const browser = await launch();
const device = process.argv[2] || 'desktop';
const opts = DEVICES[device] || DEVICES.desktop;
const ctx = await browser.newContext(opts);
const p = await ctx.newPage();
p.on('pageerror', e => console.log('page error:', e.message));
p.on('console', m => { if (m.type() === 'error') console.log('console:', m.text()); });
await p.goto(`http://127.0.0.1:${server.address().port}/`);
await p.waitForFunction(() => window.__clubhouse && window.__clubhouse.frames() > 10 && window.__clubhouse.settled(), null, { timeout: 30000 });
await p.click('#ok');
const M = (fn, ...a) => p.evaluate(([f, a]) => window.__clubhouse[f](...a), [fn, a]);
const A = () => p.evaluate(() => window.__aquarium.state());
const shot = async name => { await p.screenshot({ path: join(out, `${device}-${name}.png`) }); console.log('shot', name, JSON.stringify(await A())); };
await M('put', 'room:aquarium', 'glass');
await p.waitForTimeout(300);
await p.keyboard.press('KeyE');
for (const [ms, name] of [[4000, '1-sinking'], [1200, '2-swapped'], [1500, '3-rising'], [1600, '4-at-sea']]) { await p.waitForTimeout(ms); await shot(name); }
// look about, then sail at the mountain for a bit
for (const [yaw, pitch, name] of [[0, -0.3, '5-dash'], [Math.PI / 2, 0, '6-west'], [Math.PI, 0, '7-south'], [-Math.PI / 2, 0, '8-east']]) {
  const w = await M('where'); await M('turnTo', w.yaw + yaw, pitch); await p.waitForTimeout(500); await shot(name); await M('turnTo', w.yaw, 0);
}
await p.keyboard.down('KeyW'); await p.waitForTimeout(6000); await p.keyboard.up('KeyW'); await shot('9-sailed');
// every spot: pull up beside it, facing it, and pick its find up; then the mountain from further and
// further off, and home
const off = await p.evaluate(() => window.__aquarium.off()), spots = await p.evaluate(() => window.__aquarium.spots());
const sail = async (x, z, yaw) => { await M('put', 'room:aquarium', { x: x + off.x, z: z + off.z, yaw, y: 4.1 }); await p.waitForTimeout(700); };
for (const s of [...spots.slice(1), spots[0]]) {
  const a = Math.atan2(19 - s.x, 197 - s.z), d = Math.max(s.r + 1, s.reach - 3);
  const x = s.x + Math.sin(a) * d, z = s.z + Math.cos(a) * d;
  if (s.id === 'mountain') for (const far of [200, 100, 50, 30, 18, 10]) { await sail(s.x + Math.sin(a) * far, s.z + Math.cos(a) * far, a); await shot(`m-${far}`); }
  await sail(x, z, a);
  await shot(`s-${s.id}`);
  await p.keyboard.press('KeyE'); await p.waitForTimeout(600); await shot(`s-${s.id}-got`);
}
await p.waitForTimeout(3000); await shot('m-open');
await p.keyboard.press('KeyE');
await p.waitForFunction(() => window.__clubhouse.mode() === 'play' && !window.__aquarium.state().diving, null, { timeout: 20000 });
await M('put', 'room:aquarium', 'cabinet'); await p.waitForTimeout(500); await shot('z-cabinet');
await browser.close(); server.close();

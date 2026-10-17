// Pictures of Dog City, the giant hydrant, from the built page (npm run build first):
// dist/shots/hydrant/*.png, as a desktop and as a phone. Where you stand comes from the same numbers
// the game uses (town/layout.js, town/hydrant-walk.js).
//   node tools/clubhouse/hydrant.mjs [view ...]     (no names: all of them)
import { serve } from '../serve.mjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { launch, DEVICES } from '../browser.mjs';
import { HYDRANT as H } from '../../src/clubhouse/town/layout.js';
import { around, DOOR_SIDES } from '../../src/clubhouse/town/hydrant-walk.js';

const root = new URL('../..', import.meta.url).pathname, out = join(root, 'dist/shots/hydrant');
mkdirSync(out, { recursive: true });
// where to stand (x, z, and how high the floor is) and what to look at (x, y, z), round the hydrant
const stand = (r, turn, y) => { const p = around(r, H.th0 + turn); return [p.x, p.z, y]; };
const look = (r, turn, y) => { const p = around(r, H.th0 + turn); return [p.x, y, p.z]; };
const VIEWS = {
  'from-the-gate': { from: [0, -27, 0], to: [H.x, 14, H.z] },
  'from-the-square': { from: [4, -40, 0], to: [H.x, 12, H.z] },
  'far': { from: [-8, -10, 0], to: [H.x, 14, H.z] },
  'foot': { from: stand(21, 0.1, 0), to: look(12, 0.9, 3) },
  'doors': { from: stand(22, -0.7, 0), to: look(10, -0.75, 2) },
  // on a landing, a few steps from the door that comes out of the hydrant, looking at the house's front
  'ledge-chooter': { from: stand(15, H.stops[0].turn - 0.2, H.stops[0].y), to: look(21, H.stops[0].turn - 0.2, H.stops[0].y + 2) },
  'ledge-toots': { from: stand(15, H.stops[1].turn - 0.2, H.stops[1].y), to: look(22, H.stops[1].turn - 0.2, H.stops[1].y + 2) },
  'ledge-lily': { from: stand(15, H.stops[2].turn - 0.2, H.stops[2].y), to: look(22, H.stops[2].turn - 0.2, H.stops[2].y + 1) },
  'lookout': { from: stand(14.5, 0.4, H.top), to: [0, 3, -10] },
  'cap': { from: stand(17.5, 2.2, H.top), to: [H.x, H.top + 8, H.z] },
  'ramp': { from: stand(11.8, 3.0, 4), to: look(11.8, 3.6, 5.5) },
};
// in front of each door, 2.5 m out, looking at it
for (const s of DOOR_SIDES) { const p = around(s.r0 + 1.9 + 2.5, s.th), q = around(s.r0, s.th); VIEWS[`door-${s.id}`] = { from: [p.x, p.z, s.y], to: [q.x, s.y + 1.6, q.z] }; }
VIEWS['out-of-toots'] = { from: stand(12.6, H.stops[1].turn - 0.2, H.stops[1].y), to: look(22, H.stops[1].turn - 0.2, H.stops[1].y + 0.3) };   // just stepped out of the door
VIEWS['lily-to-the-pool'] = { from: stand(27, H.stops[2].turn - 0.2, H.stops[2].y), to: [0, 0, 22.7] };   // the ledge floor must hide the pool's water (a flat picture drawn with no depth test)
const wanted = process.argv.slice(2);
const server = await serve();
const browser = await launch();
for (const [device, opts] of [['desktop', DEVICES.desktop], ['phone', { ...DEVICES.phone, deviceScaleFactor: 1 }]]) {
  const ctx = await browser.newContext({ ...opts, ignoreHTTPSErrors: true });
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('page error:', e.message));
  p.on('console', m => { if (m.type() === 'error') console.log('console error:', m.text()); });
  await p.goto(`http://127.0.0.1:${server.address().port}/`);
  await p.waitForFunction(() => window.__clubhouse && window.__clubhouse.frames() > 5 && window.__clubhouse.settled(), null, { timeout: 60000 });
  await p.evaluate(() => document.querySelector('#ok')?.click());
  const M = (fn, ...a) => p.evaluate(([f, a]) => window.__clubhouse[f](...a), [fn, a]);
  for (const [name, v] of Object.entries(VIEWS)) {
    if (wanted.length && !wanted.includes(name)) continue;
    const [x, z, y] = v.from, [lx, ly, lz] = v.to, dx = lx - x, dz = lz - z;
    await M('put', 'outside', { x, z, y, yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(ly - (y + 1.6), Math.hypot(dx, dz)) });
    await p.waitForTimeout(700);
    await p.screenshot({ path: join(out, `${device}-${name}.png`) });
    console.log(`${device}-${name}`);
  }
  await ctx.close();
}
await browser.close(); server.close();

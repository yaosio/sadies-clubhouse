// Pictures of Marbles' Cut & Curl (npm run build first): the shop from outside, inside from the door,
// the wig shelf, ribbon rack, clothes rail and stage, Sadie in a few looks, and a frame or two of every
// show. As a desktop. Saves dist/shots/barbershop/<name>.png.
//   node tools/barbershop/shots.mjs
import { serve } from '../serve.mjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { launch } from '../browser.mjs';

const root = new URL('../..', import.meta.url).pathname, out = join(root, 'dist/shots/barbershop');
mkdirSync(out, { recursive: true });

const server = await serve();
const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: 960, height: 640 } });
const p = await ctx.newPage();
p.on('pageerror', e => console.log('page error:', e.message));
await p.goto(`http://127.0.0.1:${server.address().port}/`);
await p.waitForFunction(() => window.__clubhouse && window.__clubhouse.frames() > 5 && window.__clubhouse.settled(), null, { timeout: 30000 });
await p.evaluate(() => document.querySelector('#ok')?.click());
const M = (fn, ...a) => p.evaluate(([f, a]) => window.__clubhouse[f](...a), [fn, a]);
const B = (fn, ...a) => p.evaluate(([f, a]) => window.__barbershop[f](...a), [fn, a]);
const ROOM = 'room:barbershop';
const shot = async (name, wait = 400) => { await p.waitForTimeout(wait); await p.screenshot({ path: join(out, `${name}.png`) }); console.log(name); };
const look = async (place, x, z, y, lx, ly, lz) => {
  const dx = lx - x, dz = lz - z;
  await M('put', place, { x, z, y, yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(ly - (y + 1.6), Math.hypot(dx, dz)) });
  await p.waitForTimeout(250);
};

await M('faceDoor', 'outside', 'barbershop', 2);
const w = await M('where'), hx = w.x, hz = w.z - 2;
await look('outside', hx, hz + 12, 0, hx, 3, hz); await shot('outside-front');
await look('outside', hx - 5, hz + 4, 0, hx - 1.4, 1.4, hz); await shot('outside-pole');
await look('outside', hx + 5, hz + 6, 0, hx, 3.5, hz - 1.6); await shot('outside-roof');

await M('build', ROOM);
await look(ROOM, 0, 3.2, 0, 0, 1.3, -2); await shot('inside-from-door');
await look(ROOM, -1.0, -0.2, 0, -1.4, 1.2, -2.7); await shot('chair');
await look(ROOM, -2.6, -1.8, 0, -4.9, 1.5, -1.8); await shot('wigs');
await look(ROOM, -2.6, 1.9, 0, -4.9, 1.5, 1.9); await shot('ribbons');
await look(ROOM, 3.0, 4.0, 0, 3.0, 1.5, 2.7); await shot('clothes');
await look(ROOM, 2.4, 0.2, 0, 3.3, 0.9, -2.5); await shot('stage');
const looks = [[1, 1, 1], [2, 3, 3], [3, 4, 4], [4, 2, 5], [5, 5, 6], [0, 0, 7], [3, 1, 2]];
for (const [i, [h, t, o]] of looks.entries()) {
  await p.evaluate(([h, t, o]) => { const s = window.__barbershop; s.choose('hair', h); s.choose('tail', t); s.choose('outfit', o); }, [h, t, o]);
  await look(ROOM, -1.3, -1.3, 0, -1.4, 0.9, -2.6); await shot(`look-${i}`, 600);
}
const shows = { sing: [1.5, 3.5], build: [3, 5.5, 7.5], dance: [3, 5], magic: [3.4, 6.4, 7.9], fly: [2.6, 4, 5.8], sleuth: [3, 6, 8], sleep: [2.5, 4.5] };
for (const [name, ts] of Object.entries(shows)) {
  await look(ROOM, 2.0, -0.3, 0, 3.2, 0.9, -2.5);
  await B('show', name);
  for (const t of ts) {
    // (game time: wait for the show's own clock)
    await p.waitForFunction(t => window.__barbershop.state().showT >= t + 0.9, t, { timeout: 30000 });
    await shot(`show-${name}-${t}`, 0);
  }
  await p.waitForFunction(() => !window.__barbershop.state().show, null, { timeout: 30000 });
}
await browser.close(); server.close();

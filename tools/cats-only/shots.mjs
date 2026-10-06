// Pictures of the Cats Only stampede from the built page (dist/index.html), as a desktop: the
// closet's door and button on the landing, the herd pouring out of it, from the ground floor, and
// out in the garden: dist/shots/cats-only/
//   npm run build -- --preview && node tools/cats-only/shots.mjs
import { serve } from '../serve.mjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { launch, DEVICES } from '../browser.mjs';

const root = join(new URL('.', import.meta.url).pathname, '../..'), out = join(root, 'dist/shots/cats-only');
mkdirSync(out, { recursive: true });
const server = await serve();
const browser = await launch();
const device = process.argv[2] || 'desktop';
const ctx = await browser.newContext(DEVICES[device]);
const p = await ctx.newPage();
p.on('pageerror', e => console.log('page error:', e.message));
await p.goto(`http://127.0.0.1:${server.address().port}/`);
await p.waitForFunction(() => window.__clubhouse && window.__clubhouse.frames() > 10 && window.__clubhouse.settled(), null, { timeout: 20000 });
await p.click('#ok');
const M = (fn, ...a) => p.evaluate(([f, a]) => window.__clubhouse[f](...a), [fn, a]);
const rest = ms => p.evaluate(ms => new Promise(ok => { const t0 = window.__clubhouse.played(); const f = () => window.__clubhouse.played() - t0 >= ms / 1000 ? ok() : requestAnimationFrame(f); f(); }), ms);
const shot = async name => { await p.screenshot({ path: join(out, `${device}-${name}.png`) }); console.log(`dist/shots/cats-only/${device}-${name}.png`); };
const views = {
  landing: () => M('faceDoor', 'hall', 'cats-only', 1.4),
  ground: () => M('put', 'hall', { x: 0, z: -2.2, y: 0, yaw: 0.25, pitch: 0.12 }),
  garden: () => M('put', 'outside', { x: 0, z: -9, y: 0, yaw: Math.PI, pitch: 0.08 }),
};
for (const [view, times] of [['landing', [1, 1, 1]], ['ground', [900, 700, 700, 700]], ['garden', [1800, 600, 600]]]) {
  await p.evaluate(() => window.__catsOnly.state().phase === 'idle' || null);
  await views[view]();
  await rest(300);
  await p.evaluate(() => window.__catsOnly.go());
  let t = 0;
  for (const dt of times) { await rest(dt); t += dt; await shot(`${view}-${t}`); console.log(JSON.stringify(await p.evaluate(() => { const s = window.__catsOnly.state(); return { phase: s.phase, t: s.t, on: s.on, door: s.doorOpen, w: window.__clubhouse.where() }; }))); }
  await p.waitForFunction(() => window.__catsOnly.state().phase === 'idle', null, { timeout: 30000 });
}
await browser.close(); server.close();

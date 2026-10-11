// Walking straight in at Toots' door before she's had time to leave her window (npm run build first):
// she should come running, from the top of the stairs, down them and over to you, never popping up
// by the door out of nowhere. Prints where she is every half second from the door opening.
//   node tools/toots-house/rush.mjs
import { serve } from '../serve.mjs';
import { launch, DEVICES } from '../browser.mjs';

const server = await serve();
const browser = await launch();
const p = await browser.newPage(DEVICES.desktop);
p.on('pageerror', e => console.log('page error:', e.message));
await p.goto(`http://127.0.0.1:${server.address().port}/`);
await p.waitForFunction(() => window.__clubhouse && window.__clubhouse.frames() > 5, null, { timeout: 30000 });
await p.click('#ok').catch(() => {});
await p.waitForFunction(() => window.__clubhouse.settled(), null, { timeout: 30000 });
const M = (fn, ...a) => p.evaluate(([f, a]) => window.__clubhouse[f](...a), [fn, a]);
await M('faceDoor', 'outside', 'toots-house', 30);   // (far off: she's in her window)
await p.waitForFunction(() => window.__toots, null, { timeout: 30000 }).catch(() => {});
await p.waitForTimeout(1500);
await M('faceDoor', 'outside', 'toots-house', 2.5);   // (then straight up to the door, and in)
await p.keyboard.down('KeyW');
for (let i = 0; i < 14; i++) {
  if (i === 3) await p.keyboard.up('KeyW');
  const s = await p.evaluate(() => ({ place: window.__clubhouse.where().place, ...window.__toots.state() }));
  console.log(`${(i / 2).toFixed(1)} s: you ${s.place === 'outside' ? 'outside' : 'inside'}, she's ${s.where === 'window' ? 'at her window' : `at ${s.toots.x.toFixed(1)}, ${s.toots.y.toFixed(1)}, ${s.toots.z.toFixed(1)} (${s.toots.mode})`}`);
  await p.waitForTimeout(500);
}
await browser.close(); server.close();

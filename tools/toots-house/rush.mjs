// Walking straight in at Toots' door before she's had time to leave her window (npm run build first):
// where her picture is inside on every frame as you come through. It should be downstairs by the
// door the moment you're in, never up on the floor above (it used to poke through the ceiling).
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
await p.evaluate(() => { window.__seen = []; const f = () => { const s = window.__toots?.state(); if (s) window.__seen.push([window.__clubhouse.where().place, s.where, s.tootsShown, +s.toots.y.toFixed(2)]); if (window.__seen.length < 200) requestAnimationFrame(f); }; f(); });
await p.keyboard.down('KeyW'); await p.waitForTimeout(2500); await p.keyboard.up('KeyW');
const seen = await p.evaluate(() => window.__seen), inside = seen.filter(s => s[0] === 'room:toots-house');
console.log(`${seen.length} frames, ${inside.length} inside; first few inside:`, JSON.stringify(inside.slice(0, 4)));
console.log(inside.length && inside.every(s => !s[2] || s[3] < 1) ? 'OK: never upstairs while you were coming in' : 'PROBLEM: shown upstairs');
await browser.close(); server.close();

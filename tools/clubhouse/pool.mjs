// Pictures of the pool in the backyard, for checking how it looks and plays (npm run build first):
//   node tools/clubhouse/pool.mjs
// Stands by the beach ball, says what you could use there, kicks it, and takes a picture of the ball
// going, then a few more seconds of the pool as you'd see it from the gate (Chooter going crazy on
// your arrival, Marbles at her tricks). Saves dist/shots/clubhouse/pool-<n>.png (desktop size).
import { serve } from '../serve.mjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { launch, DEVICES } from '../browser.mjs';

const root = new URL('../..', import.meta.url).pathname, out = join(root, 'dist/shots/clubhouse');
mkdirSync(out, { recursive: true });
const server = await serve(), browser = await launch();
const p = await browser.newPage(DEVICES.desktop);
p.on('pageerror', e => console.log('page error:', e.message));
await p.goto(`http://127.0.0.1:${server.address().port}/`);
await p.waitForFunction(() => window.__clubhouse && window.__clubhouse.frames() > 5 && window.__clubhouse.settled(), null, { timeout: 30000 });
await p.click('#ok');
const M = (fn, ...a) => p.evaluate(([f, a]) => window.__clubhouse[f](...a), [fn, a]);
let n = 0; const shot = () => p.screenshot({ path: join(out, `pool-${n++}.png`) });
await M('put', 'outside', { x: 4.6, z: 17.7, y: 0, yaw: Math.PI, pitch: -0.7 });   // (the ball starts at 4.6, 19.4)
await p.waitForTimeout(300);
console.log('you could use:', await M('target'));
await shot();
await p.keyboard.press('KeyE');
for (let i = 0; i < 2; i++) { await p.waitForTimeout(450); await shot(); }
await M('put', 'outside', { x: 0, z: 14, y: 0, yaw: Math.PI, pitch: -0.05 });   // (and arrive again at the gate)
await p.waitForTimeout(300);
await M('put', 'outside', { x: 0, z: 16, y: 0, yaw: Math.PI, pitch: -0.1 });
for (let i = 0; i < 4; i++) { await p.waitForTimeout(1500); await shot(); }
console.log(`${n} pictures in dist/shots/clubhouse/pool-*.png`);
await browser.close(); server.close();

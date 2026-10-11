// Is there a hitch walking in at Toots' front door? (npm run build first.) Opens the built page as a
// desktop, stands 6 m from her door, then walks in, timing every frame's own work and noting where
// you are each frame. Prints the slowest frames with where they happened, and how many drawing
// set-ups (shaders) the graphics card had before and after: a jump there on the way in means
// something was being set up for the first time as you came through.
//   node tools/toots-house/door.mjs
import { serve } from '../serve.mjs';
import { launch, DEVICES } from '../browser.mjs';

const server = await serve();
const browser = await launch();
const p = await browser.newPage(DEVICES.desktop);
p.on('pageerror', e => console.log('page error:', e.message));
await p.addInitScript(() => {
  const raf = window.requestAnimationFrame.bind(window); window.__frames = [];
  window.requestAnimationFrame = cb => raf(t => {
    const a = performance.now(); cb(t);
    const w = window.__clubhouse?.where?.();
    window.__frames.push([t, performance.now() - a, w ? `${w.place} z ${w.z?.toFixed(1)}` : '']);
  });
});
await p.goto(`http://127.0.0.1:${server.address().port}/`);
await p.waitForFunction(() => window.__clubhouse && window.__clubhouse.frames() > 5, null, { timeout: 30000 });
await p.click('#ok').catch(() => {});
await p.waitForFunction(() => window.__clubhouse.settled(), null, { timeout: 30000 });
const M = (fn, ...a) => p.evaluate(([f, a]) => window.__clubhouse[f](...a), [fn, a]);
await M('faceDoor', 'outside', 'toots-house', 6);
await p.waitForTimeout(3000);   // (her room builds as you come near: let it)
const before = await M('speed');
await p.evaluate(() => { window.__frames.length = 0; });
await p.keyboard.down('KeyW'); await p.waitForTimeout(3000); await p.keyboard.up('KeyW');
await p.waitForTimeout(1500);
const after = await M('speed'), fr = await p.evaluate(() => window.__frames);
const sorted = fr.map(x => x[1]).sort((a, b) => a - b);
console.log(`${fr.length} frames, typical ${sorted[sorted.length >> 1].toFixed(1)} ms`);
console.log('slowest:');
for (const [t, ms, w] of [...fr].sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`  ${ms.toFixed(1).padStart(6)} ms at ${(t - fr[0][0]).toFixed(0).padStart(5)} ms, ${w}`);
console.log(`drawing set-ups ${before.programs} → ${after.programs}, pictures ${before.textures} → ${after.textures}`);
console.log('build times:', JSON.stringify(after.places['room:toots-house']), 'ms, longest bit', after.bits['room:toots-house']);
await browser.close(); server.close();

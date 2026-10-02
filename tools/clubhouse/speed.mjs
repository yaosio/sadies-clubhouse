// How quick the mansion is (npm run build first): opens the built page as a desktop, stands still at
// the gate while the rooms build, and prints how long the first picture took, how long each place
// took to build (and the longest bit of it, which is how long the game's held up), and what's held on
// the graphics card. Then puts every room that can be put away
// away and builds it again, a few times over, to show nothing piles up. In between, how long each
// frame's work takes standing in each place (typical and worst), and how many frames a second.
//   node tools/clubhouse/speed.mjs
import { serve } from '../serve.mjs';
import { launch, quietFonts } from '../browser.mjs';


const server = await serve();
const browser = await launch(['--enable-precise-memory-info']);
const p = await browser.newPage({ viewport: { width: 1280, height: 800 } });
p.on('pageerror', e => console.log('page error:', e.message));
// time every frame's work from outside the game, as tools/dropper-world/profile.mjs does
await p.addInitScript(() => {
  const raf = window.requestAnimationFrame.bind(window); window.__frames = [];
  window.requestAnimationFrame = cb => raf(t => { const a = performance.now(); cb(t); window.__frames.push([t, performance.now() - a]); });
});
await quietFonts(p);
await p.goto(`http://127.0.0.1:${server.address().port}/`);
await p.waitForFunction(() => window.__mansion && window.__mansion.frames() > 5, null, { timeout: 30000 });
await p.waitForFunction(() => window.__mansion.settled(), null, { timeout: 30000 });
const M = (fn, ...a) => p.evaluate(([f, a]) => window.__mansion[f](...a), [fn, a]);
const sp = await M('speed');
console.log(`first picture: ${sp.first} ms, with ${sp.atFirst.length ? sp.atFirst.join(', ') : 'no rooms'} built`);
for (const [k, v] of Object.entries(sp.places)) console.log(`  ${k.padEnd(26)} ${String(v).padStart(4)} ms  (longest bit ${sp.bits[k]} ms)`);
console.log(`graphics card: ${sp.programs} drawing set-ups, ${sp.geometries} shapes, ${sp.textures} pictures; kit list ${sp.kept}; memory ${sp.heap} MB`);
// visit every room once (so everything's been on the graphics card), then put away and rebuild
await M('put', 'hall', 'stairs');
const rooms = (await M('places')).filter(n => n.startsWith('room:'));
for (const n of rooms) { await M('put', n, { x: 0, z: 0, yaw: 0 }); await M('step', 0); }
await M('put', 'outside', 'start'); await M('step', 0);
// each frame's work, standing in each place for a couple of seconds (a hidden browser draws on the
// processor, so these are much slower than a real graphics card: compare them with each other)
console.log('each frame\'s own work (typical, worst), standing in each place:');
for (const [name, spot] of [['outside', 'start'], ['hall', 'stairs'], ...rooms.map(n => [n, null])]) {
  if (spot) await M('put', name, spot); else await M('faceDoor', name, 'door', 3);
  if (!spot) await M('turnTo', (await M('where')).yaw + Math.PI);   // (looking into the room, not at its door)
  await p.waitForTimeout(500); await p.evaluate(() => { window.__frames.length = 0; });
  await p.waitForTimeout(2000);
  const fr = await p.evaluate(() => window.__frames), f = fr.map(x => x[1]).sort((a, b) => a - b);
  const fps = fr.length > 1 ? (fr.length - 1) / ((fr[fr.length - 1][0] - fr[0][0]) / 1000) : 0;
  console.log(`  ${name.padEnd(26)} ${f[f.length >> 1].toFixed(1).padStart(5)} ms, worst ${f[f.length - 1].toFixed(1).padStart(5)} ms  (${fps.toFixed(0)} frames a second, drawing included)`);
}
await M('put', 'outside', 'start'); await M('step', 0);   // (out of the last room, so it can be put away too)
const base = await M('speed');
for (let i = 0; i < 3; i++) {
  const gone = [];
  for (const n of rooms) if (await M('putAway', n)) gone.push(n);
  const mid = await M('speed');
  for (const n of gone) { await M('build', n); await M('put', n, { x: 0, z: 0, yaw: 0 }); await M('step', 0); }
  await M('put', 'outside', 'start'); await M('step', 0);
  const s = await M('speed');
  console.log(`round ${i + 1}: put away ${gone.join(', ')}: ${mid.geometries} shapes, ${mid.textures} pictures; built again: ${s.geometries} shapes, ${s.textures} pictures, kit list ${s.kept} (was ${base.geometries}, ${base.textures}, ${base.kept})`);
}
await browser.close(); server.close();

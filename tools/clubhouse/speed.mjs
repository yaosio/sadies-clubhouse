// How quick the mansion is (npm run build first): opens the built page as a desktop, stands still at
// the gate while the rooms build, and prints how long the first picture took, how long each place
// took to build, and what's held on the graphics card. Then puts every room that can be put away
// away and builds it again, a few times over, to show nothing piles up.
//   node tools/clubhouse/speed.mjs
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../..', import.meta.url).pathname;
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(join(spawnSync('npm', ['root', '-g']).stdout.toString().trim(), 'playwright'))); }

const server = createServer((q, s) => { s.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); s.end(readFileSync(join(root, 'dist/index.html'))); });
await new Promise(ok => server.listen(0, '127.0.0.1', ok));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-precise-memory-info'] });
const p = await browser.newPage({ viewport: { width: 1280, height: 800 } });
p.on('pageerror', e => console.log('page error:', e.message));
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
await p.goto(`http://127.0.0.1:${server.address().port}/`);
await p.waitForFunction(() => window.__mansion && window.__mansion.frames() > 5, null, { timeout: 30000 });
await p.waitForFunction(() => window.__mansion.settled(), null, { timeout: 30000 });
const M = (fn, ...a) => p.evaluate(([f, a]) => window.__mansion[f](...a), [fn, a]);
const sp = await M('speed');
console.log(`first picture: ${sp.first} ms, with ${sp.atFirst.length ? sp.atFirst.join(', ') : 'no rooms'} built`);
for (const [k, v] of Object.entries(sp.places)) console.log(`  ${k.padEnd(26)} ${String(v).padStart(4)} ms`);
console.log(`graphics card: ${sp.programs} drawing set-ups, ${sp.geometries} shapes, ${sp.textures} pictures; kit list ${sp.kept}; memory ${sp.heap} MB`);
// visit every room once (so everything's been on the graphics card), then put away and rebuild
await M('put', 'hall', 'stairs');
const rooms = (await M('places')).filter(n => n.startsWith('room:'));
for (const n of rooms) { await M('put', n, { x: 0, z: 0, yaw: 0 }); await M('step', 0); }
await M('put', 'outside', 'start'); await M('step', 0);
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

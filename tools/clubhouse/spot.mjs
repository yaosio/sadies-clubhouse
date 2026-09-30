// A picture of the mansion from anywhere, for checking how something looks (npm run build first):
//   node tools/clubhouse/spot.mjs <name> <place> <x> <z> <y> <lookX> <lookY> <lookZ>
// stands at x, y (the floor's height), z in that place and looks at the point lookX, lookY, lookZ.
// Saves dist/shots/clubhouse/spot-<name>.png (desktop size). Places: outside, hall, room:<id>.
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../..', import.meta.url).pathname, out = join(root, 'dist/shots/clubhouse');
mkdirSync(out, { recursive: true });
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(join(spawnSync('npm', ['root', '-g']).stdout.toString().trim(), 'playwright'))); }

const [name, placeName, ...n] = process.argv.slice(2);
const [x, z, y, lx, ly, lz] = n.map(Number);
const server = createServer((q, s) => { s.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); s.end(readFileSync(join(root, 'dist/index.html'))); });
await new Promise(ok => server.listen(0, '127.0.0.1', ok));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await browser.newPage({ viewport: { width: 1280, height: 800 } });
p.on('pageerror', e => console.log('page error:', e.message));
await p.goto(`http://127.0.0.1:${server.address().port}/`);
await p.waitForFunction(() => window.__mansion && window.__mansion.frames() > 5, null, { timeout: 30000 });
const EYE = 1.6;   // roughly where your eye is above the floor
const dx = lx - x, dz = lz - z, yaw = Math.atan2(-dx, -dz), pitch = Math.atan2(ly - (y + EYE), Math.hypot(dx, dz));
await p.evaluate(([w, s]) => { window.__mansion.put(w, s); document.querySelector('#letter').hidden = true; }, [placeName, { x, z, y, yaw, pitch }]);
await p.waitForTimeout(1500);
await p.screenshot({ path: join(out, `spot-${name}.png`) });
console.log(`dist/shots/clubhouse/spot-${name}.png`, JSON.stringify(await p.evaluate(() => window.__mansion.where())));
await browser.close(); server.close();

// A picture of the clubhouse from anywhere, for checking how something looks (npm run build first):
//   node tools/clubhouse/spot.mjs <name> <place> <x> <z> <y> <lookX> <lookY> <lookZ>
// stands at x, y (the floor's height), z in that place and looks at the point lookX, lookY, lookZ.
// Saves dist/shots/clubhouse/spot-<name>.png (desktop size). Places: outside, hall, room:<id>.
import { serve } from '../serve.mjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { launch, DEVICES } from '../browser.mjs';

const root = new URL('../..', import.meta.url).pathname, out = join(root, 'dist/shots/clubhouse');
mkdirSync(out, { recursive: true });

const [name, placeName, ...n] = process.argv.slice(2);
const [x, z, y, lx, ly, lz] = n.map(Number);
const server = await serve();
const browser = await launch();
const p = await browser.newPage(DEVICES.desktop);
p.on('pageerror', e => console.log('page error:', e.message));
await p.goto(`http://127.0.0.1:${server.address().port}/`);
await p.waitForFunction(() => window.__clubhouse && window.__clubhouse.frames() > 5 && window.__clubhouse.settled(), null, { timeout: 30000 });
const EYE = 1.6;   // roughly where your eye is above the floor
const dx = lx - x, dz = lz - z, yaw = Math.atan2(-dx, -dz), pitch = Math.atan2(ly - (y + EYE), Math.hypot(dx, dz));
await p.evaluate(([w, s]) => { window.__clubhouse.put(w, s); document.querySelector('#letter').hidden = true; }, [placeName, { x, z, y, yaw, pitch }]);
await p.waitForTimeout(1500);
await p.screenshot({ path: join(out, `spot-${name}.png`) });
console.log(`dist/shots/clubhouse/spot-${name}.png`, JSON.stringify(await p.evaluate(() => window.__clubhouse.where())));
await browser.close(); server.close();

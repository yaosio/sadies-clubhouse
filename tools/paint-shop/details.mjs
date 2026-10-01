// Close-up pictures of Chooter's Paint Shop's little things (npm run build first): the sandwich board
// from the front and the back, the door's OPEN sign, Chooter in his cap, Sadie's plaque, the TNT box,
// the easel from behind, the crate and plinth painted on every side with the bucket, and the room's
// top and bottom corners, inside and out (no night showing through). As a desktop.
// Saves dist/shots/paint-shop/detail-<name>.png.
//   node tools/paint-shop/details.mjs
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { serve } from '../serve.mjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../..', import.meta.url).pathname, out = join(root, 'dist/shots/paint-shop');
mkdirSync(out, { recursive: true });
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(join(spawnSync('npm', ['root', '-g']).stdout.toString().trim(), 'playwright'))); }

const server = await serve();
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 960, height: 640 } });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
const p = await ctx.newPage();
p.on('pageerror', e => console.log('page error:', e.message));
await p.goto(`http://127.0.0.1:${server.address().port}/`);
await p.waitForFunction(() => window.__mansion && window.__mansion.frames() > 5 && window.__mansion.settled(), null, { timeout: 30000 });
await p.evaluate(() => document.querySelector('#ok')?.click());
const M = (fn, ...a) => p.evaluate(([f, a]) => window.__mansion[f](...a), [fn, a]);
const ROOM = 'room:paint-shop';
const shot = async (name, wait = 500) => { await p.waitForTimeout(wait); await p.screenshot({ path: join(out, `detail-${name}.png`) }); console.log(`detail-${name}`); };
const look = async (place, x, z, y, lx, ly, lz) => {
  const dx = lx - x, dz = lz - z;
  await M('put', place, { x, z, y, yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(ly - (y + 1.6), Math.hypot(dx, dz)) });
  await p.waitForTimeout(200);
};
const press = (x, y) => p.evaluate(async ([x, y]) => {
  const c = document.querySelector('#mansion #view');
  const ev = type => c.dispatchEvent(new PointerEvent(type, { pointerId: 5, pointerType: 'mouse', button: 0, clientX: x * innerWidth, clientY: y * innerHeight, bubbles: true }));
  ev('pointerdown'); await new Promise(ok => requestAnimationFrame(ok)); await new Promise(ok => requestAnimationFrame(ok)); ev('pointerup');
}, [x, y]);

// outside: where the shop's door is (standing 2 m in front of it, facing it)
await M('faceDoor', 'outside', 'paint-shop', 2);
const w = await M('where'), hx = w.x, hz = w.z - 2;
const bx = hx + 1.5, bz = hz + 3.3;
await look('outside', bx + 0.6, bz + 1.6, 0, bx, 0.45, bz); await shot('board-front');
await look('outside', bx - 0.5, bz - 1.6, 0, bx, 0.45, bz); await shot('board-back');
await look('outside', bx + 1.8, bz, 0, bx, 0.45, bz); await shot('board-side');
await look('outside', hx, hz + 1.4, 0, hx, 1.1, hz); await shot('door');
await look('outside', hx - 5, hz + 3, 0, hx - 3.2, 1.2, hz); await shot('outside-front-corner');
await look('outside', hx + 6, hz - 7, 0, hx + 3.2, 1.2, hz - 5); await shot('outside-back-corner');

// inside
await look(ROOM, 2.85, -2.6, 0, 2.85, 0.5, -3.75); await shot('chooter');
await p.evaluate(() => window.__paintShop.hold('brush', 1)); await shot('chooter-red', 300);
await p.evaluate(() => window.__paintShop.hold('brush', 'rainbow')); await shot('chooter-rainbow', 300);
await look(ROOM, 2.2, -0.9, -0.6, 3.3, 0.35, -1.4); await shot('plaque');
await look(ROOM, 2.4, 2.6, -0.4, 2.4, 0.3, 3.7); await shot('tnt');
await look(ROOM, -4.6, 4.2, 0, -3.7, 1.3, 3.0); await shot('easel-back');
// the bucket on the crate's top and two of its sides, and the plinth's front and side
await p.evaluate(() => { window.__paintShop.hold('bucket', 8); document.querySelector('#mansion #paint').click(); });
await look(ROOM, -2.6, -0.9, 0.4, -2.6, 0.5, -2.4); await press(0.5, 0.5); await press(0.5, 0.75);
await look(ROOM, -0.9, -2.0, -0.6, -2.6, 0.4, -2.4); await press(0.5, 0.5);
await shot('crate');
await look(ROOM, 2.0, -0.5, -0.6, 3.3, 0.2, -1.4); await press(0.5, 0.55); await press(0.62, 0.5); await press(0.38, 0.5);
await shot('plinth');
console.log(JSON.stringify((await p.evaluate(() => window.__paintShop.state())).painted));
// the corners, top and bottom
await look(ROOM, 0, 0, 0, 4.9, 3.95, -4.4); await shot('corner-top');
await look(ROOM, 0, 0, 0, -4.9, 0.05, -4.4); await shot('corner-bottom');
await ctx.close(); await browser.close(); server.close();

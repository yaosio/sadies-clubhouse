// Pictures of the whole trip from the built page (dist/index.html), as a desktop and a phone: the door
// on the landing, the cockpit through it, then sat in the seat at moments along the way (it jumps the
// trip's clock to each), and Sadie's space room afterwards: dist/shots/space-adventure/
//   npm run build -- --preview && node tools/space-adventure/trip.mjs [phone|desktop] [times...]
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = join(new URL('.', import.meta.url).pathname, '../..'), out = join(root, 'dist/shots/space-adventure');
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(join(spawnSync('npm', ['root', '-g']).stdout.toString().trim(), 'playwright'))); }
mkdirSync(out, { recursive: true });
const args = process.argv.slice(2), only = args.find(a => /^[a-z]+$/.test(a));
const TIMES = args.filter(a => /^[\d.]+$/.test(a)).map(Number);
const times = TIMES.length ? TIMES : [3, 20, 45, 60, 65, 70, 73, 76, 80, 85, 91, 98, 103, 107.2];
const html = readFileSync(join(root, 'dist/index.html'));
const server = createServer((q, s) => { s.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); s.end(html); });
await new Promise(ok => server.listen(0, '127.0.0.1', ok));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
for (const [device, opts] of [['desktop', { viewport: { width: 1280, height: 800 } }], ['phone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]]) {
  if (only && only !== device) continue;
  const ctx = await browser.newContext(opts);
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('page error:', e.message));
  await p.goto(`http://127.0.0.1:${server.address().port}/`);
  await p.waitForFunction(() => window.__mansion && window.__mansion.frames() > 10, null, { timeout: 20000 });
  await p.click('#ok');
  const M = (fn, ...a) => p.evaluate(([f, a]) => window.__mansion[f](...a), [fn, a]);
  const S = (fn, ...a) => p.evaluate(([f, a]) => window.__space[f](...a), [fn, a]);
  const shot = async name => { await p.screenshot({ path: join(out, `${device}-${name}.png`) }); console.log(`dist/shots/space-adventure/${device}-${name}.png`); };
  await M('faceDoor', 'hall', 'space-adventure', 2.6); await p.waitForTimeout(800); await shot('0-door');
  await M('faceDoor', 'hall', 'space-adventure', 1.2);
  await p.keyboard.down('KeyW'); await p.waitForTimeout(500); await p.keyboard.up('KeyW');
  await M('put', 'room:space-adventure', { x: 0, z: -2.6, yaw: Math.PI, pitch: 0, y: 0 }); await p.waitForTimeout(500); await shot('1-cockpit');
  await M('put', 'room:space-adventure', { x: 0, z: -1.2, yaw: Math.PI, pitch: 0, y: 0 });
  await p.waitForTimeout(300);
  await S('warp', 0);
  for (const t of times) {
    await S('jump', t); await p.waitForTimeout(700);
    await shot(`t${String(t).padStart(5, '0')}`);
  }
  await S('warp', 1); await S('jump', 109.4); await p.waitForTimeout(2500); await shot('9-after');
  // her space room: looking back at the door, and at the button's sign from the front
  await M('put', 'room:space-adventure', { x: 0, z: 0.5, yaw: 0, pitch: 0, y: 0 }); await p.waitForTimeout(500); await shot('9-after-door');
  await M('put', 'room:space-adventure', { x: -2.2, z: -1.4, yaw: Math.PI, pitch: 0, y: 0 }); await p.waitForTimeout(500); await shot('9-after-sign');
  console.log(JSON.stringify(await S('state')));
  await ctx.close();
}
await browser.close(); server.close();

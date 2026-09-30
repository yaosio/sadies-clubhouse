// Pictures of Clyde's house (npm run build first): from the gate looking out, from the lane, at the
// front door, the castle from the lane (its windows stay behind the fence), inside, and stepping up to the Good Morning Machine and running it (the right parts
// put in, sped up), as a desktop and a phone. Saves dist/shots/clydes-house/<device>-<name>.png.
//   node tools/clydes-house/shots.mjs [desktop|phone]
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../..', import.meta.url).pathname, out = join(root, 'dist/shots/clydes-house');
mkdirSync(out, { recursive: true });
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(join(spawnSync('npm', ['root', '-g']).stdout.toString().trim(), 'playwright'))); }

const only = process.argv[2];
const server = createServer((q, s) => { s.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); s.end(readFileSync(join(root, 'dist/index.html'))); });
await new Promise(ok => server.listen(0, '127.0.0.1', ok));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const DEVICES = { desktop: { viewport: { width: 1280, height: 800 } }, phone: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } };
for (const [device, opts] of Object.entries(DEVICES)) {
  if (only && only !== device) continue;
  const ctx = await browser.newContext(opts);
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('page error:', e.message));
  await p.goto(`http://127.0.0.1:${server.address().port}/`);
  await p.waitForFunction(() => window.__mansion && window.__mansion.frames() > 5, null, { timeout: 30000 });
  await p.evaluate(() => document.querySelector('#ok')?.click());
  const M = (fn, ...a) => p.evaluate(([f, a]) => window.__mansion[f](...a), [fn, a]);
  const shot = async (name, wait = 600) => { await p.waitForTimeout(wait); await p.screenshot({ path: join(out, `${device}-${name}.png`) }); console.log(`${device}-${name}`); };
  const look = async (place, x, z, y, lx, ly, lz) => {
    const dx = lx - x, dz = lz - z;
    await M('put', place, { x, z, y, yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(ly - (y + 1.6), Math.hypot(dx, dz)) });
  };
  await look('outside', 0, -26, 0, 0, 3, -20); await shot('0-gate');
  await look('outside', 0, -27, 0, -10, 3, -38); await shot('1-turned-round');
  await look('outside', -3, -30, 0, -10, 3.5, -38); await shot('2-lane');
  await look('outside', -8, -35, 0, 0, 6, 5); await shot('2b-castle-from-the-lane');
  await look('outside', -9.2, -33, 0, -10, 1.3, -37); await shot('3-door');
  await M('faceDoor', 'outside', 'clydes-house', 1.6); await shot('4-door-open', 900);
  await M('put', 'room:clydes-house', 'door'); await shot('5-inside');
  await look('room:clydes-house', 0, -1, 0, -4.6, 2, 0); await shot('6-left-wall');
  await look('room:clydes-house', 0, -1, 0, 4.6, 2, 0.5); await shot('7-right-wall');
  await M('put', 'room:clydes-house', 'machine');
  await p.waitForTimeout(300);
  if (opts.hasTouch) await p.tap('#mansion #use'); else await p.keyboard.press('KeyE');
  await shot('8-machine', 1200);
  await p.evaluate(() => window.__clydesHouse.speed(6));
  await shot('9-hello', 1500);
  // put the right part in every gap, and pull the lever
  const S = () => p.evaluate(() => window.__clydesHouse.state());
  for (let i = 0; i < 20 && (await S()).phase !== 'ready'; i++) await p.waitForTimeout(300);
  await p.evaluate(() => window.__clydesHouse.speed(1));
  let s = await S();
  for (const g of s.missing) {
    while ((await S()).picked !== g) await p.keyboard.press('KeyD');
    await p.keyboard.press('KeyW');
    await p.keyboard.press('KeyW');
  }
  await shot('10-parts-in', 300);
  s = await S();
  for (const g of s.missing) while ((await S()).parts[g] !== g) { while ((await S()).picked !== g) await p.keyboard.press('KeyD'); await p.keyboard.press('KeyW'); }
  await shot('11-right-parts', 300);
  await p.keyboard.press('Space');
  for (const [name, ms] of [['12-dominoes', 900], ['13-yarn', 800], ['14-wheel', 1000], ['15-boat', 900], ['16-treat', 900], ['17-sadie', 1200]]) await shot(name, ms);
  await ctx.close();
}
await browser.close(); server.close();

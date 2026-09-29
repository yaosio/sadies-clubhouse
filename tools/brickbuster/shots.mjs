// Pictures of Brickbuster '96's room, as a desktop and a phone, from the built page (npm run build
// first): walking in, standing back, stepping up to play, and the glass cracked. dist/shots/brickbuster/
//   node tools/brickbuster/shots.mjs
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../..', import.meta.url).pathname, out = join(root, 'dist/shots/brickbuster');
mkdirSync(out, { recursive: true });
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(join(spawnSync('npm', ['root', '-g']).stdout.toString().trim(), 'playwright'))); }

const server = createServer((q, s) => { s.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); s.end(readFileSync(join(root, 'dist/index.html'))); });
await new Promise(ok => server.listen(0, '127.0.0.1', ok));
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
for (const [device, opts] of [['desktop', { viewport: { width: 1280, height: 800 } }], ['phone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }]]) {
  const ctx = await browser.newContext(opts);
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('page error:', e.message));
  await p.goto(url);
  await p.waitForFunction(() => window.__mansion && window.__mansion.frames() > 5, null, { timeout: 30000 });
  await p.click('#ok');
  const shot = async (name, wait = 1000) => { await p.waitForTimeout(wait); await p.screenshot({ path: join(out, `${device}-${name}.png`) }); console.log(`dist/shots/brickbuster/${device}-${name}.png`); };
  await p.evaluate(() => { const m = window.__mansion; m.faceDoor('hall', 'brickbuster', 2.4); });
  await shot('1-door');
  await p.evaluate(() => { const m = window.__mansion; m.faceDoor('room:brickbuster', 'door', 0.6); m.turnTo(m.where().yaw + Math.PI, 0.3); });
  await shot('2-walking-in');
  await p.evaluate(() => window.__mansion.put('room:brickbuster', 'case'));
  await shot('3-standing-back');
  await p.evaluate(() => { const m = window.__mansion; m.put('room:brickbuster', { x: -2.5, z: 1.5, yaw: Math.PI + 0.7, pitch: 0.1, y: 0 }); });
  await shot('4-sadie-and-poster');
  await p.evaluate(() => { const m = window.__mansion; m.put('room:brickbuster', { x: 1, z: -2, yaw: -Math.PI / 2 + 0.2, pitch: 0.05, y: 0 }); });
  await shot('5-poster');
  await p.evaluate(() => window.__mansion.put('room:brickbuster', 'case'));
  await p.waitForTimeout(300);
  if (opts.hasTouch) await p.tap('#mansion #use'); else await p.keyboard.press('KeyE');
  await shot('6-playing', 2500);
  await p.evaluate(() => { const b = window.__brickbuster; b.throwBall(1, 1.5, 0.4, -5); });
  await p.waitForTimeout(700);
  await p.evaluate(() => { const b = window.__brickbuster; b.throwBall(3.2, 5, 0.4, 6); });
  await shot('7-cracked', 500);
  console.log(JSON.stringify(await p.evaluate(() => window.__brickbuster.state())));
  await ctx.close();
}
await browser.close(); server.close();

// Pictures of the mansion from its main spots, as a desktop and a phone, from the built page
// (npm run build first): dist/shots/clubhouse/*.png
//   node tools/clubhouse/shots.mjs            every spot
//   node tools/clubhouse/shots.mjs hall door  only the spots whose names have these in them
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

const server = createServer((q, s) => { s.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); s.end(readFileSync(join(root, 'dist/index.html'))); });
await new Promise(ok => server.listen(0, '127.0.0.1', ok));
const url = `http://127.0.0.1:${server.address().port}/`;

// each spot: how to get there (run in the page), then how long to let it settle
const SPOTS = [
  ['1-letter', null],
  ['2-gate', m => m.put('outside', 'start')],
  ['3-door-outside', m => m.faceDoor('outside', 'front', 2.2)],
  ['4-hall', m => m.put('hall', 'start')],
  ['5-hall-back-door', m => m.faceDoor('hall', 'front', 2.2)],
  ['6-stairs', m => m.put('hall', 'stairs')],
  ['7-landing', m => m.put('hall', 'landing')],
  ['8-activity-doors-shut', m => { m.faceDoor('hall', 'dropper-world', 4.2); m.turnTo(m.where().yaw - 0.35); }],
  ['8-activity-door', m => m.faceDoor('hall', 'dropper-world', 2.0)],
  ['8-activity-door-inside', m => m.faceDoor('hall', 'dropper-world', 0.3)],
  ['9-room', m => m.put('room:dropper-world', 'computer')],
  ['10-room-door', m => m.faceDoor('room:dropper-world', 'door', 2.0)],
];
const only = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const [device, opts] of [['desktop', { viewport: { width: 1280, height: 800 } }], ['phone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }]]) {
  const ctx = await browser.newContext({ ...opts, ignoreHTTPSErrors: true });
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('page error:', e.message));
  await p.goto(url);
  await p.waitForFunction(() => window.__mansion && window.__mansion.frames() > 5, null, { timeout: 30000 });
  for (const [name, go] of SPOTS) {
    if (only.length && !only.some(o => name.includes(o))) continue;
    if (go) await p.evaluate(`(${go})(window.__mansion); document.querySelector('#letter').hidden = true;`);
    await p.waitForTimeout(go ? 1200 : 1500);
    await p.screenshot({ path: join(out, `${device}-${name}.png`) });
    console.log(`dist/shots/clubhouse/${device}-${name}.png  ${JSON.stringify(await p.evaluate(() => ({ ...window.__mansion.where(), through: window.__mansion.looking(), use: window.__mansion.target() })))}`);
  }
  await ctx.close();
}
await browser.close(); server.close();

// Pictures of the aquarium mock-up as a computer and a phone: art/aquarium/*.png
//   node art/aquarium/build.mjs && node art/aquarium/shots.mjs
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const here = new URL('.', import.meta.url).pathname, root = join(here, '../..');
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(join(spawnSync('npm', ['root', '-g']).stdout.toString().trim(), 'playwright'))); }

const page = readFileSync(join(root, 'dist/aquarium/mockup.html'));
const server = createServer((q, s) => { s.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); s.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">' + page); });
await new Promise(ok => server.listen(0, '127.0.0.1', ok));
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const out = process.argv[2] || here;
for (const [device, vp] of [['computer', { width: 1100, height: 820 }], ['phone', { width: 400, height: 860 }]]) {
  const p = await browser.newPage({ viewport: vp });
  p.on('pageerror', e => console.log('page error:', e.message));
  p.on('console', m => m.type() === 'error' && console.log('console:', m.text()));
  for (const [view, wait] of [['landing', 1200], ['ring', 900], ['overview', 1200], ['glass', 1200], ['cabinet-found', 1200], ['cabinet', 900], ['dive', 2600], ['dive', 5200]]) {
    await p.goto(url + '?' + view + wait + '#' + view + (device === 'phone' ? '-phone' : ''));
    await p.waitForFunction(() => window.__aqReady, null, { timeout: 30000 });
    await p.waitForTimeout(wait);
    const name = `${view}${view === 'dive' ? wait : ''}-${device}.png`;
    await p.locator('#stage').screenshot({ path: join(out, name) });
    console.log(name);
  }
  await p.close();
}
await browser.close(); server.close();

// Pictures of the bare board (no buttons, bubbles or tips on top) for mock-ups: builds a tall pile,
// brings Chooter in, lets it settle, then takes a phone and a desktop shot. Needs a built
// dist/index.html (npm run build).
//
//   node tools/dropper-world/board-shot.mjs [out folder]      (default: dist/board-shots)
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { serve } from '../serve.mjs';
import { chromium } from '../browser.mjs';


const root = resolve(new URL('../..', import.meta.url).pathname);
const out = resolve(process.argv[2] || join(root, 'dist/board-shots'));
mkdirSync(out, { recursive: true });
const server = await serve();
const browser = await chromium.launch();
for (const [name, opts] of [
  ['phone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }],
  ['desktop', { viewport: { width: 1280, height: 800 } }],
]) {
  const ctx = await browser.newContext(opts);
  const p = await ctx.newPage();
  await p.goto(`http://127.0.0.1:${server.address().port}/#dropper-world`);
  await p.waitForTimeout(1500);
  await p.evaluate(() => { document.getElementById('buildPile').click(); document.getElementById('meetChooter').click(); });
  await p.waitForTimeout(12000);
  // on a wide screen the camera stays where it was; look at Sadie from a bit further back
  if (name === 'desktop') await p.evaluate(() => { const d = window.__jellyDebug(); window.__jellyLook(d.cx, d.cy + 4, 1.1); });
  await p.addStyleTag({ content: '.hud,#clubBack,.tip,.toast,.thought,.toy-btn,.toy-tray,.sheet,#testBadge,.perf{display:none!important}' });
  await p.waitForTimeout(300);
  await p.screenshot({ path: join(out, name + '.png') });
  await ctx.close();
}
await browser.close(); server.close();
console.log('saved in ' + out);

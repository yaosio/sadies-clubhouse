// Walks up to Lily's trampoline from a little way off and onto it, printing where you stand and how
// high you bounce each step (to see that walking onto it works, not just being put on it).
//   npm run build -- --preview && node tools/lily-house/trampoline.mjs
import { serve } from '../serve.mjs';
import { launch, DEVICES } from '../browser.mjs';
import { up, walk } from '../../tests/shared/browser.mjs';

const server = await serve(), browser = await launch();
const p = await (await browser.newContext(DEVICES.desktop)).newPage();
p.on('pageerror', e => console.log('ERROR', e.message));
await p.goto(`http://127.0.0.1:${server.address().port}/`);
if (!await up(p)) { console.log('did not open'); process.exit(1); }
await p.click('#ok');
const M = (f, ...a) => p.evaluate(([f, a]) => window.__clubhouse[f](...a), [f, a]);
await M('faceDoor', 'outside', 'lily-house', 3); await p.waitForTimeout(800);   // (builds her house)
const tr = await p.evaluate(() => window.__lily.trampoline());
console.log('trampoline', tr);
// 2.5 m out from it, towards the door side, facing it, on the ledge
for (const [ox, oz] of [[0, 2.5], [2.5, 0], [-2.5, 0], [0, -2.5]]) {
  const x = tr.x + ox, z = tr.z + oz, floor = await M('floorAt', 'outside', x, z, tr.y - 0.42);
  await M('put', 'outside', { x, z, y: floor ?? tr.y - 0.42, yaw: Math.atan2(ox, oz), pitch: -0.2 });
  await p.waitForTimeout(300);
  const steps = [];
  for (let i = 0; i < 8; i++) { await walk(p, 150); const w = await M('where'); steps.push(`${w.x.toFixed(2)},${w.z.toFixed(2)} y${w.y.toFixed(2)} hop${w.hop.toFixed(2)}`); }
  console.log(`from ${ox},${oz} (floor ${floor}):`, steps.join(' | '));
}
await browser.close(); server.close();

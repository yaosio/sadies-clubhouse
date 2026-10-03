// Pictures of Chooter's Paint Shop (npm run build first): the shop from the lane, its door, inside
// (the counter and Chooter, the pegboard, the plaster Sadie), then painting: the LOOK and PAINT buttons and a
// stroke across the back wall with a finger or the mouse, a stamp, a rainbow stroke, the bucket on the
// floor, Sadie's paw prints, the dynamite going off, and the room after all of it. As a desktop and a
// phone. Saves dist/shots/paint-shop/<device>-<name>.png.
//   node tools/paint-shop/shots.mjs [desktop|phone]
import { serve } from '../serve.mjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { launch, DEVICES } from '../browser.mjs';

const root = new URL('../..', import.meta.url).pathname, out = join(root, 'dist/shots/paint-shop');
mkdirSync(out, { recursive: true });

const only = process.argv[2];
const server = await serve();
const browser = await launch();
const ROOM = 'room:paint-shop';
for (const [device, opts] of Object.entries(DEVICES)) {
  if (only && only !== device) continue;
  const ctx = await browser.newContext(opts);
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('page error:', e.message));
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('console:', m.text()); });
  await p.goto(`http://127.0.0.1:${server.address().port}/`);
  await p.waitForFunction(() => window.__clubhouse && window.__clubhouse.frames() > 5 && window.__clubhouse.settled(), null, { timeout: 30000 });
  await p.evaluate(() => document.querySelector('#ok')?.click());
  const M = (fn, ...a) => p.evaluate(([f, a]) => window.__clubhouse[f](...a), [fn, a]);
  const S = () => p.evaluate(() => window.__paintShop.state());
  const shot = async (name, wait = 600) => { await p.waitForTimeout(wait); await p.screenshot({ path: join(out, `${device}-${name}.png`) }); console.log(`${device}-${name}`); };
  const look = async (place, x, z, y, lx, ly, lz) => {
    const dx = lx - x, dz = lz - z;
    await M('put', place, { x, z, y, yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(ly - (y + 1.6), Math.hypot(dx, dz)) });
    await p.waitForTimeout(200);   // (drawn from there before anything's pressed: a press is a line from the view)
  };
  // a press on the screen that drags from (x0, y0) to (x1, y1), as a finger or the mouse, in steps
  const drag = async (x0, y0, x1, y1, steps = 12) => p.evaluate(async ([x0, y0, x1, y1, steps, touch]) => {
    const c = document.querySelector('#clubhouse #view'), W = innerWidth, H = innerHeight;
    const ev = (type, k) => c.dispatchEvent(new PointerEvent(type, { pointerId: 5, pointerType: touch ? 'touch' : 'mouse', button: 0, clientX: (x0 + (x1 - x0) * k) * W, clientY: (y0 + (y1 - y0) * k) * H, bubbles: true }));
    ev('pointerdown', 0);
    for (let i = 1; i <= steps; i++) { await new Promise(ok => requestAnimationFrame(ok)); ev('pointermove', i / steps); }
    await new Promise(ok => requestAnimationFrame(ok)); await new Promise(ok => requestAnimationFrame(ok));
    ev('pointerup', 1);
  }, [x0, y0, x1, y1, steps, !!opts.hasTouch]);

  await look('outside', 4, -31, 0, 10, 2, -38); await shot('0-from-the-lane');
  await M('faceDoor', 'outside', 'paint-shop', 1.6); await shot('1-door-open', 900);
  await M('put', ROOM, 'door'); await shot('2-inside');
  await M('put', ROOM, 'counter'); await shot('3-counter');
  await M('put', ROOM, 'pegboard'); await shot('4-pegboard');
  await look(ROOM, 1.2, -0.6, 0, 3.3, 1.1, -1.4); await shot('5-plaster-sadie');
  // painting the back wall: PAINT on, then a stroke
  await look(ROOM, 0, 1.5, 0, 0, 2.0, -4.5);
  await p.click('#clubhouse #paint [data-to=paint]'); await shot('6-paint-switch', 300);
  await p.evaluate(() => window.__paintShop.hold('roller', 1));
  await drag(0.2, 0.3, 0.8, 0.35);
  await p.evaluate(() => window.__paintShop.hold('brush', 'rainbow'));
  await drag(0.15, 0.5, 0.85, 0.42, 30);
  await p.evaluate(() => window.__paintShop.hold('spray', 7));
  await drag(0.3, 0.6, 0.6, 0.62, 20);
  for (const [st, x] of [['stamp-fish', 0.25], ['stamp-yarn', 0.45], ['stamp-clyde', 0.65], ['stamp-paw', 0.8]]) { await p.evaluate(t => window.__paintShop.hold(t), st); await drag(x, 0.2, x, 0.2, 1); }
  console.log(JSON.stringify((await S()).painted));
  await shot('7-back-wall');
  // the floor: the bucket, and Sadie's prints
  await look(ROOM, 0, 3.2, 0, 0, 0, 0.5);
  await p.evaluate(() => window.__paintShop.hold('bucket', 6));
  await drag(0.5, 0.75, 0.5, 0.75, 1);
  await p.evaluate(() => window.__paintShop.hold('brush', 10));
  await p.evaluate(() => window.__paintShop.sadie());
  await shot('8-sadie-comes-in', 2500);
  await shot('9-paw-prints', 9000);
  // the dynamite on the back wall
  await look(ROOM, 0, 1.5, 0, 0, 2.0, -4.5);
  await p.evaluate(() => window.__paintShop.hold('dynamite'));
  await drag(0.3, 0.3, 0.3, 0.3, 1);
  await shot('10-boom', 150);
  await shot('11-after', 1500);
  console.log(JSON.stringify(await S()));
  await ctx.close();
}
await browser.close(); server.close();

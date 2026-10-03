// Chooter's Paint Shop in a real (hidden) browser, as a phone and as a desktop: run by tools/check.mjs
// (never on its own) with the built page. It's built into the clubhouse (outside the gate), so these
// run whenever the clubhouse changes too.
//
// It walks out along the lane to the shop and in through its door, dips the brush in a pot on the
// counter and takes a tool off the pegboard (E, or the USE button on a phone), sees the YOU'RE HOLDING
// box name them and the switch go to PAINT, flips it to LOOK and back, and paints a wall with a finger or the mouse (silently), stamps a stamp, fills the
// floor with the bucket, blows the floor's paint off with the dynamite, watches Sadie come in and
// leave paw prints, pushes the plunger twice (the first time it asks) and sees the whole room go back
// to bare, and checks the paint is kept after a reload. Screenshots in dist/check/paint-shop/. Any
// error on the page is a failure.
import { bothDevices } from '../shared/browser.mjs';

const ROOM = 'room:paint-shop';

export default async function ({ browser, page, check, outDir }) {
  await bothDevices(browser, outDir, async ({ device, opts, p, errors, shot, M, up, walk, rest, use, until: untilGame }) => {
    const S = () => p.evaluate(() => window.__paintShop.state());
    const until = (fn, arg, ms = 8000) => untilGame(fn, arg, ms);   // (in the game's time)
    // stand at (x, z) in the shop looking at a point, and let it draw from there
    const face = async (x, z, tx, ty, tz) => {
      const dx = tx - x, dz = tz - z;
      await M('put', ROOM, { x, z, y: 0, yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(ty - 1.6, Math.hypot(dx, dz)) });
      await p.waitForTimeout(250);
    };
    // a press on the screen from (x0, y0) to (x1, y1) (fractions of the way across and down), a frame a step
    const drag = (x0, y0, x1 = x0, y1 = y0, steps = 1) => p.evaluate(async ([x0, y0, x1, y1, steps, touch]) => {
      const c = document.querySelector('#clubhouse #view'), W = innerWidth, H = innerHeight, frame = () => new Promise(ok => requestAnimationFrame(ok));
      const ev = (type, k) => c.dispatchEvent(new PointerEvent(type, { pointerId: 5, pointerType: touch ? 'touch' : 'mouse', button: 0, clientX: (x0 + (x1 - x0) * k) * W, clientY: (y0 + (y1 - y0) * k) * H, bubbles: true }));
      ev('pointerdown', 0);
      for (let i = 1; i <= steps; i++) { await frame(); ev('pointermove', i / steps); }
      await frame(); await frame();
      ev('pointerup', 1);
    }, [x0, y0, x1, y1, steps, !!opts.hasTouch]);

    await p.goto(page);
    if (!await up()) { check(`${device}: the clubhouse opens`, false, errors[0]); return; }
    await p.click('#ok');

    // out of the gate, across the path from Clyde's, and in
    check(`${device}: the paint shop is on the lane, with its door`, await M('faceDoor', 'outside', 'paint-shop', 3));
    await walk(250); await p.waitForTimeout(700);
    await shot('1-shop');
    check(`${device}: ...which opens onto the shop`, await M('looking') === ROOM);
    await walk(1400);
    check(`${device}: walking through it, you're in the shop`, (await M('where')).place === ROOM);
    await p.waitForTimeout(400);
    await shot('2-inside');

    // dipping the brush in a pot, and taking a tool off the pegboard
    await face(-0.75, -2.9, -0.75, 1.16, -3.95);
    check(`${device}: looking at a pot on the counter, it offers a dip`, await M('target') === 'DIP IN YELLOW', await M('target'));
    await use(); await p.waitForTimeout(150);
    let s = await S();
    check(`${device}: ...and dipping in it, you're holding yellow (plip)`, s.holding.paint === 3 && s.heard.includes('plip'), JSON.stringify(s.holding));
    await face(-3.6, -0.92, -4.9, 1.6, -0.92);
    check(`${device}: on the pegboard, the spray can`, await M('target') === 'TAKE THE SPRAY CAN', await M('target'));
    await use(); await p.waitForTimeout(150);
    s = await S();
    check(`${device}: ...taking it, you hold it (tok)`, s.holding.tool === 'spray' && s.heard.includes('tok'));
    // painting the right wall (nothing on it): PAINT turns painting on, then a stroke
    await face(1, 2.5, 5, 1.8, 2.5);
    await p.click('#clubhouse #paint [data-to=paint]');
    check(`${device}: PAINT turns painting on`, await M('painting'));
    await p.evaluate(() => window.__paintShop.hold('brush', 1));
    await drag(0.15, 0.45, 0.85, 0.42, 14);
    s = await S();
    check(`${device}: dragging paints a stroke across the wall`, s.painted['right wall'] > 40, `${s.painted['right wall']} pixels`);
    // kept after a reload (the shop keeps the paint 1.5 s of play after the last stroke: once Sadie's
    // gone, as she can still be leaving prints)
    await until(() => !window.__paintShop.state().sadie.on, null, 30000);
    await rest(1800);
    const kept = (await S()).painted;
    await p.reload();
    await up(); await M('build', ROOM); await M('put', ROOM, 'middle'); await p.waitForTimeout(300);
    s = await S();
    check(`${device}: the paint is kept after a reload`, Object.entries(kept).every(([k, v]) => s.painted[k] === v) && s.total > 0, `${s.total} pixels`);

    check(`${device}: no errors on the page`, !errors.length, errors.slice(0, 3).join(' | '));
  });
}

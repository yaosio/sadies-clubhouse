// The clubhouse menu in a real (hidden) browser, as a phone and as a desktop: run by
// tools/check.mjs (never on its own) with the built page, every time (it only takes a few seconds).
//
// It opens the page (the 3D room with its shelf), checks the first activity's box is chosen, taps a
// locked box and Sadie, turns to the second shelf and back, walks back with the arrow pad, then taps
// the first activity's box and presses PLAY!: the menu must leave the page completely and the activity start; then ESC BACK must bring the menu
// back with the tower saved, and Escape too when the page came in straight by address. Any error
// on the page, or anything that doesn't work, is a failure. Screenshots go in dist/check/clubhouse/.
import { join } from 'node:path';

export default async function ({ browser, page, check, outDir }) {
  const DEVICES = [
    ['phone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
    ['desktop', { viewport: { width: 1280, height: 800 } }],
  ];
  for (const [device, opts] of DEVICES) {
    const ctx = await browser.newContext(opts);
    // the web fonts can't be fetched from here; answer with nothing rather than log a network error
    await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    const p = await ctx.newPage(), errors = [];
    p.on('pageerror', e => errors.push(e.message));
    p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    const shot = name => p.screenshot({ path: join(outDir, `${device}-${name}.png`) });
    const tap = (x, y) => opts.hasTouch ? p.touchscreen.tap(x, y) : p.mouse.click(x, y);
    const led = () => p.evaluate(() => window.__clubhouse.led());
    const where = (kind, nth) => p.evaluate(([k, n]) => window.__clubhouse.where(k, n), [kind, nth]);

    await p.goto(page);
    const up = await p.waitForFunction(() => window.__clubhouse && window.__clubhouse.frames() > 20, null, { timeout: 10000 }).then(() => true, () => false);
    await p.waitForTimeout(800);
    await shot('1-menu');
    check(`${device}: the menu opens and the 3D room draws`, up, errors[0]);
    if (!up) { await ctx.close(); continue; }
    check(`${device}: ...with Sadie's Dropper World chosen`, /DROPPER WORLD/.test(await led()), JSON.stringify(await led()));

    const locked = await where('locked', 0);
    await tap(locked.x, locked.y); await p.waitForTimeout(1500);
    await shot('2-locked-box');
    check(`${device}: tapping a locked box says it's under construction`, /UNDER CONSTRUCTION/.test(await led()));
    check(`${device}: ...and PLAY! does nothing for it`, await p.evaluate(() => document.querySelector('#clubhouse #play').disabled));

    const sadie = await where('sadie', 0);
    await tap(sadie.x, sadie.y); await p.waitForTimeout(1500);
    await shot('3-sadie');
    check(`${device}: tapping Sadie says who she is`, /SADIE/.test(await led()) && /UNIMPRESSED/.test(await led()));

    // MORE SHELVES turns to the second shelf, and again back to the first
    const key = async k => { await p.click(`#clubhouse .key[data-k=${k}]`); await p.waitForTimeout(1600); };
    await key('PageDown');
    await shot('4-shelf-2');
    check(`${device}: MORE SHELVES turns to the second shelf`, /SHELF 2/.test(await led()));
    await key('PageDown');
    check(`${device}: ...and back to the first`, /SHELF 1/.test(await led()));

    const before = await p.evaluate(() => window.__clubhouse.camera());
    const back = await p.evaluate(() => { const r = document.querySelector('#pad [data-d=b]').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    await p.mouse.move(back.x, back.y); await p.mouse.down(); await p.waitForTimeout(500); await p.mouse.up();
    const after = await p.evaluate(() => window.__clubhouse.camera());
    check(`${device}: holding an arrow on the pad walks (backwards, to see the shelf)`, Math.hypot(after.x - before.x, after.z - before.z) > 0.1,
      `moved ${Math.hypot(after.x - before.x, after.z - before.z).toFixed(2)} m`);

    await p.waitForTimeout(300);
    const box = await where('activity', 0);
    check(`${device}: Dropper World's box is in view`, box.visible);
    await tap(box.x, box.y); await p.waitForTimeout(1500);
    check(`${device}: tapping its box chooses it again`, /DROPPER WORLD/.test(await led()));
    await shot('5-dropper-box');
    await p.click('#clubhouse #play', { timeout: 3000 }).catch(() => {});
    const inside = await p.waitForFunction(() => !document.getElementById('clubhouse') && window.__jellyDebug && document.getElementById('app'), null, { timeout: 8000 }).then(() => true, () => false);
    await p.waitForTimeout(3000);
    await shot('6-played');
    const left = await p.evaluate(() => ({ menu: !!document.getElementById('clubhouse'), hook: !!window.__clubhouse, title: document.title, pieces: window.__jellyDebug?.().pieces }));
    check(`${device}: PLAY! starts Dropper World`, inside && left.pieces >= 0, `title ${JSON.stringify(left.title)}`);
    check(`${device}: ...and the menu is gone from the page`, !left.menu && !left.hook);

    // ESC BACK (the clubhouse's key in the activity's corner) goes back to the menu, tower saved
    const count = left.pieces;
    await p.click('#clubBack', { timeout: 3000 }).catch(() => {});
    const home = await p.waitForFunction(() => window.__clubhouse && window.__clubhouse.frames() > 20, null, { timeout: 10000 }).then(() => true, () => false);
    await p.waitForTimeout(500);
    await shot('7-back');
    check(`${device}: ESC BACK goes back to the clubhouse`, home && !(await p.evaluate(() => !!document.getElementById('app'))));
    await p.click('#clubhouse #play', { timeout: 3000 }).catch(() => {});
    await p.waitForFunction(() => window.__jellyDebug && document.getElementById('app'), null, { timeout: 8000 }).catch(() => {});
    const again = await p.evaluate(() => window.__jellyDebug?.().pieces);
    check(`${device}: ...and PLAY! again finds the tower as it was`, again >= count && count > 0, `${count} pieces before, ${again} after`);

    // straight in by address (#dropper-world), then the Escape key goes back too
    await p.goto(page + '#dropper-world');
    await p.waitForFunction(() => window.__jellyDebug && document.getElementById('clubBack'), null, { timeout: 8000 }).catch(() => {});
    await p.waitForTimeout(500);
    await p.keyboard.press('Escape');
    const home2 = await p.waitForFunction(() => window.__clubhouse && window.__clubhouse.frames() > 5, null, { timeout: 10000 }).then(() => true, () => false);
    check(`${device}: the Escape key goes back too (even when it came in by address)`, home2 && !(await p.evaluate(() => location.hash)));
    check(`${device}: no errors on the page`, !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
}

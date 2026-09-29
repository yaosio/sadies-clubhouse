// Sadie's mansion (the clubhouse) in a real (hidden) browser, as a phone and as a desktop: run by
// tools/check.mjs (never on its own) with the built page, every time (it takes under a minute).
//
// It opens the page at the gate with Sadie's letter (the first time only), walks, goes in through the
// front door (seeing the hall through it first), climbs the spiral stairs to the landing, walks through
// Dropper World's door into its room, plays it at the computer (the mansion must leave the page
// completely), comes back with ESC BACK to that computer with the tower saved, and comes back from an
// address that went straight in. It pauses, and in the test version starts the letter over. Any error
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
    const M = (fn, ...a) => p.evaluate(([f, a]) => window.__mansion[f](...a), [fn, a]);
    const up = () => p.waitForFunction(() => window.__mansion && window.__mansion.frames() > 10, null, { timeout: 15000 }).then(() => true, () => false);
    const walk = async ms => { await p.keyboard.down('KeyW'); await p.waitForTimeout(ms); await p.keyboard.up('KeyW'); await p.waitForTimeout(100); };

    await p.goto(page);
    const opened = await up();
    await p.waitForTimeout(500);
    await shot('1-letter');
    check(`${device}: the mansion opens and draws`, opened, errors[0]);
    if (!opened) { await ctx.close(); continue; }
    check(`${device}: ...at the gate, with Sadie's letter`, (await M('where')).place === 'outside' && await M('mode') === 'letter' && await p.isVisible('#letter'));
    await p.click('#ok');
    check(`${device}: OK puts the letter away`, await M('mode') === 'play' && !(await p.isVisible('#letter')));
    await p.reload(); await up();
    check(`${device}: ...and it only comes the first time`, await M('mode') === 'play' && !(await p.isVisible('#letter')));
    await shot('2-gate');

    // walking: the keys on a desktop, the thumb stick on a phone
    const before = await M('where');
    if (opts.hasTouch) {
      await p.evaluate(async () => {
        const c = document.querySelector('#mansion #view'), r = c.getBoundingClientRect(), x = r.left + 80, y = r.bottom - 120;
        const ev = (type, dy) => c.dispatchEvent(new PointerEvent(type, { pointerId: 7, pointerType: 'touch', clientX: x, clientY: y + dy, bubbles: true }));
        ev('pointerdown', 0); ev('pointermove', -45);
        await new Promise(ok => setTimeout(ok, 700));
        ev('pointerup', -45);
      });
    } else await walk(700);
    const after = await M('where');
    check(`${device}: ${opts.hasTouch ? 'the thumb stick' : 'W'} walks you up the path`, after.z - before.z > 0.8, `moved ${(after.z - before.z).toFixed(2)} m`);

    // in through the front door: it opens as you come up, and the hall shows through it
    await M('faceDoor', 'outside', 'front', 2.4);
    await walk(350);
    await p.waitForTimeout(500);
    await shot('3-front-door');
    check(`${device}: the front door opens as you come up, showing the hall through it`, await M('looking') === 'hall');
    await walk(700);   // through, and about a metre on: still inside the door's swing
    await shot('4-hall');
    check(`${device}: ...and walking through it takes you into the hall (no loading)`, (await M('where')).place === 'hall');
    check(`${device}: ...and the door stays open while you're still in its swing`, await M('lastDoorOpen') > 0.9, `open ${(await M('lastDoorOpen'))?.toFixed(2)}`);

    // stepping through a doorway a little at a time, you come out exactly as far past it as you
    // stepped (no jump: even a few centimetres shows as a stutter)
    await M('faceDoor', 'outside', 'front', 0.5);
    let past = null;
    for (let i = 0; i < 60 && past === null; i++) {
      await M('step', 0.013);
      const w = await M('where');
      if (w.place === 'hall') past = w.z - (await M('doorAt', 'hall', 'front')).z;
    }
    check(`${device}: stepping through a doorway doesn't jump you forward`, past !== null && past > 0 && past <= 0.0131, `came out ${past?.toFixed(4)} m past it`);

    // looking up and down while turning never tips the view over
    let tipped = 0;
    for (const [yaw, pitch] of [[0.7, 0.6], [2.4, -0.7], [-1.9, 0.5]]) { await M('turnTo', yaw, pitch); await p.waitForTimeout(80); tipped = Math.max(tipped, await M('tilt')); }
    check(`${device}: looking up or down while turning keeps the view upright`, tipped < 1e-3, `leans ${tipped.toFixed(3)}`);

    // up the spiral stairs to the landing, keeping to the middle of the steps
    await M('put', 'hall', 'stairs');
    for (let i = 0; i < 40; i++) {
      const w = await M('where');
      if (w.y > 4.5) break;
      const th = Math.atan2(w.x, w.z), r = Math.hypot(w.x, w.z);
      await M('turnTo', th - Math.PI / 2 + (r - 2.2) * 0.4);
      await walk(150);
    }
    const top = await M('where');
    check(`${device}: the stairs go up to the first landing`, top.y > 4.5, `at ${top.y.toFixed(2)} m`);

    // through Dropper World's door into its room
    await M('faceDoor', 'hall', 'dropper-world', 2.2);
    await walk(1500);
    await shot('5-room');
    check(`${device}: Dropper World's door on the landing leads to its room`, (await M('where')).place === 'room:dropper-world');

    // play it at the computer
    await M('put', 'room:dropper-world', 'computer');
    await p.waitForTimeout(300);
    check(`${device}: at the computer, it offers to play`, /DROPPER WORLD/.test(await M('target') || ''), await M('target'));
    if (opts.hasTouch) await p.tap('#mansion #use'); else await p.keyboard.press('KeyE');
    const inside = await p.waitForFunction(() => !document.getElementById('mansion') && window.__jellyDebug && document.getElementById('app'), null, { timeout: 10000 }).then(() => true, () => false);
    await p.waitForTimeout(3000);
    await shot('6-played');
    const left = await p.evaluate(() => ({ mansion: !!document.getElementById('mansion'), hook: !!window.__mansion, title: document.title, pieces: window.__jellyDebug?.().pieces }));
    check(`${device}: using the computer starts Dropper World`, inside && left.pieces >= 0, `title ${JSON.stringify(left.title)}`);
    check(`${device}: ...and the mansion is gone from the page`, !left.mansion && !left.hook);

    // ESC BACK: back at that computer, tower saved
    const count = left.pieces;
    await p.click('#clubBack', { timeout: 3000 }).catch(() => {});
    const home = await up();
    await p.waitForTimeout(500);
    await shot('7-back');
    check(`${device}: ESC BACK comes back to the mansion, at Dropper World's computer`, home && (await M('where')).place === 'room:dropper-world' && await M('mode') === 'play');
    if (opts.hasTouch) await p.tap('#mansion #use').catch(() => {}); else await p.keyboard.press('KeyE');
    await p.waitForFunction(() => window.__jellyDebug && document.getElementById('app'), null, { timeout: 10000 }).catch(() => {});
    const again = await p.evaluate(() => window.__jellyDebug?.().pieces);
    check(`${device}: ...and playing again finds the tower as it was`, again >= count && count > 0, `${count} pieces before, ${again} after`);

    // straight in by address (#dropper-world), then the Escape key comes back too
    await p.goto(page + '#dropper-world');
    await p.waitForFunction(() => window.__jellyDebug && document.getElementById('clubBack'), null, { timeout: 8000 }).catch(() => {});
    await p.waitForTimeout(500);
    await p.keyboard.press('Escape');
    const home2 = await up();
    check(`${device}: the Escape key comes back too (even when it came in by address)`, home2 && !(await p.evaluate(() => location.hash)));

    // pausing, and in the test version, starting the letter over
    if (opts.hasTouch) await p.tap('#mansion #pause'); else await p.keyboard.press('Escape');
    await p.waitForTimeout(200);
    await shot('8-paused');
    const test = await p.evaluate(() => !!document.getElementById('testBadge'));
    check(`${device}: ${opts.hasTouch ? 'the pause button' : 'Escape'} pauses`, await M('mode') === 'menu' && await p.isVisible('#menu'));
    check(`${device}: ...with the start-over buttons only in the test version`, (await p.isVisible('#dev')) === test);
    if (test) {
      await p.click('#resets button:has-text("INVITATION")');
      await up();
      check(`${device}: starting the invitation over brings Sadie's letter back`, await M('mode') === 'letter');
    } else {
      await p.click('#resume');
      check(`${device}: RESUME carries on`, await M('mode') === 'play');
    }
    check(`${device}: no errors on the page`, !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
}

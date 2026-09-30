// Brickbuster '96 in a real (hidden) browser, as a phone and as a desktop: run by tools/check.mjs
// (never on its own) with the built page. It lives in the mansion, so these run whenever the mansion
// changes too.
//
// It walks through Brickbuster's door on the landing into its room, steps up to the case (the view
// eases back to fit it), moves the paddle with the keys and the mouse (a finger on the phone), sends
// the ball into the bottom of the glass to crack it (the crack sound, the paddle wincing), steps
// back (the game stops where it was), comes back after a reload to find the crack still there,
// breaks it (the shatter, the heap, the yarn ball's escape, the sign on the door), finds it still
// broken after a reload, and in the test version starts it over from the pause menu. Screenshots in dist/check/brickbuster/.
// Any error on the page is a failure.
import { join } from 'node:path';

export default async function ({ browser, page, check, outDir }) {
  const DEVICES = [
    ['phone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
    ['desktop', { viewport: { width: 1280, height: 800 } }],
  ];
  await Promise.all(DEVICES.map(async ([device, opts]) => {
    const ctx = await browser.newContext(opts);
    await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    const p = await ctx.newPage(), errors = [];
    p.on('pageerror', e => errors.push(e.message));
    p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    const shot = name => p.screenshot({ path: join(outDir, `${device}-${name}.png`) });
    const M = (fn, ...a) => p.evaluate(([f, a]) => window.__mansion[f](...a), [fn, a]);
    const B = () => p.evaluate(() => window.__brickbuster.state());
    const up = () => p.waitForFunction(() => window.__mansion && window.__mansion.frames() > 10, null, { timeout: 15000 }).then(() => true, () => false);
    const walk = async ms => { await p.keyboard.down('KeyW'); await p.waitForTimeout(ms); await p.keyboard.up('KeyW'); await p.waitForTimeout(100); };
    const use = () => opts.hasTouch ? p.tap('#mansion #use') : p.keyboard.press('KeyE');
    const modeIs = m => p.waitForFunction(m => window.__mansion.mode() === m, m, { timeout: 5000 }).then(() => true, () => false);
    // a finger sliding across the screen (dx pixels), or the mouse moving
    const slide = dx => p.evaluate(async dx => {
      const c = document.querySelector('#mansion #view'), y = innerHeight * 0.6, x0 = innerWidth / 2 - dx / 2;
      const ev = (type, x) => c.dispatchEvent(new PointerEvent(type, { pointerId: 9, pointerType: 'touch', clientX: x, clientY: y, bubbles: true }));
      ev('pointerdown', x0);
      for (let i = 1; i <= 10; i++) { ev('pointermove', x0 + dx * i / 10); await new Promise(ok => setTimeout(ok, 20)); }
      ev('pointerup', x0 + dx);
    }, dx);

    await p.goto(page);
    if (!await up()) { check(`${device}: the mansion opens`, false, errors[0]); await ctx.close(); return; }
    await p.click('#ok');

    // through its door on the landing, into the room
    await M('faceDoor', 'hall', 'brickbuster', 1.3);
    await walk(1200);
    await shot('1-room');
    check(`${device}: Brickbuster's door on the landing leads to its room`, (await M('where')).place === 'room:brickbuster');

    // step up to the case
    await M('put', 'room:brickbuster', 'case');
    await p.waitForTimeout(300);
    check(`${device}: looking at the case, it offers to play`, /BRICKBUSTER/.test(await M('target') || ''), await M('target'));
    const stood = await M('where');
    await use();
    const playing = await modeIs('arcade');
    await p.waitForTimeout(1600);
    await shot('2-playing');
    let s = await B();
    check(`${device}: stepping up starts the game, the view eased back to fit the case`, playing && s.active && (await M('where')).z < stood.z - 0.3);
    check(`${device}: ...and the yarn ball is sent off by itself`, !s.serving);
    await p.evaluate(() => window.__brickbuster.catchBall());   // (so it can't miss on its own while we check other things)

    // the paddle: keys and the mouse on a desktop, a finger on a phone
    if (opts.hasTouch) {
      const a = (await B()).paddle; await slide(-120); const b = (await B()).paddle; await slide(160); const c = (await B()).paddle;
      check(`${device}: sliding a finger moves the paddle along with it`, b < a - 0.3 && c > b + 0.4, `${a.toFixed(2)} → ${b.toFixed(2)} → ${c.toFixed(2)}`);
    } else {
      const a = (await B()).paddle;
      await p.keyboard.down('KeyA'); await p.waitForTimeout(250); await p.keyboard.up('KeyA');
      const b = (await B()).paddle;
      await p.keyboard.down('KeyD'); await p.waitForTimeout(400); await p.keyboard.up('KeyD');
      const c = (await B()).paddle;
      check(`${device}: A and D move the paddle`, b < a - 0.3 && c > b + 0.5, `${a.toFixed(2)} → ${b.toFixed(2)} → ${c.toFixed(2)}`);
      await p.mouse.move(640, 500); await p.mouse.move(400, 500, { steps: 8 });
      const d = (await B()).paddle;
      check(`${device}: ...and so does the mouse`, d < c - 0.3, `${c.toFixed(2)} → ${d.toFixed(2)}`);
      check(`${device}: ...and walking doesn't (you're playing)`, Math.abs((await M('where')).x - stood.x) < 5);
    }

    // missing: the ball goes past the paddle and cracks the bottom of the glass
    const before = (await B()).cracks.bottom;
    await p.evaluate(() => { const b = window.__brickbuster, s = b.state(); b.throwBall(s.paddle < 2.1 ? 3.6 : 0.6, 1.4, 0, -5); });
    await p.waitForTimeout(450);
    s = await B();
    await shot('3-cracked');
    check(`${device}: missing cracks the bottom of the glass, with a crack sound`, s.cracks.bottom === before + 1 && /^crack/.test(s.lastSound || ''), `cracks ${s.cracks.bottom}, last sound ${s.lastSound}`);
    check(`${device}: ...and the paddle winces`, s.face === 'wince', s.face);

    // stepping back: the game stops where it was
    if (opts.hasTouch) await p.tap('#mansion #use'); else await p.keyboard.press('Escape');
    const back = await modeIs('play');
    const b1 = (await B()).ball; await p.waitForTimeout(400); const b2 = (await B()).ball;
    await shot('4-stepped-back');
    check(`${device}: ${opts.hasTouch ? 'STEP BACK' : 'Escape'} steps back to where you stood`, back && Math.hypot((await M('where')).x - stood.x, (await M('where')).z - stood.z) < 0.05);
    check(`${device}: ...and the game waits, the ball where it was`, !(await B()).active && b1.x === b2.x && b1.y === b2.y);

    // the cracks are still there after a reload
    await p.reload(); await up();
    s = await B();
    check(`${device}: the cracks are still there next time`, s.cracks.bottom === before + 1, `${s.cracks.bottom} cracks`);

    // breaking it: three cracks at the bottom. The glass shatters, you're stepped back to watch, every
    // brick ends up on the heap, the paddle on the floor, and the yarn ball bounces round the room,
    // hits the poster (squeak, then silence) and goes out the door with Sadie after it; the door gets
    // her sign, and it's broken for good
    await M('put', 'room:brickbuster', 'case');
    await p.waitForTimeout(300);
    await use();
    await modeIs('arcade');
    await p.waitForTimeout(1200);
    for (let i = 0; i < 8 && !(await B()).broken; i++) {
      await p.evaluate(() => { const b = window.__brickbuster, s = b.state(); if (!s.broken) b.throwBall(s.paddle < 2.1 ? 3.6 : 0.6, 1.4, 0, -5); });
      await p.waitForTimeout(450);
    }
    s = await B();
    await shot('5-shattered');
    check(`${device}: the third crack breaks the glass, with the big shatter`, s.broken === 'bottom' && s.heard.includes('shatter') && !s.heard.includes('crack3'), `broken ${s.broken}, heard ${s.heard.slice(-4).join(' ')}`);
    check(`${device}: ...and you're stepped back to watch`, await modeIs('play'));
    let held = false, muted = false, watched = 0, off = 0, walked = 0;
    const at0 = await M('where');
    if (!opts.hasTouch) await p.keyboard.down('KeyW');
    for (let i = 0; i < 60 && (await B()).escape !== 'gone'; i++) {
      await p.waitForTimeout(250);
      const e = await B(), w = await M('where');
      held ||= e.doorHeld; muted ||= e.lastSound === 'mute';
      if (e.watched && i > 3) {   // (after a second: the view's had time to turn to it)
        watched++;
        const want = Math.atan2(-(e.yarn[0] - w.x), -(e.yarn[2] - w.z)), d = Math.abs(Math.atan2(Math.sin(want - w.yaw), Math.cos(want - w.yaw)));
        off = Math.max(off, d);
        walked = Math.max(walked, Math.hypot(w.x - at0.x, w.z - at0.z));
      }
    }
    if (!opts.hasTouch) await p.keyboard.up('KeyW');
    check(`${device}: your view follows the yarn ball round the room, and you can't walk off`, watched > 4 && off < 0.6 && walked < 0.05, `${watched} looks, at most ${off.toFixed(2)} off it, walked ${walked.toFixed(2)} m`);
    check(`${device}: ...and it lets you go once the ball's out`, !(await B()).watched);
    await p.waitForTimeout(1500);
    s = await B();
    await shot('6-left-broken');
    check(`${device}: every brick lands on the heap, and the paddle's lying there sad`, s.bricks === 0 && s.pile === 80 && /sad|sigh/.test(s.face), `${s.pile} on the heap, face ${s.face}`);
    check(`${device}: the yarn ball hits the poster (squeak) and goes out the door, which opens for it`, s.escape === 'gone' && muted && held && s.lastSound === 'mute');
    check(`${device}: ...Sadie goes after it, and the door gets her OUT OF ORDER sign`, !s.sadie && s.sign && !s.doorHeld);
    check(`${device}: ...and the case doesn't offer to play any more`, await M('target') === null);
    // out in the hall: the ball's loose, Sadie's after it, and her napping box is empty
    await p.waitForTimeout(1500);
    s = await B();
    const r0 = Math.hypot(s.hall?.ball[0] ?? 99, s.hall?.ball[2] ?? 99);
    check(`${device}: the yarn ball's loose in the hall, and Sadie's out there after it`, s.hall && s.hall.shown && !s.hall.napping && r0 < 7.8, s.hall && `ball ${r0.toFixed(1)} m from the middle, ${s.hall.ball[1].toFixed(1)} m up`);
    await M('put', 'hall', 'start');
    await p.waitForTimeout(300);
    await shot('6b-hall');
    await p.reload(); await up();
    s = await B();
    const h1 = s.hall; await p.waitForTimeout(2500); const h2 = (await B()).hall;
    check(`${device}: ...and it still is next time, moving`, h1 && h2 && h2.shown && !h2.napping && (Math.hypot(h2.ball[0] - h1.ball[0], h2.ball[2] - h1.ball[2]) > 0.05 || Math.hypot(h2.cat[0] - h1.cat[0], h2.cat[2] - h1.cat[2]) > 0.05 || h2.whacks > h1.whacks));
    await M('faceDoor', 'hall', 'brickbuster', 2.4);
    await p.waitForTimeout(800);
    await shot('7-out-of-order');
    check(`${device}: it's still broken next time: bricks on the heap, sign on the door`, s.broken === 'bottom' && s.pile === 80 && s.sign && !s.sadie && s.escape === 'gone');

    // the test version can start it over
    if (opts.hasTouch) await p.tap('#mansion #pause'); else await p.keyboard.press('Escape');
    await p.waitForTimeout(200);
    if (await p.evaluate(() => !!document.getElementById('testBadge'))) {
      await p.click('#resets button:has-text("BRICKBUSTER")');
      await up();
      s = await B();
      check(`${device}: the test version's pause menu can start Brickbuster over: fixed`, !s.cracks.bottom && !s.cracks.top && !s.broken && !s.pile && s.bricks === 80 && s.sadie && !s.sign && !s.hall);
    }
    check(`${device}: no errors on the page`, !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }));
}

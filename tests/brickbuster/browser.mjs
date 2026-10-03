// Brickbuster '96 in a real (hidden) browser, as a phone and as a desktop: run by tools/check.mjs
// (never on its own) with the built page. It lives in the clubhouse, so these run whenever the clubhouse
// changes too.
//
// It walks through Brickbuster's door on the landing into its room, steps up to the case (the view
// eases back to fit it), moves the paddle with the keys and the mouse (a finger on the phone), sends
// the ball into the bottom of the glass to crack it (the crack sound, the paddle wincing), steps
// back (the game stops where it was), comes back after a reload to find the crack still there,
// breaks it (the shatter, the heap, the yarn ball's escape, the sign on the door), finds it still
// broken after a reload, and in the test version starts it over from the pause menu. Screenshots in dist/check/brickbuster/.
// Any error on the page is a failure.
import { bothDevices, pressPause } from '../shared/browser.mjs';

export default async function ({ browser, page, check, outDir }) {
  await bothDevices(browser, outDir, async ({ device, opts, ctx, p, errors, shot, M, up, walk, use, modeIs, until }) => {
    const B = () => p.evaluate(() => window.__brickbuster.state());
    // a finger sliding across the screen (dx pixels), or the mouse moving
    const slide = dx => p.evaluate(async dx => {
      const c = document.querySelector('#clubhouse #view'), y = innerHeight * 0.6, x0 = innerWidth / 2 - dx / 2;
      const ev = (type, x) => c.dispatchEvent(new PointerEvent(type, { pointerId: 9, pointerType: 'touch', clientX: x, clientY: y, bubbles: true }));
      ev('pointerdown', x0);
      for (let i = 1; i <= 10; i++) { ev('pointermove', x0 + dx * i / 10); await new Promise(ok => setTimeout(ok, 20)); }
      ev('pointerup', x0 + dx);
    }, dx);

    await p.goto(page);
    if (!await up()) { check(`${device}: the clubhouse opens`, false, errors[0]); await ctx.close(); return; }
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
    const { cracks: { bottom: before }, sounds: played0 } = await B();
    const since = s => s.heard.slice(-(s.sounds - played0) || s.heard.length);   // (the sounds since: the log keeps the last 200)
    await p.evaluate(() => { const b = window.__brickbuster, s = b.state(); b.throwBall(s.paddle < 2.1 ? 3.6 : 0.6, 1.4, 0, -5); });
    // (until it's cracked, however slow the computer: a set wait could end before, or long after)
    await until(n => window.__brickbuster.state().cracks.bottom > n, before, 8000);
    s = await B();
    await shot('3-cracked');
    check(`${device}: missing cracks the bottom of the glass, with a crack sound`, s.cracks.bottom === before + 1 && s.sounds > played0 && since(s).some(h => /^crack/.test(h)), `cracks ${s.cracks.bottom}, heard ${since(s).join(' ')}`);
    // (back on the paddle: left to itself, the ball is sent off again and, with nobody moving the
    // paddle, misses again before a slow computer has stepped back, and breaks the glass)
    await p.evaluate(() => window.__brickbuster.catchBall());

    // stepping back: the game stops where it was
    if (opts.hasTouch) await p.tap('#clubhouse #use'); else await p.keyboard.press('Escape');
    await modeIs('play');
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
    check(`${device}: ...and it lets you go once the ball's out`, await until(() => { const e = window.__brickbuster.state(); return e.escape === 'gone' && !e.watched; }, null, 30000));
    // (Sadie gone after it and the door shut behind her, or as long as that could take)
    await until(() => { const s = window.__brickbuster.state(); return !s.sadie && s.sign && !s.doorHeld; }, null, 15000);
    await p.waitForTimeout(300);
    s = await B();
    await shot('6-left-broken');
    check(`${device}: every brick lands on the heap, and the paddle's lying there sad`, s.bricks === 0 && s.pile === 80 && /sad|sigh/.test(s.face), `${s.pile} on the heap, face ${s.face}`);
    check(`${device}: ...and the case doesn't offer to play any more`, await M('target') === null);
    await p.reload(); await up();
    s = await B();
    check(`${device}: it's still broken next time: bricks on the heap, sign on the door`, s.broken === 'bottom' && s.pile === 80 && s.sign && !s.sadie && s.escape === 'gone');
    // put away when you're far off (the clubhouse does it after a while three doors away) and built
    // again as you come back: the yarn ball and Sadie leave the hall with it, and come back with it
    const gone = await p.evaluate(() => { const ok = window.__clubhouse.putAway('room:brickbuster'); return { ok, meshes: window.__clubhouse.built().includes('room:brickbuster') }; });
    await M('build', 'room:brickbuster');
    await p.waitForTimeout(300);
    s = await B();
    check(`${device}: put away and built again, it's still broken, with the ball and Sadie back in the hall`, gone.ok && !gone.meshes && s.broken === 'bottom' && s.pile === 80 && s.sign && s.hall?.shown && !s.hall.napping);

    // the pause menu can start it over (after asking)
    await pressPause(p, opts);
    await p.waitForTimeout(200);
    await p.click('#resets button:has-text("BRICKBUSTER")');
    await p.click('#sureYes');
    await up();
    s = await B();
    check(`${device}: the pause menu can start Brickbuster over: fixed`, !s.cracks.bottom && !s.cracks.top && !s.broken && !s.pile && s.bricks === 80 && s.sadie && !s.sign && !s.hall);
    check(`${device}: no errors on the page`, !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  });
}

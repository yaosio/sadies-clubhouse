// Sadie's Mini Golf in a real (hidden) browser, as a phone and as a desktop: run by tools/check.mjs
// (never on its own) with the built page. It's built into the mansion's backyard, so these run
// whenever the mansion changes too.
//
// It walks up to each tee and plays: a putt of its own (holding Space on the desktop; dragging back
// on the phone), the pause menu (the hole carries on after it), stepping back (the hole starts
// over), then Sadie's trick shot on every hole (all three pins in one, and in), with her replay of it
// after the hole watched to the end (all three pins and in again, and you're stepped back), and on
// the first hole the recorded way round, shot by shot: the score saved. Screenshots in dist/check/mini-golf/. Any error on the page fails.
import { bothDevices } from '../shared/browser.mjs';
import { HOLES } from '../../src/activities/mini-golf/holes/index.js';

const KEY = 'sadies-clubhouse.mini-golf.best';

export default async function ({ browser, page, check, outDir }) {
  await bothDevices(browser, outDir, async ({ device, opts, p, errors, shot, M, up, use, modeIs }) => {
    const G = (f, ...a) => p.evaluate(([f, a]) => window.__golf[f](...a), [f, a]);
    const hole = async i => (await G('holes'))[i];
    const waitFor = (i, test, ms = 40000) => p.waitForFunction(([i, test]) => new Function('h', 'return ' + test)(window.__golf.holes()[i]), [i, test], { timeout: ms }).then(() => true, () => false);
    await p.goto(page);
    if (!await up()) { check(`${device}: the mansion opens`, false, errors[0]); return; }
    await p.click('#ok');
    check(`${device}: the mini golf is built in the backyard`, await p.waitForFunction(() => window.__golf, null, { timeout: 10000 }).then(() => true, () => false));

    // the backyard, bigger now, with the three holes in it
    await M('put', 'outside', { x: 0, z: 11.6, yaw: Math.PI + 0.55, pitch: -0.25 });
    await p.waitForTimeout(500);
    await shot('1-backyard');
    await M('put', 'outside', { x: 2.5, z: 12, yaw: Math.atan2(-7.3, -6), pitch: -0.3 });
    await p.waitForTimeout(400);
    await shot('2-tail-hole');

    // up to the first tee, and play
    const tee = async i => { await M('put', 'outside', await G('stand', i)); await p.waitForTimeout(400); };
    const playHole = async i => { await tee(i); await use(); return modeIs('arcade'); };
    await tee(0);
    check(`${device}: at a tee, it offers to play the hole`, /HOLE 1/.test(await M('target') || ''), await M('target'));
    await use();
    check(`${device}: ...and playing it, the view drops in behind the ball`, await modeIs('arcade'));
    await p.waitForTimeout(600);
    await shot('3-tee');
    check(`${device}: ...with Sadie's tail and the strokes on the screen`, (await G('hud')).shown);

    // a putt of your own: hold Space and let go (the desktop), or drag back from the ball (the phone)
    if (opts.hasTouch) {
      const box = await p.locator('#mansion #view').boundingBox(), cx = box.x + box.width / 2, cy = box.y + box.height * 0.55;
      await p.mouse.move(cx, cy); await p.mouse.down();
      for (let k = 1; k <= 6; k++) { await p.mouse.move(cx, cy + k * 25); await p.waitForTimeout(30); }
      await shot('4-pulling-back');
      await p.mouse.up();
    } else {
      await p.keyboard.down('Space'); await p.waitForTimeout(500);
      await shot('4-pulling-back');
      await p.keyboard.up('Space');
    }
    let h = await hole(0);
    check(`${device}: pulling back and letting go putts the ball`, h.strokes === 1 && (h.ball.moving || h.phase !== 'aim'), JSON.stringify(h));
    await waitFor(0, "h.phase === 'aim' || h.phase === 'done'");
    // the pause menu: the hole carries on after it
    await p.click('#pause'); await p.waitForTimeout(400);
    await p.click('#resume'); await p.waitForTimeout(400);
    h = await hole(0);
    check(`${device}: ...and after the pause menu, the hole carries on where it was`, h.strokes >= 1 && h.active, JSON.stringify(h));
    // stepping back: the hole starts over
    if (opts.hasTouch) await p.tap('#mansion #use'); else await p.keyboard.press('Escape');
    await modeIs('play'); await p.waitForTimeout(300);
    h = await hole(0);
    check(`${device}: stepping back, the hole starts over (nothing kept but the best scores)`, h.phase === 'idle' && h.strokes === 0 && h.pins.every(Boolean), JSON.stringify(h));

    // Sadie's trick shot, on every hole: all three pins in one shot, and in
    for (const [i, hl] of HOLES.entries()) {
      check(`${device}: hole ${i + 1}: playing it`, await playHole(i));
      await p.waitForTimeout(300);
      const [a, power, clock] = hl.shots.trick[0];
      await G('shoot', i, a, power, clock);
      const sunk = await waitFor(i, 'h.sunk');
      h = await hole(i);
      check(`${device}: hole ${i + 1}: the trick shot BLASTS all three pins, and goes in`, sunk && h.strokes === 1 && h.pins.every(p => !p), JSON.stringify(h));
      if (i === 0) await shot('5-trick-shot');
      // then Sadie shows hers (the ball only): just what the checks replay, all three pins and in.
      // Once it's done you're stepped back, and the hole's as it was
      const replay = await waitFor(i, 'h.replay', 8000);
      if (i === 0) { await p.waitForTimeout(2500); await shot('7-sadies-replay'); }
      const back = await p.waitForFunction(() => window.__mansion.mode() === 'play', null, { timeout: 40000 }).then(() => true, () => false);
      h = await hole(i);
      check(`${device}: hole ${i + 1}: ...then Sadie's replay of it knocks all three pins and goes in, just as it should`, replay && h.sadie && h.sadie.blasts === 3 && h.sadie.sunk, JSON.stringify(h.sadie));
      check(`${device}: hole ${i + 1}: ...and once it's done you step back, and the hole's as it was`, back && h.phase === 'idle' && h.strokes === 0, JSON.stringify(h));
      await p.waitForTimeout(200);
    }
    const best = await p.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), KEY);
    check(`${device}: ...and the best scores are kept (holes in one, and the trick shot)`, best && HOLES.every(h => best.holes[h.id] === 1) && best.trick, JSON.stringify(best));

    // the first hole the long way round: the recorded shots, one at a time (each pin, then in)
    await playHole(0);
    await p.waitForTimeout(300);
    for (const [k, [a, power, clock]] of HOLES[0].shots.normal.entries()) {
      await G('shoot', 0, a, power, clock);
      await waitFor(0, `h.phase === 'aim' || h.phase === 'done' || h.phase === 'replay'`);
      if (k === 0) await shot('6-first-pin');
    }
    h = await hole(0);
    check(`${device}: the first hole's way round: a pin a shot, then in`, h.sunk && h.strokes === HOLES[0].shots.normal.length, JSON.stringify(h));
    // (stepping back straight away, without watching Sadie)
    if (opts.hasTouch) await p.tap('#mansion #use'); else await p.keyboard.press('Escape');
    await modeIs('play'); await p.waitForTimeout(300);
    const best2 = await p.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), KEY);
    check(`${device}: ...the hole in one still the best score kept`, best2?.holes?.doughnut === 1, JSON.stringify(best2));

    // the score board by the patio
    await M('put', 'outside', { x: -2.2, z: 13.8, yaw: Math.PI, pitch: 0.15 });
    await p.waitForTimeout(2500);
    await shot('8-score-board');
    check(`${device}: no errors on the page`, !errors.length, errors.slice(0, 3).join(' | '));
  });
}

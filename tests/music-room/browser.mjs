// The music room in a real (hidden) browser, as a phone and as a desktop: run by tools/check.mjs
// (never on its own) with the built page. It lives in the clubhouse, so these run whenever the clubhouse
// changes too.
//
// Fatal errors only (docs/clubhouse/checks/fatal-only.md). It walks through the music room's door on
// the landing, steps up to the toy piano (keys, and on a phone a tap), records a tune on the tape deck
// and plays it back, turns the volume dial, and reloads: the dial and the tape are kept. Screenshots
// in dist/check/music-room/. Any error on the page is a failure.
import { bothDevices } from '../shared/browser.mjs';

export default async function ({ browser, page, check, outDir }) {
  await bothDevices(browser, outDir, async ({ device, opts, ctx, p, errors, shot, M, up, walk, use, modeIs }) => {
    const R = () => p.evaluate(() => window.__musicRoom.state());
    const stepUpTo = async spot => { await M('put', 'room:music-room', spot); await p.waitForTimeout(250); await use(); const ok = await modeIs('arcade'); await p.waitForTimeout(300); return ok; };
    const stepBack = async () => { if (opts.hasTouch) await p.tap('#clubhouse #use'); else await p.keyboard.press('Escape'); return modeIs('play'); };
    // a finger (or the mouse) pressing the screen at (fx, fy) of the way across and down, for `ms`
    const press = (fx, fy, ms = 120) => p.evaluate(async ([fx, fy, ms, touch]) => {
      const c = document.querySelector('#clubhouse #view'), x = innerWidth * fx, y = innerHeight * fy;
      const ev = type => c.dispatchEvent(new PointerEvent(type, { pointerId: 7, pointerType: touch ? 'touch' : 'mouse', clientX: x, clientY: y, bubbles: true }));
      ev('pointerdown'); await new Promise(ok => setTimeout(ok, ms)); ev('pointerup');
    }, [fx, fy, ms, !!opts.hasTouch]);
    const played = async () => (await R()).sounds;

    await p.goto(page);
    if (!await up()) { check(`${device}: the clubhouse opens`, false, errors[0]); await ctx.close(); return; }
    await p.click('#ok');

    // through its door on the landing, into the room
    await M('faceDoor', 'hall', 'music-room', 3); await p.waitForTimeout(300);
    await shot('0-door');
    await M('faceDoor', 'hall', 'music-room', 1.3);
    await walk(1200);
    await shot('1-room');
    check(`${device}: the music room's door on the landing leads to it`, (await M('where')).place === 'room:music-room');

    // the toy piano
    await M('put', 'room:music-room', 'piano'); await p.waitForTimeout(250);
    check(`${device}: looking at the piano, it offers to play it`, /PIANO/.test(await M('target') || ''), await M('target'));
    check(`${device}: stepping up to the piano eases the view in`, await stepUpTo('piano'));
    await p.waitForTimeout(700);
    let a = await played();
    if (opts.hasTouch) {
      await press(0.5, 0.53, 200);
      check(`${device}: tapping the piano's keys plays them`, await played() > a, `${a} → ${await played()}`);
    } else {
      await p.keyboard.down('KeyD'); await p.waitForTimeout(150);
      const lit = (await R()).lit.piano;
      await shot('2-piano');
      await p.keyboard.up('KeyD');
      await p.keyboard.press('KeyA'); await p.keyboard.press('KeyW');
      check(`${device}: A to ; and the black keys (W E T...) play the piano`, await played() >= a + 3, `${a} → ${await played()}`);
      check(`${device}: ...the key being held lights up`, lit.includes(64), JSON.stringify(lit));
      check(`${device}: ...and W is a key, not a step back`, await M('mode') === 'arcade');
    }
    if (opts.hasTouch) await shot('2-piano');
    check(`${device}: stepping back from the piano`, await stepBack());

    // the tape deck: record a tune on the piano, and play it back
    if (!opts.hasTouch) {
      await stepUpTo('tape'); await p.waitForTimeout(700);
      await p.keyboard.press('KeyR');
      check(`${device}: R starts the tape recording`, (await R()).tape.state === 'rec');
      await stepBack(); await stepUpTo('piano'); await p.waitForTimeout(700);
      for (const k of ['KeyA', 'KeyS', 'KeyD']) { await p.keyboard.press(k); await p.waitForTimeout(120); }
      await stepBack(); await stepUpTo('tape'); await p.waitForTimeout(700);
      await p.keyboard.press('KeyS');
      check(`${device}: ...the three notes went on the tape`, (await R()).tape.mine === 3, JSON.stringify((await R()).tape));
      a = await played(); await p.keyboard.press('KeyP'); await p.waitForTimeout(1500);
      check(`${device}: P plays them back, once`, await played() >= a + 3 && (await R()).tape.state === 'idle');
      await shot('6-tape');
      await stepBack();
    } else {
      check(`${device}: stepping up to the tape deck`, await stepUpTo('tape'));
      await shot('6-tape');
      await stepBack();
    }

    // the volume dial
    await M('put', 'room:music-room', 'dial'); await p.waitForTimeout(250);
    check(`${device}: the volume dial can be turned`, /VOLUME/.test(await M('target') || ''), await M('target'));
    await use(); await p.waitForTimeout(100);
    check(`${device}: ...from MEDIUM to LOUD`, (await R()).volume === 'LOUD');

    // kept after a reload: the dial, and your tape just as it was
    const before = (await R()).tape;
    await p.reload(); await up();
    await M('put', 'room:music-room', 'door'); await p.waitForTimeout(200);
    const s = await R();
    check(`${device}: the volume and the tape are kept after a reload`, s.volume === 'LOUD' && s.tape.mine === before.mine,
      `${s.volume}, your tape ${s.tape.mine} notes (was ${before.mine})`);
    check(`${device}: no errors on the page`, !errors.length, errors[0]);
    await ctx.close();
  });
}

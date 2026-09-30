// The music room in a real (hidden) browser, as a phone and as a desktop: run by tools/check.mjs
// (never on its own) with the built page. It lives in the mansion, so these run whenever the mansion
// changes too.
//
// It walks through the music room's door on the landing, steps up to the toy piano (keys, and on a
// phone a tap), the drums, the KEYCAT 3000 (its sounds and its demo) and the theremin (only while
// it's held), records a tune on the tape deck and plays it back, turns the sign and the volume dial
// (both kept after a reload), walks under the wind chimes, and sends Sadie off: across the piano
// (her notes, and her walk kept on her tape), sulking next to it when the sign says SHH, and hopping
// straight off the xylophone when you step up to it. Screenshots in dist/check/music-room/. Any
// error on the page is a failure.
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
    const R = () => p.evaluate(() => window.__musicRoom.state());
    const up = () => p.waitForFunction(() => window.__mansion && window.__mansion.frames() > 10, null, { timeout: 15000 }).then(() => true, () => false);
    const walk = async ms => { await p.keyboard.down('KeyW'); await p.waitForTimeout(ms); await p.keyboard.up('KeyW'); await p.waitForTimeout(100); };
    const use = () => opts.hasTouch ? p.tap('#mansion #use') : p.keyboard.press('KeyE');
    const modeIs = m => p.waitForFunction(m => window.__mansion.mode() === m, m, { timeout: 5000 }).then(() => true, () => false);
    const stepUpTo = async spot => { await M('put', 'room:music-room', spot); await p.waitForTimeout(250); await use(); const ok = await modeIs('arcade'); await p.waitForTimeout(300); return ok; };
    const stepBack = async () => { if (opts.hasTouch) await p.tap('#mansion #use'); else await p.keyboard.press('Escape'); return modeIs('play'); };
    // a finger (or the mouse) pressing the screen at (fx, fy) of the way across and down, for `ms`
    const press = (fx, fy, ms = 120) => p.evaluate(async ([fx, fy, ms, touch]) => {
      const c = document.querySelector('#mansion #view'), x = innerWidth * fx, y = innerHeight * fy;
      const ev = type => c.dispatchEvent(new PointerEvent(type, { pointerId: 7, pointerType: touch ? 'touch' : 'mouse', clientX: x, clientY: y, bubbles: true }));
      ev('pointerdown'); await new Promise(ok => setTimeout(ok, ms)); ev('pointerup');
    }, [fx, fy, ms, !!opts.hasTouch]);
    const played = async () => (await R()).sounds;

    await p.goto(page);
    if (!await up()) { check(`${device}: the mansion opens`, false, errors[0]); await ctx.close(); return; }
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

    // the drums
    check(`${device}: stepping up to the drums`, await stepUpTo('drums'));
    await p.waitForTimeout(700);
    a = await played();
    if (opts.hasTouch) await press(0.5, 0.5); else { await p.keyboard.press('Space'); await p.keyboard.press('KeyS'); }
    await shot('3-drums');
    check(`${device}: the drums play`, await played() > a, `${a} → ${await played()}`);
    await stepBack();

    // the KEYCAT 3000: its sounds and its demo
    check(`${device}: stepping up to the KEYCAT 3000`, await stepUpTo('synth'));
    await p.waitForTimeout(700);
    if (!opts.hasTouch) {
      await p.keyboard.press('Digit2'); a = await played(); await p.keyboard.press('KeyG');
      const s = await R();
      check(`${device}: 2 picks the synth's BIRD sound, and it plays it`, s.voice === 'BIRD' && s.heard.at(-1) === 'synth-BIRD67', s.heard.at(-1));
      await p.keyboard.press('Digit0'); await p.waitForTimeout(1600);
      check(`${device}: its DEMO plays three notes, then says FULL VERSION 1997`, /FULL/.test((await R()).lcd) && await played() >= a + 4);
    }
    await shot('4-synth');
    await stepBack();

    // the theremin: only while it's held
    check(`${device}: stepping up to the theremin`, await stepUpTo('theremin'));
    await p.waitForTimeout(700);
    const held = p.evaluate(async touch => {
      const c = document.querySelector('#mansion #view'), ev = (type, x) => c.dispatchEvent(new PointerEvent(type, { pointerId: 8, pointerType: touch ? 'touch' : 'mouse', clientX: x, clientY: innerHeight * 0.45, bubbles: true }));
      ev('pointerdown', innerWidth * 0.3);
      for (let i = 0; i < 10; i++) { ev('pointermove', innerWidth * (0.3 + i * 0.04)); await new Promise(ok => setTimeout(ok, 40)); }
      const on = window.__musicRoom.state().theremin;
      ev('pointerup', innerWidth * 0.7);
      return on;
    }, !!opts.hasTouch);
    check(`${device}: the theremin sings while it's held, and stops when it's let go`, await held && !(await R()).theremin);
    await shot('5-theremin');
    await stepBack();

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

    // the sign: SHH, and Sadie only sulks by the piano, silently
    await M('put', 'room:music-room', 'sign'); await p.waitForTimeout(250);
    check(`${device}: the sign by the door can be turned`, /SIGN/.test(await M('target') || ''), await M('target'));
    await use(); await p.waitForTimeout(100);
    check(`${device}: ...to SHH, SADIE NAPPING`, (await R()).welcome === false);
    a = (await R()).heard.filter(h => h.startsWith('piano')).length;
    await p.evaluate(() => window.__musicRoom.sadieNow('piano')); await p.waitForTimeout(2500);
    let s = await R();
    check(`${device}: with the sign on SHH, Sadie only sits beside the piano, not a sound`, s.sadie.mode === 'sulk' && s.heard.filter(h => h.startsWith('piano')).length === a, s.sadie.mode);
    await use(); await p.waitForTimeout(100);
    check(`${device}: turned back to SADIE WELCOME`, (await R()).welcome === true);

    // Sadie walks across the piano (after she's back from sulking)
    await p.waitForFunction(() => window.__musicRoom.state().sadie.mode === 'cushion', null, { timeout: 25000 }).catch(() => {});
    await M('put', 'room:music-room', 'piano'); await M('turnTo', 0.35, -0.25);
    a = await played();
    await p.evaluate(() => window.__musicRoom.sadieNow('piano'));
    await p.waitForFunction(() => window.__musicRoom.state().sadie.mode === 'walk', null, { timeout: 5000 }).catch(() => {});
    await p.waitForTimeout(1800);
    await shot('7-sadie-on-the-piano');
    await p.waitForFunction(() => window.__musicRoom.state().sadie.mode === 'cushion', null, { timeout: 60000 }).catch(() => {});
    s = await R();
    check(`${device}: Sadie walks across the piano, a few notes, then goes back to her cushion`, s.sadie.mode === 'cushion' && s.sounds >= a + 4, `${s.sounds - a} notes, now ${s.sadie.mode}`);
    check(`${device}: ...and her walk is kept on her tape`, s.tape.sadie >= 4, String(s.tape.sadie));

    // she hops straight off the instrument you step up to
    await p.evaluate(() => window.__musicRoom.sadieNow('xylophone'));
    await p.waitForFunction(() => window.__musicRoom.state().sadie.mode === 'walk', null, { timeout: 5000 }).catch(() => {});
    await stepUpTo('xylophone');
    s = await R();
    check(`${device}: stepping up to the xylophone while she's on it, she hops off`, ['back', 'cushion'].includes(s.sadie.mode), s.sadie.mode);
    await stepBack();

    // the volume dial
    await M('put', 'room:music-room', 'dial'); await p.waitForTimeout(250);
    check(`${device}: the volume dial can be turned`, /VOLUME/.test(await M('target') || ''), await M('target'));
    await use(); await p.waitForTimeout(100);
    check(`${device}: ...from MEDIUM to LOUD`, (await R()).volume === 'LOUD');

    // the wind chimes: walking under them
    await M('put', 'room:music-room', 'chimes');
    await walk(450);
    s = await R();
    check(`${device}: walking under the wind chimes, they chime`, s.heard.some(h => h.startsWith('chime')), s.heard.slice(-3).join(' '));
    await shot('8-chimes');

    // kept after a reload: the dial, and the tape
    await p.reload(); await up();
    await M('put', 'room:music-room', 'door'); await p.waitForTimeout(200);
    s = await R();
    check(`${device}: the volume and the tape are kept after a reload`, s.volume === 'LOUD' && s.welcome === true && s.tape.sadie >= 4);
    check(`${device}: no errors on the page`, !errors.length, errors[0]);
    await ctx.close();
  }));
}

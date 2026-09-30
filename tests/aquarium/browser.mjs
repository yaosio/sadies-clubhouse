// The aquarium in a real (hidden) browser, as a phone and as a desktop: run by tools/check.mjs
// (never on its own) with the built page. It lives in the mansion, so these run whenever the mansion
// changes too.
//
// It finds the aquarium's door on the landing, walks through it into the room, stands at the glass
// (it offers to tap it: E, or the TAP GLASS button on a phone), taps it (Sadie glares, your view
// rises over the rim and dips in, the COMING SOON sign floats there) and comes back out to where it
// stood, able to walk again. Screenshots in dist/check/aquarium/. Any error on the page is a failure.
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
    const A = () => p.evaluate(() => window.__aquarium.state());
    const up = () => p.waitForFunction(() => window.__mansion && window.__mansion.frames() > 10, null, { timeout: 15000 }).then(() => true, () => false);
    const walk = async (ms, key = 'KeyW') => { await p.keyboard.down(key); await p.waitForTimeout(ms); await p.keyboard.up(key); await p.waitForTimeout(100); };
    const until = (fn, ms) => p.waitForFunction(fn, null, { timeout: ms }).then(() => true, () => false);

    await p.goto(page);
    if (!await up()) { check(`${device}: the mansion opens`, false, errors[0]); await ctx.close(); return; }
    await p.click('#ok');

    // its door on the landing, then through it into the room
    check(`${device}: the aquarium has a door on the landing`, await M('faceDoor', 'hall', 'aquarium', 2.6));
    await p.waitForTimeout(400);
    await shot('1-door');
    await M('faceDoor', 'hall', 'aquarium', 1.3);
    await walk(1200);
    check(`${device}: its door leads to the aquarium`, (await M('where')).place === 'room:aquarium');
    await M('put', 'room:aquarium', { x: -3.6, z: -4.8, yaw: Math.PI + 0.62, pitch: -0.12, y: 0 });
    await p.waitForTimeout(400);
    await shot('2-room');

    // at the glass it offers to tap it
    await M('put', 'room:aquarium', 'glass');
    await p.waitForTimeout(300);
    await shot('3-glass');
    const offer = await M('target');
    const button = opts.hasTouch ? await p.textContent('#mansion #use') : null;
    check(`${device}: at the glass, looking at it, it offers to tap it`, offer === 'TAP THE GLASS' && (!opts.hasTouch || button === 'TAP GLASS'), `${offer}${button ? ' / ' + button : ''}`);
    await M('put', 'room:aquarium', { x: 0, z: -2, yaw: 0, y: 0 });
    await p.waitForTimeout(200);
    check(`${device}: ...but not from the far end of the room, facing away`, !(await M('target')));

    // tap it: Sadie glares, your view rises and dips in, the sign, and back where you stood
    await M('put', 'room:aquarium', 'glass');
    await p.waitForTimeout(300);
    const stood = await M('where');
    if (opts.hasTouch) await p.tap('#mansion #use'); else await p.keyboard.press('KeyE');
    await p.waitForTimeout(500);
    let s = await A();
    await shot('4-tapped');
    check(`${device}: tapping the glass: Sadie glares, and your view starts to move`, s.taps === 1 && s.glaring && s.diving && (await M('mode')) === 'gliding');
    const signed = await until(() => window.__aquarium.state().sign, 7000);
    await p.waitForTimeout(500);
    await shot('5-underwater');
    check(`${device}: ...it dips into the water, where the COMING SOON sign floats`, signed);
    const back = await until(() => window.__mansion.mode() === 'play' && !window.__aquarium.state().diving, 9000);
    const at = await M('where');
    check(`${device}: ...and comes back out to where you stood`, back && Math.hypot(at.x - stood.x, at.z - stood.z) < 0.01, `${at.x.toFixed(2)}, ${at.z.toFixed(2)}`);
    await walk(500, 'KeyS');   // (backing away from the glass)
    const moved = await M('where');
    check(`${device}: ...and you can walk again`, Math.hypot(moved.x - at.x, moved.z - at.z) > 0.2);

    check(`${device}: no errors on the page`, !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }));
}

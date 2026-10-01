// The aquarium in a real (hidden) browser, as a phone and as a desktop: run by tools/check.mjs
// (never on its own) with the built page. It lives in the mansion, so these run whenever the mansion
// changes too.
//
// It finds the aquarium's door on the landing, walks through it into the room, stands at the glass
// (it offers to tap it: E, or the TAP GLASS button on a phone) and taps it: Sadie glares, your view
// rises over the rim and sinks to the sand, where the room is swapped for the ocean. It stops the
// dive right there and compares the picture just before the swap with the one just after (they must
// be the same), then comes up in the boat, sails, picks up the rubber duck, is kept out by the reef,
// and goes home (comparing that swap too), back where it stood, the duck in the cabinet; and the next
// trip comes up where the boat was left. Screenshots in dist/check/aquarium/. Any error on the page
// is a failure.
import { join } from 'node:path';
import { bothDevices } from '../shared/browser.mjs';

export default async function ({ browser, page, check, outDir }) {
  await bothDevices(browser, outDir, async ({ device, opts, ctx, p, errors, shot, M, up, walk }) => {
    const A = () => p.evaluate(() => window.__aquarium.state());
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

    // tap it: Sadie glares, your view rises and sinks to the sand
    await M('put', 'room:aquarium', 'glass');
    await p.waitForTimeout(300);
    const stood = await M('where');
    await p.evaluate(() => window.__aquarium.hold(true));
    if (opts.hasTouch) await p.tap('#mansion #use'); else await p.keyboard.press('KeyE');
    await p.waitForTimeout(500);
    let s = await A();
    await shot('4-tapped');
    check(`${device}: tapping the glass: Sadie glares, and your view starts to move`, s.taps === 1 && s.glaring && s.diving && (await M('mode')) === 'gliding');
    // the swap: the picture just before it and just after must be the same
    const canvas = p.locator('#mansion #view');
    const same = async (what) => {
      await until(() => window.__aquarium.state().held === 'before', 9000);
      await p.waitForTimeout(250);
      const a = await canvas.screenshot({ path: join(outDir, `${device}-${what}-before.png`) }), was = (await A()).where;
      await p.evaluate(() => window.__aquarium.go());
      await until(() => window.__aquarium.state().held === 'after', 3000);
      await p.waitForTimeout(250);
      const b = await canvas.screenshot({ path: join(outDir, `${device}-${what}-after.png`) }), now = (await A()).where;
      const diff = await p.evaluate(async ([a, b]) => {
        const load = src => new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.src = 'data:image/png;base64,' + src; });
        const [ia, ib] = await Promise.all([load(a), load(b)]), px = im => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0); return g.getImageData(0, 0, im.width, im.height).data; };
        const da = px(ia), db = px(ib); let n = 0;
        for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 24) n++;
        return n / (da.length / 4);
      }, [a.toString('base64'), b.toString('base64')]);
      await p.evaluate(() => window.__aquarium.hold(false));
      return { was, now, diff };
    };
    const inSwap = await same('5-swap-in');
    check(`${device}: ...down at the sand the room becomes the ocean, and nothing on the screen changes`, inSwap.was === 'room' && inSwap.now === 'sea' && inSwap.diff < 0.002, `${(inSwap.diff * 100).toFixed(2)}% of the picture changed`);
    const atSea = await until(() => window.__mansion.mode() === 'play' && !window.__aquarium.state().diving, 12000);
    await p.waitForTimeout(400);
    await shot('6-at-sea');
    s = await A();
    const home = await M('target'), homeButton = opts.hasTouch ? await p.textContent('#mansion #use') : null;
    check(`${device}: ...you come up in the boat, where it starts, with the sign and the button home`, atSea && s.where === 'sea' && Math.hypot(s.boatAt.x - 19, s.boatAt.z - 197) < 0.5 && s.sign === 'FINDS 0 OF 6' && home === 'BACK TO AQUARIUM' && (!opts.hasTouch || homeButton === 'GO HOME'), `${home} / ${s.sign}`);

    // sailing: quick
    const w0 = await A();
    await walk(2000);
    const w1 = await A();
    check(`${device}: ...the boat sails, and quickly`, Math.hypot(w1.boatAt.x - w0.boatAt.x, w1.boatAt.z - w0.boatAt.z) > 18, `${Math.hypot(w1.boatAt.x - w0.boatAt.x, w1.boatAt.z - w0.boatAt.z).toFixed(1)} m in 2 s`);

    // pull up by the rubber duck and pick it up
    const off = await p.evaluate(() => window.__aquarium.off());
    const sailTo = (x, z, yaw) => M('put', 'room:aquarium', { x: x + off.x, z: z + off.z, yaw, y: 4.1 });
    await sailTo(144, 101 + 13, 0);
    await p.waitForTimeout(400);
    await shot('7-duck');
    const pick = await M('target'), heard = (await A()).sounds;
    if (opts.hasTouch) await p.tap('#mansion #use'); else await p.keyboard.press('KeyE');
    await p.waitForTimeout(400);
    s = await A();
    check(`${device}: ...by the rubber duck it offers to pick it up; it's found, with a sound, and the sign says so`, pick === 'PICK UP THE RUBBER DUCK' && s.found.includes('duck') && s.sounds > heard && s.lastSound === 'find-duck' && s.sign === 'GOT THE RUBBER DUCK!', `${pick} / ${s.sign}`);

    // the reef keeps you away from the mountain
    await sailTo(0, 40, 0);
    await walk(1500);
    s = await A();
    await shot('8-reef');
    check(`${device}: ...the reef keeps you off the mountain, and the sign says why`, Math.hypot(s.boatAt.x, s.boatAt.z) > 31.5 && /REEF CLOSED/.test(s.sign), `${Math.hypot(s.boatAt.x, s.boatAt.z).toFixed(1)} m off / ${s.sign}`);

    // home: the same swap the other way, back where you stood, the duck in the cabinet
    await sailTo(-60, 120, 0.5);
    await p.waitForTimeout(300);
    await p.evaluate(() => window.__aquarium.hold(true));
    if (opts.hasTouch) await p.tap('#mansion #use'); else await p.keyboard.press('KeyE');
    const outSwap = await same('9-swap-home');
    check(`${device}: going home: down at the seabed the ocean becomes the tank again, and nothing on the screen changes`, outSwap.was === 'sea' && outSwap.now === 'room' && outSwap.diff < 0.002, `${(outSwap.diff * 100).toFixed(2)}% of the picture changed`);
    const back = await until(() => window.__mansion.mode() === 'play' && !window.__aquarium.state().diving, 12000);
    const at = await M('where');
    s = await A();
    check(`${device}: ...and comes back out where you stood, the boat's spot saved`, back && s.where === 'room' && Math.hypot(at.x - stood.x, at.z - stood.z) < 0.01 && Math.abs(at.y) < 0.01 && Math.hypot(s.boat.x + 60, s.boat.z - 120) < 0.5, `${at.x.toFixed(2)}, ${at.z.toFixed(2)}, y ${at.y.toFixed(2)}`);
    await walk(500, 'KeyS');   // (backing away from the glass)
    const moved = await M('where');
    check(`${device}: ...and you can walk again`, Math.hypot(moved.x - at.x, moved.z - at.z) > 0.2);
    await M('put', 'room:aquarium', 'cabinet');
    await p.waitForTimeout(400);
    await shot('10-cabinet');

    // the next trip comes up where the boat was left
    await M('put', 'room:aquarium', 'glass');
    await p.waitForTimeout(300);
    if (opts.hasTouch) await p.tap('#mansion #use'); else await p.keyboard.press('KeyE');
    const again = await until(() => window.__mansion.mode() === 'play' && window.__aquarium.state().where === 'sea', 15000);
    s = await A();
    check(`${device}: the next trip comes up where you left the boat`, again && Math.hypot(s.boatAt.x + 60, s.boatAt.z - 120) < 0.5 && s.found.includes('duck'));

    check(`${device}: no errors on the page`, !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  });
}

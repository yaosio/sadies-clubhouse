// The aquarium in a real (hidden) browser, as a phone and as a desktop: run by tools/check.mjs
// (never on its own) with the built page. It lives in the clubhouse, so these run whenever the clubhouse
// changes too.
//
// It finds the aquarium's door on the landing, walks into the room, stands at the glass (it offers to
// tap it: E, or the TAP GLASS button on a phone) and taps it: your view sinks to the sand, where the
// room is swapped for the ocean, and you come up in the boat. It picks up the rubber duck, goes home
// (back where it stood, and it can walk again), and the next trip comes up where the boat was left; a
// reload out at sea keeps the boat. Fatal errors only: the picture matching across the swap, the reef
// and the boat's speed were dropped (docs/clubhouse/checks/fatal-only.md). Screenshots in
// dist/check/aquarium/. Any error on the page is a failure.
import { bothDevices, pressUse } from '../shared/browser.mjs';

export default async function ({ browser, page, check, outDir }) {
  await bothDevices(browser, outDir, async ({ device, opts, ctx, p, errors, shot, M, up, walk, until: untilGame }) => {
    const A = () => p.evaluate(() => window.__aquarium.state());
    const until = (fn, ms) => untilGame(fn, null, ms);   // (in the game's time)

    await p.goto(page);
    if (!await up()) { check(`${device}: the clubhouse opens`, false, errors[0]); await ctx.close(); return; }
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
    const button = opts.hasTouch ? await p.textContent('#clubhouse #use') : null;
    check(`${device}: at the glass, looking at it, it offers to tap it`, offer === 'TAP THE GLASS' && (!opts.hasTouch || button === 'TAP GLASS'), `${offer}${button ? ' / ' + button : ''}`);

    // tap it: Sadie glares, your view rises and sinks to the sand
    await M('put', 'room:aquarium', 'glass');
    await p.waitForTimeout(300);
    const stood = await M('where');
    await p.evaluate(() => window.__aquarium.hold(true));
    await pressUse(p, opts);
    await p.waitForTimeout(500);
    let s = await A();
    await shot('4-tapped');
    check(`${device}: tapping the glass: Sadie glares, and your view starts to move`, s.taps === 1 && s.glaring && s.diving && (await M('mode')) === 'gliding');
    // down at the sand the room becomes the ocean (the picture matching across the swap is a looks check, dropped: fatal-only)
    await until(() => window.__aquarium.state().held === 'before', 9000);
    await p.evaluate(() => window.__aquarium.go());
    await until(() => window.__aquarium.state().held === 'after', 3000);
    await p.evaluate(() => window.__aquarium.hold(false));
    const atSea = await until(() => window.__clubhouse.mode() === 'play' && !window.__aquarium.state().diving, 12000);
    await p.waitForTimeout(400);
    await shot('6-at-sea');
    s = await A();
    const home = await M('target'), homeButton = opts.hasTouch ? await p.textContent('#clubhouse #use') : null;
    check(`${device}: ...you come up in the boat, where it starts, with the sign and the button home`, atSea && s.where === 'sea' && Math.hypot(s.boatAt.x - 19, s.boatAt.z - 197) < 0.5 && s.sign === 'FINDS 0 OF 6' && home === 'BACK TO AQUARIUM' && (!opts.hasTouch || homeButton === 'GO HOME'), `${home} / ${s.sign}`);

    // pull up by the rubber duck and pick it up
    const off = await p.evaluate(() => window.__aquarium.off());
    const sailTo = (x, z, yaw) => M('put', 'room:aquarium', { x: x + off.x, z: z + off.z, yaw, y: 4.1 });
    await sailTo(144, 101 + 13, 0);
    await p.waitForTimeout(400);
    await shot('7-duck');
    const pick = await M('target'), heard = (await A()).sounds;
    await pressUse(p, opts);
    await p.waitForTimeout(400);
    s = await A();
    check(`${device}: ...by the rubber duck it offers to pick it up; it's found, with a sound, and the sign says so`, pick === 'PICK UP THE RUBBER DUCK' && s.found.includes('duck') && s.sounds > heard && s.lastSound === 'find-duck' && s.sign === 'GOT THE RUBBER DUCK!', `${pick} / ${s.sign}`);

    // home: the same swap the other way, back where you stood, the duck in the cabinet
    await sailTo(-60, 120, 0.5);
    await p.waitForTimeout(300);
    await pressUse(p, opts);
    const back = await until(() => window.__clubhouse.mode() === 'play' && !window.__aquarium.state().diving, 12000);
    const at = await M('where');
    s = await A();
    check(`${device}: ...and comes back out where you stood, the boat's spot saved`, back && s.where === 'room' && Math.hypot(at.x - stood.x, at.z - stood.z) < 0.01 && Math.abs(at.y) < 0.01 && Math.hypot(s.boat.x + 60, s.boat.z - 120) < 0.5, `${at.x.toFixed(2)}, ${at.z.toFixed(2)}, y ${at.y.toFixed(2)}`);
    await walk(500, 'KeyS');   // (backing away from the glass)
    const moved = await M('where');
    check(`${device}: ...and you can walk again`, Math.hypot(moved.x - at.x, moved.z - at.z) > 0.2);

    // the next trip comes up where the boat was left
    await M('put', 'room:aquarium', 'glass');
    await p.waitForTimeout(300);
    await pressUse(p, opts);
    const again = await until(() => window.__clubhouse.mode() === 'play' && window.__aquarium.state().where === 'sea', 15000);
    s = await A();
    check(`${device}: the next trip comes up where you left the boat`, again && Math.hypot(s.boatAt.x + 60, s.boatAt.z - 120) < 0.5 && s.found.includes('duck'));

    // sail a little, then reload while still at sea: the boat is where it was, not where it was last left
    await walk(1500);
    const sailed = (await A()).boatAt;
    await p.reload(); await up();
    await M('put', 'room:aquarium', 'glass'); await p.waitForTimeout(400);
    s = await A();
    check(`${device}: a reload out at sea keeps the boat where it was`, Math.hypot(s.boat.x - sailed.x, s.boat.z - sailed.z) < 1 && Math.hypot(sailed.x + 60, sailed.z - 120) > 5, `saved ${s.boat.x.toFixed(1)}, ${s.boat.z.toFixed(1)}; was ${sailed.x.toFixed(1)}, ${sailed.z.toFixed(1)}`);

    check(`${device}: no errors on the page`, !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  });
}

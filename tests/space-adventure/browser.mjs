// Space Adventure in a real (hidden) browser, as a phone and as a desktop: run by tools/check.mjs
// (never on its own) with the built page. It lives in the clubhouse, so these run whenever the clubhouse
// changes too.
//
// It finds the sixth door on the landing, goes through it into the cockpit, and walks in: it's
// strapped into the seat (it can't walk off), Sadie hops up and starts talking, the music starts;
// pausing stops the trip; then it runs the trip quickly (the checks' fast-forward) through the
// clouds, where space is swapped for the land, down onto the beach, and to the black. When the black
// clears it's standing in Sadie's space room, free to walk, the radio playing, Sadie saying she loves
// space; the big red button takes it on the trip again; and coming back later the door opens onto
// the space room. Screenshots in dist/check/space-adventure/. Any error on the page is a failure.
import { bothDevices, pressUse } from '../shared/browser.mjs';

export default async function ({ browser, page, check, outDir }) {
  await bothDevices(browser, outDir, async ({ device, opts, ctx, p, errors, shot, M, up, walk, until: untilGame }) => {
    const S = () => p.evaluate(() => window.__space.state());
    const until = (fn, ms, arg) => untilGame(fn, arg, ms);   // (in the game's time)
    const ROOM = 'room:space-adventure';

    await p.goto(page);
    if (!await up()) { check(`${device}: the clubhouse opens`, false, errors[0]); await ctx.close(); return; }
    await p.click('#ok');

    // its door on the landing, and through it: the cockpit
    check(`${device}: Space Adventure has a door on the landing`, await M('faceDoor', 'hall', 'space-adventure', 2.6));
    await p.waitForTimeout(500);
    await shot('1-door');
    check(`${device}: through the open door, the cockpit`, (await M('looking')) === ROOM && (await S()).stage === 'cockpit');
    await M('faceDoor', 'hall', 'space-adventure', 1.3);
    await walk(650);
    let s = await S();
    check(`${device}: its door leads into the cockpit, and nothing's started yet`, (await M('where')).place === ROOM && s.stage === 'cockpit' && s.t === null && !s.watching);
    await p.waitForTimeout(300);
    await shot('2-cockpit');

    // walk in: strapped into the seat
    await walk(1400);
    s = await S();
    check(`${device}: walking in starts the trip and straps you in`, s.t !== null && s.watching, JSON.stringify(s));
    await p.waitForTimeout(1600);
    await walk(600);   // (trying to get up)
    const seat = await M('where');
    check(`${device}: ...in the pilot's seat, and you can't walk off`, Math.abs(seat.x) < 0.05 && Math.abs(seat.z - 0.45) < 0.1 && Math.abs(seat.yaw - Math.PI) < 0.05, `${seat.x.toFixed(2)}, ${seat.z.toFixed(2)}`);
    await p.waitForTimeout(1200);
    await shot('3-trip');

    // pausing stops the trip where it is
    await p.click('#clubhouse #pause');
    const t0 = (await S()).t; await p.waitForTimeout(700); const t1 = (await S()).t;
    check(`${device}: pausing stops the trip`, t0 === t1 && await p.isVisible('#clubhouse #menu'));
    await p.click('#clubhouse #resume');

    // the rest of it, quickly: the clouds, the land, the black
    await p.evaluate(() => window.__space.warp(12));
    check(`${device}: into the clouds, space is swapped for the land`, await until(() => window.__space.state().swapped, 20000));
    s = await S();
    check(`${device}: ...space gone, the land there instead`, s.land && !s.space);
    await p.evaluate(() => window.__space.warp(1));
    await p.evaluate(() => window.__space.jump(92.5));
    await p.waitForTimeout(700);
    s = await S();
    await shot('4-landed');
    await p.evaluate(() => window.__space.jump(106.9));
    check(`${device}: she flies at you, and it goes black`, await until(() => { const b = document.getElementById('saBlack'); return b && !b.hidden && Number(b.style.opacity) > 0.95; }, 3000));
    await shot('5-black');
    check(`${device}: the black clears in her space room, and you can walk again`, await until(() => { const s = window.__space.state(); return s.stage === 'hangout' && !s.watching && s.t === null; }, 6000));
    s = await S();
    check(`${device}: the trip is done and remembered`, s.done);
    const at = await M('where');
    check(`${device}: ...and you're standing just inside the door`, at.place === ROOM && Math.abs(at.z - (-2.2)) < 0.2);
    await p.waitForTimeout(400);
    await shot('6-space-room');
    await walk(500);
    check(`${device}: you can walk about in it`, Math.abs((await M('where')).z - at.z) > 0.3 || Math.abs((await M('where')).x - at.x) > 0.3);

    // the big red button: the trip again
    await M('put', ROOM, 'button');
    await p.waitForTimeout(300);
    const offer = await M('target');
    check(`${device}: at the big red button, it offers to press it`, offer === 'PRESS THE BIG RED BUTTON', offer);
    await shot('7-button');
    await pressUse(p, opts);
    check(`${device}: pressing it takes you on the trip again`, await until(() => { const s = window.__space.state(); return s.stage === 'cockpit' && s.t > 0 && s.watching && !s.radio; }, 4000));

    // coming back later, the door opens onto her space room
    await p.reload();
    if (await up()) {
      await M('faceDoor', 'hall', 'space-adventure', 2.6);
      await p.waitForTimeout(400);
      check(`${device}: after the trip, the door opens onto her space room`, (await S()).stage === 'hangout' && (await M('looking')) === ROOM);
      await shot('8-door-after');
    }
    check(`${device}: no errors on the page`, errors.length === 0, errors[0]);
    await ctx.close();
  });
}

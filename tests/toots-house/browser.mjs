// Toots' House in a real (hidden) browser, as a phone and as a desktop: run by tools/check.mjs (never on
// its own) with the built page. It's built into the clubhouse (outside the gate), so these run whenever
// the clubhouse changes too.
//
// It walks out across the town square to her house (she's in the upstairs window) and in through the
// door, takes a ball from the basket (E, or the USE button on a phone), throws it across the room, and
// waits for Toots to bring it back. Then a look at her friends' pictures, and upstairs. Screenshots in
// dist/check/toots-house/. Any error on the page is a failure.
import { bothDevices } from '../shared/browser.mjs';

const ROOM = 'room:toots-house';

export default async function ({ browser, page, check, outDir }) {
  await bothDevices(browser, outDir, async ({ device, p, errors, shot, M, up, walk, use, until }) => {
    const S = () => p.evaluate(() => window.__toots.state());
    const face = async (x, z, tx, ty, tz, y = 0) => {
      const dx = tx - x, dz = tz - z;
      await M('put', ROOM, { x, z, y, yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(ty - y - 1.6, Math.hypot(dx, dz)) });
      await p.waitForTimeout(250);
    };

    await p.goto(page);
    if (!await up()) { check(`${device}: the clubhouse opens`, false, errors[0]); return; }
    await p.click('#ok');

    // out of the gate, across the square, and in
    check(`${device}: Toots' house is on the town square, with its door`, await M('faceDoor', 'outside', 'toots-house', 6));
    await p.waitForTimeout(700);
    await shot('1-house');
    await walk(900); await p.waitForTimeout(500);
    check(`${device}: ...which opens onto her house`, await M('looking') === ROOM);
    await walk(1400);
    check(`${device}: walking through it, you're inside`, (await M('where')).place === ROOM);
    await p.waitForTimeout(400);
    await shot('2-inside');

    // a ball from the basket by the door
    await face(2.65, 3.6, 2.65, 0.45, 5.25);
    check(`${device}: looking at the basket, it offers a ball`, await M('target') === 'TAKE A BALL', await M('target'));
    await use(); await p.waitForTimeout(200);
    check(`${device}: ...and taking one, you're holding it`, (await S()).ball.held === 'you');
    // thrown across the room
    await face(2.65, 3.6, 6.5, 1.8, -3);
    check(`${device}: holding it, you can throw it`, await M('target') === 'THROW THE BALL', await M('target'));
    await use(); await p.waitForTimeout(400);
    check(`${device}: ...it flies, and Toots is after it`, !(await S()).ball.held && (await S()).toots.mode === 'chase', JSON.stringify(await S()));
    check(`${device}: ...and she brings it back`, await until(() => window.__toots.state().toots.fetched > 0, null, 30000), JSON.stringify(await S()));
    await shot('3-fetched');

    // her friends' pictures, then upstairs: her window seat, and the beds with Sadie asleep
    await M('put', ROOM, 'pictures'); await p.waitForTimeout(400);
    await shot('4-pictures');
    await M('put', ROOM, 'upstairs'); await p.waitForTimeout(400);
    await shot('5-upstairs');
    await M('put', ROOM, 'beds'); await p.waitForTimeout(400);
    await shot('6-beds');
    check(`${device}: no errors on the page`, !errors.length, errors.slice(0, 3).join(' | '));
  });
}

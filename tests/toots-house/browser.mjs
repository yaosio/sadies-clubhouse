// Toots' House in a real (hidden) browser, as a phone and as a desktop: run by tools/check.mjs (never on
// its own) with the built page. It's built into the clubhouse (outside the gate), so these run whenever
// the clubhouse changes too.
//
// It walks out across the town square to her house (she's in the upstairs window) and in through the
// door (she roos as it opens), takes a ball from the basket (E, or the USE button on a phone), throws it across the room, and
// waits for Toots to bring it back. On the way in, she's left her window and is waiting by the door,
// and her music plays inside. Then a look at her friends' pictures, and upstairs. Screenshots in
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
    check(`${device}: ...and at her door, she's left the window to meet you (only one Toots)`, await until(() => window.__toots.state().where === 'door', null, 8000), JSON.stringify(await S()));
    await walk(1400);
    check(`${device}: walking through it, you're inside`, (await M('where')).place === ROOM);
    let s = await S();
    check(`${device}: ...and she's there by the door`, s.tootsShown && s.toots.z > 1.5, JSON.stringify(s.toots));
    check(`${device}: ...her music plays in here`, s.music.playing, JSON.stringify(s.music));
    check(`${device}: ...and she rooed as her door opened`, s.heard.some(k => k.startsWith('roo')), JSON.stringify(s.heard));
    check(`${device}: ...and the town's out there, all round (pictures of it)`, s.views.sky, JSON.stringify(s.views));
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
    await M('put', ROOM, 'tv'); await p.waitForTimeout(400);
    await shot('7-tv');
    await M('put', ROOM, 'stairsSide'); await p.waitForTimeout(400);
    await shot('8-stairs');
    // her backyard outside, from round the side: the fence, and her tree over it
    const L = { x: 14.13, z: -39.51, yaw: -1.0821 }, c = Math.cos(L.yaw), sn = Math.sin(L.yaw);
    const at = (lx, lz) => ({ x: L.x + c * lx + sn * lz, z: L.z - sn * lx + c * lz });
    const from = at(11, -3), to = at(0, -8.5);
    await M('put', 'outside', { ...from, y: 0, yaw: Math.atan2(-(to.x - from.x), -(to.z - from.z)), pitch: 0.12 }); await p.waitForTimeout(500);
    await shot('9-backyard');
    check(`${device}: no errors on the page`, !errors.length, errors.slice(0, 3).join(' | '));
  });
}

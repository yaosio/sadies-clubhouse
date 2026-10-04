// Marbles' Cut & Curl in a real (hidden) browser, as a phone and as a desktop: run by tools/check.mjs
// (never on its own) with the built page. It's built into the clubhouse (outside the gate), so these
// run whenever the clubhouse changes too.
//
// It walks out across the town square to the shop and in through its door, looks at a wig head and picks it
// (E, or the USE button on a phone), asks Marbles to pick, puts on the pop star outfit and pulls the
// rope, and waits for the whole show (Sadie hops up, sings, hops back) to end with her back in her chair.
// Screenshots in dist/check/barbershop/. Any error on the page is a failure.
import { bothDevices } from '../shared/browser.mjs';

const ROOM = 'room:barbershop';

export default async function ({ browser, page, check, outDir }) {
  await bothDevices(browser, outDir, async ({ device, p, errors, shot, M, up, walk, use, until }) => {
    const B = (fn, ...a) => p.evaluate(([f, a]) => window.__barbershop[f](...a), [fn, a]);
    const S = () => B('state');
    const face = async (x, z, tx, ty, tz) => {
      const dx = tx - x, dz = tz - z;
      await M('put', ROOM, { x, z, y: 0, yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(ty - 1.6, Math.hypot(dx, dz)) });
      await p.waitForTimeout(250);
    };

    await p.goto(page);
    if (!await up()) { check(`${device}: the clubhouse opens`, false, errors[0]); return; }
    await p.click('#ok');

    // out of the gate, across the square, and in
    check(`${device}: the barbershop is on the town square, with its door`, await M('faceDoor', 'outside', 'barbershop', 3));
    await walk(250); await p.waitForTimeout(700);
    await shot('1-shop');
    check(`${device}: ...which opens onto the shop`, await M('looking') === ROOM);
    await walk(1400);
    check(`${device}: walking through it, you're in the shop`, (await M('where')).place === ROOM);
    await p.waitForTimeout(400);
    await shot('2-inside');

    // a wig head: the third (pink mohawk)
    await face(-2.6, -2.0, -4.7, 1.55, -2.0);
    check(`${device}: looking at a wig head, it offers it`, await M('target') === 'HAIR: PINK MOHAWK', await M('target'));
    await use(); await p.waitForTimeout(200);
    let s = await S();
    check(`${device}: ...and using it, Sadie has the pink mohawk (snip)`, s.pick.hair === 2 && s.heard.includes('snip'), JSON.stringify(s.pick));
    await face(-1.3, -0.6, -1.4, 0.9, -2.6); await shot('3-chair');

    // Marbles picks everything
    await B('pickForMe');
    s = await S();
    check(`${device}: asking Marbles picks something for each (never the plain ones)`, s.pick.hair > 0 && s.pick.tail > 0 && s.pick.outfit > 0, JSON.stringify(s.pick));

    // the pop star show, from the rope
    await B('choose', 'outfit', 1);
    await face(0.9, -0.1, 1.45, 1.4, -1.2);
    check(`${device}: looking at the rope, it offers the show`, await M('target') === 'PULL THE ROPE', await M('target'));
    await use(); await p.waitForTimeout(300);
    s = await S();
    check(`${device}: pulling it starts the pop star's show`, s.show === 'sing', JSON.stringify(s));
    await until(() => window.__barbershop.state().showT > 3, null, 20000);
    await shot('4-show');
    check(`${device}: ...she sings (the meow song)`, (await S()).heard.includes('song'));
    check(`${device}: ...and it ends, with Sadie back in her chair`, await until(() => !window.__barbershop.state().show, null, 30000) && (await S()).sadieShown);
    await shot('5-after');

    check(`${device}: no errors on the page`, !errors.length, errors.slice(0, 3).join(' | '));
  });
}

// The hedge maze in a real (hidden) browser, as a phone and as a desktop: run by tools/check.mjs
// (never on its own) with the built page. It's built into the clubhouse, so these run whenever the
// clubhouse changes too.
//
// It finds the hedge block beside the house, sees the maze through its front gate, walks in, finds its way through, turning corner
// after corner (5 to 8, then the corner onto the end), and out of the end into the backyard. Turning
// round, the gate it came out of shows the maze, and walking back in, you come in where you came out
// (a second walk through the new maze was dropped: fatal-only). And you can walk round the side of
// the house to the backyard without the maze. Screenshots in dist/check/hedge-maze/. Any error on
// the page is a failure.
import { bothDevices } from '../shared/browser.mjs';

const ROOM = 'room:hedge-maze';

export default async function ({ browser, page, check, outDir }) {
  await bothDevices(browser, outDir, async ({ device, p, errors, shot, M, up, walk }) => {
    const Z = () => p.evaluate(() => window.__maze.state());
    await p.goto(page);
    if (!await up()) { check(`${device}: the clubhouse opens`, false, errors[0]); return; }
    await p.click('#ok');

    // the hedge block outside, its front gate opening onto the maze
    check(`${device}: the hedge maze has a gate beside the house`, await M('faceDoor', 'outside', 'hedge-maze', 3));
    await walk(250);
    await p.waitForTimeout(700);
    await shot('1-gate');
    check(`${device}: ...which opens onto the maze`, await M('looking') === ROOM);
    await walk(1400);
    let z = await Z();
    check(`${device}: walking through it, you're in the maze`, (await M('where')).place === ROOM && z.inside);
    await p.waitForTimeout(1500);
    await shot('2-inside');

    // finding the way through: a step at a time towards the next cell on the way, through the end's gate
    async function through() {
      let corners = 0, dir = null, out = false;
      for (let n = 0; n < 900 && !out; n++) {
        const w = await M('where');
        if (w.place !== ROOM) { out = true; break; }
        const a = await p.evaluate(([x, z]) => window.__maze.ahead(x, z), [w.x, w.z]);
        if (!a) return { corners, out, lost: true };
        const dx = a.x - w.x, dz = a.z - w.z, d = Math.hypot(dx, dz);
        const way = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'e' : 'w') : (dz > 0 ? 'n' : 's');
        if (d > 0.8 && way !== dir) { if (dir) corners++; dir = way; }
        await M('turnTo', Math.atan2(-dx, -dz));
        if (a.gate && d < 3) { await p.waitForTimeout(500); await M('step', 0.3); }
        else await M('step', Math.min(0.5, Math.max(0.05, d - 0.05)));
      }
      return { corners: corners - 0, out };
    }
    const first = await through();
    z = await Z();
    const outThere = await M('where');
    await p.waitForTimeout(400);
    await shot('3-backyard');
    check(`${device}: finding the way through, the end lets you out into the backyard`, first.out && outThere.place === 'outside' && outThere.z > 9, JSON.stringify({ ...first, at: outThere }));
    check(`${device}: ...after 5 to 8 corners, then the corner onto the end`, first.corners >= 6 && first.corners <= 9, `${first.corners} corners`);

    // turning round: the gate you came out of still shows that bit of maze, and in you go again
    const exitKey = z.doors.back;
    await M('faceDoor', 'outside', 'hedge-maze.back', 2.5);
    await walk(250); await p.waitForTimeout(700);
    await shot('4-back-gate');
    check(`${device}: turning round, the gate you came out of opens onto the maze`, await M('looking') === ROOM);
    await walk(1400);
    z = await Z();
    check(`${device}: ...and walking back in, you come in where you came out`, (await M('where')).place === ROOM && z.inside && z.doors.back === exitKey);
    // (the way through is done once: a second, different maze is a pleasure, not something that can trap you)

    // the backyard's also just round the side of the house
    await M('put', 'outside', { x: -12, z: -6, yaw: Math.PI, pitch: 0 });
    for (let n = 0; n < 50; n++) await M('step', 0.5);
    const round = await M('where');
    await shot('5-round-the-side');
    check(`${device}: you can walk round the side of the house into the backyard`, round.place === 'outside' && round.z > 15, `got to z ${round.z.toFixed(1)}`);
    check(`${device}: no errors on the page`, !errors.length, errors.slice(0, 3).join(' | '));
  });
}

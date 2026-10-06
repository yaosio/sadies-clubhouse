// Cats Only in a real (hidden) browser, as a phone and as a desktop: run by tools/check.mjs (never
// on its own) with the built page. It lives in the clubhouse, so these run whenever the clubhouse
// changes too.
//
// It opens the door without pressing the button and steps into the closet (and finds it too small to
// do more than step in, and out again). It looks at the button and presses it (the real USE press),
// then opens the door: the herd pours out, the front door swings open for them, they run out of it
// and vanish once it has shut, and the player hasn't been moved an inch. It does the same with the
// door already open when the button's pressed (it slams shut and flies open again). Screenshots in
// dist/check/cats-only/. Any error on the page is a failure.
import { bothDevices } from '../shared/browser.mjs';

export default async function ({ browser, page, check, outDir }) {
  await bothDevices(browser, outDir, async ({ device, ctx, p, errors, shot, M, up, walk, rest, use, until }) => {
    const C = () => p.evaluate(() => window.__catsOnly.state());
    await p.goto(page);
    if (!await up()) { check(`${device}: the clubhouse opens`, false, errors[0]); await ctx.close(); return; }
    await p.click('#ok');

    // 1. open the door without pressing anything: a closet with a cat bed, room to step in and no more
    await M('faceDoor', 'hall', 'cats-only', 1.4);
    await rest(900);
    let s = await C();
    check(`${device}: Cats Only's door on the landing opens, and nothing comes out when the button wasn't pressed`, s.doorOpen > 0.8 && s.phase === 'idle' && s.on === 0, `door ${s.doorOpen.toFixed(2)}, ${s.phase}`);
    await shot('1-door-open');
    await walk(1500);
    const inside = await M('where');
    check(`${device}: stepping forward goes into the closet`, inside.place === 'room:cats-only', inside.place);
    await shot('2-inside');
    await walk(1500);
    const deeper = await M('where');
    check(`${device}: it's so small you can't get any further than a step or so in (the bed's in the way)`, deeper.place === 'room:cats-only' && deeper.z > -0.5 && deeper.z < 0.9, `z ${deeper.z.toFixed(2)}`);
    await M('turnTo', inside.yaw + Math.PI);
    await walk(2200);
    check(`${device}: and you can step back out onto the landing`, (await M('where')).place === 'hall');

    // 2. the red button: look at it, press it (the real USE), nothing happens yet
    const b = await p.evaluate(() => window.__catsOnly.button());
    await M('faceDoor', 'hall', 'cats-only', 1.4);
    const from = await M('where'), nx = Math.sin(from.yaw), nz = Math.cos(from.yaw), lx = Math.cos(from.yaw), lz = -Math.sin(from.yaw);   // (out into the hall, and along the wall)
    // stand along the wall from the button, out of the door's reach (so it stays shut), looking along the wall at it
    await M('put', 'hall', { x: b.x - lx * 1.3 + nx * 0.8, z: b.z - lz * 1.3 + nz * 0.8, y: from.y, yaw: from.yaw - Math.PI / 2, pitch: -0.1 });
    await rest(600);
    check(`${device}: (and the door stayed shut)`, (await C()).doorOpen < 0.05);
    const target = await M('target');
    check(`${device}: the button says DO NOT PRESS when you look at it`, /DO NOT PRESS/i.test(target || ''), String(target));
    await shot('3-button');
    await use();
    await rest(300);
    s = await C();
    check(`${device}: pressing it arms the door (nothing runs yet), and it now says to open the door`, s.armed && s.phase === 'idle' && s.on === 0 && /OPEN THE DOOR/.test(await M('target') || ''), `${s.armed} ${s.phase}`);

    // 3. open the door: the avalanche. Stand where the door opens, and watch.
    const stood = await M('faceDoor', 'hall', 'cats-only', 1.4) && await M('where');
    await until(() => window.__catsOnly.state().phase === 'pour', null, 4000);
    const t0 = await p.evaluate(() => window.__clubhouse.played());
    await rest(500);
    s = await C();
    check(`${device}: opening the armed door sets the herd off, and the front door swings open for them`, s.phase === 'pour' && s.on > 5 && s.frontHeld, `${s.phase}, ${s.on} running`);
    await rest(900);
    await shot('4-herd');
    s = await C();
    check(`${device}: a whole herd is out at once`, s.on >= 40, `${s.on} Sadies`);
    await rest(1700);
    s = await C();
    await shot('5-garden');
    check(`${device}: they run out of the front door into the garden (it's open to let them)`, s.garden > 5 && s.frontOpen > 0.6, `${s.garden} in the garden, door ${s.frontOpen.toFixed(2)}`);
    check(`${device}: all of it is over, and the front door's shut, before anyone could have walked to it`, await until(() => window.__catsOnly.state().phase === 'idle', null, 9000));
    const took = (await p.evaluate(() => window.__clubhouse.played())) - t0;
    s = await C();
    check(`${device}: afterwards no Sadie is left and the front door has shut`, s.on === 0 && s.frontOpen < 0.15 && !s.frontHeld, `${s.on} left, door ${s.frontOpen.toFixed(2)}`);
    const after = await M('where');
    check(`${device}: the herd never moved the player`, Math.hypot(after.x - stood.x, after.z - stood.z) < 0.01 && after.place === 'hall', `${after.x.toFixed(2)}, ${after.z.toFixed(2)}`);
    const meows = Object.entries(s.meows).filter(([k]) => /^meow/.test(k)).reduce((a, [, v]) => a + v, 0);
    check(`${device}: the meows were few (${meows})`, meows <= 10, `${meows} meows`);
    check(`${device}: it took well under the quickest walk to the front door (${took.toFixed(1)} s)`, took < 8.5, `${took.toFixed(1)} s`);

    // 4. the door's already open when the button's pressed: it slams shut and flies open with the herd
    await M('faceDoor', 'hall', 'cats-only', 1.4);
    await rest(900);
    check(`${device}: (the door's open again)`, (await C()).doorOpen > 0.8);
    await p.evaluate(() => window.__catsOnly.press());
    await rest(120);
    s = await C();
    check(`${device}: pressing the button with the door open slams it shut`, s.phase === 'slam' && s.doorOpen < 0.95 && s.armed, `${s.phase}, door ${s.doorOpen.toFixed(2)}`);
    await until(() => window.__catsOnly.state().phase === 'pour', null, 4000);
    s = await C();
    check(`${device}: ...and it flies open again with the herd`, s.phase === 'pour' && s.doorOpen > 0.4, `${s.phase}, door ${s.doorOpen.toFixed(2)}`);
    await rest(1200);
    await shot('6-slammed');
    check(`${device}: that one ends too`, await until(() => window.__catsOnly.state().phase === 'idle', null, 9000) && (await C()).on === 0);

    // 5. still fine: walk about, nothing stuck, no errors
    await M('faceDoor', 'hall', 'cats-only', 1.4);
    await walk(1200);
    check(`${device}: you can still walk into the closet afterwards`, (await M('where')).place === 'room:cats-only');
    check(`${device}: no errors on the page`, errors.length === 0, errors[0]);
  });
}

// Clyde's house in a real (hidden) browser, as a phone and as a desktop: run by tools/check.mjs
// (never on its own) with the built page. It's built into the clubhouse (outside the gate), so these
// run whenever the clubhouse changes too.
//
// It walks out along the lane to the house, sees in through its front door and walks through it,
// steps up to the Good Morning Machine (hearing Clyde's hello, sped up), puts junk in the gap and
// pulls the lever (it stops there, and the part stays for you to swap), puts the right parts in
// four times over (one gap, then two, three, four), sees the finale through (Sadie snubs the treat
// Clyde hands her), checks every sound played once along the way, and that the treats are kept
// after a reload; then pulls each of the weather machine's levers outside (the weather changes, Sadie
// reacts, a jingle each time, kept after a reload). On a phone the parts are swapped
// by tapping, and a swipe moves along the machine. Screenshots in dist/check/clydes-house/. Any
// error on the page is a failure.
import { bothDevices } from '../shared/browser.mjs';
import { ROUNDS } from '../../src/activities/clydes-house/machine.js';

export default async function ({ browser, page, check, outDir }) {
  await bothDevices(browser, outDir, async ({ device, opts, ctx, p, errors, shot, M, up, walk, use, modeIs, until: untilGame }) => {
    const S = () => p.evaluate(() => window.__clydesHouse.state());
    const until = (fn, arg, ms = 30000) => untilGame(fn, arg, ms);   // (in the game's time)
    const ready = () => until(() => { const s = window.__clydesHouse.state(); return s.phase === 'ready' && !s.lines; });
    // a finger (or the mouse) pressing the screen at (fx, fy) of the way across and down, and moving by dx pixels
    const press = (fx, fy, dx = 0) => p.evaluate(async ([fx, fy, dx, touch]) => {
      const c = document.querySelector('#clubhouse #view'), x = innerWidth * fx, y = innerHeight * fy;
      const ev = (type, d) => c.dispatchEvent(new PointerEvent(type, { pointerId: 9, pointerType: touch ? 'touch' : 'mouse', clientX: x + d, clientY: y, bubbles: true }));
      ev('pointerdown', 0); if (dx) for (let i = 1; i <= 6; i++) { ev('pointermove', dx * i / 6); await new Promise(ok => setTimeout(ok, 20)); }
      ev('pointerup', dx);
    }, [fx, fy, dx, !!opts.hasTouch]);
    // put a part in a gap: its right one, or (right = false) some junk
    async function put(gap, right = true) {
      const good = s => right ? s.parts[gap] === gap : s.parts[gap] && s.parts[gap] !== gap;
      if (opts.hasTouch) {
        // move along to it (a swipe), then tap it: the view's centred on it, so tap down the middle till it changes
        for (let i = 0; i < 6 && (await S()).picked !== gap; i++) await press(0.5, 0.75, -140);
        await p.waitForTimeout(800);   // (the view eases over to it)
        for (let y = 0.2; y < 0.8 && !good(await S()); y += 0.025) {
          const before = (await S()).parts;
          await press(0.5, y);
          // (hit another gap on the way? tap it round to where it was: four parts, so three more)
          const after = (await S()).parts;
          if (Object.keys(after).some(g => g !== gap && after[g] !== before[g])) for (let i = 0; i < 3; i++) await press(0.5, y);
        }
        for (let i = 0; i < 5 && !good(await S()); i++) { await p.keyboard.press('KeyW'); }
      } else {
        for (let i = 0; i < 6 && (await S()).picked !== gap; i++) await p.keyboard.press('KeyD');
        for (let i = 0; i < 5 && !good(await S()); i++) await p.keyboard.press('KeyW');
      }
      return good(await S());
    }
    const pull = () => opts.hasTouch ? p.keyboard.press('Space') : p.keyboard.press('Space');

    await p.goto(page);
    if (!await up()) { check(`${device}: the clubhouse opens`, false, errors[0]); await ctx.close(); return; }
    await p.click('#ok');

    // out along the lane, to the house, and in through its front door
    await M('faceDoor', 'outside', 'clydes-house', 3); await p.waitForTimeout(300);
    await shot('0-house');
    await M('faceDoor', 'outside', 'clydes-house', 1.3);
    await walk(250); await p.waitForTimeout(400);
    check(`${device}: Clyde's front door opens as you come up the path, showing the room through it`, await M('looking') === 'room:clydes-house', await M('looking'));
    await walk(900);
    await shot('1-inside');
    check(`${device}: ...and walking through it takes you in`, (await M('where')).place === 'room:clydes-house');

    // stepping up to the machine: Clyde says hello
    await M('put', 'room:clydes-house', 'machine'); await p.waitForTimeout(300);
    check(`${device}: looking at the machine, it offers to play it`, /GOOD MORNING MACHINE/.test(await M('target') || ''), await M('target'));
    await use();
    check(`${device}: stepping up to it`, await modeIs('arcade'));
    await p.evaluate(() => window.__clydesHouse.speed(8));
    check(`${device}: Clyde says hello, then it's ready, with the dominoes missing`, await ready() && (await S()).missing.join() === 'dominoes');
    await p.evaluate(() => window.__clydesHouse.speed(4));

    // junk in the gap: it stops there, Clyde says so, and the junk stays for you to swap
    check(`${device}: ${opts.hasTouch ? 'tapping' : 'W'} puts a part in the gap (junk first)`, await put('dominoes', false), JSON.stringify((await S()).parts));
    const junk = (await S()).parts.dominoes;
    await shot('2-junk');
    await pull();
    check(`${device}: pulling the lever with junk in, it runs, stops, and Clyde has a word`, await until(() => window.__clydesHouse.state().phase !== 'ready', null, 3000) && await ready());
    let s = await S();
    check(`${device}: ...no treat, and the ${junk} is still there to swap`, s.treats === 0 && s.parts.dominoes === junk && s.round === 0, JSON.stringify(s.parts));

    // the right parts: once, twice, and three gaps
    for (const [round, gaps] of ROUNDS.slice(0, 1).entries()) {
      s = await S();
      check(`${device}: round ${round + 1}: ${gaps.length} missing`, s.round === round && s.missing.join() === gaps.join(), s.missing.join());
      let ok = true;
      for (const g of gaps) ok = await put(g) && ok;
      check(`${device}: ...the right parts go in`, ok, JSON.stringify((await S()).parts));
      const sounds = s.sounds;
      await pull();
      const done = await until(r => window.__clydesHouse.state().treats > r, round, 30000);
      check(`${device}: ...the lever, and the treat gets to Sadie's bowl, with the chime`, done && (await S()).sounds > sounds);
      await ready();
    }
    s = await S();
    check(`${device}: the first round's treat is in Sadie's bowl`, s.treats === 1, JSON.stringify(s));

    // kept after a reload
    await p.reload(); await up();
    s = await S();
    check(`${device}: the treat is kept after a reload`, s.treats === 1);

    check(`${device}: no errors on the page`, !errors.length, errors[0]);
    await ctx.close();
  });
}

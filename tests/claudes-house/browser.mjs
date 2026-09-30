// Claude's house in a real (hidden) browser, as a phone and as a desktop: run by tools/check.mjs
// (never on its own) with the built page. It's built into the mansion (outside the gate), so these
// run whenever the mansion changes too.
//
// It walks out along the lane to the house, sees in through its front door and walks through it,
// steps up to the Good Morning Machine (hearing Claude's hello, sped up), puts junk in the gap and
// pulls the lever (it stops there, and the part stays for you to swap), puts the right parts in
// three times over (one gap, then two, then three), sees the finale through (Sadie snubs the treat
// Claude hands her), and checks the treats are kept after a reload. On a phone the parts are swapped
// by tapping, and a swipe moves along the machine. Screenshots in dist/check/claudes-house/. Any
// error on the page is a failure.
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
    const S = () => p.evaluate(() => window.__claudesHouse.state());
    const up = () => p.waitForFunction(() => window.__mansion && window.__mansion.frames() > 10, null, { timeout: 15000 }).then(() => true, () => false);
    const walk = async ms => { await p.keyboard.down('KeyW'); await p.waitForTimeout(ms); await p.keyboard.up('KeyW'); await p.waitForTimeout(100); };
    const use = () => opts.hasTouch ? p.tap('#mansion #use') : p.keyboard.press('KeyE');
    const modeIs = m => p.waitForFunction(m => window.__mansion.mode() === m, m, { timeout: 5000 }).then(() => true, () => false);
    const until = (fn, arg, ms = 30000) => p.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
    const ready = () => until(() => { const s = window.__claudesHouse.state(); return s.phase === 'ready' && !s.lines; });
    // a finger (or the mouse) pressing the screen at (fx, fy) of the way across and down, and moving by dx pixels
    const press = (fx, fy, dx = 0) => p.evaluate(async ([fx, fy, dx, touch]) => {
      const c = document.querySelector('#mansion #view'), x = innerWidth * fx, y = innerHeight * fy;
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
        for (let y = 0.2; y < 0.8 && !good(await S()); y += 0.025) await press(0.5, y);
        for (let i = 0; i < 5 && !good(await S()); i++) { await p.keyboard.press('KeyW'); }
      } else {
        for (let i = 0; i < 6 && (await S()).picked !== gap; i++) await p.keyboard.press('KeyD');
        for (let i = 0; i < 5 && !good(await S()); i++) await p.keyboard.press('KeyW');
      }
      return good(await S());
    }
    const pull = () => opts.hasTouch ? p.keyboard.press('Space') : p.keyboard.press('Space');

    await p.goto(page);
    if (!await up()) { check(`${device}: the mansion opens`, false, errors[0]); await ctx.close(); return; }
    await p.click('#ok');

    // out along the lane, to the house, and in through its front door
    await M('faceDoor', 'outside', 'claudes-house', 3); await p.waitForTimeout(300);
    await shot('0-house');
    await M('faceDoor', 'outside', 'claudes-house', 1.3);
    await walk(250); await p.waitForTimeout(400);
    check(`${device}: Claude's front door opens as you come up the path, showing the room through it`, await M('looking') === 'room:claudes-house', await M('looking'));
    await walk(900);
    await shot('1-inside');
    check(`${device}: ...and walking through it takes you in`, (await M('where')).place === 'room:claudes-house');

    // stepping up to the machine: Claude says hello
    await M('put', 'room:claudes-house', 'machine'); await p.waitForTimeout(300);
    check(`${device}: looking at the machine, it offers to play it`, /GOOD MORNING MACHINE/.test(await M('target') || ''), await M('target'));
    await use();
    check(`${device}: stepping up to it`, await modeIs('arcade'));
    await p.evaluate(() => window.__claudesHouse.speed(8));
    check(`${device}: Claude says hello, then it's ready, with the dominoes missing`, await ready() && (await S()).missing.join() === 'dominoes');
    await p.evaluate(() => window.__claudesHouse.speed(4));

    // junk in the gap: it stops there, Claude says so, and the junk stays for you to swap
    check(`${device}: ${opts.hasTouch ? 'tapping' : 'W'} puts a part in the gap (junk first)`, await put('dominoes', false), JSON.stringify((await S()).parts));
    const junk = (await S()).parts.dominoes;
    await shot('2-junk');
    await pull();
    check(`${device}: pulling the lever with junk in, it runs, stops, and Claude has a word`, await until(() => window.__claudesHouse.state().phase !== 'ready', null, 3000) && await ready());
    let s = await S();
    check(`${device}: ...no treat, and the ${junk} is still there to swap`, s.treats === 0 && s.parts.dominoes === junk && s.round === 0, JSON.stringify(s.parts));

    // the right parts: once, twice, and three gaps
    for (const [round, gaps] of [[0, ['dominoes']], [1, ['dominoes', 'funnel']], [2, ['dominoes', 'funnel', 'fan']]]) {
      s = await S();
      check(`${device}: round ${round + 1}: ${gaps.length} missing`, s.round === round && s.missing.join() === gaps.join(), s.missing.join());
      let ok = true;
      for (const g of gaps) ok = await put(g) && ok;
      check(`${device}: ...the right parts go in`, ok, JSON.stringify((await S()).parts));
      if (round === 2) await shot('3-all-three');
      const sounds = s.sounds;
      await pull();
      if (round === 0) { await p.waitForTimeout(1200); await shot('4-running'); }
      const done = await until(r => window.__claudesHouse.state().treats > r, round, 30000);
      check(`${device}: ...the lever, and the treat gets to Sadie's bowl, with the chime`, done && (await S()).sounds > sounds);
      if (round === 2) { await p.waitForTimeout(3000); await shot('5-finale'); }
      await ready();
    }
    s = await S();
    check(`${device}: after the third, Claude's had the idea (the finale), and it's three treats`, s.finale && s.treats === 3 && s.missing.length >= 1, JSON.stringify(s));
    if (opts.hasTouch) {
      const before = (await S()).view.x;
      await press(0.5, 0.75, 160); await p.waitForTimeout(500);
      check(`${device}: a swipe moves along the machine`, Math.abs((await S()).view.x - before) > 0.1 || (await S()).missing.length === 1);
    }
    await shot('6-again');
    await p.keyboard.press('Escape');
    check(`${device}: Esc steps back`, await modeIs('play'));

    // kept after a reload
    await p.reload(); await up();
    s = await S();
    check(`${device}: the treats and the finale are kept after a reload`, s.treats === 3 && s.finale);
    check(`${device}: no errors on the page`, !errors.length, errors[0]);
    await ctx.close();
  }));
}

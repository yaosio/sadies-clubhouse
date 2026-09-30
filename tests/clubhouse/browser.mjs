// Sadie's mansion (the clubhouse) in a real (hidden) browser, as a phone and as a desktop: run by
// tools/check.mjs (never on its own) with the built page, every time (it takes under a minute).
//
// It opens the page at the gate with Sadie's letter (the first time only), walks, goes in through the
// front door (seeing the hall through it first), climbs the spiral stairs to the landing, walks through
// Dropper World's door into its room, plays it at the computer (the mansion must leave the page
// completely), comes back with ESC BACK to that computer with the tower saved, and comes back from an
// address that went straight in. It checks the rooms are built after the mansion opens (and how quick
// each is), and that a room put away is built again as you walk up to its door, with nothing piling
// up. The main theme plays, fades out in the Music Room and comes back; the pause menu's MUSIC button
// goes SOFT, OFF and ON. It pauses, and in the test version starts the letter over. A room's code is a file of its own:
// when that file won't come, the room's door stays shut and it's fetched again later. Any error
// on the page, or anything that doesn't work, is a failure. Screenshots go in dist/check/clubhouse/.
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

const SLOW = 1500, BIT = 200, PROGRAMS = 8;   // (ms to build a place, the longest bit of it, and kinds of drawing: see below)

export default async function ({ browser, page, check, outDir }) {
  const DEVICES = [
    ['phone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
    ['desktop', { viewport: { width: 1280, height: 800 } }],
  ];
  // the phone and the desktop at the same time (each in its own browser window)
  await Promise.all(DEVICES.map(async ([device, opts]) => {
    const ctx = await browser.newContext(opts);
    // the web fonts can't be fetched from here; answer with nothing rather than log a network error
    await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    const p = await ctx.newPage(), errors = [];
    p.on('pageerror', e => errors.push(e.message));
    p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    const shot = name => p.screenshot({ path: join(outDir, `${device}-${name}.png`) });
    const M = (fn, ...a) => p.evaluate(([f, a]) => window.__mansion[f](...a), [fn, a]);
    const up = () => p.waitForFunction(() => window.__mansion && window.__mansion.frames() > 10, null, { timeout: 15000 }).then(() => true, () => false);
    const walk = async ms => { await p.keyboard.down('KeyW'); await p.waitForTimeout(ms); await p.keyboard.up('KeyW'); await p.waitForTimeout(100); };

    await p.goto(page);
    const opened = await up();
    await p.waitForTimeout(500);
    await shot('1-letter');
    check(`${device}: the mansion opens and draws`, opened, errors[0]);
    if (!opened) { await ctx.close(); return; }
    check(`${device}: ...at the gate, with Sadie's letter`, (await M('where')).place === 'outside' && await M('mode') === 'letter' && await p.isVisible('#letter'));
    await p.click('#ok');
    check(`${device}: OK puts the letter away`, await M('mode') === 'play' && !(await p.isVisible('#letter')));
    await p.reload(); await up();
    check(`${device}: ...and it only comes the first time`, await M('mode') === 'play' && !(await p.isVisible('#letter')));
    await shot('2-gate');

    // walking: the keys on a desktop, the thumb stick on a phone
    const before = await M('where');
    if (opts.hasTouch) {
      await p.evaluate(async () => {
        const c = document.querySelector('#mansion #view'), r = document.querySelector('#mansion #stick').getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
        const ev = (type, dy) => c.dispatchEvent(new PointerEvent(type, { pointerId: 7, pointerType: 'touch', clientX: x, clientY: y + dy, bubbles: true }));
        ev('pointerdown', 0); ev('pointermove', -45);
        await new Promise(ok => setTimeout(ok, 700));
        ev('pointerup', -45);
      });
    } else await walk(700);
    const after = await M('where');
    check(`${device}: ${opts.hasTouch ? 'the thumb stick' : 'W'} walks you up the path`, after.z - before.z > 0.8, `moved ${(after.z - before.z).toFixed(2)} m`);
    if (opts.hasTouch) {
      // dragging anywhere else, even on the left side, only looks around: the stick stays put
      const r0 = await p.evaluate(() => JSON.stringify(document.querySelector('#mansion #stick').getBoundingClientRect()));
      const w0 = await M('where');
      await p.evaluate(async () => {
        const c = document.querySelector('#mansion #view'), x = 90, y = 300;
        const ev = (type, dx) => c.dispatchEvent(new PointerEvent(type, { pointerId: 8, pointerType: 'touch', clientX: x + dx, clientY: y, bubbles: true }));
        ev('pointerdown', 0); ev('pointermove', 60); await new Promise(ok => setTimeout(ok, 300)); ev('pointerup', 60);
      });
      const w1 = await M('where'), r1 = await p.evaluate(() => JSON.stringify(document.querySelector('#mansion #stick').getBoundingClientRect()));
      check(`${device}: dragging away from the stick turns the view, and the stick stays in its corner`,
        Math.abs(w1.yaw - w0.yaw) > 0.1 && Math.hypot(w1.x - w0.x, w1.z - w0.z) < 0.01 && r0 === r1);
    }

    // in through the front door: it opens as you come up, and the hall shows through it
    await M('faceDoor', 'outside', 'front', 2.4);
    await walk(350);
    await p.waitForTimeout(500);
    await shot('3-front-door');
    check(`${device}: the front door opens as you come up, showing the hall through it`, await M('looking') === 'hall');
    await walk(700);   // through, and about a metre on: still inside the door's swing
    await shot('4-hall');
    check(`${device}: ...and walking through it takes you into the hall (no loading)`, (await M('where')).place === 'hall');
    check(`${device}: ...and the door stays open while you're still in its swing`, await M('lastDoorOpen') > 0.9, `open ${(await M('lastDoorOpen'))?.toFixed(2)}`);

    // stepping through a doorway a little at a time, you come out exactly as far past it as you
    // stepped (no jump: even a few centimetres shows as a stutter)
    await M('faceDoor', 'outside', 'front', 0.5);
    let past = null;
    for (let i = 0; i < 60 && past === null; i++) {
      await M('step', 0.013);
      const w = await M('where');
      if (w.place === 'hall') past = w.z - (await M('doorAt', 'hall', 'front')).z;
    }
    check(`${device}: stepping through a doorway doesn't jump you forward`, past !== null && past > 0 && past <= 0.0131, `came out ${past?.toFixed(4)} m past it`);

    // looking up and down while turning never tips the view over
    let tipped = 0;
    for (const [yaw, pitch] of [[0.7, 0.6], [2.4, -0.7], [-1.9, 0.5]]) { await M('turnTo', yaw, pitch); await p.waitForTimeout(80); tipped = Math.max(tipped, await M('tilt')); }
    check(`${device}: looking up or down while turning keeps the view upright`, tipped < 1e-3, `leans ${tipped.toFixed(3)}`);

    // the mansion opens before the rooms are built (all but a building outside the gate, which you can
    // see from the lane); the rest are built one at a time while you stand about
    const sp = await M('speed');
    check(`${device}: the mansion opens without waiting for the rooms`, sp.atFirst.every(n => n === 'room:clydes-house'), `first picture after ${sp.first} ms, with ${sp.atFirst.join(', ') || 'no rooms'} built`);
    const settled = await p.waitForFunction(() => window.__mansion.settled(), null, { timeout: 20000 }).then(() => true, () => false);
    const sp2 = await M('speed'), slow = Object.entries(sp2.places).filter(([, ms]) => ms > SLOW);
    check(`${device}: ...and the rooms are built while you stand about`, settled, (await M('built')).join(', '));
    // the main theme: playing (you've pressed something by now), fading out in the Music Room (it has
    // music of its own) and back in once you've left it
    const playing = () => p.waitForFunction(() => { const m = window.__mansion.music(); return m.playing && m.notes > 0 && m.level > 0.05; }, null, { timeout: 8000 }).then(() => true, () => false);
    check(`${device}: the main theme plays`, await playing(), JSON.stringify(await M('music')));
    await M('faceDoor', 'room:music-room', 'door', 2);
    const hushed = await p.waitForFunction(() => { const m = window.__mansion.music(); return !m.playing && m.level < 0.01; }, null, { timeout: 8000 }).then(() => true, () => false);
    check(`${device}: ...and fades out in the Music Room`, hushed, JSON.stringify(await M('music')));
    await M('faceDoor', 'hall', 'dropper-world', 1.3);
    check(`${device}: ...and back in once you've left`, await playing(), JSON.stringify(await M('music')));
    // how quick each place is to build (a slow one makes a hiccup as you walk up to its door), and
    // how many kinds of drawing the graphics card has had to learn (each new kind: a hiccup the first
    // time it's seen). Headless drawing is slow, so these are generous.
    check(`${device}: every place builds in under ${SLOW} ms`, !slow.length, Object.entries(sp2.places).map(([k, ms]) => `${k.replace('room:', '')} ${ms}`).join(', '));
    // (a room builds a bit at a time, so the game's never held up for long: the longest bit)
    const bits = Object.entries(sp2.bits).filter(([k]) => k.startsWith('room:')), long = bits.filter(([, ms]) => ms > BIT);
    check(`${device}: ...a bit at a time, never holding the game up more than ${BIT} ms`, !long.length, bits.map(([k, ms]) => `${k.replace('room:', '')} ${ms}`).join(', '));
    check(`${device}: ...and every place draws with the same few materials`, sp2.programs <= PROGRAMS, `${sp2.programs} kinds so far`);

    // a building outside the gate far off is drawn as a plain block (none is that far yet: here the
    // distance is made short, standing at the gate)
    await M('put', 'outside', 'start');
    await M('farHouse', 5); await p.waitForTimeout(300);
    await shot('4a-far-house');
    const far = await M('houses');
    await M('farHouse', 90); await p.waitForTimeout(300);
    const near = await M('houses');
    check(`${device}: a building outside the gate is a plain block when far off, and itself close up`, far.length && far.every(h => h.far) && near.every(h => !h.far), JSON.stringify(far));

    // up the spiral stairs to the landing, keeping to the middle of the steps
    await M('put', 'hall', 'stairs');
    for (let i = 0; i < 40; i++) {
      const w = await M('where');
      if (w.y > 4.5) break;
      const th = Math.atan2(w.x, w.z), r = Math.hypot(w.x, w.z);
      await M('turnTo', th - Math.PI / 2 + (r - 2.2) * 0.4);
      await walk(150);
    }
    const top = await M('where');
    check(`${device}: the stairs go up to the first landing`, top.y > 4.5, `at ${top.y.toFixed(2)} m`);

    // two doors open side by side on the landing both show what's through them (neither goes black)
    await M('faceDoor', 'hall', 'dropper-world', 1.3);
    await M('faceDoor', 'hall', 'dropper-world', 2.4);
    await M('turnTo', (await M('where')).yaw - 0.45);
    await M('holdOpen', 'hall', 'dropper-world');
    await M('holdOpen', 'room:brickbuster', 'door');
    await p.waitForTimeout(700);
    await shot('4b-two-doors');
    const both = await M('showing');
    await M('holdOpen', 'hall', null); await M('holdOpen', 'room:brickbuster', null);
    check(`${device}: two open doors side by side both show their rooms`, both >= 2, `${both} showing`);

    // a room far off can be put away (its things handed back), and walking up to its door builds it
    // again: the door opens once it's ready, and nothing piles up
    await M('onlyDoors', true);   // (or it's built again straight away, as you're standing still)
    const k0 = (await M('speed')).kept;
    const away = await M('putAway', 'room:aquarium');
    const k1 = (await M('speed')).kept;
    check(`${device}: a room can be put away, handing its things back`, away && !(await M('built')).includes('room:aquarium') && k1 < k0, `${k0} things kept, then ${k1}`);
    await M('faceDoor', 'hall', 'aquarium', 1.3);
    await walk(350);
    await p.waitForTimeout(800);
    await shot('4c-built-again');
    check(`${device}: ...walking up to its door builds it again, and the door opens onto it`, await M('looking') === 'room:aquarium' && (await M('built')).includes('room:aquarium'));
    const k2 = (await M('speed')).kept;
    await M('onlyDoors', false);
    check(`${device}: ...with nothing piled up`, k2 === k0, `${k0} things kept before, ${k2} after`);
    // every room can be put away and built again, twice over, with nothing piling up (and no copies
    // of anything it puts on the screen)
    const all = (await M('places')).filter(n => n.startsWith('room:'));
    const refused = [], kept = [];
    for (let round = 0; round < 3; round++) {
      for (const n of all) { if (!(await M('putAway', n))) refused.push(n); await M('build', n); }
      kept.push((await M('speed')).kept);
    }
    // (the first time round, a room outside the gate keeps its house's pictures from its first build)
    check(`${device}: ...every room can be put away and built again, over and over`, !refused.length && kept[1] === kept[0] && kept[2] === kept[0], `${[...new Set(refused)].join(', ') || 'all of them'}; things kept each time round: ${kept.join(', ')}`);
    check(`${device}: ...and leaves no copies behind on the screen`, await p.evaluate(() => document.querySelectorAll('#saTalk').length) === 1);

    // through Dropper World's door into its room
    // (from 1.3 m out: further than that is off the landing, except in front of the first door)
    await M('faceDoor', 'hall', 'dropper-world', 1.3);
    await walk(1200);
    await shot('5-room');
    check(`${device}: Dropper World's door on the landing leads to its room`, (await M('where')).place === 'room:dropper-world');

    // play it at the computer
    await M('put', 'room:dropper-world', 'computer');
    await p.waitForTimeout(300);
    check(`${device}: at the computer, it offers to play`, /DROPPER WORLD/.test(await M('target') || ''), await M('target'));
    if (opts.hasTouch) await p.tap('#mansion #use'); else await p.keyboard.press('KeyE');
    const inside = await p.waitForFunction(() => !document.getElementById('mansion') && window.__jellyDebug && document.getElementById('app'), null, { timeout: 10000 }).then(() => true, () => false);
    await p.waitForTimeout(3000);
    await shot('6-played');
    const left = await p.evaluate(() => ({ mansion: !!document.getElementById('mansion'), hook: !!window.__mansion, title: document.title, pieces: window.__jellyDebug?.().pieces }));
    check(`${device}: using the computer starts Dropper World`, inside && left.pieces >= 0, `title ${JSON.stringify(left.title)}`);
    check(`${device}: ...and the mansion is gone from the page`, !left.mansion && !left.hook);

    // ESC BACK: back at that computer, tower saved
    const count = left.pieces;
    await p.click('#clubBack', { timeout: 3000 }).catch(() => {});
    const home = await up();
    await p.waitForTimeout(500);
    await shot('7-back');
    check(`${device}: ESC BACK comes back to the mansion, at Dropper World's computer`, home && (await M('where')).place === 'room:dropper-world' && await M('mode') === 'play');
    if (opts.hasTouch) await p.tap('#mansion #use').catch(() => {}); else await p.keyboard.press('KeyE');
    await p.waitForFunction(() => window.__jellyDebug && document.getElementById('app'), null, { timeout: 10000 }).catch(() => {});
    const again = await p.evaluate(() => window.__jellyDebug?.().pieces);
    check(`${device}: ...and playing again finds the tower as it was`, again >= count && count > 0, `${count} pieces before, ${again} after`);

    // straight in by address (#dropper-world), then the Escape key comes back too
    await p.goto(page + '#dropper-world');
    await p.waitForFunction(() => window.__jellyDebug && document.getElementById('clubBack'), null, { timeout: 8000 }).catch(() => {});
    await p.waitForTimeout(500);
    await p.keyboard.press('Escape');
    const home2 = await up();
    check(`${device}: the Escape key comes back too (even when it came in by address)`, home2 && !(await p.evaluate(() => location.hash)));

    // pausing, and starting the letter over (only once you say you're sure)
    if (opts.hasTouch) await p.tap('#mansion #pause'); else await p.keyboard.press('Escape');
    await p.waitForTimeout(200);
    await shot('8-paused');
    check(`${device}: ${opts.hasTouch ? 'the pause button' : 'Escape'} pauses`, await M('mode') === 'menu' && await p.isVisible('#menu'));
    check(`${device}: ...with the start-over buttons`, await p.isVisible('#resets button:has-text("INVITATION")'));
    // the MUSIC button: ON, SOFT, OFF (remembered), and ON again
    const tap = async () => { await p.click('#music'); return [await p.textContent('#music'), await p.evaluate(() => localStorage.getItem('mansion.music'))]; };
    const soft = await tap(), offNow = await tap();
    const silent = await p.waitForFunction(() => window.__mansion.music().level < 0.01, null, { timeout: 6000 }).then(() => true, () => false);
    const onAgain = await tap();
    check(`${device}: the pause menu's MUSIC button goes SOFT, OFF (silent) and ON again, and remembers`, soft[0] === 'MUSIC: SOFT' && offNow[0] === 'MUSIC: OFF' && silent && onAgain[0] === 'MUSIC: ON'
      && JSON.parse(offNow[1]) === 'off' && JSON.parse(onAgain[1]) === 'on', `${soft[0]}, ${offNow[0]}, ${onAgain[0]}`);
    await p.click('#resets button:has-text("INVITATION")');
    await shot('9-sure');
    check(`${device}: a start-over button asks first`, await p.isVisible('#sureYes') && !(await p.isVisible('#resets')));
    await p.click('#sureNo');
    check(`${device}: ...and NO keeps it`, await p.isVisible('#resets') && !(await p.isVisible('#sure')) && await p.evaluate(() => localStorage.getItem('mansion.invited') !== null));
    await p.click('#resume');
    check(`${device}: RESUME carries on`, await M('mode') === 'play');
    if (opts.hasTouch) await p.tap('#mansion #pause'); else await p.keyboard.press('Escape');
    await p.waitForTimeout(200);
    await p.click('#resets button:has-text("INVITATION")');
    await p.click('#sureYes');
    await up();
    check(`${device}: YES starts the invitation over: Sadie's letter is back`, await M('mode') === 'letter');
    check(`${device}: no errors on the page`, !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }));

  // a room whose file won't come (the network hiccuped): its door stays shut, the rest carry on, and
  // it's fetched again once the network's back
  const files = JSON.parse(readFileSync(join(new URL('../..', import.meta.url).pathname, 'dist/game-files.json'), 'utf8'));
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  let cut = true, asked = 0;
  await ctx.route(url => url.pathname.endsWith('/game/' + files['src/activities/aquarium/room.js']), r => { asked++; return cut ? r.abort() : r.continue(); });
  const p = await ctx.newPage(), errors = [];
  p.on('pageerror', e => errors.push(e.message));
  const M = (fn, ...a) => p.evaluate(([f, a]) => window.__mansion[f](...a), [fn, a]);
  await p.goto(page);
  await p.waitForFunction(() => window.__mansion && window.__mansion.frames() > 10, null, { timeout: 15000 });
  const failed = await M('build', 'room:aquarium');
  await p.waitForFunction(() => window.__mansion.built().length >= 5, null, { timeout: 20000 }).catch(() => {});
  const others = (await M('built')).filter(n => n !== 'room:aquarium').length;
  check('a room whose file won\'t load keeps its door shut, and the other rooms still build', !failed && !(await M('built')).includes('room:aquarium') && others >= 5 && asked > 0,
    `aquarium built: ${failed}, ${others} other rooms built`);
  cut = false;
  check('...and it\'s built once its file comes', await M('build', 'room:aquarium') && (await M('built')).includes('room:aquarium'));
  check('...with no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

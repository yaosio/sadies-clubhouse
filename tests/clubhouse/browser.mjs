// Sadie's mansion (the clubhouse) in a real (hidden) browser, as a phone and as a desktop: run by
// tools/check.mjs (never on its own) with the built page, every time (it takes under a minute).
//
// It opens the page at the gate with Sadie's letter (the first time only), walks, goes in through the
// front door (seeing the hall through it first), climbs the spiral stairs to the landings, and checks
// every door on them leads to its own room, and every activity on a computer plays there (the mansion
// must leave the page completely) and comes back with ESC BACK, or from an address that went straight
// in. It checks the rooms are built after the mansion opens (and how quick each is), and that a room
// put away is built again as you walk up to its door, with nothing piling up. The main theme plays,
// fades out in a room that keeps it out and comes back; the pause menu's MUSIC button goes SOFT, OFF
// and ON. It pauses, each activity's START OVER erases only its own saves, and in the test version it
// starts the letter over. A room's code is a file of its own: when that file won't come, the room's
// door stays shut and it's fetched again later. It names no room: it picks them from the cards. Any
// error on the page, or anything that doesn't work, is a failure. Screenshots go in dist/check/clubhouse/.
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { walk as walkFor, rest, until } from '../shared/browser.mjs';
import { allKeeps, allCards } from './cards.mjs';

const SLOW = 1500, BIT = 200, PROGRAMS = 8;   // (ms to build a place, the longest bit of it, and kinds of drawing: see below)

export default async function ({ browser, page, check, outDir }) {
  // It names no room: it picks them from the cards, so renaming or adding one never breaks it.
  // (`beside`, `first`: the first two doors up the stairs; `spare`: the last room on the landings that
  // lives in its room, for putting away; `computers`: every activity played at a computer)
  const cards = await allCards(), landed = cards.filter(c => Number.isInteger(c.slot)).sort((a, b) => a.slot - b.slot);
  const [beside, first] = [landed[0], landed[1] || landed[0]], spare = landed.filter(c => c.room).at(-1), computers = landed.filter(c => c.start);
  const saver = cards.find(c => c.keeps && c.room), junk = saver.keeps[0];
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
    const walk = ms => walkFor(p, ms);

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
      // (held for 700 ms of the game's own time, as W is: a slow computer walks no less far)
      const stick = steps => p.evaluate(steps => {
        const c = document.querySelector('#mansion #view'), r = document.querySelector('#mansion #stick').getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
        for (const [type, dy] of steps) c.dispatchEvent(new PointerEvent(type, { pointerId: 7, pointerType: 'touch', clientX: x, clientY: y + dy, bubbles: true }));
        return window.__mansion.played();
      }, steps);
      const t0 = await stick([['pointerdown', 0], ['pointermove', -45]]);
      await rest(p, 700, t0);
      await stick([['pointerup', -45]]);
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
    const outsideRooms = await M('outsideRooms');
    check(`${device}: the mansion opens without waiting for the rooms`, sp.atFirst.every(n => outsideRooms.includes(n)), `first picture after ${sp.first} ms, with ${sp.atFirst.join(', ') || 'no rooms'} built`);
    const settled = await p.waitForFunction(() => window.__mansion.settled(), null, { timeout: 20000 }).then(() => true, () => false);
    const sp2 = await M('speed'), slow = Object.entries(sp2.places).filter(([, ms]) => ms > SLOW);
    check(`${device}: ...and the rooms are built while you stand about`, settled, (await M('built')).join(', '));
    // the main theme: playing (you've pressed something by now), fading out in a room that keeps it out
    // (`hush: true`, the Music Room so far) and back in once you've left it
    const playing = () => p.waitForFunction(() => { const m = window.__mansion.music(); return m.playing && m.notes > 0 && m.level > 0.05; }, null, { timeout: 8000 }).then(() => true, () => false);
    check(`${device}: the main theme plays`, await playing(), JSON.stringify(await M('music')));
    const quiet = (await M('quiet'))[0];
    if (quiet) await M('faceDoor', quiet, 'door', 2);
    const hushed = await p.waitForFunction(() => { const m = window.__mansion.music(); return !m.playing && m.level < 0.01; }, null, { timeout: 8000 }).then(() => true, () => false);
    check(`${device}: ...and fades out in a room that keeps it out (${quiet})`, !!quiet && hushed, JSON.stringify(await M('music')));
    await M('faceDoor', 'hall', first.id, 1.3);
    check(`${device}: ...and back in once you've left`, await playing(), JSON.stringify(await M('music')));
    // how quick each place is to build (a slow one makes a hiccup as you walk up to its door), and
    // how many kinds of drawing the graphics card has had to learn (each new kind: a hiccup the first
    // time it's seen). Headless drawing is slow, so these are generous.
    check(`${device}: every place builds in under ${SLOW} ms`, !slow.length, Object.entries(sp2.places).map(([k, ms]) => `${k.replace('room:', '')} ${ms}`).join(', '));
    // (a room builds a bit at a time, so the game's never held up for long: the longest bit. Not
    // counting the ones built before the first picture, the buildings outside: nothing's playing
    // yet, and how long that takes is the start-up's, timed by tools/clubhouse/startup.mjs. The
    // Hedge Maze's first build takes its one picture of the house then, the first time anything
    // draws the house, which took 300 to 400 ms on GitHub's slower computers. Built again, every
    // room, those too, is held to the limit below.)
    const bits = Object.entries(sp2.bits).filter(([k]) => k.startsWith('room:') && !sp.atFirst.includes(k)), long = bits.filter(([, ms]) => ms > BIT);
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
    // the outside's ground can have levels: a bridge over the lane, something solid under it, and you
    // stand on whichever is nearest your feet (only checked once: it's the same on any screen)
    if (device === 'desktop') {
      const lv = await p.evaluate(() => {
        const o = window.__mansion.outside(), f = (x, z, y) => o.floor(x, z, y);
        const gone = [
          o.surface((x, z) => Math.abs(x) < 3 && Math.abs(z + 31) < 1 ? 3 : null),   // a bridge 3 m up, across the lane
          o.block(-1, 1, -31.5, -30.5, 0, 1),                                         // a crate under it
          o.block(2, 3, -31.5, -30.5, 2.8, 3.1)];                                     // a lamp post's top, sticking up through the bridge
        const got = { under: f(0, -31, 0), onTop: f(0, -31, 3), beside: f(2.5, -31, 0), lampOnTop: f(2.5, -31, 3), lane: f(10, -31, 0), off: f(10, -31, 3) };
        for (const g of gone) g();
        got.after = f(0, -31, 0);   // (and taken away again, it's plain ground)
        return got;
      });
      check(`${device}: outside, the ground can have levels: a bridge over the lane, a crate under it`,
        lv.under === null && lv.onTop === 3 && lv.beside === 0 && lv.lampOnTop === null && lv.lane === 0 && lv.off === null && lv.after === 0, JSON.stringify(lv));
    }

    // ...and on round again to the second landing, and off the stairs onto it
    for (let i = 0; i < 60; i++) {
      const w = await M('where');
      if (w.y > 9.1) break;
      const th = Math.atan2(w.x, w.z), r = Math.hypot(w.x, w.z);
      await M('turnTo', th - Math.PI / 2 + (r - 2.2) * 0.4);
      await walk(150);
    }
    { const w = await M('where'); await M('turnTo', Math.atan2(w.x, w.z) + Math.PI); }   // (straight out from the middle, along the bridge)
    await walk(1500);
    const up2 = await M('where'), r2 = Math.hypot(up2.x, up2.z);
    check(`${device}: ...and round again to the second landing, and off the stairs onto it`, up2.y > 9.1 && r2 > 6, `at ${up2.y.toFixed(2)} m, ${r2.toFixed(1)} m from the middle`);

    // two doors open side by side on the landing both show what's through them (neither goes black)
    await M('faceDoor', 'hall', first.id, 1.3);
    await M('faceDoor', 'hall', first.id, 2.4);
    await M('turnTo', (await M('where')).yaw - 0.45);
    await M('holdOpen', 'hall', first.id);
    await M('holdOpen', 'room:' + beside.id, 'door');
    await p.waitForTimeout(700);
    await shot('4b-two-doors');
    const both = await M('showing');
    await M('holdOpen', 'hall', null); await M('holdOpen', 'room:' + beside.id, null);
    check(`${device}: two open doors side by side both show their rooms`, both >= 2, `${both} showing`);

    // a room far off can be put away (its things handed back), and walking up to its door builds it
    // again: the door opens once it's ready, and nothing piles up
    await M('onlyDoors', true);   // (or it's built again straight away, as you're standing still)
    const k0 = (await M('speed')).kept;
    const away = await M('putAway', 'room:' + spare.id);
    const k1 = (await M('speed')).kept;
    check(`${device}: a room can be put away, handing its things back`, away && !(await M('built')).includes('room:' + spare.id) && k1 < k0, `${k0} things kept, then ${k1}`);
    await M('faceDoor', 'hall', spare.id, 1.3);
    await walk(350);
    // (built again and showing through its open door, or already walked through it: a shut door
    // can't be walked through, so being in the room means it opened. On a slow computer the walk
    // can carry you in before the check looks.)
    const rebuilt = await until(p, n => window.__mansion.looking() === n || window.__mansion.where().place === n, 'room:' + spare.id, 5000)
      && (await M('built')).includes('room:' + spare.id);
    await shot('4c-built-again');
    check(`${device}: ...walking up to its door builds it again, and the door opens onto it`, rebuilt, rebuilt ? '' : JSON.stringify({ at: await M('where'), looking: await M('looking'), built: (await M('built')).includes('room:' + spare.id) }));
    const k2 = (await M('speed')).kept;
    check(`${device}: ...with nothing piled up`, k2 === k0, `${k0} things kept before, ${k2} after`);
    // Every room keeps the sound rules (src/shared/sound.js): none of its music is heard once you've
    // left it, and once it's put away nothing it started is left (no sounds, no lines).
    const leftOver = [];
    for (const n of (await M('places')).filter(n => n.startsWith('room:'))) {
      await M('build', n); await M('faceDoor', n, 'door', 2); await p.waitForTimeout(1200);
      await M('faceDoor', 'hall', first.id, 1.3); await p.waitForTimeout(600);
      const o = (await M('sound')).owners[n];
      if (o?.music) leftOver.push(`${n} music still heard`);
      if (!(await M('putAway', n))) leftOver.push(`${n} wouldn't be put away`);
      else if ((await M('sound')).owners[n]) leftOver.push(`${n} left sounds behind`);
    }
    // (a room's test hook (`window.__<room>`) goes with it, or it keeps the whole room's state alive)
    const hooksLeft = (await M('built')).length ? [] : await p.evaluate(() => Object.keys(window).filter(k => k.startsWith('__') && k !== '__mansion'));
    check(`${device}: a room's test hook is taken away when it's put away`, !hooksLeft.length, hooksLeft.join(', '));
    // (and nothing it had waiting to go off later starts up again once it's put away)
    await p.waitForTimeout(2000);
    const owners = (await M('sound')).owners;
    for (const n of (await M('places')).filter(n => n.startsWith('room:'))) if (owners[n] && !(await M('built')).includes(n)) leftOver.push(`${n} made sounds after it was put away`);
    check(`${device}: every room keeps the sound rules: its music isn't heard once you've left, and it leaves nothing playing when put away`, !leftOver.length, leftOver.join(', '));
    // one place's mistake in a frame doesn't stop the game: it carries on (and says so once, not an error)
    await M('sabotage', 'hall', true);
    const f0 = await M('frames'); await p.waitForTimeout(600);
    const carried = (await M('frames')) > f0 + 5;
    await M('sabotage', 'hall', false);
    check(`${device}: a place that fails in a frame doesn't freeze the game`, carried, `frames ${f0} then ${await M('frames')}`);
    // every room can be put away and built again, twice over, with nothing piling up (and no copies
    // of anything it puts on the screen)
    const all = (await M('places')).filter(n => n.startsWith('room:'));
    // (and nothing on the page, and none of its saves, changes: built again from its save, it's the
    // same room; each rebuild is as quick as the first build)
    const saves = () => p.evaluate(() => JSON.stringify(Object.keys(localStorage).filter(k => !k.startsWith('mansion.')).sort().map(k => [k, localStorage.getItem(k)])));
    for (const n of all) await M('build', n);   // (the ones put away just now)
    const saved0 = await saves();
    const refused = [], kept = [], onPage = [];
    for (let round = 0; round < 3; round++) {
      for (const n of all) { if (!(await M('putAway', n))) refused.push(n); await M('build', n); }
      kept.push((await M('speed')).kept);
      onPage.push(await p.evaluate(() => document.querySelectorAll('*').length));
    }
    const saved1 = await saves(), sp3 = await M('speed');
    await M('onlyDoors', false);
    // (the first time round, a room outside the gate keeps its house's pictures from its first build)
    check(`${device}: ...every room can be put away and built again, over and over`, !refused.length && kept[1] === kept[0] && kept[2] === kept[0], `${[...new Set(refused)].join(', ') || 'all of them'}; things kept each time round: ${kept.join(', ')}`);
    check(`${device}: ...and leaves no copies behind on the page`, onPage[1] === onPage[0] && onPage[2] === onPage[0], `things on the page each time round: ${onPage.join(', ')}`);
    check(`${device}: ...and every room's save is just as it was`, saved1 === saved0, saved1 === saved0 ? '' : `before ${saved0.slice(0, 300)} after ${saved1.slice(0, 300)}`);
    const slowAgain = all.filter(n => sp3.places[n] > SLOW || sp3.bits[n] > BIT);
    check(`${device}: ...and each is as quick to build again (under ${SLOW} ms, no bit over ${BIT} ms)`, !slowAgain.length, all.map(n => `${n.replace('room:', '')} ${sp3.places[n]}/${sp3.bits[n]}`).join(', '));

    // the weather is the world's: it comes over every place out of doors (one with a `sky`), and what
    // falls, falls round you in whichever one you're in
    for (const n of await M('places')) await M('build', n);
    await M('weatherSpeed', 20); await M('setWeather', 'clear'); await rest(p, 400);
    const outdoors = await M('outdoors'), clear = {};
    for (const n of outdoors) clear[n] = await M('sunlight', n);
    await M('setWeather', 'rain'); await rest(p, 600);
    const rained = [];
    for (const n of outdoors) {
      await M('put', n, 'start'); await rest(p, 300);
      const w = await M('weather'), sun = await M('sunlight', n);
      if (!(sun < clear[n] * 0.5 && w.clouds > 0.9 && w.seen === n && w.rain > 100)) rained.push(`${n}: sun ${clear[n]} to ${sun}, ${JSON.stringify(w)}`);
    }
    // ...and in one seen through a doorway from outside (a building out of doors, like the maze),
    // while you stay out there
    for (const n of outdoors.filter(n => n !== 'outside')) {
      if (!(await M('faceDoor', 'outside', n.replace('room:', ''), 2))) { rained.push(`${n}: no door to it from outside`); continue; }
      await rest(p, 800);
      const w = await M('weather');
      if (!(w.each[n]?.rain > 100 && w.each.outside?.rain > 100)) rained.push(`${n} through its door from outside: ${JSON.stringify(w.each)}`);
    }
    await M('setWeather', 'clear'); await rest(p, 600);
    check(`${device}: the weather comes over every place out of doors (${outdoors.join(', ')}), and rain falls round you in each, and in one seen through its door`, outdoors.length >= 2 && !rained.length, rained.join(' | '));
    await M('weatherSpeed', 1);

    // every door on the landings leads to its own room
    const wrong = [];
    for (const c of landed) {
      await M('faceDoor', 'hall', c.id, 1.3); await walk(1200);
      const at = (await M('where')).place;
      if (at !== 'room:' + c.id) wrong.push(`${c.id}'s door took you to ${at}`);
    }
    check(`${device}: every door on the landings leads to its own room (${landed.length})`, !wrong.length, wrong.join(', '));
    await shot('5-room');

    // every activity on a computer: played there (the mansion leaves the page completely), ESC BACK
    // comes back to that computer, and so does the Escape key when it came in straight by address
    for (const c of computers) {
      await M('build', 'room:' + c.id); await M('put', 'room:' + c.id, 'computer');
      await p.waitForTimeout(300);
      const offer = await M('target');
      if (opts.hasTouch) await p.tap('#mansion #use'); else await p.keyboard.press('KeyE');
      const inside = await p.waitForFunction(() => !document.getElementById('mansion') && !window.__mansion && document.querySelector('#clubBack[data-ready]'), null, { timeout: 10000 }).then(() => true, () => false);
      await p.waitForTimeout(1500);
      await shot('6-played-' + c.id);
      check(`${device}: ${c.name}: at its computer, it offers to play, and using it starts it with the mansion gone from the page`, !!offer && inside, `offered ${JSON.stringify(offer)}, title ${JSON.stringify(await p.title())}`);
      await p.click('#clubBack', { timeout: 3000 }).catch(() => {});
      const home = await up();
      await p.waitForTimeout(500);
      check(`${device}: ${c.name}: ESC BACK comes back to the mansion, at its computer`, home && (await M('where')).place === 'room:' + c.id && await M('mode') === 'play');
      await p.goto(page + '#' + c.id); await p.reload();   // (only the address's # changing doesn't load the page again)
      await p.waitForFunction(() => document.querySelector('#clubBack[data-ready]'), null, { timeout: 8000 }).catch(() => {});
      await p.keyboard.press('Escape');
      const home2 = await up();
      check(`${device}: ${c.name}: the Escape key comes back too, when it came in by address`, home2 && !(await p.evaluate(() => location.hash)));
    }
    await shot('7-back');

    // pausing, and starting the letter over (only once you say you're sure)
    if (opts.hasTouch) await p.tap('#mansion #pause'); else await p.keyboard.press('Escape');
    await p.waitForTimeout(200);
    await shot('8-paused');
    check(`${device}: ${opts.hasTouch ? 'the pause button' : 'Escape'} pauses`, await M('mode') === 'menu' && await p.isVisible('#menu'));
    check(`${device}: ...with the start-over buttons`, await p.isVisible('#resets button:has-text("INVITATION")'));
    // the volume buttons: MUSIC, SOUNDS, VOICES, each ON, SOFT, OFF (remembered), and ON again
    const tap = async b => { await p.click('#vol-' + b); return [await p.textContent('#vol-' + b), await p.evaluate(k => JSON.parse(localStorage.getItem(k)), 'mansion.' + b), (await M('sound')).levels[b]]; };
    const soft = await tap('music'), offNow = await tap('music');
    const silent = await p.waitForFunction(() => window.__mansion.music().level < 0.01, null, { timeout: 6000 }).then(() => true, () => false);
    const onAgain = await tap('music');
    check(`${device}: the pause menu's MUSIC button goes SOFT, OFF (the theme stops) and ON again, and remembers`, soft[0] === 'MUSIC: SOFT' && soft[2] === 0.45 && offNow[0] === 'MUSIC: OFF'
      && offNow[2] === 0 && silent && onAgain[0] === 'MUSIC: ON' && offNow[1] === 'off' && onAgain[1] === 'on', `${soft[0]}, ${offNow[0]}, ${onAgain[0]}`);
    const others = [];
    for (const b of ['sounds', 'voices']) { const r = [await tap(b), await tap(b), await tap(b)]; others.push(r.map(x => x[0] + ' ' + x[2]).join(', '), r[1][2] === 0 && r[2][2] === 1 && r[2][1] === 'on'); }
    check(`${device}: ...and so do SOUNDS and VOICES`, others[1] && others[3], others.filter(x => typeof x === 'string').join('; '));
    await p.click('#resets button:has-text("INVITATION")');
    await shot('9-sure');
    check(`${device}: a start-over button asks first`, await p.isVisible('#sureYes') && !(await p.isVisible('#resets')));
    await p.click('#sureNo');
    check(`${device}: ...and NO keeps it`, await p.isVisible('#resets') && !(await p.isVisible('#sure')) && await p.evaluate(() => localStorage.getItem('mansion.invited') !== null));
    // each activity's start-over button erases its own saves (all of its card's `keeps`) and nobody else's
    const marks = cards.flatMap(c => (c.keeps || []).map(k => k + 'zz-check')), wrongly = [];
    for (const c of cards.filter(c => c.keeps)) {
      await p.evaluate(ks => ks.forEach(k => localStorage.setItem(k, '1')), marks);
      if (await M('mode') !== 'menu') { if (opts.hasTouch) await p.tap('#mansion #pause'); else await p.keyboard.press('Escape'); await p.waitForTimeout(200); }
      await p.evaluate(name => [...document.querySelectorAll('#resets button')].find(b => b.textContent === name)?.click(), c.name.toUpperCase());
      await p.click('#sureYes', { timeout: 3000 }).catch(() => wrongly.push(`${c.id} has no start-over button`));
      await up();
      const left = await p.evaluate(ks => ks.filter(k => localStorage.getItem(k) !== null), marks), mine = c.keeps.map(k => k + 'zz-check');
      if (left.some(k => mine.includes(k))) wrongly.push(`${c.id} kept some of its own`);
      const gone = marks.filter(k => !mine.includes(k) && !left.includes(k));
      if (gone.length) wrongly.push(`${c.id} erased ${gone.join(' ')}`);
    }
    await p.evaluate(ks => ks.forEach(k => localStorage.removeItem(k)), marks);
    check(`${device}: each activity's START OVER erases its own saves and nobody else's (${cards.filter(c => c.keeps).length})`, !wrongly.length, wrongly.join(', '));
    if (await M('mode') !== 'menu') { if (opts.hasTouch) await p.tap('#mansion #pause'); else await p.keyboard.press('Escape'); await p.waitForTimeout(200); }
    // your saves: how much room they take, SAVE A BACKUP (a file with every save) and LOAD A BACKUP
    // (only once you say yes: every save goes back as it was in the file)
    check(`${device}: the pause menu says how much the saves take`, /SAVES: [\d.]+ [KM]B OF/.test(await p.textContent('#saveNote')), await p.textContent('#saveNote'));
    const download = await Promise.all([p.waitForEvent('download', { timeout: 8000 }), p.click('#saveBackup')]).then(([d]) => d.path(), () => null);
    const file = download ? readFileSync(download, 'utf8') : '{}', made = JSON.parse(file);
    const savedNow = await p.evaluate(() => Object.keys(localStorage).length);
    check(`${device}: ...SAVE A BACKUP gives a file with every save in it`, made.format && Object.keys(made.saves || {}).length === savedNow && made.saves['mansion.invited'], `${Object.keys(made.saves || {}).length} of ${savedNow} saves`);
    await p.evaluate(k => { localStorage.setItem('mansion.music', '"off"'); localStorage.setItem(k + 'extra', '1'); }, junk);
    await p.setInputFiles('#backupFile', { name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(file) });
    await p.waitForSelector('#sure', { state: 'visible', timeout: 5000 }).catch(() => {});   // (the file's read first)
    await shot('8b-load-backup');
    // (right where you asked, in place of the backup buttons, not down under START OVER)
    const asked = await p.evaluate(() => document.querySelector('#saves #sure') !== null && document.querySelector('#backups').hidden && !document.querySelector('#resets').hidden);
    check(`${device}: ...LOAD A BACKUP asks first, right there under YOUR SAVES`, asked && await p.isVisible('#sure') && (await p.textContent('#sureYes')) === 'YES, LOAD IT', `${await p.isVisible('#sure')} ${await p.textContent('#sureYes')} ${await p.textContent('#saveNote')} ${await M('mode')}`);
    await p.click('#sureYes');
    await up();
    const loaded = await p.evaluate(k => [localStorage.getItem('mansion.music'), localStorage.getItem(k + 'extra')], junk);
    check(`${device}: ...and puts every save back as it was`, loaded[0] === '"on"' && loaded[1] === null, JSON.stringify(loaded));
    // nearly full: the pause menu says so
    await p.evaluate(k => localStorage.setItem(k + 'junk', 'x'.repeat(4.2e6)), junk);
    if (opts.hasTouch) await p.tap('#mansion #pause'); else await p.keyboard.press('Escape');
    await p.waitForTimeout(200);
    check(`${device}: ...and warns when the saves are nearly full`, /NEARLY FULL/.test(await p.textContent('#saveNote')), await p.textContent('#saveNote'));
    await p.evaluate(k => localStorage.removeItem(k + 'junk'), junk);
    await p.click('#resume');
    check(`${device}: RESUME carries on`, await M('mode') === 'play');
    if (opts.hasTouch) await p.tap('#mansion #pause'); else await p.keyboard.press('Escape');
    await p.waitForTimeout(200);
    await p.click('#resets button:has-text("INVITATION")');
    await p.click('#sureYes');
    await up();
    check(`${device}: YES starts the invitation over: Sadie's letter is back`, await M('mode') === 'letter');
    // every save written while walking round (and playing every computer's activity) belongs to someone: a card's
    // `keeps` or the mansion's own, so the start-over buttons can always find it
    const keeps = await allKeeps(), keys = await p.evaluate(() => Object.keys(localStorage));
    const stray = keys.filter(k => !keeps.some(s => k.startsWith(s)));
    check(`${device}: every save belongs to an activity's card or the mansion`, keys.length && !stray.length, stray.join(', ') || `${keys.length} saves`);
    check(`${device}: no errors on the page`, !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }));

  // a room whose file won't come (the network hiccuped): its door stays shut, the rest carry on, and
  // it's fetched again once the network's back
  const files = JSON.parse(readFileSync(join(new URL('../..', import.meta.url).pathname, 'dist/game-files.json'), 'utf8'));
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  let cut = true, asked = 0;
  const cutOff = 'room:' + spare.id;
  await ctx.route(url => url.pathname.endsWith('/game/' + files[`src/activities/${spare.id}/room.js`]), r => { asked++; return cut ? r.abort() : r.continue(); });
  const p = await ctx.newPage(), errors = [];
  p.on('pageerror', e => errors.push(e.message));
  const M = (fn, ...a) => p.evaluate(([f, a]) => window.__mansion[f](...a), [fn, a]);
  await p.goto(page);
  await p.waitForFunction(() => window.__mansion && window.__mansion.frames() > 10, null, { timeout: 15000 });
  const failed = await M('build', cutOff);
  const rooms = (await M('places')).filter(n => n.startsWith('room:')).length;
  await p.waitForFunction(n => window.__mansion.built().length >= n, rooms - 1, { timeout: 20000 }).catch(() => {});
  const others = (await M('built')).filter(n => n !== cutOff).length;
  check('a room whose file won\'t load keeps its door shut, and the other rooms still build', !failed && !(await M('built')).includes(cutOff) && others >= rooms - 1 && asked > 0,
    `${spare.id} built: ${failed}, ${others} of ${rooms - 1} other rooms built`);
  cut = false;
  check('...and it\'s built once its file comes', await M('build', cutOff) && (await M('built')).includes(cutOff));
  check('...with no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

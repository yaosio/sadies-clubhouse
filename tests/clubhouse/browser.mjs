// Sadie's clubhouse in a real (hidden) browser, as a phone and as a desktop: run by tools/check.mjs
// (never on its own) with the built page, every time. Fatal errors only (docs/clubhouse/checks/fatal-only.md):
//
// It opens the page at the gate with Sadie's letter (the first time only), walks, goes in through the
// front door, climbs the spiral stairs to both landings, and checks every door leads to its own room,
// every building outside leads to its own room, and every activity on a computer plays there (the
// clubhouse must leave the page completely) and comes back with ESC BACK. Rooms are built after the
// clubhouse opens; a room put away is built again as you walk up to its door; every room put away and
// built again over and over leaves nothing behind (no leak). A place that throws doesn't freeze the
// game. It pauses, each activity's START OVER erases only its own saves, a backup saves and loads, and
// every save belongs to an activity's card. A room whose file won't come keeps its door shut and is
// fetched again later. It names no room: it picks them from the cards. Any error on the page, or
// anything that doesn't work, is a failure. Screenshots go in dist/check/clubhouse/.
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { walk as walkFor, rest, until, DEVICES, pressUse, pressPause } from '../shared/browser.mjs';
import { allKeeps, allCards } from './cards.mjs';
import { DESKTOP } from '../shared/devices.mjs';

const LEAK_MB = 3;   // (how much the page's memory may grow over two more rounds of putting every room away and building it again)

export default async function ({ browser, page, check, outDir, touched = null }) {
  // It names no room: it picks them from the cards, so renaming or adding one never breaks it.
  // (`spare`: the last room on the landings that lives in its room, for putting away; `computers`:
  // every activity played at a computer)
  // `touched` (--since-main: the rooms that differ from main, which passed everything) narrows the loops over
  // every room to those rooms; the clubhouse's own checks, every room being built and any error on the page
  // still run in full. Null: all of them.
  const mine = c => !touched || touched.has(c.id);
  const cards = await allCards(), landed = cards.filter(c => Number.isInteger(c.slot)).sort((a, b) => a.slot - b.slot);
  const spare = landed.filter(c => c.room).at(-1), computers = landed.filter(c => c.start);
  const saver = cards.find(c => c.keeps && c.room), junk = saver.keeps[0];
  // the phone and the desktop at the same time (each in its own browser window)
  await Promise.all(DEVICES.map(async ([device, opts]) => {
    const ctx = await browser.newContext(opts);
    const p = await ctx.newPage(), errors = [];
    p.on('pageerror', e => errors.push(e.message));
    p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    const shot = name => p.screenshot({ path: join(outDir, `${device}-${name}.png`) });
    const M = (fn, ...a) => p.evaluate(([f, a]) => window.__clubhouse[f](...a), [fn, a]);
    const up = () => p.waitForFunction(() => window.__clubhouse && window.__clubhouse.frames() > 10, null, { timeout: 15000 }).then(() => true, () => false);
    const walk = ms => walkFor(p, ms);

    await p.goto(page);
    const opened = await up();
    await p.waitForTimeout(500);
    await shot('1-letter');
    check(`${device}: the clubhouse opens and draws`, opened, errors[0]);
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
        const c = document.querySelector('#clubhouse #view'), r = document.querySelector('#clubhouse #stick').getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
        for (const [type, dy] of steps) c.dispatchEvent(new PointerEvent(type, { pointerId: 7, pointerType: 'touch', clientX: x, clientY: y + dy, bubbles: true }));
        return window.__clubhouse.played();
      }, steps);
      const t0 = await stick([['pointerdown', 0], ['pointermove', -45]]);
      await rest(p, 700, t0);
      await stick([['pointerup', -45]]);
    } else await walk(700);
    const after = await M('where');
    check(`${device}: ${opts.hasTouch ? 'the thumb stick' : 'W'} walks you up the path`, after.z - before.z > 0.8, `moved ${(after.z - before.z).toFixed(2)} m`);

    // the pool in the backyard: in at its gate, up to the edge of the water and no further
    await M('put', 'outside', { x: 0, z: 15, y: 0, yaw: Math.PI, pitch: 0 });
    await walk(3500);
    const edge = await M('where');
    await shot('2b-pool');
    check(`${device}: you walk in at the pool's gate and stop at the water's edge, not in it`, edge.place === 'outside' && edge.z > 17 && edge.z < 20.1, `got to z ${edge.z.toFixed(1)}`);

    // in through the front door: it opens as you come up, and the hall shows through it
    await M('faceDoor', 'outside', 'front', 2.4);
    await walk(350);
    await p.waitForTimeout(500);
    await shot('3-front-door');
    check(`${device}: the front door opens as you come up, showing the hall through it`, await M('looking') === 'hall');
    await walk(700);   // through, and about a metre on: still inside the door's swing
    await shot('4-hall');
    check(`${device}: ...and walking through it takes you into the hall (no loading)`, (await M('where')).place === 'hall');

    // the clubhouse opens before the rooms are built (all but a building outside the gate, which you can
    // see from the town square); the rest are built one at a time while you stand about
    const sp = await M('speed');
    const outsideRooms = await M('outsideRooms');
    check(`${device}: the clubhouse opens without waiting for the rooms`, sp.atFirst.every(n => outsideRooms.includes(n)), `first picture after ${sp.first} ms, with ${sp.atFirst.join(', ') || 'no rooms'} built`);
    const settled = await p.waitForFunction(() => window.__clubhouse.settled(), null, { timeout: 20000 }).then(() => true, () => false);
    check(`${device}: ...and the rooms are built while you stand about`, settled, (await M('built')).join(', '));
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
    const rebuilt = await until(p, n => window.__clubhouse.looking() === n || window.__clubhouse.where().place === n, 'room:' + spare.id, 5000)
      && (await M('built')).includes('room:' + spare.id);
    await shot('4c-built-again');
    check(`${device}: ...walking up to its door builds it again, and the door opens onto it`, rebuilt, rebuilt ? '' : JSON.stringify({ at: await M('where'), looking: await M('looking'), built: (await M('built')).includes('room:' + spare.id) }));
    const k2 = (await M('speed')).kept;
    check(`${device}: ...with nothing piled up`, k2 === k0, `${k0} things kept before, ${k2} after`);
    // one place's mistake in a frame doesn't stop the game: it carries on (and says so once, not an error)
    await M('sabotage', 'hall', true);
    const f0 = await M('frames'); await p.waitForTimeout(600);
    const carried = (await M('frames')) > f0 + 5;
    await M('sabotage', 'hall', false);
    check(`${device}: a place that fails in a frame doesn't freeze the game`, carried, `frames ${f0} then ${await M('frames')}`);
    // every room can be put away and built again, twice over, with nothing piling up (and no copies
    // of anything it puts on the screen)
    const all = (await M('places')).filter(n => n.startsWith('room:') && (!touched || touched.has(n.slice(5))));
    // (and nothing on the page, and none of its saves, changes: built again from its save, it's the
    // same room; each rebuild is as quick as the first build)
    const saves = () => p.evaluate(() => JSON.stringify(Object.keys(localStorage).filter(k => !k.startsWith('mansion.')).sort().map(k => [k, localStorage.getItem(k)])));
    for (const n of all) await M('build', n);   // (the ones put away just now)
    const saved0 = await saves();
    const refused = [], kept = [], onPage = [], heap = [], listeners = [];
    // (what's left in the page's memory after clearing out the garbage, and how many things listen on
    // the window and the document: a room that adds one each time it's built, or never lets go of
    // its things, shows as steady growth)
    const cdp = await ctx.newCDPSession(p);
    const memory = async () => {
      await cdp.send('HeapProfiler.collectGarbage');
      const used = (await cdp.send('Runtime.getHeapUsage')).usedSize;
      let n = 0;
      for (const target of ['window', 'document']) {
        const { result } = await cdp.send('Runtime.evaluate', { expression: target });
        n += (await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId })).listeners.length;
      }
      return [used, n];
    };
    for (let round = 0; round < 3; round++) {
      for (const n of all) { if (!(await M('putAway', n))) refused.push(n); await M('build', n); }
      kept.push((await M('speed')).kept);
      onPage.push(await p.evaluate(() => document.querySelectorAll('*').length));
      const [used, n] = await memory(); heap.push(used); listeners.push(n);
    }
    const saved1 = await saves();
    await M('onlyDoors', false);
    // (the first time round, a room outside the gate keeps its house's pictures from its first build)
    check(`${device}: ...every room can be put away and built again, over and over`, !refused.length && kept[1] === kept[0] && kept[2] === kept[0], `${[...new Set(refused)].join(', ') || 'all of them'}; things kept each time round: ${kept.join(', ')}`);
    check(`${device}: ...and leaves no copies behind on the page`, onPage[1] === onPage[0] && onPage[2] === onPage[0], `things on the page each time round: ${onPage.join(', ')}`);
    const growth = heap[2] - heap[0];
    check(`${device}: ...and leaks nothing: no growing memory (under ${LEAK_MB} MB over two more rounds) and no listeners left on the window or page`, growth < LEAK_MB * 1e6 && listeners[2] === listeners[0],
      `memory ${heap.map(h => (h / 1e6).toFixed(1)).join(', ')} MB, listeners ${listeners.join(', ')}`);
    check(`${device}: ...and every room's save is just as it was`, saved1 === saved0, saved1 === saved0 ? '' : `before ${saved0.slice(0, 300)} after ${saved1.slice(0, 300)}`);

    // every door on the landings leads to its own room
    const wrong = [];
    for (const c of landed.filter(mine)) {
      await M('faceDoor', 'hall', c.id, 1.3); await walk(1200);
      const at = (await M('where')).place;
      if (at !== 'room:' + c.id) wrong.push(`${c.id}'s door took you to ${at}`);
    }
    check(`${device}: every door on the landings leads to its own room (${landed.length})`, !wrong.length, wrong.join(', '));
    await shot('5-room');

    // ...and so does every building outside (a plot round the town square, a spot in the grounds): walk in through
    // its door, or its arch, from outside, and you're in its room
    const buildings = cards.filter(c => mine(c) && c.room && (c.lot !== undefined || c.grounds !== undefined)), wrongOut = [];
    for (const c of buildings) {
      await M('build', 'room:' + c.id);
      if (!(await M('faceDoor', 'outside', c.id, 1.3))) { wrongOut.push(`${c.id}: no door to it from outside`); continue; }
      await walk(1200);
      const at = (await M('where')).place;
      if (at !== 'room:' + c.id) wrongOut.push(`${c.id}'s door took you to ${at}`);
    }
    check(`${device}: every building outside leads to its own room (${buildings.length})`, (touched || buildings.length >= 1) && !wrongOut.length, wrongOut.join(', '));

    // every activity on a computer: played there (the clubhouse leaves the page completely), ESC BACK
    // comes back to that computer, and so does the Escape key when it came in straight by address
    for (const c of computers.filter(mine)) {
      await M('build', 'room:' + c.id); await M('put', 'room:' + c.id, 'computer');
      await p.waitForTimeout(300);
      const offer = await M('target');
      await pressUse(p, opts);
      const inside = await p.waitForFunction(() => !document.getElementById('clubhouse') && !window.__clubhouse && document.querySelector('#clubBack[data-ready]'), null, { timeout: 10000 }).then(() => true, () => false);
      await p.waitForTimeout(1500);
      await shot('6-played-' + c.id);
      check(`${device}: ${c.name}: at its computer, it offers to play, and using it starts it with the clubhouse gone from the page`, !!offer && inside, `offered ${JSON.stringify(offer)}, title ${JSON.stringify(await p.title())}`);
      await p.click('#clubBack', { timeout: 3000 }).catch(() => {});
      const home = await up();
      await p.waitForTimeout(500);
      check(`${device}: ${c.name}: ESC BACK comes back to the clubhouse, at its computer`, home && (await M('where')).place === 'room:' + c.id && await M('mode') === 'play');
      await p.goto(page + '#' + c.id); await p.reload();   // (only the address's # changing doesn't load the page again)
      await p.waitForFunction(() => document.querySelector('#clubBack[data-ready]'), null, { timeout: 8000 }).catch(() => {});
      await p.keyboard.press('Escape');
      const home2 = await up();
      check(`${device}: ${c.name}: the Escape key comes back too, when it came in by address`, home2 && !(await p.evaluate(() => location.hash)));
    }
    await shot('7-back');

    // pausing, and starting the letter over (only once you say you're sure)
    await pressPause(p, opts);
    await p.waitForTimeout(200);
    await shot('8-paused');
    check(`${device}: ${opts.hasTouch ? 'the pause button' : 'Escape'} pauses`, await M('mode') === 'menu' && await p.isVisible('#menu'));
    check(`${device}: ...with the start-over buttons`, await p.isVisible('#resets button:has-text("INVITATION")'));
    await p.evaluate(() => localStorage.setItem('mansion.music', '"on"'));   // (the backup below has one setting to put back)
    await p.click('#resets button:has-text("INVITATION")');
    await shot('9-sure');
    check(`${device}: a start-over button asks first`, await p.isVisible('#sureYes') && !(await p.isVisible('#resets')));
    await p.click('#sureNo');
    check(`${device}: ...and NO keeps it`, await p.isVisible('#resets') && !(await p.isVisible('#sure')) && await p.evaluate(() => localStorage.getItem('mansion.invited') !== null));
    // each activity's start-over button erases its own saves (all of its card's `keeps`) and nobody else's
    const marks = cards.flatMap(c => (c.keeps || []).map(k => k + 'zz-check')), wrongly = [];
    for (const c of cards.filter(c => c.keeps && mine(c))) {
      await p.evaluate(ks => ks.forEach(k => localStorage.setItem(k, '1')), marks);
      if (await M('mode') !== 'menu') { await pressPause(p, opts); await p.waitForTimeout(200); }
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
    if (await M('mode') !== 'menu') { await pressPause(p, opts); await p.waitForTimeout(200); }
    // your saves: how much room they take, SAVE A BACKUP (a file with every save) and LOAD A BACKUP
    // (only once you say yes: every save goes back as it was in the file)
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
    await pressPause(p, opts);
    await p.waitForTimeout(200);
    await p.click('#resume');
    check(`${device}: RESUME carries on`, await M('mode') === 'play');
    await pressPause(p, opts);
    await p.waitForTimeout(200);
    await p.click('#resets button:has-text("INVITATION")');
    await p.click('#sureYes');
    await up();
    check(`${device}: YES starts the invitation over: Sadie's letter is back`, await M('mode') === 'letter');
    // every save written while walking round (and playing every computer's activity) belongs to someone: a card's
    // `keeps` or the clubhouse's own, so the start-over buttons can always find it
    const keeps = await allKeeps(), keys = await p.evaluate(() => Object.keys(localStorage));
    const stray = keys.filter(k => !keeps.some(s => k.startsWith(s)));
    check(`${device}: every save belongs to an activity's card or the clubhouse`, keys.length && !stray.length, stray.join(', ') || `${keys.length} saves`);
    check(`${device}: no errors on the page`, !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }));

  // a room whose file won't come (the network hiccuped): its door stays shut, the rest carry on, and
  // it's fetched again once the network's back
  const files = JSON.parse(readFileSync(join(new URL('../..', import.meta.url).pathname, 'dist/game-files.json'), 'utf8'));
  const ctx = await browser.newContext(DESKTOP);
  let cut = true, asked = 0;
  const cutOff = 'room:' + spare.id;
  await ctx.route(url => url.pathname.endsWith('/game/' + files[`src/activities/${spare.id}/room.js`]), r => { asked++; return cut ? r.abort() : r.continue(); });
  const p = await ctx.newPage(), errors = [];
  p.on('pageerror', e => errors.push(e.message));
  const M = (fn, ...a) => p.evaluate(([f, a]) => window.__clubhouse[f](...a), [fn, a]);
  await p.goto(page);
  await p.waitForFunction(() => window.__clubhouse && window.__clubhouse.frames() > 10, null, { timeout: 15000 });
  const failed = await M('build', cutOff);
  const rooms = (await M('places')).filter(n => n.startsWith('room:')).length;
  await p.waitForFunction(n => window.__clubhouse.built().length >= n, rooms - 1, { timeout: 20000 }).catch(() => {});
  const others = (await M('built')).filter(n => n !== cutOff).length;
  check('a room whose file won\'t load keeps its door shut, and the other rooms still build', !failed && !(await M('built')).includes(cutOff) && others >= rooms - 1 && asked > 0,
    `${spare.id} built: ${failed}, ${others} of ${rooms - 1} other rooms built`);
  cut = false;
  check('...and it\'s built once its file comes', await M('build', cutOff) && (await M('built')).includes(cutOff));
  check('...with no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

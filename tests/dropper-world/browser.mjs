// Dropper World in a real (hidden) browser, as a phone and as a desktop: run by tools/check.mjs
// (never on its own) with the built page, whenever this activity's code, its tools, the clubhouse's
// shell, the toolbox or the build changed since these last passed. The phone and the desktop run
// side by side; the slow-phone measurement runs after, on its own, so nothing else skews it.
//
// It opens a new game, checks the 90s frame gives the board most of the screen, taps Sadie and the
// mole to watch them in the dashboard (their faces drawn), opens the dev sheet, loads
// a full board (400 pieces, bedrock melting; made by tools/dropper-world/fullboard.mjs), reloads it
// to see that it saved, and measures how smooth the full board runs on a phone 4x slower than this
// machine. Screenshots of each go in dist/check/dropper-world/ to look at. Any error on the page,
// or anything that doesn't work, is a failure; the smoothness numbers are only reported.
import { readFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const SAVE_KEY = 'sadies-dropper-world.save';

// ---------- a full board to load (remade only when the game's code changes) ----------
// tools/check.mjs starts this before the headless tests, so the board (about a minute and a half of
// work) is made alongside them rather than after. Resolves to the save's text, or an Error.
export function prepare({ root, hashOf, dir }) {
  const boardFile = join(dir, 'fullboard-' + hashOf(['src/activities/dropper-world/core', 'src/activities/dropper-world/config.js', 'tools/dropper-world/fullboard.mjs']) + '.json');
  if (existsSync(boardFile)) return Promise.resolve(readFileSync(boardFile, 'utf8'));
  for (const f of readdirSync(dir)) if (/^fullboard-.*\.json$/.test(f)) rmSync(join(dir, f));
  console.log('(making a full board in the background: the game changed since the last one)');
  return new Promise(done => {
    const c = spawn(process.execPath, ['tools/dropper-world/fullboard.mjs', boardFile], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
    let text = ''; c.stdout.on('data', d => text += d); c.stderr.on('data', d => text += d);
    c.on('close', code => done(code === 0 ? readFileSync(boardFile, 'utf8') : new Error(text.trim() || 'fullboard.mjs failed')));
  });
}

export default async function ({ browser, page, check, root, hashOf, outDir, prepared }) {
  const board = await (prepared ?? prepare({ root, hashOf }));
  if (board instanceof Error) { check('make a full board', false, board.message); return; }
  const boardPieces = JSON.parse(board).pieces?.length;

  const shot = (p, name) => p.screenshot({ path: join(outDir, name + '.png') });
  const wait = (p, ms) => p.waitForTimeout(ms);
  const debugInfo = p => p.evaluate(() => window.__jellyDebug());
  const thought = p => p.evaluate(() => window.__jellyDebug().dash); // what the dashboard says about whoever it's watching
  // how much of the face in the dashboard is drawn (not the plain sky behind it), 0 to 1
  const faceDrawn = p => p.evaluate(() => { const d = document.getElementById('face').getContext('2d').getImageData(0, 0, 26, 26).data; let n = 0;
    for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 0x57) + Math.abs(d[i + 1] - 0xc8) + Math.abs(d[i + 2] - 0xff) > 30) n++; return n / 676; });

  const DEVICES = [
    ['phone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
    ['desktop', { viewport: { width: 1280, height: 800 } }],
  ];

  async function open(device, opts, save) {
    const ctx = await browser.newContext(opts);
    // the web font can't be fetched from here; answer with nothing rather than log a network error
    // the save goes in before the game starts, once; after that the game's own saves take over
    if (save) await ctx.addInitScript(([k, s]) => { try { if (!sessionStorage.getItem('check.planted')) { localStorage.setItem(k, s); sessionStorage.setItem('check.planted', '1'); } } catch { /* a frame with no storage of its own */ } }, [SAVE_KEY, save]);
    const p = await ctx.newPage();
    p.errors = [];
    p.on('pageerror', e => p.errors.push(e.message));
    p.on('console', m => { if (m.type() === 'error') p.errors.push(m.text()); });
    await p.goto(page + '#dropper-world');
    // (the game's own file comes after the page: wait for it)
    await p.waitForFunction(() => window.__jellyDebug, null, { timeout: 15000 }).catch(() => {});
    return p;
  }

  // the phone and the desktop at the same time (each in its own browser window)
  await Promise.all(DEVICES.map(async ([device, opts]) => {
    const tap = (p, x, y) => opts.hasTouch ? p.touchscreen.tap(x, y) : p.mouse.click(x, y);

    // a new game: the mole digs up the first hay and flings it, then drops pieces
    let p = await open(device, opts);
    await p.waitForFunction(() => window.__jellyDebug().moleHay, null, { timeout: 5000 }).catch(() => {});
    let d = await debugInfo(p);
    await p.evaluate(m => window.__jellyLook(m.x, m.y - 1, 2), d.mole); await wait(p, 100);
    await shot(p, `${device}-0-mole-digs-hay`);
    check(`${device}: a new game starts with the mole digging up hay`, d.moleHay);
    await p.evaluate(() => window.__jellyLook(24, 3, 0.5)); await wait(p, 1500);
    await shot(p, `${device}-0b-hay-flung`);
    await wait(p, 6400);
    d = await debugInfo(p);
    await p.evaluate(() => window.__jellyFollow()); await wait(p, 1500); // back to following Sadie
    d = await debugInfo(p);
    await shot(p, `${device}-1-new-game`);
    check(`${device}: a new game starts and the mole drops pieces`, d.pieces > 0, `${d.pieces} pieces after 8 s`);
    check(`${device}: ...and has flung out 3 bundles of hay`, d.hayOut.length + d.hay >= 3, `${d.hayOut.join(', ')}${d.hay ? `, and Sadie has eaten ${d.hay}` : ''}`);

    await tap(p, d.sx, d.sy); await wait(p, 400);
    const sadieSays = await thought(p);
    await shot(p, `${device}-2-sadie-thinks`);
    check(`${device}: tapping Sadie shows what she's thinking`, /sadie/i.test(sadieSays), JSON.stringify(sadieSays.split('\n')[0]));

    // the frame: the board gets most of the screen, and the modern bits are gone from it
    const frame = await p.evaluate(() => { const b = document.getElementById('board').getBoundingClientRect();
      return { share: b.width * b.height / (innerWidth * innerHeight), old: ['thought', 'tip', 'toast', 'aimTip'].filter(id => document.getElementById(id)) }; });
    check(`${device}: the board gets most of the screen, with nothing modern left on it`, frame.share > 0.6 && !frame.old.length,
      `board ${Math.round(frame.share * 100)}% of the screen${frame.old.length ? ', still there: ' + frame.old.join(', ') : ''}`);
    // the ESC BACK key never covers the name, and the board and dashboard never change size (a
    // resize wipes the board's picture): watch them while switching who's watched and news comes in
    const sizes = () => p.evaluate(() => ['board', 'dash'].map(id => { const r = document.getElementById(id).getBoundingClientRect(); return `${r.width}x${r.height}`; }).join(' '));
    const firstSize = await sizes(), seen = new Set([firstSize]);
    for (const who of ['mole', 'sadie', 'mole', 'sadie']) {
      await p.evaluate(w => { const b = document.querySelector(`.stamp[data-who="${w}"]`); b.click(); }, who); await wait(p, 700); seen.add(await sizes());
    }
    await p.evaluate(() => document.getElementById('dash').click()); await wait(p, 300); seen.add(await sizes()); // the "why" pop-up (phone)
    await p.evaluate(() => document.getElementById('dash').click()); await wait(p, 300);
    check(`${device}: the board and dashboard stay one size`, seen.size === 1, [...seen].join(' / '));
    const clash = await p.evaluate(() => { const b = document.getElementById('clubBack').getBoundingClientRect(), l = document.querySelector('.mlogo').getBoundingClientRect(); return b.right > l.left ? `ESC BACK ends at ${Math.round(b.right)} px, the name starts at ${Math.round(l.left)} px` : ''; });
    check(`${device}: ESC BACK doesn't cover the name`, !clash, clash);
    // every box of words in the dashboard shows whole lines (never half a line cut off), and nothing's cut off sideways
    const cut = await p.evaluate(() => [...document.querySelectorAll('#dash .scroll, #dash .name, #dash .feel span')].filter(e => e.offsetParent).flatMap(e => {
      const line = parseFloat(getComputedStyle(e).lineHeight), bad = [];
      if (e.classList.contains('scroll') && Math.abs(e.clientHeight / line - Math.round(e.clientHeight / line)) > 0.05) bad.push(`${e.id || e.className} is ${e.clientHeight} px tall, lines are ${line} px`);
      if (e.scrollWidth > e.clientWidth + 1) bad.push(`${e.id || e.className} is cut off sideways`);
      if (!e.classList.contains('scroll') && e.scrollHeight > e.clientHeight + 1) bad.push(`${e.id || e.className} is cut off top or bottom`);
      return bad; }));
    check(`${device}: the dashboard's words are never cut off`, !cut.length, cut.join('; '));
    check(`${device}: the dashboard shows Sadie's face`, await faceDrawn(p) > 0.1, `${Math.round(await faceDrawn(p) * 100)}% of the picture drawn`);

    // it flies about, so look right at it and tap where it is now (a few tries, in case it moved)
    let moleSays = '';
    for (let tries = 0; tries < 3 && !/mole/i.test(moleSays); tries++) {
      d = await debugInfo(p);
      await p.evaluate(m => window.__jellyLook(m.x, m.y, 2), d.mole); await wait(p, 100);
      d = await debugInfo(p);
      await tap(p, d.mole.sx, d.mole.sy); await wait(p, 400);
      moleSays = await thought(p);
    }
    await shot(p, `${device}-3-mole-thinks`);
    check(`${device}: tapping the mole shows what it's thinking`, /mole/i.test(moleSays), JSON.stringify(moleSays.split('\n')[0]));
    await wait(p, 200);
    check(`${device}: ...and its face`, await faceDrawn(p) > 0.1, `${Math.round(await faceDrawn(p) * 100)}% of the picture drawn`);

    // Chooter, before they meet: "Peek in" in the dev sheet, then look at his head and tap it
    await p.click('#settingsBtn'); await wait(p, 400); await p.click('#peekChooter'); await p.click('#closeSheet');
    await p.waitForFunction(() => window.__jellyDebug().peek?.out >= 1, null, { timeout: 15000 }).catch(() => {});
    d = await debugInfo(p);
    await p.evaluate(k => window.__jellyLook(k.x < 24 ? k.x + 3 : k.x - 3, k.y, 2), d.peek); await wait(p, 100); // from inside the board
    d = await debugInfo(p);
    await shot(p, `${device}-3b-chooter-peeks`);
    await tap(p, d.peek.sx + (d.peek.x < 24 ? 8 : -8), d.peek.sy); await wait(p, 400);
    const chooterSays = await thought(p);
    await shot(p, `${device}-3c-chooter-thinks`);
    check(`${device}: before they meet, Chooter peeks in and can be tapped`, d.peek.out >= 1 && /noise/i.test(chooterSays), JSON.stringify(chooterSays.split('\n').slice(0, 2).join(' / ')));

    await p.click('#settingsBtn'); await wait(p, 500);
    await shot(p, `${device}-4-dev-sheet`);
    const sheetOpen = await p.evaluate(() => document.getElementById('sheet').classList.contains('open'));
    await p.click('#closeSheet'); await wait(p, 400);
    const sheetShut = await p.evaluate(() => !document.getElementById('sheet').classList.contains('open'));
    check(`${device}: the dev sheet opens and closes`, sheetOpen && sheetShut);
    check(`${device}: no errors on the page (new game)`, !p.errors.length, p.errors.slice(0, 3).join(' | '));
    await p.context().close();

    // a full board, and it saves: reload and it's still there
    p = await open(device, opts, board);
    await wait(p, 6000);
    const loaded = await debugInfo(p);
    await shot(p, `${device}-5-full-board`);
    check(`${device}: a full board loads from a save`, Math.abs(loaded.pieces - boardPieces) <= 15, `${loaded.pieces} pieces, the save had ${boardPieces}`);
    // it saves as the page closes; right after reopening, everything should be where it was
    const before = await debugInfo(p);
    await p.reload(); await p.waitForFunction(() => window.__jellyDebug);
    const after = await debugInfo(p);
    const moved = Math.hypot(after.cx - before.cx, after.cy - before.cy);
    check(`${device}: closing and reopening keeps the board`, Math.abs(after.pieces - before.pieces) <= 3 && moved < 2,
      `${after.pieces} pieces (was ${before.pieces}), Sadie ${moved.toFixed(1)} blocks from where she was`);
    check(`${device}: no errors on the page (full board)`, !p.errors.length, p.errors.slice(0, 3).join(' | '));
    await p.context().close();
  }));

  // how smooth a full board is on a slow phone (reported, not a pass/fail)
  {
    const p = await open('phone', DEVICES[0][1], board);
    await p.evaluate(() => localStorage.setItem('jellystack.perf', 'true')); await p.reload();
    const cdp = await p.context().newCDPSession(p);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await wait(p, 15000);
    const stats = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('#perfList dt')].map(d => [d.textContent, d.nextElementSibling.textContent])));
    await shot(p, 'phone-6-slow-phone-stats');
    console.log(`INFO  full board on a phone 4x slower than this machine (rough, a hidden browser draws slower than a real one): ${Object.entries(stats).map(([k, v]) => k + ' ' + v).join(', ')}`);
    check('slow phone: no errors on the page', !p.errors.length, p.errors.slice(0, 3).join(' | '));
    await p.context().close();
  }
}

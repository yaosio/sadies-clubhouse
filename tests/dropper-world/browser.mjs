// Dropper World in a real (hidden) browser, as a phone and as a desktop: run by tools/check.mjs
// (never on its own) with the built page, whenever this activity's code, its tools, the clubhouse's
// shell, the toolbox or the build changed since these last passed. The phone and the desktop run
// side by side.
//
// Fatal errors only (docs/clubhouse/checks/fatal-only.md). It opens a new game, loads a full board
// (400 pieces, bedrock melting; made by tools/dropper-world/fullboard.mjs) and reloads it to see that
// it saved. Screenshots in dist/check/dropper-world/. Any error on the page is a failure.
import { readFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { DEVICES } from '../shared/browser.mjs';

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
    // a new game starts and the mole drops pieces
    let p = await open(device, opts);
    await wait(p, 4000);
    const d = await debugInfo(p);
    await shot(p, `${device}-1-new-game`);
    check(`${device}: a new game starts and the mole drops pieces`, d.pieces > 0, `${d.pieces} pieces after 4 s`);

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
}

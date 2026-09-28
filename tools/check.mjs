// Checks everything before a change goes anywhere: the headless tests, a fresh build, and the built
// page played in a real (hidden) browser, as a phone and as a desktop.
//
//   npm run check                  everything (the tests take about 3.5 minutes)
//   npm run check -- --quick       skip the headless tests (for a quick look while working)
//   npm run check -- --preview     build and check the test version (the one for the test page)
//   npm run check -- --retest      run the tests even if they already passed on this exact code
//   npm run check -- --live <file> the live game page, saved: if its embedded src/, tests/ and
//                                  package.json are exactly these, the tests count as passed
//
// The tests only depend on src/, tests/ and package.json, so once they've passed on exactly those
// files they aren't run again until something there changes. This session remembers it in dist/,
// which makes the check at merge time quick when the branch was checked here. A fresh session has
// no memory of it, but the live game page does: it's only ever published after passing, and it
// carries its own source. So with --live (the page read before publishing anyway), a change that
// doesn't touch the game's code (docs, art, tools) merges without re-running the tests.
//
// In the browser it opens a new game, taps Sadie and the mole to read their thoughts, opens the dev
// sheet, loads a full board (400 pieces, bedrock melting; made by tools/fullboard.mjs), reloads it
// to see that it saved, and measures how smooth the full board runs on a phone 4x slower than this
// machine. Screenshots of each go in dist/check/ to look at. Any error on the page, or anything
// that doesn't work, is a failure; the smoothness numbers are only reported.
//
// Needs Playwright with Chromium (already on Claude's cloud machines; not a project dependency).
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createServer } from 'node:http';

const root = new URL('..', import.meta.url).pathname;
const args = process.argv.slice(2);
const quick = args.includes('--quick'), preview = args.includes('--preview');
const outDir = join(root, 'dist/check');
const SAVE_KEY = 'sadies-dropper-world.save';

let failed = 0;
function check(name, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
  if (!ok) failed++;
}
function run(label, cmd, cmdArgs) {
  console.log(`\n== ${label}`);
  const r = spawnSync(cmd, cmdArgs, { cwd: root, stdio: 'inherit' });
  return r.status === 0;
}

// ---------- 1. the headless tests (unless they passed on this exact code already), and the build ----------
function hashOf(paths) {
  const h = createHash('sha1');
  const add = p => {
    const full = join(root, p);
    if (statSync(full).isDirectory()) { for (const f of readdirSync(full).sort()) add(join(p, f)); }
    else h.update(p).update(readFileSync(full));
  };
  paths.forEach(add);
  return h.digest('hex').slice(0, 12);
}
mkdirSync(join(root, 'dist'), { recursive: true });
// Is the code under test exactly what the saved live page was built from?
function sameAsLive(file) {
  const m = readFileSync(file, 'utf8').match(/<script type="application\/json" id="jelly-source">([\s\S]*?)<\/script>/);
  if (!m) return 'no embedded source in ' + file;
  const live = JSON.parse(m[1]).files, ours = new Set();
  const walk = p => {
    if (statSync(join(root, p)).isDirectory()) { for (const f of readdirSync(join(root, p))) walk(join(p, f)); }
    else ours.add(p);
  };
  ['src', 'tests', 'package.json'].forEach(walk);
  const theirs = Object.keys(live).filter(p => p === 'package.json' || p.startsWith('src/') || p.startsWith('tests/'));
  for (const p of theirs) if (!ours.has(p)) return p + ' is on the live page but not here';
  for (const p of ours) if (live[p] !== readFileSync(join(root, p), 'utf8')) return p + ' differs from the live page';
  return null;
}
if (!quick) {
  const passed = join(root, 'dist/tests-passed-' + hashOf(['src', 'tests', 'package.json']));
  const liveAt = args.indexOf('--live'), liveFile = liveAt >= 0 ? args[liveAt + 1] : null;
  if (liveFile && !existsSync(passed) && !args.includes('--retest')) {
    const why = sameAsLive(liveFile);
    if (why) console.log(`\n== live page\nthe game's code isn't the same as the live page's (${why}), so the tests run`);
    else {
      console.log('\n== live page\nthe game\'s code is exactly what the live page was built from, and that passed');
      writeFileSync(passed, 'same as the live page, ' + new Date().toISOString() + '\n');
    }
  }
  if (existsSync(passed) && !args.includes('--retest')) {
    console.log('\n== headless tests\nalready passed on exactly this code (src/ and tests/ unchanged), not running them again');
  } else {
    const ok = run('headless tests', 'node', ['tests/run.mjs']);
    check('headless tests (npm test)', ok);
    if (ok) {
      for (const f of readdirSync(join(root, 'dist'))) if (f.startsWith('tests-passed-')) rmSync(join(root, 'dist', f));
      writeFileSync(passed, new Date().toISOString() + '\n');
    }
  }
}
if (!run('build', 'node', ['tools/build.mjs', ...(preview ? ['--preview'] : [])])) {
  console.log('\nthe build failed, nothing else to check'); process.exit(1);
}

// ---------- 2. a full board to load (remade only when the game's code changes) ----------
const boardFile = join(root, 'dist/fullboard-' + hashOf(['src/core', 'src/config.js', 'tools/fullboard.mjs']) + '.json');
if (!existsSync(boardFile)) {
  for (const f of readdirSync(join(root, 'dist'))) if (/^fullboard-.*\.json$/.test(f)) rmSync(join(root, 'dist', f));
  if (!run('making a full board (about two minutes, only when the game changed)', 'node', ['tools/fullboard.mjs', boardFile])) { check('make a full board', false); process.exit(1); }
}
const board = readFileSync(boardFile, 'utf8');
const boardPieces = JSON.parse(board).pieces?.length;

// ---------- 3. the page in a browser ----------
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch {
  try { ({ chromium } = require(join(spawnSync('npm', ['root', '-g']).stdout.toString().trim(), 'playwright'))); }
  catch { console.log('\nPlaywright is not installed, so the browser checks can\'t run'); process.exit(1); }
}
rmSync(outDir, { recursive: true, force: true }); mkdirSync(outDir, { recursive: true });
// served from a local web address, like the real page (opened as a file:// the browser now and
// then forgets its saved storage on a reload, which real players never see)
const server = createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(readFileSync(join(root, 'dist/index.html')));
});
await new Promise(ok => server.listen(0, '127.0.0.1', ok));
const page = `http://127.0.0.1:${server.address().port}/`;
const shot = (p, name) => p.screenshot({ path: join(outDir, name + '.png') });
const wait = (p, ms) => p.waitForTimeout(ms);
const debugInfo = p => p.evaluate(() => window.__jellyDebug());
const thought = p => p.evaluate(() => { const t = document.getElementById('thought'); return t.hidden ? '' : t.innerText.trim(); });

const DEVICES = [
  ['phone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
  ['desktop', { viewport: { width: 1280, height: 800 } }],
];

console.log('\n== in a browser');
const browser = await chromium.launch();
async function open(device, opts, save) {
  const ctx = await browser.newContext(opts);
  // the web font can't be fetched from here; answer with nothing rather than log a network error
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  // the save goes in before the game starts, once; after that the game's own saves take over
  if (save) await ctx.addInitScript(([k, s]) => { if (!sessionStorage.getItem('check.planted')) { localStorage.setItem(k, s); sessionStorage.setItem('check.planted', '1'); } }, [SAVE_KEY, save]);
  const p = await ctx.newPage();
  p.errors = [];
  p.on('pageerror', e => p.errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error') p.errors.push(m.text()); });
  await p.goto(page);
  return p;
}

for (const [device, opts] of DEVICES) {
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

  // the mole's bubble, the camera following Sadie as usual: it should sit up in the sky above the
  // mole (the camera makes room), not down over the pile
  let above = null;
  for (let tries = 0; tries < 20 && above === null; tries++) {
    d = await debugInfo(p);
    const vw = await p.evaluate(() => innerWidth);
    if (d.follow && d.mole.sx > 40 && d.mole.sx < vw - 40 && d.mole.sy > 80) {
      await tap(p, d.mole.sx, d.mole.sy); await wait(p, 1500);
      if (/mole/i.test(await thought(p))) {
        d = await debugInfo(p);
        const box = await p.evaluate(() => document.getElementById('thought').getBoundingClientRect().toJSON());
        // above it, or off to one side of it (a wide screen): either way not over the pile below it
        above = box.bottom <= d.mole.sy + 4 || box.right <= d.mole.sx - 20 || box.left >= d.mole.sx + 20 ? true
          : `bubble ${Math.round(box.left)}-${Math.round(box.right)} across, bottom at ${Math.round(box.bottom)} px; the mole at ${Math.round(d.mole.sx)}, ${Math.round(d.mole.sy)} px`;
      }
    } else await wait(p, 500);
  }
  await shot(p, `${device}-2b-mole-bubble-above`);
  check(`${device}: the mole's thought bubble sits above it or beside it, not over the pile`, above === true, above === null ? 'never got to tap it' : above === true ? '' : above);

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
}

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
await browser.close();
server.close();

console.log(`\nscreenshots in dist/check/`);
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);

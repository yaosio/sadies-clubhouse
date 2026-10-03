// Checks everything before a change goes anywhere: each activity's headless tests, a fresh build,
// and the built page played in a real (hidden) browser, as a phone and as a desktop.
//
//   npm run check                  everything (about 11 minutes here if nothing can be skipped)
//   npm run check -- --quick       skip the headless tests (for a quick look while working)
//
// It starts with the code checker (ESLint, `npm run lint`, a few seconds, every time): it finds
// mistakes like a misspelt name or a leftover that's never used, without running anything. Then
// tools/docs.mjs: the docs are small, listed, true to their pointers and shaped alike.
//   npm run check -- --preview     build and check the test version (the one for the test page)
//   npm run check -- --retest      run everything even if it already passed on this exact code
//   npm run check -- --live <file> the live game page, saved (with its game/source-*.json beside it): an activity whose code is exactly
//                                  what that page was built from counts as having passed its tests
//   npm run check -- --only a,b    just those activities ('clubhouse': the mansion's own checks)
//   npm run check -- --plan        just print which activities still need checking (for GitHub)
//   npm run check -- --no-lint     skip the code checker (GitHub runs it once for the whole change)
//
// On GitHub (.github/workflows/check.yml) every pull request runs this too, each activity that needs
// it on a computer of its own, all at once, remembering what passed between runs.
//
// Each activity is checked on its own, so a change to one never means retesting the others:
//   - its headless tests (tests/<activity>/run.mjs) depend only on its own folder
//     (src/activities/<activity>/), its tests, the shared toolbox (src/shared/) and what everything
//     runs on (package.json, package-lock.json, .nvmrc);
//   - its browser checks (tests/<activity>/browser.mjs) depend on those plus its own tools
//     (tools/<activity>/), the clubhouse's shell (the files directly in src/; not the mansion in
//     src/clubhouse/, which an activity on a computer never needs, unlike a game that lives in its
//     room, like Brickbuster) and the build and check tools (and GitHub's own steps for them).
// Once either has passed on exactly those files it isn't run again until one of them changes. This
// session remembers it in dist/, which makes the check at merge time quick when the branch was
// checked here. A fresh session has no memory of it, but the live game page does: it's only ever
// published after passing, and it carries a copy of its project. So with --live (the page read before
// publishing anyway), an activity whose code the change doesn't touch skips its tests.
//
// The browser checks always build the page, then walk round Sadie's mansion, the clubhouse
// (tests/clubhouse/browser.mjs: about half a minute). It has every activity's door, so it runs again
// after any change to anything in the page. Each check plays the phone and the desktop side by side.
// Screenshots go in dist/check/clubhouse/ and dist/check/<activity>/ to look at.
//
// Where the time goes is printed after each stage. Anything an activity's browser checks need made
// first (Dropper World's full board) is made in the background while the headless tests run.
//
// Needs Playwright's Chromium (already on Claude's cloud machines; `npm install` brings Playwright
// itself, and GitHub fetches the browser).
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { serve } from './serve.mjs';
import { readSource } from './source.mjs';
import { activityIds } from './activities.mjs';
import { allCards } from '../tests/clubhouse/cards.mjs';
import { keepSample, oldSaves } from '../tests/shared/saves.mjs';
import { roomEars, houseEars } from '../tests/shared/ears.mjs';
import { computerLooks } from '../tests/shared/looks.mjs';

const root = new URL('..', import.meta.url).pathname;
const args = process.argv.slice(2);
const quick = args.includes('--quick'), preview = args.includes('--preview'), retest = args.includes('--retest'), lint = !args.includes('--no-lint');
const valueOf = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
// --only a,b (or a+b): just those activities ('clubhouse' for the mansion), as GitHub does on each computer
const only = valueOf('--only')?.split(/[,+]/), wanted = a => !only || only.includes(a);
const outDir = join(root, 'dist/check');

let failed = 0;
function check(name, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
  if (!ok) failed++;
}
function run(label, cmd, cmdArgs) {
  console.log(`\n== ${label}`);
  const t = Date.now(), r = spawnSync(cmd, cmdArgs, { cwd: root, stdio: 'inherit' });
  took(t);
  return r.status === 0;
}
// how long a stage took, so it's plain where the time goes
const started = Date.now();
const took = t => console.log(`(${Math.round((Date.now() - t) / 1000)} s)`);

function hashOf(paths) {
  const h = createHash('sha1');
  const add = p => {
    const full = join(root, p);
    if (!existsSync(full)) return;
    if (statSync(full).isDirectory()) { for (const f of readdirSync(full).sort()) add(join(p, f)); }
    else h.update(p).update(readFileSync(full));
  };
  paths.forEach(add);
  return h.digest('hex').slice(0, 12);
}
const ACTIVITIES = activityIds(root).filter(wanted);
// what an activity's tests depend on, and what its browser checks depend on besides
// (the mansion's own headless tests: its music's, and that every sound in the game goes through the
// sound director, so they depend on all of src/)
// what everything runs on: the tools' exact versions and Node's (a change there could change any result)
const BASE = ['package.json', 'package-lock.json', '.nvmrc'];
// the build and check tools every browser check runs through, and GitHub's own steps for them
const TOOLS = ['tests/shared', 'tools/build.mjs', 'tools/check.mjs', 'tools/serve.mjs', 'tools/browser.mjs', 'tools/activities.mjs', 'tools/source.mjs', '.github/workflows/check.yml'];
const testPaths = a => a === 'clubhouse' ? [...BASE, 'src', 'tests/clubhouse', 'tools/activities.mjs'] : [...BASE, 'src/shared', `src/activities/${a}`, `tests/${a}`];
// (a game that lives in its mansion room, its card having a `room`, depends on the mansion too)
const inMansion = a => /^\s*room:/m.test(readFileSync(join(root, 'src/activities', a, 'card.js'), 'utf8'));
const pagePaths = a => [`tools/${a}`, `tests/saves/${a}`, ...TOOLS, ...(inMansion(a) ? ['src/clubhouse'] : []),
  ...readdirSync(join(root, 'src')).filter(f => statSync(join(root, 'src', f)).isFile()).map(f => 'src/' + f)];
// "passed" notes in dist/: one per activity and kind, named after the hash of what it depended on
const note = (kind, a, hash) => join(root, 'dist', `${kind}-passed-${a}-${hash}`);
// (a note says when it passed and how many seconds it took, for sharing out GitHub's computers)
function passed(kind, a, hash, secs = 0) {
  for (const f of readdirSync(join(root, 'dist'))) if (f.startsWith(`${kind}-passed-${a}-`)) rmSync(join(root, 'dist', f));
  writeFileSync(note(kind, a, hash), `${new Date().toISOString()} ${Math.round(secs)}\n`);
}
// how long an activity's checks took last time they passed (a minute if nothing says)
function lastTook(a) {
  const n = readdirSync(join(root, 'dist')).filter(f => f.startsWith(`tests-passed-${a}-`) || f.startsWith(`browser-passed-${a}-`))
    .reduce((t, f) => t + (+readFileSync(join(root, 'dist', f), 'utf8').split(' ')[1] || 0), 0);
  return n || 60;
}
// Each activity's checks should stay quick: one that grows past this (seconds, its browser checks
// or its headless tests) is pointed out, so it's looked at before it slows every change down.
const BUDGET = 180;
const readIf = f => existsSync(f) ? readFileSync(f, 'utf8') : '';
const overBudget = (what, secs) => {
  if (secs <= BUDGET) return;
  const say = `${what} took ${Math.round(secs)} s, over the ${BUDGET} s each activity's checks should stay under`;
  console.log(process.env.CI ? `::warning title=slow checks::${say}` : `(slow: ${say})`);
};
mkdirSync(join(root, 'dist'), { recursive: true });

// Are these files exactly what the saved live page was built from?
function sameAsLive(file, paths) {
  let source;
  try { source = readSource(file); } catch (e) { return e.message; }
  if (!source) return 'no copy of the project with ' + file;
  const live = source.files, ours = new Set();
  const walk = p => {
    if (!existsSync(join(root, p))) return;
    if (statSync(join(root, p)).isDirectory()) { for (const f of readdirSync(join(root, p))) walk(join(p, f)); }
    else ours.add(p);
  };
  paths.forEach(walk);
  const theirs = Object.keys(live).filter(p => paths.some(q => p === q || p.startsWith(q + '/')));
  for (const p of theirs) if (!ours.has(p)) return p + ' is on the live page but not here';
  for (const p of ours) if (live[p] !== readFileSync(join(root, p), 'utf8')) return p + ' differs from the live page';
  return null;
}

// ---------- 0. anything an activity's browser checks need made first (Dropper World's full board) ----------
// An activity's browser.mjs can export prepare(): it's started now, in the background, so it's made
// while the headless tests run instead of after them, in a folder of its own, dist/prepared/<activity>/
// (kept between runs, and on GitHub kept until the activity's files change). Its result is handed to the checks.
const mode = preview ? 'preview' : 'real';
// (every hash is worked out now, once, from the files as they are before anything's checked: a file
// edited while the checks run can't then be noted as passed without being checked)
const testHash = Object.fromEntries([...ACTIVITIES, 'clubhouse'].map(a => [a, hashOf(testPaths(a))]));
const browserHashes = Object.fromEntries(ACTIVITIES.map(a => [a, hashOf([...testPaths(a), ...pagePaths(a)]) + '-' + mode]));
const browserHash = a => browserHashes[a];
const clubHash = hashOf([...BASE, 'src', 'tests/clubhouse', ...TOOLS]) + '-' + mode;
// --plan: just say which of them still need checking (on GitHub, so only those get a computer):
// those whose tests or browser checks haven't passed on exactly this code
if (args.includes('--plan')) {
  const need = a => a === 'clubhouse'
    ? !existsSync(note('tests', a, testHash[a])) || !existsSync(note('browser', a, clubHash))
    : (existsSync(join(root, 'tests', a, 'run.mjs')) && !existsSync(note('tests', a, testHash[a])))
      || (existsSync(join(root, 'tests', a, 'browser.mjs')) && !existsSync(note('browser', a, browserHash(a))));
  const todo = [...ACTIVITIES, 'clubhouse'].filter(a => wanted(a) && (retest || need(a)));
  // One computer each, up to COMPUTERS of them (GitHub runs about 20 at once, and each takes most of
  // a minute to set up). Past that, they're shared out by how long each took last time, the longest
  // first, each to the computer with least to do; the mansion and an activity that makes something
  // first (its prepare(), kept between runs) always get one of their own.
  const COMPUTERS = 16, alone = a => a === 'clubhouse' || /export (async )?function prepare/.test(readIf(join(root, 'tests', a, 'browser.mjs')));
  let groups = todo.map(a => [a]);
  if (todo.length > COMPUTERS) {
    groups = todo.filter(alone).map(a => [a]);
    const bins = Array.from({ length: Math.max(1, COMPUTERS - groups.length) }, () => ({ load: 0, list: [] }));
    for (const a of todo.filter(a => !alone(a)).sort((x, y) => lastTook(y) - lastTook(x))) {
      const b = bins.reduce((m, b) => b.load < m.load ? b : m); b.list.push(a); b.load += lastTook(a);
    }
    groups.push(...bins.filter(b => b.list.length).map(b => b.list));
  }
  console.log(JSON.stringify(groups.map(g => g.join('+'))));
  process.exit(0);
}
const toCheck = ACTIVITIES.filter(a => existsSync(join(root, 'tests', a, 'browser.mjs')) && (retest || !existsSync(note('browser', a, browserHash(a)))));
const suites = {}, prepared = {};
for (const a of toCheck) {
  suites[a] = await import(join(root, 'tests', a, 'browser.mjs'));
  if (suites[a].prepare) { const dir = join(root, 'dist/prepared', a); mkdirSync(dir, { recursive: true }); prepared[a] = suites[a].prepare({ root, hashOf, dir }); }
}

// ---------- the code checker (a few seconds, so always) ----------
if (lint) check('code checker (npm run lint)', run('code checker', 'npx', ['eslint', '.']));
check('the docs (tools/docs.mjs)', run('the docs', 'node', ['tools/docs.mjs']));

// ---------- 1. each activity's headless tests (unless they passed on this exact code already) ----------
if (!quick) {
  const liveFile = valueOf('--live');
  for (const a of [...ACTIVITIES, 'clubhouse']) {
    if (!existsSync(join(root, 'tests', a, 'run.mjs')) || !wanted(a)) continue;
    const hash = testHash[a];
    if (liveFile && !existsSync(note('tests', a, hash)) && !retest) {
      const why = sameAsLive(liveFile, testPaths(a));
      if (why) console.log(`\n== ${a}: live page\nits code isn't the same as the live page's (${why}), so its tests run`);
      else {
        console.log(`\n== ${a}: live page\nits code is exactly what the live page was built from, and that passed`);
        passed('tests', a, hash);
      }
    }
    if (existsSync(note('tests', a, hash)) && !retest) {
      console.log(`\n== ${a}: headless tests\nalready passed on exactly this code, not running them again`);
    } else {
      const t = Date.now(), ok = run(`${a}: headless tests`, 'node', [`tests/${a}/run.mjs`]), secs = (Date.now() - t) / 1000;
      check(`${a}: headless tests`, ok);
      if (ok) passed('tests', a, hash, secs);
      overBudget(`${a}'s headless tests`, secs);
    }
  }
}
if (!run('build', 'node', ['tools/build.mjs', ...(preview ? ['--preview'] : [])])) {
  console.log('\nthe build failed, nothing else to check'); process.exit(1);
}
// the copy of the project beside the page is all there, and the page itself stays small
{ const page = join(root, 'dist/index.html'), copy = readSource(page), size = statSync(page).size;
  const missing = ['README.md', 'CLAUDE.md', 'package.json', 'src/main.js', 'tools/build.mjs'].filter(f => copy?.files[f] !== readFileSync(join(root, f), 'utf8'));
  check('the copy of the project travels beside the page, and the page stays small', copy && !missing.length && size < 50e3,
    missing.length ? 'missing or different: ' + missing.join(', ') : `page ${(size / 1024).toFixed(1)} kB, ${Object.keys(copy.files).length} files beside it`); }

// ---------- 2. the page in a browser ----------
const { chromium } = await import('./browser.mjs');   // (only now: without Playwright, the steps above still run)
mkdirSync(outDir, { recursive: true });
// served from a local web address, like the real page (a page opened as a file:// can't fetch its
// game files, and now and then forgets its saved storage on a reload, which real players never see)
const server = await serve();
const page = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch();
// Every page a room's checks open is watched for errors the page itself didn't catch, and any one
// fails its checks, whether or not they remembered to look (CLAUDE.md: any page error fails).
// (and, for an activity that saves, what each page has saved is kept every few seconds and as its
// window closes, for the old-saves samples below: a check that ends by starting over erases it)
let pageErrors = [], dumps = [], keeping = false;
const watched = new Proxy(browser, {
  get(b, k) {
    if (k !== 'newContext') return typeof b[k] === 'function' ? b[k].bind(b) : b[k];
    return async (...a) => {
      const ctx = await b.newContext(...a), close = ctx.close.bind(ctx);
      ctx.on('page', p => p.on('pageerror', e => pageErrors.push(e.message.split('\n')[0])));
      const dump = () => Promise.all(ctx.pages().map(p => p.evaluate(() => ({ ...localStorage })).then(d => dumps.push(d), () => {})));
      const every = keeping && setInterval(dump, 3000);
      ctx.close = async (...c) => { clearInterval(every); if (keeping) await dump(); return close(...c); };
      return ctx;
    };
  },
});
const cards = Object.fromEntries((await allCards()).map(c => [c.id, c]));
async function browserChecks(name, hash, suite, extra = {}) {
  console.log(`\n== ${name} in a browser`);
  const t = Date.now(), dir = join(outDir, name), before = failed;
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  pageErrors = []; dumps = []; keeping = !!cards[name]?.keeps?.length;
  const roomCheck = (n, ok, detail) => check(`${name}: ${n}`, ok, detail);
  // (a check that gets stuck counts as failed, and the rest still run)
  try { await (await suite).default({ browser: watched, page, check: roomCheck, run, hashOf, root, outDir: dir, ...extra }); }
  catch (e) { check(`${name}: the checks ran to the end`, false, e.message.split('\n')[0]); }
  check(`${name}: no page it opened had an error of its own`, !pageErrors.length, [...new Set(pageErrors)].slice(0, 3).join(' | '));
  // its saves as earlier versions wrote them still load (tests/shared/saves.mjs); and what it saved
  // this time kept as a new sample if its saves have a new shape (here, not on GitHub: commit it)
  const card = cards[name];
  keeping = false;
  if (card?.keeps?.length) {
    const kept = failed === before && !process.env.CI ? keepSample({ root, id: name, keeps: card.keeps, dumps }) : null;
    if (kept) console.log(`(its saves have a new shape: kept as tests/saves/${name}/${kept}, commit it with the change)`);
    try { await oldSaves({ browser: watched, page, card, check: roomCheck, root, skip: kept ? [kept] : [] }); }
    catch (e) { check(`${name}: its old saves were checked`, false, e.message.split('\n')[0]); }
  }
  // standing still in it is kind to the ears (tests/shared/ears.mjs): every room in the mansion, and
  // after the mansion's own, outside at the gate and in the hall; and what you see there (or on a
  // computer, as it starts) is drawn, not one colour (tests/shared/looks.mjs)
  try {
    if (card?.room) await roomEars({ browser: watched, page, card, check: roomCheck });
    else if (card) await computerLooks({ browser: watched, page, card, check: roomCheck });
    if (name === 'clubhouse') await houseEars({ browser: watched, page, cards: Object.values(cards), check: roomCheck });
  } catch (e) { check(`${name}: it was listened to and looked at`, false, e.message.split('\n')[0]); }
  const secs = (Date.now() - t) / 1000;
  if (failed === before) passed('browser', name, hash, secs);
  overBudget(`${name}'s browser checks`, secs);
  took(t);
}

// The mansion first. It has every activity's door, so any change to anything in the page runs it
// again (only exactly the same page, already passed, skips it). It times how long each room takes
// to build, so anything still being made in the background (Dropper World's full board) is finished
// first: a busy computer makes those times jumpy (a room once took 241 ms against a 200 ms limit
// only because the board was being made alongside).
await Promise.all(Object.values(prepared));
if (!wanted('clubhouse')) { /* not asked for (--only) */ }
else if (existsSync(note('browser', 'clubhouse', clubHash)) && !retest) console.log('\n== the clubhouse in a browser\nalready passed on exactly this page, not running it again');
else await browserChecks('clubhouse', clubHash, import(join(root, 'tests/clubhouse/browser.mjs')));

// Then each activity's, one after another. (Side by side on one computer was tried: the hidden
// browser draws every page on the processor, so with several at once each game runs slower, and
// checks that let the game run for a moment then fail. GitHub runs them side by side instead, each
// activity on a computer of its own.)
for (const a of ACTIVITIES) {
  if (!existsSync(join(root, 'tests', a, 'browser.mjs'))) continue;
  if (toCheck.includes(a)) await browserChecks(a, browserHash(a), suites[a], { prepared: await prepared[a] });
  else console.log(`\n== ${a} in a browser\nalready passed on exactly this code, not running it again`);
}
await browser.close();
server.close();

console.log(`\nscreenshots in dist/check/  (${Math.round((Date.now() - started) / 1000)} s in all)`);
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);

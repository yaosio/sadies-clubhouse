// Checks everything before a change goes anywhere: each activity's headless tests, a fresh build,
// and the built page played in a real (hidden) browser, as a phone and as a desktop.
//
//   npm run check                  everything (about 11 minutes here if nothing can be skipped)
//   npm run check -- --quick       skip the headless tests (for a quick look while working)
//
// It starts with the code checker (ESLint, `npm run lint`, a few seconds, every time): it finds
// mistakes like a misspelt name or a leftover that's never used, without running anything. Then
// tools/docs.mjs: the docs every change reads are still short, and every page they name is there.
//   npm run check -- --preview     build and check the test version (the one for the test page)
//   npm run check -- --retest      run everything even if it already passed on this exact code
//   npm run check -- --live <file> the live game page, saved (with its game/source-*.json beside it): an activity whose code is exactly
//                                  what that page was built from counts as having passed its tests
//   npm run check -- --only a,b    just those activities ('clubhouse': the mansion's own checks)
//   npm run check -- --plan        just print which activities still need checking (for GitHub)
//
// On GitHub (.github/workflows/check.yml) every pull request runs this too, each activity that needs
// it on a computer of its own, all at once, remembering what passed between runs.
//
// Each activity is checked on its own, so a change to one never means retesting the others:
//   - its headless tests (tests/<activity>/run.mjs) depend only on its own folder
//     (src/activities/<activity>/), its tests, the shared toolbox (src/shared/) and package.json;
//   - its browser checks (tests/<activity>/browser.mjs) depend on those plus its own tools
//     (tools/<activity>/), the clubhouse's shell (the files directly in src/; not the mansion in
//     src/clubhouse/, which an activity on a computer never needs, unlike a game that lives in its
//     room, like Brickbuster) and the build and check tools.
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

const root = new URL('..', import.meta.url).pathname;
const args = process.argv.slice(2);
const quick = args.includes('--quick'), preview = args.includes('--preview'), retest = args.includes('--retest');
const valueOf = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
// --only a,b: just those activities ('clubhouse' for the mansion), as GitHub does, one per computer
const only = valueOf('--only')?.split(','), wanted = a => !only || only.includes(a);
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
const ACTIVITIES = readdirSync(join(root, 'src/activities')).sort().filter(d => existsSync(join(root, 'src/activities', d, 'card.js')) && wanted(d));
// what an activity's tests depend on, and what its browser checks depend on besides
// (the mansion's own headless tests: its music's, and that every sound in the game goes through the
// sound director, so they depend on all of src/)
const testPaths = a => a === 'clubhouse' ? ['package.json', 'src', 'tests/clubhouse'] : ['package.json', 'src/shared', `src/activities/${a}`, `tests/${a}`];
// (a game that lives in its mansion room, its card having a `room`, depends on the mansion too)
const inMansion = a => /^\s*room:/m.test(readFileSync(join(root, 'src/activities', a, 'card.js'), 'utf8'));
const pagePaths = a => [`tools/${a}`, 'tests/shared', 'tools/build.mjs', 'tools/check.mjs', 'tools/serve.mjs', 'tools/browser.mjs', ...(inMansion(a) ? ['src/clubhouse'] : []),
  ...readdirSync(join(root, 'src')).filter(f => statSync(join(root, 'src', f)).isFile()).map(f => 'src/' + f)];
// "passed" notes in dist/: one per activity and kind, named after the hash of what it depended on
const note = (kind, a, hash) => join(root, 'dist', `${kind}-passed-${a}-${hash}`);
function passed(kind, a, hash) {
  for (const f of readdirSync(join(root, 'dist'))) if (f.startsWith(`${kind}-passed-${a}-`)) rmSync(join(root, 'dist', f));
  writeFileSync(note(kind, a, hash), new Date().toISOString() + '\n');
}
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
// while the headless tests run instead of after them. Its result is handed to the checks.
const mode = preview ? 'preview' : 'real';
// (every hash is worked out now, once, from the files as they are before anything's checked: a file
// edited while the checks run can't then be noted as passed without being checked)
const testHash = Object.fromEntries([...ACTIVITIES, 'clubhouse'].map(a => [a, hashOf(testPaths(a))]));
const browserHashes = Object.fromEntries(ACTIVITIES.map(a => [a, hashOf([...testPaths(a), ...pagePaths(a)]) + '-' + mode]));
const browserHash = a => browserHashes[a];
const clubHash = hashOf(['package.json', 'src', 'tests/clubhouse', 'tests/shared', 'tools/build.mjs', 'tools/check.mjs', 'tools/serve.mjs', 'tools/browser.mjs']) + '-' + mode;
// --plan: just say which of them still need checking (on GitHub, so only those get a computer):
// those whose tests or browser checks haven't passed on exactly this code
if (args.includes('--plan')) {
  const need = a => a === 'clubhouse'
    ? !existsSync(note('tests', a, testHash[a])) || !existsSync(note('browser', a, clubHash))
    : (existsSync(join(root, 'tests', a, 'run.mjs')) && !existsSync(note('tests', a, testHash[a])))
      || (existsSync(join(root, 'tests', a, 'browser.mjs')) && !existsSync(note('browser', a, browserHash(a))));
  console.log(JSON.stringify([...ACTIVITIES, 'clubhouse'].filter(a => wanted(a) && (retest || need(a)))));
  process.exit(0);
}
const toCheck = ACTIVITIES.filter(a => existsSync(join(root, 'tests', a, 'browser.mjs')) && (retest || !existsSync(note('browser', a, browserHash(a)))));
const suites = {}, prepared = {};
for (const a of toCheck) {
  suites[a] = await import(join(root, 'tests', a, 'browser.mjs'));
  if (suites[a].prepare) prepared[a] = suites[a].prepare({ root, hashOf });
}

// ---------- the code checker (a few seconds, so always) ----------
check('code checker (npm run lint)', run('code checker', 'npx', ['eslint', '.']));
check('the docs every change reads (tools/docs.mjs)', run('the docs every change reads', 'node', ['tools/docs.mjs']));

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
      const ok = run(`${a}: headless tests`, 'node', [`tests/${a}/run.mjs`]);
      check(`${a}: headless tests`, ok);
      if (ok) passed('tests', a, hash);
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
let pageErrors = [];
const watched = new Proxy(browser, {
  get(b, k) {
    if (k !== 'newContext') return typeof b[k] === 'function' ? b[k].bind(b) : b[k];
    return async (...a) => {
      const ctx = await b.newContext(...a);
      ctx.on('page', p => p.on('pageerror', e => pageErrors.push(e.message.split('\n')[0])));
      return ctx;
    };
  },
});
async function browserChecks(name, hash, suite, extra = {}) {
  console.log(`\n== ${name} in a browser`);
  const t = Date.now(), dir = join(outDir, name), before = failed;
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  pageErrors = [];
  // (a check that gets stuck counts as failed, and the rest still run)
  try { await (await suite).default({ browser: watched, page, check: (n, ok, detail) => check(`${name}: ${n}`, ok, detail), run, hashOf, root, outDir: dir, ...extra }); }
  catch (e) { check(`${name}: the checks ran to the end`, false, e.message.split('\n')[0]); }
  check(`${name}: no page it opened had an error of its own`, !pageErrors.length, [...new Set(pageErrors)].slice(0, 3).join(' | '));
  if (failed === before) passed('browser', name, hash);
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

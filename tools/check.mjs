// Checks everything before a change goes anywhere: each activity's headless tests, a fresh build,
// and the built page played in a real (hidden) browser, as a phone and as a desktop.
//
//   npm run check                  everything (Dropper World's tests take about 3.5 minutes)
//   npm run check -- --quick       skip the headless tests (for a quick look while working)
//   npm run check -- --preview     build and check the test version (the one for the test page)
//   npm run check -- --retest      run everything even if it already passed on this exact code
//   npm run check -- --live <file> the live game page, saved: an activity whose code is exactly
//                                  what that page was built from counts as having passed its tests
//
// Each activity is checked on its own, so a change to one never means retesting the others:
//   - its headless tests (tests/<activity>/run.mjs) depend only on its own folder
//     (src/activities/<activity>/), its tests, the shared toolbox (src/shared/) and package.json;
//   - its browser checks (tests/<activity>/browser.mjs) depend on those plus the clubhouse (the files
//     directly in src/) and the build and check tools.
// Once either has passed on exactly those files it isn't run again until one of them changes. This
// session remembers it in dist/, which makes the check at merge time quick when the branch was
// checked here. A fresh session has no memory of it, but the live game page does: it's only ever
// published after passing, and it carries its own source. So with --live (the page read before
// publishing anyway), an activity whose code the change doesn't touch skips its tests.
//
// The browser checks always build the page and open it once, to see the clubhouse starts without
// errors. Screenshots go in dist/check/<activity>/ to look at.
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
const quick = args.includes('--quick'), preview = args.includes('--preview'), retest = args.includes('--retest');
const outDir = join(root, 'dist/check');

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
const ACTIVITIES = readdirSync(join(root, 'src/activities')).sort().filter(d => existsSync(join(root, 'src/activities', d, 'card.js')));
// what an activity's tests depend on, and what its browser checks depend on besides
const testPaths = a => ['package.json', 'src/shared', `src/activities/${a}`, `tests/${a}`];
const pagePaths = () => ['tools/build.mjs', 'tools/check.mjs',
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
  const m = readFileSync(file, 'utf8').match(/<script type="application\/json" id="jelly-source">([\s\S]*?)<\/script>/);
  if (!m) return 'no embedded source in ' + file;
  const live = JSON.parse(m[1]).files, ours = new Set();
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

// ---------- 1. each activity's headless tests (unless they passed on this exact code already) ----------
if (!quick) {
  const liveAt = args.indexOf('--live'), liveFile = liveAt >= 0 ? args[liveAt + 1] : null;
  for (const a of ACTIVITIES) {
    if (!existsSync(join(root, 'tests', a, 'run.mjs'))) continue;
    const hash = hashOf(testPaths(a));
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

// ---------- 2. the page in a browser ----------
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch {
  try { ({ chromium } = require(join(spawnSync('npm', ['root', '-g']).stdout.toString().trim(), 'playwright'))); }
  catch { console.log('\nPlaywright is not installed, so the browser checks can\'t run'); process.exit(1); }
}
mkdirSync(outDir, { recursive: true });
// served from a local web address, like the real page (opened as a file:// the browser now and
// then forgets its saved storage on a reload, which real players never see)
const server = createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(readFileSync(join(root, 'dist/index.html')));
});
await new Promise(ok => server.listen(0, '127.0.0.1', ok));
const page = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();

console.log('\n== the clubhouse in a browser');
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const p = await ctx.newPage(), errors = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.goto(page); await p.waitForTimeout(2000);
  await p.screenshot({ path: join(outDir, 'clubhouse.png') });
  check('the page opens without errors', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

const mode = preview ? 'preview' : 'real';
for (const a of ACTIVITIES) {
  if (!existsSync(join(root, 'tests', a, 'browser.mjs'))) continue;
  const hash = hashOf([...testPaths(a), ...pagePaths()]) + '-' + mode;
  if (existsSync(note('browser', a, hash)) && !retest) {
    console.log(`\n== ${a} in a browser\nalready passed on exactly this code, not running it again`);
    continue;
  }
  console.log(`\n== ${a} in a browser`);
  const dir = join(outDir, a);
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  const before = failed;
  const { default: checks } = await import(join(root, 'tests', a, 'browser.mjs'));
  await checks({ browser, page, check: (name, ok, detail) => check(`${a}: ${name}`, ok, detail), run, hashOf, root, outDir: dir });
  if (failed === before) passed('browser', a, hash);
}
await browser.close();
server.close();

console.log(`\nscreenshots in dist/check/`);
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);

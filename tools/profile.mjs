// Finds out where the time goes: plays a full board (made by tools/fullboard.mjs) in a hidden
// Chromium as a phone slowed down 4x, records a CPU profile and a browser trace, and prints:
//   - how even the frames are (typical, slow and worst gaps between frames)
//   - which of the game's functions take the most time, overall and in the slowest frames
//   - what the browser spends the rest of its time on (garbage collection, drawing to screen, ...)
//
//   node tools/profile.mjs [--seconds 40] [--slow 4] [--desktop] [--no-build] [--json out.json]
//
// It builds the real game first (dist/index.html) unless --no-build. A hidden browser has no
// graphics card, so "drawing to screen" costs look different from a real phone; the game's own
// code (physics, the characters, preparing each drawing) is measured fairly.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createServer } from 'node:http';

const root = new URL('..', import.meta.url).pathname;
const args = process.argv.slice(2);
const opt = (name, d) => { const i = args.indexOf(name); return i < 0 ? d : args[i + 1]; };
const seconds = +opt('--seconds', 40), slow = +opt('--slow', 4), desktop = args.includes('--desktop');
const SAVE_KEY = 'sadies-dropper-world.save';

if (!args.includes('--no-build') && spawnSync('node', ['tools/build.mjs'], { cwd: root, stdio: 'inherit' }).status !== 0) process.exit(1);
let boardFile = readdirSync(join(root, 'dist')).find(f => /^fullboard-.*\.json$/.test(f));
if (!boardFile) {
  boardFile = 'fullboard-profile.json';
  console.log('making a full board (about two minutes)');
  if (spawnSync('node', ['tools/fullboard.mjs', join(root, 'dist', boardFile)], { cwd: root, stdio: 'inherit' }).status !== 0) process.exit(1);
}
const board = readFileSync(join(root, 'dist', boardFile), 'utf8');
const html = readFileSync(join(root, 'dist/index.html'), 'utf8');

// which source file each line of the built page came from (the bundler marks each file's start)
const htmlLines = html.split('\n'), fileOfLine = [];
{ let cur = '?'; for (let i = 0; i < htmlLines.length; i++) { const m = htmlLines[i].match(/^\s*\/\/ (src\/\S+\.js)$/); if (m) cur = m[1].slice(4); fileOfLine[i] = cur; } }

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const server = createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html' }); r.end(html); });
await new Promise(ok => server.listen(0, '127.0.0.1', ok));
const browser = await chromium.launch();
const ctx = await browser.newContext(desktop ? { viewport: { width: 1280, height: 800 } }
  : { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
await ctx.addInitScript(([k, s]) => {
  if (!sessionStorage.getItem('profile.planted')) { localStorage.setItem(k, s); sessionStorage.setItem('profile.planted', '1'); }
  // time every animation frame from outside the game: when it started and how long its work took
  const raf = window.requestAnimationFrame.bind(window); window.__frames = [];
  window.requestAnimationFrame = cb => raf(t => { const a = performance.now(); cb(t); window.__frames.push([t, performance.now() - a]); });
}, [SAVE_KEY, board]);
const page = await ctx.newPage();
const errors = []; page.on('pageerror', e => errors.push(e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/`);
await page.waitForFunction(() => window.__jellyDebug);
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: slow });
await page.waitForTimeout(3000); // let the loaded board settle in
const piecesAtStart = (await page.evaluate(() => window.__jellyDebug())).pieces;

await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
await browser.startTracing(page, { categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'v8', 'blink.canvas', 'gpu'] });
await page.evaluate(() => { window.__frames.length = 0; });
await cdp.send('Profiler.start');
await page.waitForTimeout(seconds * 1000);
const { profile } = await cdp.send('Profiler.stop');
const frames = await page.evaluate(() => window.__frames);
const trace = JSON.parse((await browser.stopTracing()).toString());
const piecesAtEnd = (await page.evaluate(() => window.__jellyDebug())).pieces;
await browser.close(); server.close();

// ---------- frame evenness ----------
const pct = (a, q) => a[Math.min(a.length - 1, Math.floor(q * a.length))];
const gaps = frames.slice(1).map((f, i) => f[0] - frames[i][0]).sort((a, b) => a - b);
const works = frames.map(f => f[1]).sort((a, b) => a - b);
const ms = v => v.toFixed(1) + ' ms';
console.log(`\n=== ${desktop ? 'desktop' : 'phone'}, ${slow}x slower, ${seconds} s, ${piecesAtStart} pieces at the start, ${piecesAtEnd} at the end${errors.length ? ', PAGE ERRORS: ' + errors.join(' | ') : ''}`);
console.log(`\nFRAMES: ${frames.length} in ${seconds} s = ${(frames.length / seconds).toFixed(1)} per second`);
console.log(`  time between frames: typical ${ms(pct(gaps, 0.5))}, 1 in 10 over ${ms(pct(gaps, 0.9))}, 1 in 100 over ${ms(pct(gaps, 0.99))}, worst ${ms(gaps[gaps.length - 1])}`);
console.log(`  game's own work per frame: typical ${ms(pct(works, 0.5))}, 1 in 10 over ${ms(pct(works, 0.9))}, 1 in 100 over ${ms(pct(works, 0.99))}, worst ${ms(works[works.length - 1])}`);
for (const lim of [20, 33, 50, 100]) console.log(`  gaps over ${lim} ms: ${gaps.filter(g => g > lim).length}`);

// ---------- the CPU profile ----------
const nodes = new Map(); for (const n of profile.nodes) nodes.set(n.id, n);
for (const n of profile.nodes) for (const c of n.children || []) nodes.get(c).parent = n.id;
const label = n => {
  const cf = n.callFrame, name = cf.functionName || '(anonymous)';
  if (!cf.url) return name; // (garbage collector), (program), (idle), native canvas calls
  return `${name}  [${fileOfLine[cf.lineNumber] || cf.url.split('/').pop()}:${cf.lineNumber + 1}]`;
};
const stackOf = id => { const s = []; for (let n = nodes.get(id); n; n = nodes.get(n.parent)) s.push(n); return s; }; // leaf first
const inFrame = st => st.findIndex(n => n.callFrame.functionName === 'frame' && n.callFrame.url);
const self = new Map(), incl = new Map(), phase = new Map(), outside = new Map();
const add = (m, k, v) => m.set(k, (m.get(k) || 0) + v);
const perFrame = []; let cur = null, total = 0;
for (let i = 0; i < profile.samples.length; i++) {
  const dt = (profile.timeDeltas[i + 1] ?? 0) / 1000; total += dt; // each sample stands for the time until the next one
  const st = stackOf(profile.samples[i]), fi = inFrame(st);
  if (fi < 0) {
    cur = null;
    const top = st[0].callFrame.functionName;
    add(outside, top === '(idle)' ? '(idle: nothing to do)' : top === '(program)' ? '(browser work outside the game code: drawing to screen, events, ...)'
      : top === '(garbage collector)' ? '(garbage collector)' : 'other game code outside frames: ' + label(st[st.length - 2] || st[0]), dt);
    continue;
  }
  if (!cur) { cur = { ms: 0, phase: new Map(), self: new Map() }; perFrame.push(cur); }
  cur.ms += dt;
  add(self, label(st[0]), dt); add(cur.self, label(st[0]), dt);
  const seen = new Set(); for (let k = 0; k <= fi; k++) { const l = label(st[k]); if (!seen.has(l)) { seen.add(l); add(incl, l, dt); } }
  // phases: the step the frame is in, and one level below it (e.g. draw > drawSadie)
  const a = st[fi - 1], b = st[fi - 2];
  const ph = !a ? 'frame itself' : a.callFrame.functionName + (b && a.callFrame.url ? ' > ' + b.callFrame.functionName : '');
  add(phase, ph, dt); add(cur.phase, ph, dt);
}
const inFrames = [...perFrame].reduce((s, f) => s + f.ms, 0);
const table = (m, n, of) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n)
  .map(([k, v]) => `  ${ms(v / seconds).padStart(9)}/s  ${(100 * v / of).toFixed(1).padStart(5)}%  ${k}`).join('\n');
console.log(`\nWHOLE TIME (${ms(total)} recorded; per second of play):`);
console.log(`  ${ms(inFrames / seconds).padStart(9)}/s  ${(100 * inFrames / total).toFixed(1).padStart(5)}%  inside the game's frames`);
console.log(table(outside, 12, total));
console.log(`\nINSIDE FRAMES, BY STEP (one level down):\n${table(phase, 30, inFrames)}`);
console.log(`\nINSIDE FRAMES, BY FUNCTION INCLUDING WHAT IT CALLS:\n${table(incl, 45, inFrames)}`);
console.log(`\nINSIDE FRAMES, BY FUNCTION ON ITS OWN (not counting what it calls):\n${table(self, 35, inFrames)}`);

const slowest = [...perFrame].sort((a, b) => b.ms - a.ms).slice(0, 8);
console.log(`\nSLOWEST FRAMES (by the profile):`);
for (const f of slowest) {
  console.log(`  ${ms(f.ms)}:  ` + [...f.phase].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k} ${v.toFixed(1)}`).join(', '));
  console.log(`      on its own: ` + [...f.self].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k.split('  ')[0]} ${v.toFixed(1)}`).join(', '));
}

// ---------- the trace: what the browser's main thread and others do ----------
const evs = trace.traceEvents || trace;
const mainPid = (() => { const c = new Map(); for (const e of evs) if (e.name === 'FireAnimationFrame') add(c, e.pid + ':' + e.tid, 1); return [...c].sort((a, b) => b[1] - a[1])[0]?.[0]; })();
const threadName = new Map(); for (const e of evs) if (e.name === 'thread_name') threadName.set(e.pid + ':' + e.tid, e.args.name);
const byName = new Map(), byThread = new Map();
for (const e of evs) {
  if (e.ph !== 'X' || !e.dur) continue;
  const key = e.pid + ':' + e.tid, tn = threadName.get(key) || key;
  if (e.name === 'RunTask' || e.name === 'ThreadControllerImpl::RunTask') add(byThread, tn, e.dur / 1000);
  if (key === mainPid) add(byName, e.name, e.dur / 1000);
}
console.log(`\nBROWSER THREADS, BUSY TIME (per second; "${threadName.get(mainPid)}" is where the game runs):`);
console.log(table(byThread, 10, seconds * 1000).replace(/%/g, '% of one core'));
console.log(`\nMAIN THREAD EVENTS (overlapping, per second):`);
console.log([...byName].sort((a, b) => b[1] - a[1]).slice(0, 18).map(([k, v]) => `  ${ms(v / seconds).padStart(9)}/s  ${k}`).join('\n'));

const json = opt('--json');
if (json) writeFileSync(json, JSON.stringify({ frames, profile }));

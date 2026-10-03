// How long the game takes to start (npm run build first): opens the built page as a desktop a few
// times and prints how long it took from asking for the page to the mansion's first picture (the
// middle of the runs, and each run). Every file the page asks for (the game files, the fonts) can be
// held up as a real connection would (`--delay <ms>`, 100 by default: the game page's files come
// from the internet, so each one fetched in a row adds a wait)
//   node tools/clubhouse/startup.mjs [--runs 5] [--delay 100] [--phone]
import { serve } from '../serve.mjs';
import { launch } from '../browser.mjs';


const arg = (k, d) => { const i = process.argv.indexOf(k); return i < 0 ? d : Number(process.argv[i + 1]); };
const RUNS = arg('--runs', 5), DELAY = arg('--delay', 100);
const PHONE = process.argv.includes('--phone');
const server = await serve();
const browser = await launch();
const wait = ms => new Promise(ok => setTimeout(ok, ms));
const times = [];
for (let i = 0; i < RUNS; i++) {
  const ctx = await browser.newContext(PHONE ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('page error:', e.message));
  const fetched = [];
  await p.route(/127\.0\.0\.1/, async r => { await wait(DELAY); fetched.push([r.request().url().split('/').pop(), performance.now()]); return r.continue(); });
  const t0 = performance.now();
  await p.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'commit' });
  const at = await p.waitForFunction(() => window.__mansion && window.__mansion.frames() > 0 && performance.now(), null, { timeout: 60000, polling: 'raf' });
  const ms = Math.round(await at.jsonValue());
  times.push(ms);
  console.log(`run ${i + 1}: first picture ${ms} ms after asking for the page; files: ${fetched.map(([f, t]) => `${f.slice(0, 18)} @${Math.round(t - t0)}`).join(', ')}`);
  await ctx.close();
}
times.sort((a, b) => a - b);
console.log(`first picture: ${times[times.length >> 1]} ms (middle of ${RUNS}; fastest ${times[0]}, slowest ${times[times.length - 1]}), files held up ${DELAY} ms each${PHONE ? ', as a phone' : ''}`);
await browser.close(); server.close();

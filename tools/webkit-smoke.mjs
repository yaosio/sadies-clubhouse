// The game in WebKit, the engine under Safari and every iPhone: a short look that it opens and draws.
// Run by `.github/workflows/safari.yml` once a week (`npm run build` first; locally, after
// `npx playwright install webkit`: `node tools/webkit-smoke.mjs`). Not part of `npm run check`: the real
// checks play the game in Chromium, and this only asks whether Safari's engine runs it at all.
// For the clubhouse, as a phone and a desktop: it opens and draws, the frames keep coming, the letter's
// OK works and stays gone after a reload, and nothing on the page errors. Then every activity started
// straight from its address, drawn and error-free. Pictures go in dist/check/webkit/.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { serve } from './serve.mjs';
import { allCards } from '../tests/clubhouse/cards.mjs';
import { picture } from '../tests/shared/looks.mjs';
import { DEVICES } from '../tests/shared/browser.mjs';

const root = join(new URL('.', import.meta.url).pathname, '..'), out = join(root, 'dist/check/webkit');
mkdirSync(out, { recursive: true });
const { webkit } = createRequire(import.meta.url)('playwright');
const server = await serve(), page = `http://127.0.0.1:${server.address().port}/`;
const browser = await webkit.launch();
let failed = 0;
const check = (name, ok, detail = '') => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? ` (${detail})` : ''}`); };
const drawn = async (p, name) => {
  const s = await picture(p).catch(e => ({ error: e.message.split('\n')[0] }));
  check(`${name}: drawn, not one colour`, !s.error && s.most <= 0.85 && s.colours >= 12, s.error || `${Math.round(s.most * 100)}% one colour, ${s.colours} colours`);
};
const open = async opts => {
  const ctx = await browser.newContext(opts), p = await ctx.newPage(), errors = [];
  p.on('pageerror', e => errors.push(e.message.split('\n')[0]));
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  return { ctx, p, errors };
};
const frames = p => p.evaluate(() => window.__mansion?.frames() ?? -1);

try {
  await Promise.all(DEVICES.map(async ([device, opts]) => {
    const { ctx, p, errors } = await open(opts), n = s => `${device}: ${s}`;
    await p.goto(page);
    const up = await p.waitForFunction(() => window.__mansion && window.__mansion.frames() > 10, null, { timeout: 60000 }).then(() => true, () => false);
    check(n('the clubhouse opens and draws frames'), up, errors[0]);
    if (up) {
      const a = await frames(p);
      check(n('the frames keep coming'), await p.waitForFunction(a => window.__mansion.frames() > a + 5, a, { timeout: 30000 }).then(() => true, () => false), `stuck at ${await frames(p)}`);
      await p.screenshot({ path: join(out, `${device}-letter.png`) });
      await p.click('#ok');
      await p.reload();
      await p.waitForFunction(() => window.__mansion && window.__mansion.frames() > 10, null, { timeout: 60000 });
      check(n('the letter comes only the first time'), !(await p.isVisible('#letter')));
      await p.waitForTimeout(500);
      await drawn(p, n('the gate'));
      await p.screenshot({ path: join(out, `${device}-gate.png`) });
    }
    check(n('nothing on the page errored'), !errors.length, [...new Set(errors)].slice(0, 3).join(' | '));
    await ctx.close();
  }));
  for (const c of (await allCards()).filter(c => c.start)) {
    const { ctx, p, errors } = await open(DEVICES[1][1]);
    await p.goto(page + '#' + c.id);
    await p.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await p.waitForTimeout(2500);
    await drawn(p, `${c.id} started from its address`);
    check(`${c.id}: nothing on the page errored`, !errors.length, [...new Set(errors)].slice(0, 3).join(' | '));
    await p.screenshot({ path: join(out, `${c.id}.png`) });
    await ctx.close();
  }
} catch (e) { check('the smoke look ran to the end', false, e.message.split('\n')[0]); }
await browser.close(); server.close();
console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exit(failed ? 1 : 0);

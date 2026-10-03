// What every room's browser checks start with (tests/<room>/browser.mjs, run by tools/check.mjs):
// the phone and the desktop side by side, each in its own browser window, with the page's errors
// collected, and the few moves every check makes in the mansion. A check that changes this file runs
// every room's browser checks again.
import { join } from 'node:path';

import { PHONE, DESKTOP } from './devices.mjs';

export const DEVICES = [['phone', PHONE], ['desktop', DESKTOP]];

// a browser window as that device, and every error on its page collected
export async function openDevice(browser, opts) {
  const ctx = await browser.newContext(opts);
  const p = await ctx.newPage(), errors = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  return { ctx, p, errors };
}

// `fn` run as the phone and the desktop at the same time, handed its kit:
//   device, opts, ctx, p (the page), errors
//   shot(name): a screenshot, dist/check/<room>/<device>-<name>.png
//   M(fn, ...args): the mansion's hook for the checks (window.__mansion)
//   up(): wait for the mansion to open and every room to be built (false if it doesn't)
//   walk(ms, key): hold a key down (W: forward) for that long in the game (see walk below)
//   rest(ms): let that long go by in the game (see rest below)
//   use(): E on a desktop, the button on a phone
//   pause(): Escape on a desktop, the pause button on a phone
//   modeIs(mode): wait for the mansion to be in that mode ('play', 'arcade'...; false if it isn't)
//   until(fn, arg, ms): wait for fn(arg) on the page to come true, for up to ms of the game's time
export function bothDevices(browser, outDir, fn) {
  return Promise.all(DEVICES.map(async ([device, opts]) => {
    const { ctx, p, errors } = await openDevice(browser, opts);
    const kit = {
      device, opts, ctx, p, errors,
      shot: name => p.screenshot({ path: join(outDir, `${device}-${name}.png`) }),
      M: (f, ...a) => p.evaluate(([f, a]) => window.__mansion[f](...a), [f, a]),
      up: () => up(p),
      walk: (ms, key) => walk(p, ms, key),
      rest: ms => rest(p, ms),
      use: () => pressUse(p, opts),
      pause: () => pressPause(p, opts),
      modeIs: m => p.waitForFunction(m => window.__mansion.mode() === m, m, { timeout: 5000 }).then(() => true, () => false),
      until: (f, a, ms) => until(p, f, a, ms),
    };
    try { await fn(kit); } finally { await ctx.close().catch(() => {}); }
  }));
}

// The USE button on a phone, E on a desktop; and the pause button on a phone, Escape on a desktop
// (`opts`: the device's, so a phone is told by its touch)
export const pressUse = (p, opts) => opts.hasTouch ? p.tap('#mansion #use') : p.keyboard.press('KeyE');
export const pressPause = (p, opts) => opts.hasTouch ? p.tap('#mansion #pause') : p.keyboard.press('Escape');

// Wait for the mansion to open and every room to be built. It gets slower with every room: past 8 s
// it says so (docs/clubhouse/decisions/known-limits.md, known limits: the plan for when it does).
export async function up(p) {
  const t = Date.now();
  const ok = await p.waitForFunction(() => window.__mansion && window.__mansion.frames() > 10 && window.__mansion.settled(), null, { timeout: 15000 }).then(() => true, () => false);
  const secs = (Date.now() - t) / 1000;
  if (ok && secs > 8) {
    const say = `the mansion took ${secs.toFixed(1)} s to build every room (the checks give up at 15): time for checks that don't wait for every room (docs/clubhouse/decisions/known-limits.md)`;
    console.log(process.env.CI ? `::warning title=many rooms::${say}` : `(slow: ${say})`);
  }
  return ok;
}

// Let `ms` of the game's own time go by, not the clock's: on a busy computer (GitHub's, say) frames
// come slower and the game falls behind the clock, so a wait timed by the clock can end before what
// it waited for has happened in the game. The mansion counts the time it's played
// (window.__mansion.played()); without the mansion on the page, it's the clock.
export async function rest(p, ms, from) {
  const t0 = from ?? await p.evaluate(() => window.__mansion?.played());
  if (t0 === undefined) return p.waitForTimeout(ms);
  await p.waitForFunction(([t0, s]) => !window.__mansion || window.__mansion.played() - t0 >= s, [t0, ms / 1000], { polling: 'raf', timeout: ms * 8 + 5000 }).catch(() => {});
}

// Wait for something to happen in the game (`fn(arg)` run on the page comes true), giving up only
// once `ms` of the game's own time has gone by (and, if the game stops counting, after plenty of the
// clock's). For anything the game does on its own timers (Sadie getting up, a ball coming back):
// waiting by the clock gives up too soon on a slow computer, where the game falls behind the clock.
// Whether it happened. (Without the mansion on the page, it's the clock.)
export async function until(p, fn, arg, ms) {
  const played = () => p.evaluate(() => window.__mansion?.played()).catch(() => undefined);
  const t0 = await played(), start = Date.now(), cap = ms * 8 + 5000;
  for (;;) {
    if (await p.evaluate(fn, arg).catch(() => false)) return true;
    const t = await played(), gone = t0 === undefined || t === undefined ? Date.now() - start : (t - t0) * 1000;
    if (gone >= ms || Date.now() - start >= cap) return !!(await p.evaluate(fn, arg).catch(() => false));
    await p.waitForTimeout(50);
  }
}

// Hold a key down (W: forward) for `ms` of the game's own time (so a slow computer doesn't stop
// short of a door). (Timed from just before the key goes down, as the clock did: from after would
// walk on a little further, through a door it should stop at.)
export async function walk(p, ms, key = 'KeyW') {
  const t0 = await p.evaluate(() => window.__mansion?.played());
  await p.keyboard.down(key);
  await rest(p, ms, t0);
  await p.keyboard.up(key);
  await p.waitForTimeout(100);
}

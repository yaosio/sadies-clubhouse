// What every room's browser checks start with (tests/<room>/browser.mjs, run by tools/check.mjs):
// the phone and the desktop side by side, each in its own browser window, with the page's errors
// collected, and the few moves every check makes in the mansion. A check that changes this file runs
// every room's browser checks again.
import { join } from 'node:path';

export const DEVICES = [
  ['phone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
  ['desktop', { viewport: { width: 1280, height: 800 } }],
];

// a browser window as that device, the web fonts answered with nothing (they can't be fetched from
// here; rather than log a network error), and every error on its page collected
export async function openDevice(browser, opts) {
  const ctx = await browser.newContext(opts);
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
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
//   use(): E on a desktop, the button on a phone
//   modeIs(mode): wait for the mansion to be in that mode ('play', 'arcade'...; false if it isn't)
export function bothDevices(browser, outDir, fn) {
  return Promise.all(DEVICES.map(async ([device, opts]) => {
    const { ctx, p, errors } = await openDevice(browser, opts);
    const kit = {
      device, opts, ctx, p, errors,
      shot: name => p.screenshot({ path: join(outDir, `${device}-${name}.png`) }),
      M: (f, ...a) => p.evaluate(([f, a]) => window.__mansion[f](...a), [f, a]),
      up: () => p.waitForFunction(() => window.__mansion && window.__mansion.frames() > 10 && window.__mansion.settled(), null, { timeout: 15000 }).then(() => true, () => false),
      walk: (ms, key) => walk(p, ms, key),
      use: () => opts.hasTouch ? p.tap('#mansion #use') : p.keyboard.press('KeyE'),
      modeIs: m => p.waitForFunction(m => window.__mansion.mode() === m, m, { timeout: 5000 }).then(() => true, () => false),
    };
    try { await fn(kit); } finally { await ctx.close().catch(() => {}); }
  }));
}

// Hold a key down (W: forward) for `ms` of the game's own time, not the clock's: on a busy computer
// (GitHub's, say) frames come slower and each moves you less, so a walk timed by the clock could
// stop short of a door. The mansion counts the time it's played (window.__mansion.played()).
export async function walk(p, ms, key = 'KeyW') {
  const t0 = await p.evaluate(() => window.__mansion?.played());
  await p.keyboard.down(key);
  if (t0 === undefined) await p.waitForTimeout(ms);
  else await p.waitForFunction(([t0, s]) => !window.__mansion || window.__mansion.played() - t0 >= s, [t0, ms / 1000], { polling: 'raf', timeout: ms * 8 + 5000 }).catch(() => {});
  await p.keyboard.up(key);
  await p.waitForTimeout(100);
}
